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

  useGrowthBookDevTools({ gb })

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

Useful commands:

```bash
pnpm dev             # Watch mode
pnpm build           # Build the plugin
pnpm typecheck       # Run TypeScript checks
pnpm lint            # Lint with oxlint
pnpm format          # Format with oxfmt
pnpm format:check    # Check formatting
pnpm knip            # Find unused exports/deps
```

To run the example app:

```bash
pnpm start:example          # Start Expo
pnpm ios:example            # Run on iOS
pnpm android:example        # Run on Android
```

The example app needs `WITH_ROZENITE=true` set before the Expo command (e.g. `WITH_ROZENITE=true expo start`).

## Contributing

Contributions are welcome. Bug fixes, new features, docs improvements — all good.

The general flow:

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Make sure `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` all pass
4. Use [conventional commits](https://www.conventionalcommits.org) for your commit messages (enforced by commitlint)
5. Open a pull request

If you're planning something big, open an issue first so we can discuss it.

## License

MIT
