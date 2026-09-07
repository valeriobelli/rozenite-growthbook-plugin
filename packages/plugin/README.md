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

## Agent tools

The plugin also exposes its capabilities to coding agents through
[Rozenite for Agents](https://www.rozenite.dev/docs/agent/overview). The tools
register whenever `useGrowthBookDevTools` is mounted, so an agent can drive the
app without the DevTools panel being open.

The agent domain is the package name:

```bash
npx rozenite agent targets
npx rozenite agent rozenite-growthbook-plugin tools --pretty
npx rozenite agent rozenite-growthbook-plugin call --tool list-features --args '{"limit":20}' --pretty
```

### Reading

| Tool               | What it returns                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `list-features`    | Every feature key with its evaluated value and whether an override is in force. Cursor-paginated. |
| `get-feature`      | One feature in full: value, rule, source, experiment, override state.                             |
| `list-experiments` | The evaluated experiments with their assigned and forced variations. Cursor-paginated.            |
| `get-state`        | The user attributes, the forced features, the forced variations, and the SDK info, in one call.   |

### Writing

| Tool                        | Effect                                                                           |
| --------------------------- | -------------------------------------------------------------------------------- |
| `set-feature-override`      | Forces a feature to a value.                                                     |
| `remove-feature-override`   | Removes the override of one feature.                                             |
| `clear-feature-overrides`   | Removes every feature override. Destructive.                                     |
| `set-variation-override`    | Forces an experiment to a variation index.                                       |
| `remove-variation-override` | Removes the forced variation of one experiment.                                  |
| `clear-variation-overrides` | Removes every forced variation. Destructive.                                     |
| `patch-attributes`          | Merges attributes into the current ones. Prefer this.                            |
| `replace-attributes`        | Replaces the whole attribute map. Destructive: attributes not named are deleted. |
| `remove-attributes`         | Deletes the named attributes.                                                    |

Overrides live in memory. They disappear when the app reloads.

### Typed SDK access

The package publishes typed descriptors on the `./sdk` entry point:

```ts
import { createAgentClient } from '@rozenite/agent-sdk'
import { growthbookTools } from 'rozenite-growthbook-plugin/sdk'

const client = createAgentClient()

const result = await client.withSession(async (session) => {
  await session.tools.call(growthbookTools.patchAttributes, {
    attributes: { country: 'IT' },
  })

  return session.tools.call(growthbookTools.getFeature, { key: 'dark-mode' })
})
```

## License

MIT
