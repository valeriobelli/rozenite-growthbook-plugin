
# rozenite-growthbook-plugin

A [Rozenite](https://rozenite.com) DevTools plugin for debugging [GrowthBook](https://www.growthbook.io) feature flags and experiments in React Native apps.

Inspect features, override values, force experiment variations, and edit user attributes; all from the Rozenite DevTools panel.

<p align="center">
<img alt="Demo" src="https://github.com/user-attachments/assets/8e0356d0-269e-4f8e-89e4-f42f7ba56e9d" />
</p>

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

## Development

```bash
git clone https://github.com/valeriobelli/rozenite-growthbook-plugin.git
cd rozenite-growthbook-plugin
pnpm install
```

Look into the `package.json` files to understand the packages interface.

## Contributing

Contributions are welcome. Bug fixes, new features, docs improvements.

Use [conventional commits](https://www.conventionalcommits.org) for your commit messages (enforced by commitlint)

If you're planning something big, open an issue first so we can discuss it.

## License

MIT
