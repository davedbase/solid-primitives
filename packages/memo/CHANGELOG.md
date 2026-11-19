# @solid-primitives/memo

## 1.5.1

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1
  - @solid-primitives/scheduled@1.5.3

## 1.5.0

### Minor Changes

- 0ebdd1a: Added createRcMemo primitive for memos that are only awake while there are listeners.

## 1.4.5

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0
  - @solid-primitives/scheduled@1.5.3

## 1.4.4

### Patch Changes

- Updated dependencies [f32f209]
  - @solid-primitives/scheduled@1.5.3

## 1.4.3

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/scheduled@1.5.2
  - @solid-primitives/utils@6.3.2

## 1.4.2

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/scheduled@1.5.1
  - @solid-primitives/utils@6.3.1

## 1.4.1

### Patch Changes

- d86e65d: fix createWritableMemo (fixes #772)

## 1.4.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/scheduled@1.5.0
  - @solid-primitives/utils@6.3.0

## 1.3.10

### Patch Changes

- Updated dependencies [57a3078]
  - @solid-primitives/scheduled@1.4.4

## 1.3.9

### Patch Changes

- 49416e8: Fix unable to set Writable Memos twice to the same value, when they changed in between

## 1.3.8

### Patch Changes

- 74db287: Correct the "homepage" field in package.json
- Updated dependencies [74db287]
  - @solid-primitives/scheduled@1.4.3

## 1.3.7

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3
  - @solid-primitives/scheduled@1.4.2

## 1.3.6

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/scheduled@1.4.2
  - @solid-primitives/utils@6.2.2

## 1.3.5

### Patch Changes

- 6aa53864: Correct `createLatest` and `createLatestMany` triggering on `equals: false` sources

## 1.3.4

### Patch Changes

- Updated dependencies [722eeafb]
  - @solid-primitives/scheduled@1.4.1

## 1.3.3

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1
  - @solid-primitives/scheduled@1.4.0

## 1.3.2

### Patch Changes

- Updated dependencies [a2c9ab03]
  - @solid-primitives/scheduled@1.4.0

## 1.3.1

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 1.3.0

### Minor Changes

- 5e1f19e0: Add `createLatestMany`

  Deprecate scheduled memos (`createDebouncedMemo`, `createDebouncedMemoOn`, `createThrottledMemo`) in favor of using the `createSchedule` primitive from the `scheduled` package

## 1.2.5

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 1.2.4

### Patch Changes

- a1b88c95: Improve lazy memo reads in another memo.
- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 1.2.3

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/scheduled@1.3.2
  - @solid-primitives/utils@5.5.1

## 1.2.2

### Patch Changes

- 4d461d50: Simplify `createLazyMemo`

  If won't run if disposed even if stale anymore.

## 1.2.1

### Patch Changes

- c9e84c7f: Fix createWritableMemo setter return

## 1.2.0

### Minor Changes

- d7b907e6: Major improvements to how createWritableMemo and createLatest works.

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 1.2.0-beta.1

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 1.2.0-beta.0

### Minor Changes

- d7b907e6: Major improvements to how createWritableMemo and createLatest works.

## 1.1.5

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/scheduled@1.3.1
  - @solid-primitives/utils@5.2.1

## 1.1.4

### Patch Changes

- c2866ea6: Update utils package
- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 1.1.3

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/scheduled@1.2.1
  - @solid-primitives/utils@4.0.1

## 1.1.2

### Patch Changes

- 63497285: Correct the cleanup behavior of createLazyMemo and createPureComputation.

## 1.1.1

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0

## 1.1.0

### Minor Changes

- 71a1414d: Add `createReducer` (moved from `@solid-primitives/reducer` package)
- 8ddc147a: Rename `createCurtain` to `createLatest`. (deprecate `createCurtain`)

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
- Updated dependencies [8ddc147a]
  - @solid-primitives/utils@3.1.0
  - @solid-primitives/scheduled@1.1.0

## 1.0.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/scheduled@1.0.1
  - @solid-primitives/utils@3.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [73b6a34]
  - @solid-primitives/utils@3.0.0

## Changelog up to version 1.0.0

0.0.100

Initial release as a Stage-1 primitive.

0.0.200

Add `createWritableMemo`. rename `createCache` to `createMemoCache`.

0.0.300

Add `createCurtain`. refactor `createWritableMemo`.

0.1.1

Support for Solid 1.4

0.2.1

`createLazyMemo` improvements

0.3.0

Improve how `createPureReaction`, `createThrottledMemo` and `createDebouncedMemo` work when created during batched effect.

Provida a separate tuntime for server.

1.0.0 - **stage-3**

[PR#158](https://github.com/solidjs-community/solid-primitives/pull/158)

Add `createDebouncedMemoOn` primitive.

Move the initial value argument from options to a separate argument in `createDebouncedMemo` and `createThrottledMemo` primitives.
