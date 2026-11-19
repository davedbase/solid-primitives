# @solid-primitives/fullscreen

## 1.3.5

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 1.3.4

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 1.3.3

### Patch Changes

- 48d890d: Add missing type keyword to type imports.

## 1.3.2

### Patch Changes

- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 1.3.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 1.3.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 1.2.6

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 1.2.5

### Patch Changes

- d23dd74: Add type exports for cjs

## 1.2.4

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.

## 1.2.3

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)

## 1.2.2

### Patch Changes

- dd2d7d1c: Improve export conditions.

## 1.2.1

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)

## 1.2.0

### Minor Changes

- 48051f0b: fix oncleanup message

## 1.1.1

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5

## Changelog up to version 1.1.0

0.0.100

Initial release

1.0.4

Published with CJS and SSR protection.

1.0.5

Added missing peerDependencies and updated to latest Solid.
