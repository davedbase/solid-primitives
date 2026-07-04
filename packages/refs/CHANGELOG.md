# @solid-primitives/refs

## 1.1.4

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 1.1.3

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 1.1.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 1.1.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 1.1.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 1.0.8

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 1.0.7

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 1.0.6

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 1.0.5

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 1.0.4

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 1.0.3

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 1.0.2

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 1.0.1

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 1.0.0

### Major Changes

- d6559a32: Major API changes. Bump stage to 2.

  `mapRemoved`, `Children`, `unmount`, `refs`, `elements`, `getChangedItems`, `getAddedItems` and `getRemovedItems` has been removed.

  Add `getResolvedElements`, `resolveElements`, `getFirstChild` and `resolveFirst` primitives.

  Improve `mergeRefs` to allow an array of refs to be passed in.

  Ensure SSR support for `resolveElements`, `resolveFirst`, `<Ref>` and `<Refs>`.

  Removes `"@solid-primitives/immutable"` dependency.

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 1.0.0-beta.1

### Major Changes

- d6559a32: Major API changes. Bump stage to 2.

  `mapRemoved`, `Refs`, `Ref`, `unmount`, `refs`, `elements`, `getChangedItems`, `getAddedItems` and `getRemovedItems` has been removed.

  Add `getResolvedElements`, `resolveElements`, `getFirstChild` and `resolveFirst` primitives.

  Improve `mergeRefs` to allow an array of refs to be passed in.

  Ensure SSR support for `resolveElements` and `resolveFirst`.

  Removes `"@solid-primitives/immutable"` dependency.

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 0.4.0-beta.0

### Minor Changes

- d8054700: Add `findFirst` and `resolveFirst` primitives

## 0.3.7

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/immutable@0.1.7
  - @solid-primitives/rootless@1.2.5
  - @solid-primitives/utils@5.2.1

## 0.3.6

### Patch Changes

- Updated dependencies [c2866ea6]
- Updated dependencies [c2866ea6]
  - @solid-primitives/rootless@1.2.3
  - @solid-primitives/utils@5.0.0
  - @solid-primitives/immutable@0.1.6

## 0.3.5

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/immutable@0.1.5
  - @solid-primitives/rootless@1.2.2
  - @solid-primitives/utils@4.0.1

## 0.3.4

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0
  - @solid-primitives/immutable@0.1.4
  - @solid-primitives/rootless@1.2.1

## 0.3.3

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [e36ed229]
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
  - @solid-primitives/rootless@1.2.0
  - @solid-primitives/utils@3.1.0
  - @solid-primitives/immutable@0.1.3

## 0.3.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/immutable@0.1.2
  - @solid-primitives/rootless@1.1.3
  - @solid-primitives/utils@3.0.2

## 0.3.1

### Patch Changes

- e7870cb: Update deps.
- Updated dependencies [e7870cb]
  - @solid-primitives/immutable@0.1.1

## Changelog up to version 0.3.0

0.0.100

Initial release as a Stage-1 primitive.

0.2.0

Add `mergeRefs`
