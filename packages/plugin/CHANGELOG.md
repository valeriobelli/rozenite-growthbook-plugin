# rozenite-growthbook-plugin

## 1.0.0

### Major Changes

- b037ef7: Migrate to Rozenite v2

### Minor Changes

- c148583: Expose the plugin to Rozenite agents.

  Thirteen agent tools now register alongside the DevTools panel, so a coding
  agent can read the GrowthBook state and drive it: `list-features`,
  `get-feature`, `list-experiments` and `get-state` for reading, and
  `set-feature-override`, `remove-feature-override`, `clear-feature-overrides`,
  `set-variation-override`, `remove-variation-override`,
  `clear-variation-overrides`, `patch-attributes`, `replace-attributes` and
  `remove-attributes` for writing.

  The package also gains a `./sdk` entry point that publishes typed tool
  descriptors for `@rozenite/agent-sdk`.

- 58e034d: Polish UI

## 0.6.0

### Minor Changes

- e689cb8: Split AttributesTab components to enhance tab performance
- e443c30: Decode and show correct input type for unknown attribute types
- ea57da7: Simplify useGrowthBookDevTools interface

## 0.5.0

### Minor Changes

- 95dcd5a: Separate SDK info and devtools-specific settings into separate tabs
- bb0fd3a: Optimize perf withing results filtering

## 0.4.0

### Minor Changes

- 5952347: Optimize UI/UX and performance
- 4d30127: Subscribe to client changes reflecting them to devtools state

## 0.3.0

### Minor Changes

- c4a09da: Add possibility to override GrowthBook backend API endpoint

## 0.2.1

### Patch Changes

- f03cc40: Force changeset to create github releases

## 0.2.0

### Minor Changes

- 3a2363e: Restructure TanStack Query management and fix experiments and feature flags communication to devtools

## 0.1.0

### Minor Changes

- 882d65a: Initial release

### Patch Changes

- bf456f9: Fix release configuration
