# @solid-primitives/raf

## 2.3.5

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 2.3.4

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 2.3.3

### Patch Changes

- f32f209: Update author email for David Di Biase.

## 2.3.2

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 2.3.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 2.3.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 2.2.0

### Minor Changes

- b71cf00: add createMs primitive

## 2.1.16

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 2.1.15

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 2.1.14

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 2.1.13

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 2.1.12

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 2.1.11

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 2.1.10

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 2.1.9

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 2.1.8

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 2.1.8-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 2.1.7

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 2.1.6

### Patch Changes

- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 2.1.5

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 2.1.4

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0

## 2.1.3

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)
- Updated dependencies [a372d0e7]
- Updated dependencies [b662fe9f]
- Updated dependencies [abb8063c]
  - @solid-primitives/utils@3.1.0

## 2.1.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/utils@3.0.2

## 2.1.1

### Patch Changes

- e7870cb: Update deps.

## Changelog up to version 2.1.0

0.0.100

Initial release ported from https://github.com/microcipcip/vue-use-kit/blob/master/src/functions/useRafFn/useRafFn.ts.

1.0.6

Released official version with CJS and SSR support.

1.0.7

Updated to Solid 1.3, switched to peerDependencies

1.0.9

Patched double running and added refresh rate warning (patch by [titoBouzout](https://www.github.com/titoBouzout)).

2.0.0

Patch by [titoBouzout](https://www.github.com/titoBouzout):

- allow to limit fps above 60fps
- remove `runImmediately` – animation loop will have to be initialized manually.
- respect `requestAnimationFrame` signature and give `timeStamp` back to the callback instead of a `deltaTime`
- use cancelAnimationFrame instead of !isRunning

Patch by [thetarnav](https://www.github.com/thetarnav):

- Move FPS limiting feature into a separate `targetFPS` primitive
