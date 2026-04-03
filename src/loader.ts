import type {
  LoaderStrategy,
  TemplateRegistryEntry
} from '@theme-registry/toolkit'

export interface NextLoaderOptions {
  ssr?: boolean
}

export function createNextLoader(options: NextLoaderOptions = {}): LoaderStrategy {
  const { ssr = true } = options

  return {
    name: 'next-loader',
    getHeaderLines: () => ['import dynamic from "next/dynamic";'],
    createTemplateRegistration: (entry: TemplateRegistryEntry) => {
      const loader = `dynamic(() => import("./${entry.relativePath}"), { ssr: ${ssr ? 'true' : 'false'} })`
      const contextArg = entry.includeContext ? `, "${entry.context}"` : ''
      return `registry.set("${entry.template}", ${loader}${contextArg});`
    },
    getSupportedExtensions: () => ['.js', '.jsx', '.ts', '.tsx']
  }
}

export const nextLoader = createNextLoader()
export default nextLoader
