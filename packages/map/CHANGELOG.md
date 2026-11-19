# @solid-primitives/map

## 0.7.4

### Patch Changes

- @solid-primitives/trigger@1.2.4

## 0.7.3

### Patch Changes

- @solid-primitives/trigger@1.2.3

## 0.7.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/trigger@1.2.2

## 0.7.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/trigger@1.2.1

## 0.7.0

### Minor Changes

- 1d1c686: Avoid notifying non-existent members on Map.clear()

## 0.6.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/trigger@1.2.0

## 0.5.0

### Minor Changes

- 46e4379: Fix and optimize ReactiveMap and ReactiveWeakMap (https://github.com/solidjs-community/solid-primitives/pull/704)

## 0.4.13

### Patch Changes

- Updated dependencies [32fcb81]
  - @solid-primitives/trigger@1.1.0

## 0.4.12

### Patch Changes

- 1ea2a09: Use new Map/SetIterator types

## 0.4.11

### Patch Changes

- 74db287: Correct the "homepage" field in package.json
- Updated dependencies [74db287]
  - @solid-primitives/trigger@1.0.11

## 0.4.10

### Patch Changes

- @solid-primitives/trigger@1.0.10

## 0.4.9

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/trigger@1.0.9

## 0.4.8

### Patch Changes

- 0d0640db: Fix ReactiveMap iterators tracking

## 0.4.7

### Patch Changes

- @solid-primitives/trigger@1.0.8

## 0.4.6

### Patch Changes

- 52a00ca5: Update `ReactiveSet`/`ReactiveMap` constructors to allow passing any iterable as the initial value.

## 0.4.5

### Patch Changes

- @solid-primitives/trigger@1.0.7

## 0.4.4

### Patch Changes

- @solid-primitives/trigger@1.0.6

## 0.4.3

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/trigger@1.0.3

## 0.4.2

### Patch Changes

- @solid-primitives/trigger@1.0.2

## 0.4.2-beta.0

### Patch Changes

- @solid-primitives/trigger@1.0.2-beta.0

## 0.4.1

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/trigger@1.0.1

## 0.4.0

### Minor Changes

- d6167247: Improve `createTriggerCache` and reactive sets/maps by autocleaning signals that aren't being listened to.

### Patch Changes

- Updated dependencies [d6167247]
  - @solid-primitives/trigger@1.0.0

## 0.3.2

### Patch Changes

- @solid-primitives/trigger@0.0.4

## 0.3.1

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/trigger@0.0.3

## 0.3.0

### Minor Changes

- 9ed32b38: Moves trigger primitives from utils to @solid-primitives/trigger package. Better utilize WeakMaps for caching triggers.

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/trigger@0.0.2

## 0.2.3

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
  - @solid-primitives/utils@3.1.0

## 0.2.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/utils@3.0.2

## 0.2.1

### Patch Changes

- Updated dependencies [73b6a34]
  - @solid-primitives/utils@3.0.0

## Changelog up to version 0.2.0

0.0.100

Initial release of the package.

0.2.0

Deprecated `createMap` and `createWeakMap` functions, as they weren't providing any benefit over instanciating with the `new` keyword.

`ReactiveMap` and `ReactiveWeakMap` now will respect `instanceof Map/WeakMap` checks.

Internal signals will be created only if read in a tracking scope.

Remove setter function api from `.set()` method.
