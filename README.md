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

Start the toolkit watcher automatically whenever `next dev` (Webpack or Turbopack) runs by wrapping your Next config with `withThemeRegistry`:

```js
// next.config.cjs
let withThemeRegistry = (config => config)
try {
  ({ withThemeRegistry } = require('@theme-registry/next-loader'))
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Theme registry integration skipped:', error.message)
  }
}

module.exports = withThemeRegistry(
  {
    config: './theme-registry.config.cjs',
    nextLoaderOptions: { ssr: false }
  },
  {
    reactStrictMode: true
  }
)
```

`withThemeRegistry` loads the shared `theme-registry.config.*` (or uses the inline `themesDir`/`loader` you provide), starts `@theme-registry/toolkit`'s watch mode once, and keeps it alive until Next.js shuts down. By default it only runs when `NODE_ENV !== 'production'`; override via `enabled: true | false` when needed (for example, to run the watcher during preview deployments).
