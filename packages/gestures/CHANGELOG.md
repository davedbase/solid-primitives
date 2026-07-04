# @solid-primitives/gestures

## 1.2.1

### Patch Changes

- 59c9702: Fix named imports breaking under Rolldown (Vite 8+ / Storybook 10.4.6+) bundlers.

  These packages re-export their public API via `export * from "./x.js"` barrels. Rollup resolves named imports through these at link time, but Rolldown's static analysis doesn't reliably follow `export *` for named-export resolution, causing errors like:

  ```
  "createEventListener" is not exported by "@solid-primitives/event-listener/dist/index.js"
  ```

  The build now also emits explicit `export { name } from "./x.js"` lines for every runtime export reachable through a barrel's `export *`, derived automatically from each submodule's compiled output — so `dist/` is bundler-agnostic regardless of how a given tool resolves star re-exports.

## 1.2.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

## 1.1.6

### Patch Changes

- d23dd74: Add type exports for cjs

## 1.1.5

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.

## 1.1.4

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)

## 1.1.3

### Patch Changes

- dd2d7d1c: Improve export conditions.

## 1.1.2

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)

## 1.1.1

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5

## Changelog up to version 1.1.0

1.0.0

First ported commit from svelte-gestures.
