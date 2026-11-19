# @solid-primitives/props

## 3.2.4

### Patch Changes

- 59c9702: Fix named imports breaking under Rolldown (Vite 8+ / Storybook 10.4.6+) bundlers.

  These packages re-export their public API via `export * from "./x.js"` barrels. Rollup resolves named imports through these at link time, but Rolldown's static analysis doesn't reliably follow `export *` for named-export resolution, causing errors like:

  ```
  "createEventListener" is not exported by "@solid-primitives/event-listener/dist/index.js"
  ```

  The build now also emits explicit `export { name } from "./x.js"` lines for every runtime export reachable through a barrel's `export *`, derived automatically from each submodule's compiled output — so `dist/` is bundler-agnostic regardless of how a given tool resolves star re-exports.

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 3.2.3

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 3.2.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 3.2.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 3.2.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 3.1.11

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 3.1.10

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 3.1.9

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 3.1.8

### Patch Changes

- d35e8b01: Reduce `if` statements in `combineStyle` and allow for `undefined` params.

## 3.1.7

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 3.1.6

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 3.1.5

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 3.1.4

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 3.1.3

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 3.1.2

### Patch Changes

- e4c7e59c: Improve regex used to extract CSS properties from inline styles.

## 3.1.1

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 3.1.1-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 3.1.0

### Minor Changes

- ddc12685: Add an overload to `combineProps` which allows for passing an options object, with `reverseEventHandlers` option. This option when enabled will cause the event handlers to be called right to left.

### Patch Changes

- Updated dependencies [ddc12685]
  - @solid-primitives/utils@5.3.0

## 3.0.7

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 3.0.6

### Patch Changes

- 0cfb9546: Improve checking event-listener keys

## 3.0.5

### Patch Changes

- 9e444e21: Fix bug with checking for event-listenets on function sources

## 3.0.4

### Patch Changes

- 93a6b4f3: Support function sources in `combineProps`

## 3.0.3

### Patch Changes

- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 3.0.2

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 3.0.1

### Patch Changes

- 27b80ea8: Align the behavior with solid 1.6 mergeProps logic - fixes #235 (combineProps wasn't respecting the check if source is a proxi in mergeProps)
- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0

## 3.0.0

### Major Changes

- 92a8afc4: Move `createCntrolledProp` primitive to a separate package: `@solid-primitives/controlled-props`. This pacakge no longer ships JSX, hence putting it to ssr.noExternal for SSR support is no longer neccessary.

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
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

Initial release

1.0.2

Release initial version with CJS support.

2.0.0 - [PR#127](https://github.com/solidjs-community/solid-primitives/pull/127)

Renamed `createProps` to `createControlledProps`, `createProp` to `createControlledProp` etc. (for all of the primitives focused on testing)

Added `combineProps` primitive

2.1.0

Add support for tuple event handlers and de-dupeing to `combineProps`.

2.1.1

Support for Solid 1.4

2.2.0

Add `filterProps` and `createPropsPredicate` primitives.
