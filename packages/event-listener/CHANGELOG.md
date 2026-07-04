# @solid-primitives/event-listener

## 2.4.6

### Patch Changes

- 59c9702: Fix named imports breaking under Rolldown (Vite 8+ / Storybook 10.4.6+) bundlers.

  These packages re-export their public API via `export * from "./x.js"` barrels. Rollup resolves named imports through these at link time, but Rolldown's static analysis doesn't reliably follow `export *` for named-export resolution, causing errors like:

  ```
  "createEventListener" is not exported by "@solid-primitives/event-listener/dist/index.js"
  ```

  The build now also emits explicit `export { name } from "./x.js"` lines for every runtime export reachable through a barrel's `export *`, derived automatically from each submodule's compiled output — so `dist/` is bundler-agnostic regardless of how a given tool resolves star re-exports.

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 2.4.5

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 2.4.4

### Patch Changes

- f32f209: Update author email for David Di Biase.

## 2.4.3

### Patch Changes

- 48d890d: Add missing type keyword to type imports.

## 2.4.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 2.4.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 2.4.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 2.3.3

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 2.3.2

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 2.3.1

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 2.3.0

### Minor Changes

- b4398ee0: Add more event target and event target map types.

## 2.2.14

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 2.2.13

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 2.2.12

### Patch Changes

- f03c47b0: Improve types of `createEventListenerMap`

## 2.2.11

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 2.2.10

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 2.2.9

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 2.2.8

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 2.2.8-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 2.2.7

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 2.2.6

### Patch Changes

- c2866ea6: Update utils package
- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 2.2.5

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 2.2.4

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0

## 2.2.3

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- abb8063c: Prevent `makeEventListener` from displaying a warning if used outside of a reactive root
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
  - @solid-primitives/utils@3.1.0

## 2.2.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/utils@3.0.2

## 2.2.1

### Patch Changes

- Updated dependencies [73b6a34]
  - @solid-primitives/utils@3.0.0

## Changelog up to version 2.2.0

0.0.100

First ported commit from react-use-event-listener.

1.1.4

Released a version with type mostly cleaned up.

1.2.3

Switched to a more idiomatic pattern: Warning: incompatible with the previous version!

1.2.5

Added CJS build.

1.2.6

Migrated to new build process.

1.3.0

**(minor breaking changes to type generics and returned functions)**
Primitive rewritten to provide better types and more solidlike (reactive) usage. Added a lot more primitives.

1.3.8

Published recent major updates to latest tag.

1.4.1

Updated to Solid 1.3

1.4.2

Minor improvements.

1.4.3

Allow listening to multiple event types with a single `createEventListener` | `createEventSignal`. Removed option to pass a reactive signal as options.

1.5.0

Add `createEventListenerBus`.

2.0.0

[PR#113](https://github.com/solidjs-community/solid-primitives/pull/113)

Remove `createEventListenerBus`, `createEventListenerStore` & `eventListenerMap`

Add `makeEventListener` and `makeEventListenerStack`

Remove clear() functions from reactive primitives.

2.1.0

Allow for `undefined` targets in `createEventListener`

2.2.0

Add `preventDefault`, `stopPropagation` and `stopImmediatePropagation` callback wrappers.
