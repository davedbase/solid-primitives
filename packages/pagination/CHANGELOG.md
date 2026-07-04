# @solid-primitives/pagination

## 0.5.2

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 0.5.1

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 0.5.0

### Minor Changes

- b9d71b4: new segmentation primitive, jump pages, fix set page to non-existent page, fix demo

## 0.4.3

### Patch Changes

- 48d890d: Add missing type keyword to type imports.

## 0.4.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 0.4.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 0.4.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 0.3.0

### Minor Changes

- 7ba7e1d: infinite scolling: fix suspense

## 0.2.12

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 0.2.11

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 0.2.10

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 0.2.9

### Patch Changes

- 0b589d42: Fix of back and next page values

## 0.2.8

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 0.2.7

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 0.2.6

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 0.2.5

### Patch Changes

- f2f77197: Remove intersection-observer package dependency

## 0.2.4

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0
  - @solid-primitives/intersection-observer@2.0.11

## 0.2.3

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/intersection-observer@2.0.9
  - @solid-primitives/utils@5.5.1

## 0.2.2

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0
  - @solid-primitives/intersection-observer@2.0.8

## 0.2.2-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0
  - @solid-primitives/intersection-observer@2.0.8-beta.0

## 0.2.1

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/intersection-observer@2.0.7
  - @solid-primitives/utils@5.2.1

## 0.2.0

### Minor Changes

- 46a2ae79: make options reactive, prevent wrong page slice

## 0.1.0

### Minor Changes

- a6277325: added new `createInfiniteScroll` primitive

## 0.0.103

### Patch Changes

- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 0.0.102

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 0.0.101

### Patch Changes

- 6d8ed09b: initial release: pagination
