# @solid-primitives/trigger

## 1.2.4

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 1.2.3

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 1.2.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 1.2.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 1.2.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 1.1.0

### Minor Changes

- 32fcb81: Add `dirtyAll` to `createTriggerCache`

## 1.0.11

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 1.0.10

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 1.0.9

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 1.0.8

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 1.0.7

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 1.0.6

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 1.0.5

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 1.0.4

### Patch Changes

- 83843698: Use `!isServer && DEV` for checking development env to support versions prior to 1.6.12
- Updated dependencies [83843698]
  - @solid-primitives/utils@5.5.2

## 1.0.3

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 1.0.2

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 1.0.2-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 1.0.1

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 1.0.0

### Major Changes

- d6167247: Improve `createTriggerCache` and reactive sets/maps by autocleaning signals that aren't being listened to.

## 0.0.4

### Patch Changes

- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 0.0.3

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 0.0.2

### Patch Changes

- 9ed32b38: Moves trigger primitives from utils to @solid-primitives/trigger package. Better utilize WeakMaps for caching triggers.
- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0
