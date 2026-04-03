# @theme-registry/next-loader

Next.js loader strategy for `@theme-registry/toolkit`. Generates registries that use `next/dynamic` to load templates.

## Installation

```bash
npm install --save-dev @theme-registry/next-loader
```

## Usage

```ts
import { createNextLoader } from '@theme-registry/next-loader'
import { buildAllThemes } from '@theme-registry/toolkit'

await buildAllThemes({
  themesDir: './src/themes',
  loader: createNextLoader({ ssr: false })
})
```

### Options

| Option | Required | Default value | Description |
|--------|----------|----------------|-------------|
| `ssr`  | No       | `true`         | Passed to `next/dynamic`'s `ssr` flag. Set to `false` to disable server-side rendering for generated templates. |

## Integrate with `next.config.*`

`withThemeRegistry` loads `theme-registry.config.*` (or the inline overrides you pass), starts `@theme-registry/toolkit`'s watch mode once, and keeps it alive until Next.js shuts down. By default the watcher only runs when `NODE_ENV !== 'production'`; override via `enabled: true | false` for preview builds.

### Example `next.config.cjs`

One pattern works for both CommonJS configs and `next.config.ts` files (when `require` is allowed). Reuse the same `nextConfig` and `registryOptions` so you can share the values in either format:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true
}

const registryOptions = {
  config: './theme-registry.config.cjs',
  nextLoaderOptions: { ssr: false }
}

let withThemeRegistry = (options, config) => config
try {
  ({ withThemeRegistry } = require('@theme-registry/next-loader'))
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('Theme registry watcher skipped:', message)
  }
}

module.exports = withThemeRegistry(registryOptions, nextConfig)
```
