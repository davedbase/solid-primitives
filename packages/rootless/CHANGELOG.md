# @solid-primitives/rootless

## 1.5.4

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 1.5.3

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 1.5.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 1.5.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 1.5.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 1.4.5

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 1.4.4

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 1.4.3

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 1.4.2

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 1.4.1

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 1.4.0

### Minor Changes

- 5ea65ea9: Add `createRootPool` primitive.

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 1.3.2

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 1.3.1

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 1.3.0

### Minor Changes

- 464248f7: Rename `createSharedRoot` to `createSingletonRoot`.

  Add experimental `createHydratableSingletonRoot` optimized for SSR and hydration.

### Patch Changes

- Updated dependencies [464248f7]
  - @solid-primitives/utils@5.5.0

## 1.2.6

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 1.2.6-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 1.2.5

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 1.2.4

### Patch Changes

- 60ee06f8: Allow for passing `null` to `createRoot` in `createSubRoot`.

## 1.2.3

### Patch Changes

- c2866ea6: Update utils package
- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 1.2.2

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 1.2.1

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0

## 1.2.0

### Minor Changes

- e36ed229: Rename `createBranch` to `createSubRoot`

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
  - @solid-primitives/utils@3.1.0

## 1.1.3

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/utils@3.0.2

## 1.1.2

### Patch Changes

- Updated dependencies [73b6a34]
  - @solid-primitives/utils@3.0.0

## Changelog up to version 1.1.1

0.0.100

Initial release as a Stage-1 primitive.

1.0.0 - **Stage-2**

- Remove `runWithRoot`
- Rename `createSubRoot` to `createBranch` and `runWithSubRoot` to `createDisposable` (also unify returns to only dispose fn)

  1.1.0

Add `createSharedRoot` primitive
