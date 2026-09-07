---
'rozenite-growthbook-plugin': minor
---

Expose the plugin to Rozenite agents.

Thirteen agent tools now register alongside the DevTools panel, so a coding
agent can read the GrowthBook state and drive it: `list-features`,
`get-feature`, `list-experiments` and `get-state` for reading, and
`set-feature-override`, `remove-feature-override`, `clear-feature-overrides`,
`set-variation-override`, `remove-variation-override`,
`clear-variation-overrides`, `patch-attributes`, `replace-attributes` and
`remove-attributes` for writing.

The package also gains a `./sdk` entry point that publishes typed tool
descriptors for `@rozenite/agent-sdk`.
