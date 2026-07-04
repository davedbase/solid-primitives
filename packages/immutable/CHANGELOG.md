# @solid-primitives/immutable

## 1.1.5

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1
  - @solid-primitives/keyed@1.5.3

## 1.1.4

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0
  - @solid-primitives/keyed@1.5.3

## 1.1.3

### Patch Changes

- Updated dependencies [00af88d]
  - @solid-primitives/keyed@1.5.3

## 1.1.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/keyed@1.5.2
  - @solid-primitives/utils@6.3.2

## 1.1.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/keyed@1.5.1
  - @solid-primitives/utils@6.3.1

## 1.1.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/keyed@1.5.0
  - @solid-primitives/utils@6.3.0

## 1.0.12

### Patch Changes

- Updated dependencies [e82cb70]
  - @solid-primitives/keyed@1.4.0

## 1.0.11

### Patch Changes

- Updated dependencies [cf11535]
  - @solid-primitives/keyed@1.3.0

## 1.0.10

### Patch Changes

- Updated dependencies [9749071]
  - @solid-primitives/keyed@1.2.3

## 1.0.9

### Patch Changes

- 74db287: Correct the "homepage" field in package.json
- Updated dependencies [74db287]
  - @solid-primitives/keyed@1.2.2

## 1.0.8

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3
  - @solid-primitives/keyed@1.2.1

## 1.0.7

### Patch Changes

- a632588: Correct getOwnPropertyDescriptor trap

## 1.0.6

### Patch Changes

- 1696655: Loosen createImmutable types. Fix tracking array indexes.

## 1.0.5

### Patch Changes

- 13cf989: Support storing other class instances than plain objects.

## 1.0.4

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/keyed@1.2.1
  - @solid-primitives/utils@6.2.2

## 1.0.3

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1
  - @solid-primitives/keyed@1.2.0

## 1.0.2

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0
  - @solid-primitives/keyed@1.2.0

## 1.0.1

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1
  - @solid-primitives/keyed@1.2.0

## 1.0.0

### Major Changes

- 1edee005: Moves the exiting immutable helpers from the `immutable` package to `utils/immutable` submodule.

  The immutable package is replaced with a new `createImmutable` primitive for creating stores derived from immutable structures. (issue #140)

### Patch Changes

- Updated dependencies [1edee005]
- Updated dependencies [1edee005]
- Updated dependencies [6415f2ba]
  - @solid-primitives/utils@6.1.0
  - @solid-primitives/keyed@1.2.0

## 0.1.10

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 0.1.9

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 0.1.8

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 0.1.8-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 0.1.7

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 0.1.6

### Patch Changes

- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 0.1.5

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 0.1.4

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0

## 0.1.3

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
  - @solid-primitives/utils@3.1.0

## 0.1.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/utils@3.0.2

## 0.1.1

### Patch Changes

- e7870cb: Update deps.

## Changelog up to version 0.1.0

0.0.100

Initial release as a Stage-1 primitive.
