# @solid-primitives/geolocation

## 1.5.5

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1
  - @solid-primitives/static-store@0.1.4

## 1.5.4

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0
  - @solid-primitives/static-store@0.1.3

## 1.5.3

### Patch Changes

- f32f209: Update author email for David Di Biase.

## 1.5.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/static-store@0.1.2
  - @solid-primitives/utils@6.3.2

## 1.5.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/static-store@0.1.1
  - @solid-primitives/utils@6.3.1

## 1.5.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/static-store@0.1.0
  - @solid-primitives/utils@6.3.0

## 1.4.15

### Patch Changes

- Updated dependencies [56d9511]
  - @solid-primitives/static-store@0.0.9

## 1.4.14

### Patch Changes

- 74db287: Correct the "homepage" field in package.json
- Updated dependencies [74db287]
  - @solid-primitives/static-store@0.0.8

## 1.4.13

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3
  - @solid-primitives/static-store@0.0.7

## 1.4.12

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/static-store@0.0.6
  - @solid-primitives/utils@6.2.2

## 1.4.11

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1
  - @solid-primitives/static-store@0.0.5

## 1.4.10

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0
  - @solid-primitives/static-store@0.0.4

## 1.4.9

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1
  - @solid-primitives/static-store@0.0.3

## 1.4.8

### Patch Changes

- 2f6d3732: Use the static-store package for creating reactive objects. Minor overall improvements
- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0
  - @solid-primitives/static-store@0.0.2

## 1.4.7

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 1.4.6

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 1.4.6-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 1.4.5

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 1.4.4

### Patch Changes

- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 1.4.3

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 1.4.2

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0

## 1.4.1

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
  - @solid-primitives/utils@3.1.0

## 1.4.0

### Minor Changes

- 6fcf348: Adjustments to support Solid 1.5

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/utils@3.0.2

## 1.3.1

### Patch Changes

- Updated dependencies [73b6a34]
  - @solid-primitives/utils@3.0.0

## Changelog up to version 1.3.0

0.0.100

Pulling an early release of the package together and preparing for 1.0.0 release. No changes.

1.0.0

Added testing, improved types, changed name of createGeolocationWatcher to createGeolocationMonitor.

1.0.6

Published with CJS and SSR support.

1.0.7

Changed to peerDependencies and updated to latest Solid.

1.1.1

Improved tests and type dependencies.

1.2.0

Additional clean-up and tests improvements.

1.3.0

Upgraded to latest version of Solid and our Primitives standards.
