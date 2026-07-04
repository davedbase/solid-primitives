# @solid-primitives/pointer

## 0.3.6

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/event-listener@2.4.6
  - @solid-primitives/utils@6.4.1
  - @solid-primitives/rootless@1.5.4

## 0.3.5

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0
  - @solid-primitives/event-listener@2.4.5
  - @solid-primitives/rootless@1.5.3

## 0.3.4

### Patch Changes

- Updated dependencies [f32f209]
  - @solid-primitives/event-listener@2.4.4

## 0.3.3

### Patch Changes

- 48d890d: Add missing type keyword to type imports.
- Updated dependencies [48d890d]
  - @solid-primitives/event-listener@2.4.3

## 0.3.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/event-listener@2.4.2
  - @solid-primitives/rootless@1.5.2
  - @solid-primitives/utils@6.3.2

## 0.3.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/event-listener@2.4.1
  - @solid-primitives/rootless@1.5.1
  - @solid-primitives/utils@6.3.1

## 0.3.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/event-listener@2.4.0
  - @solid-primitives/rootless@1.5.0
  - @solid-primitives/utils@6.3.0

## 0.2.19

### Patch Changes

- 74db287: Correct the "homepage" field in package.json
- Updated dependencies [74db287]
  - @solid-primitives/event-listener@2.3.3
  - @solid-primitives/rootless@1.4.5

## 0.2.18

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3
  - @solid-primitives/event-listener@2.3.2
  - @solid-primitives/rootless@1.4.4

## 0.2.17

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/event-listener@2.3.1
  - @solid-primitives/rootless@1.4.3
  - @solid-primitives/utils@6.2.2

## 0.2.16

### Patch Changes

- Updated dependencies [b4398ee0]
  - @solid-primitives/event-listener@2.3.0

## 0.2.15

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1
  - @solid-primitives/event-listener@2.2.14
  - @solid-primitives/rootless@1.4.2

## 0.2.14

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0
  - @solid-primitives/event-listener@2.2.13
  - @solid-primitives/rootless@1.4.1

## 0.2.13

### Patch Changes

- Updated dependencies [f03c47b0]
  - @solid-primitives/event-listener@2.2.12

## 0.2.12

### Patch Changes

- Updated dependencies [2e0bcedf]
- Updated dependencies [5ea65ea9]
  - @solid-primitives/utils@6.1.1
  - @solid-primitives/rootless@1.4.0
  - @solid-primitives/event-listener@2.2.11

## 0.2.11

### Patch Changes

- 1edee005: Use immutable helpers from `"utils/immutable"`
- Updated dependencies [1edee005]
- Updated dependencies [6415f2ba]
  - @solid-primitives/utils@6.1.0

## 0.2.10

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0
  - @solid-primitives/event-listener@2.2.10
  - @solid-primitives/immutable@0.1.10
  - @solid-primitives/rootless@1.3.2

## 0.2.9

### Patch Changes

- 83843698: Use `!isServer && DEV` for checking development env to support versions prior to 1.6.12
- Updated dependencies [83843698]
  - @solid-primitives/utils@5.5.2

## 0.2.8

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/event-listener@2.2.9
  - @solid-primitives/immutable@0.1.9
  - @solid-primitives/rootless@1.3.1
  - @solid-primitives/utils@5.5.1

## 0.2.7

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0
  - @solid-primitives/event-listener@2.2.8
  - @solid-primitives/immutable@0.1.8
  - @solid-primitives/rootless@1.2.6

## 0.2.7-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0
  - @solid-primitives/event-listener@2.2.8-beta.0
  - @solid-primitives/immutable@0.1.8-beta.0
  - @solid-primitives/rootless@1.2.6-beta.0

## 0.2.6

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/event-listener@2.2.7
  - @solid-primitives/immutable@0.1.7
  - @solid-primitives/rootless@1.2.5
  - @solid-primitives/utils@5.2.1

## 0.2.5

### Patch Changes

- c2866ea6: Update utils package
- Updated dependencies [c2866ea6]
- Updated dependencies [c2866ea6]
  - @solid-primitives/event-listener@2.2.6
  - @solid-primitives/rootless@1.2.3
  - @solid-primitives/utils@5.0.0
  - @solid-primitives/immutable@0.1.6

## 0.2.4

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/event-listener@2.2.5
  - @solid-primitives/immutable@0.1.5
  - @solid-primitives/rootless@1.2.2
  - @solid-primitives/utils@4.0.1

## 0.2.3

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0
  - @solid-primitives/event-listener@2.2.4
  - @solid-primitives/immutable@0.1.4
  - @solid-primitives/rootless@1.2.1

## 0.2.2

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [e36ed229]
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
- Updated dependencies [abb8063c]
  - @solid-primitives/rootless@1.2.0
  - @solid-primitives/utils@3.1.0
  - @solid-primitives/event-listener@2.2.3
  - @solid-primitives/immutable@0.1.3

## 0.2.1

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/event-listener@2.2.2
  - @solid-primitives/immutable@0.1.2
  - @solid-primitives/rootless@1.1.3
  - @solid-primitives/utils@3.0.2

## 0.2.0

### Minor Changes

- e7870cb: Remove returned clear function from createPointerListeners.

### Patch Changes

- e7870cb: Update deps.
- Updated dependencies [e7870cb]
  - @solid-primitives/immutable@0.1.1

## Changelog up to version 0.1.0

0.0.100

Initial release as a Stage-2 primitive.
