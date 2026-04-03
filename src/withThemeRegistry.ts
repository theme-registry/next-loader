import {
  loadConfig,
  watchThemes,
  type LoaderSpecifier,
  type ThemeRegistryOptions,
  type ThemeWatcherHandle,
  type WatchThemesOptions
} from '@theme-registry/toolkit'
import { createNextLoader, type NextLoaderOptions } from './loader.js'

export type NextConfigObject = Record<string, any>
export type NextConfigFunction = (
  phase: string,
  defaults: NextConfigObject
) => NextConfigObject | Promise<NextConfigObject>
export type NextConfig = NextConfigObject | NextConfigFunction

export interface WithThemeRegistryOptions extends ThemeRegistryOptions {
  /** Optional path to theme-registry.config.* */
  config?: string
  /** Forwarded to chokidar via @theme-registry/toolkit */
  watchOptions?: WatchThemesOptions['watchOptions']
  /** Loader factory options when no custom loader is provided. */
  nextLoaderOptions?: NextLoaderOptions
  /** Force-enable or disable the watcher regardless of NODE_ENV. */
  enabled?: boolean
  /** Custom loader instance or identifier. */
  loader?: LoaderSpecifier
}

let watcherHandle: ThemeWatcherHandle | null = null
let watcherPromise: Promise<ThemeWatcherHandle> | null = null

export function withThemeRegistry(
  options: WithThemeRegistryOptions,
  nextConfig: NextConfig = {}
): NextConfigFunction {
  const configFactory = normalizeConfig(nextConfig)

  return async (phase, defaults) => {
    if (shouldEnableWatcher(options)) {
      await ensureThemeWatcher(options)
    }
    return configFactory(phase, defaults)
  }
}

function normalizeConfig(config: NextConfig): NextConfigFunction {
  if (typeof config === 'function') {
    return config as NextConfigFunction
  }
  return async () => config
}

function shouldEnableWatcher(options: WithThemeRegistryOptions): boolean {
  if (typeof options.enabled === 'boolean') {
    return options.enabled
  }
  return process.env.NODE_ENV !== 'production'
}

async function ensureThemeWatcher(options: WithThemeRegistryOptions): Promise<void> {
  if (watcherHandle) return
  if (!watcherPromise) {
    watcherPromise = startWatcher(options)
  }

  try {
    watcherHandle = await watcherPromise
  } catch (error) {
    watcherPromise = null
    throw error
  }
}

async function startWatcher(options: WithThemeRegistryOptions): Promise<ThemeWatcherHandle> {
  const resolved = await resolveWatcherOptions(options)
  const handle = await watchThemes(resolved)
  watcherHandle = handle

  let cleanedUp = false
  const cleanup = async () => {
    if (cleanedUp) return
    cleanedUp = true
    try {
      await handle.close()
    } catch {
      // ignore cleanup errors
    }
    if (watcherHandle === handle) {
      watcherHandle = null
      watcherPromise = null
    }
    detach()
  }

  const detach = () => {
    signals.forEach((signal, index) => {
      process.removeListener(signal, signalHandlers[index])
    })
    process.removeListener('exit', exitHandler)
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  const signalHandlers = signals.map(signal => {
    const handler = () => {
      void cleanup()
    }
    process.once(signal, handler)
    return handler
  })

  const exitHandler = () => {
    void cleanup()
  }
  process.once('exit', exitHandler)

  return handle
}

async function resolveWatcherOptions(
  options: WithThemeRegistryOptions
): Promise<WatchThemesOptions> {
  const {
    config,
    nextLoaderOptions,
    enabled: _enabled,
    ...inlineOptions
  } = options

  const baseOptions = config ? await loadConfig(config) : undefined
  const loader = inlineOptions.loader ?? baseOptions?.loader ?? createNextLoader(nextLoaderOptions)

  const merged: WatchThemesOptions = {
    ...(baseOptions ?? {}),
    ...inlineOptions,
    loader
  }

  if (!merged.themesDir) {
    throw new Error(
      'withThemeRegistry requires a themesDir. Provide one via options or theme-registry.config.*'
    )
  }

  if (inlineOptions.watchOptions) {
    merged.watchOptions = inlineOptions.watchOptions
  }

  return merged
}
