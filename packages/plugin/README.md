# rozenite-growthbook-plugin

A [Rozenite](https://rozenite.com) DevTools plugin for debugging [GrowthBook](https://www.growthbook.io) feature flags and experiments in React Native apps.

Inspect features, override values, force experiment variations, and edit user attributes — all from the Rozenite DevTools panel.

## Installation

```bash
pnpm add rozenite-growthbook-plugin
```

You'll also need these peer dependencies:

- `@growthbook/growthbook` (>= 1.0.0)
- `react`
- `react-native`

## Usage

Call the `useGrowthBookDevTools` hook somewhere inside your `GrowthBookProvider`:

```tsx
import { useGrowthBook } from '@growthbook/growthbook-react'
import { useGrowthBookDevTools } from 'rozenite-growthbook-plugin'

function DevToolsBridge() {
  const gb = useGrowthBook()

  useGrowthBookDevTools(gb)

  return null
}
```

The hook only runs in development builds. It's a no-op in production.

## License

MIT
