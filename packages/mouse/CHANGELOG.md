# @solid-primitives/mouse

## 2.1.7

### Patch Changes

- 59c9702: Fix named imports breaking under Rolldown (Vite 8+ / Storybook 10.4.6+) bundlers.

  These packages re-export their public API via `export * from "./x.js"` barrels. Rollup resolves named imports through these at link time, but Rolldown's static analysis doesn't reliably follow `export *` for named-export resolution, causing errors like:

  ```
  "createEventListener" is not exported by "@solid-primitives/event-listener/dist/index.js"
  ```

  The build now also emits explicit `export { name } from "./x.js"` lines for every runtime export reachable through a barrel's `export *`, derived automatically from each submodule's compiled output — so `dist/` is bundler-agnostic regardless of how a given tool resolves star re-exports.

- Updated dependencies [59c9702]
  - @solid-primitives/event-listener@2.4.6
  - @solid-primitives/utils@6.4.1
  - @solid-primitives/rootless@1.5.4
  - @solid-primitives/static-store@0.1.4

## 2.1.6

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0
  - @solid-primitives/event-listener@2.4.5
  - @solid-primitives/rootless@1.5.3
  - @solid-primitives/static-store@0.1.3

## 2.1.5

### Patch Changes

- Updated dependencies [f32f209]
  - @solid-primitives/event-listener@2.4.4

## 2.1.4

### Patch Changes

- Updated dependencies [48d890d]
  - @solid-primitives/event-listener@2.4.3

## 2.1.3

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/event-listener@2.4.2
  - @solid-primitives/static-store@0.1.2
  - @solid-primitives/rootless@1.5.2
  - @solid-primitives/utils@6.3.2

## 2.1.2

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/event-listener@2.4.1
  - @solid-primitives/static-store@0.1.1
  - @solid-primitives/rootless@1.5.1
  - @solid-primitives/utils@6.3.1

## 2.1.1

### Patch Changes

- 8fe4e2a: Use `scrollY` not `screenY` in `getPositionToScreen`

## 2.1.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/event-listener@2.4.0
  - @solid-primitives/static-store@0.1.0
  - @solid-primitives/rootless@1.5.0
  - @solid-primitives/utils@6.3.0

## 2.0.21

### Patch Changes

- Updated dependencies [56d9511]
  - @solid-primitives/static-store@0.0.9

## 2.0.20

### Patch Changes

- 7e7888a: Add `SVGSVGElement` to allowed target types.

## 2.0.19

### Patch Changes

- 74db287: Correct the "homepage" field in package.json
- Updated dependencies [74db287]
  - @solid-primitives/event-listener@2.3.3
  - @solid-primitives/rootless@1.4.5
  - @solid-primitives/static-store@0.0.8

## 2.0.18

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3
  - @solid-primitives/event-listener@2.3.2
  - @solid-primitives/rootless@1.4.4
  - @solid-primitives/static-store@0.0.7

## 2.0.17

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/event-listener@2.3.1
  - @solid-primitives/rootless@1.4.3
  - @solid-primitives/static-store@0.0.6
  - @solid-primitives/utils@6.2.2

## 2.0.16

### Patch Changes

- Updated dependencies [b4398ee0]
  - @solid-primitives/event-listener@2.3.0

## 2.0.15

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1
  - @solid-primitives/event-listener@2.2.14
  - @solid-primitives/rootless@1.4.2
  - @solid-primitives/static-store@0.0.5

## 2.0.14

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0
  - @solid-primitives/event-listener@2.2.13
  - @solid-primitives/rootless@1.4.1
  - @solid-primitives/static-store@0.0.4

## 2.0.13

### Patch Changes

- Updated dependencies [f03c47b0]
  - @solid-primitives/event-listener@2.2.12

## 2.0.12

### Patch Changes

- Updated dependencies [2e0bcedf]
- Updated dependencies [5ea65ea9]
  - @solid-primitives/utils@6.1.1
  - @solid-primitives/rootless@1.4.0
  - @solid-primitives/event-listener@2.2.11
  - @solid-primitives/static-store@0.0.3

## 2.0.11

### Patch Changes

- 2f6d3732: Use the static-store package for creating reactive objects. Minor overall improvements
- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0
  - @solid-primitives/event-listener@2.2.10
  - @solid-primitives/rootless@1.3.2
  - @solid-primitives/static-store@0.0.2

## 2.0.10

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/event-listener@2.2.9
  - @solid-primitives/rootless@1.3.1
  - @solid-primitives/utils@5.5.1

## 2.0.9

### Patch Changes

- 464248f7: Improve behavior of primitives under hydration.
- Updated dependencies [464248f7]
- Updated dependencies [464248f7]
  - @solid-primitives/rootless@1.3.0
  - @solid-primitives/utils@5.5.0

## 2.0.8

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0
  - @solid-primitives/event-listener@2.2.8
  - @solid-primitives/rootless@1.2.6

## 2.0.8-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0
  - @solid-primitives/event-listener@2.2.8-beta.0
  - @solid-primitives/rootless@1.2.6-beta.0

## 2.0.7

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/event-listener@2.2.7
  - @solid-primitives/rootless@1.2.5
  - @solid-primitives/utils@5.2.1

## 2.0.6

### Patch Changes

- Updated dependencies [c2866ea6]
- Updated dependencies [c2866ea6]
  - @solid-primitives/event-listener@2.2.6
  - @solid-primitives/rootless@1.2.3
  - @solid-primitives/utils@5.0.0

## 2.0.5

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/event-listener@2.2.5
  - @solid-primitives/rootless@1.2.2
  - @solid-primitives/utils@4.0.1

## 2.0.4

### Patch Changes

- Updated dependencies [9ed32b38]
  - @solid-primitives/utils@4.0.0
  - @solid-primitives/event-listener@2.2.4
  - @solid-primitives/rootless@1.2.1

## 2.0.3

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

## 2.0.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/event-listener@2.2.2
  - @solid-primitives/rootless@1.1.3
  - @solid-primitives/utils@3.0.2

## 2.0.1

### Patch Changes

- e7870cb: Update deps.

## Changelog up to version 2.0.0

1.0.0

Release as a Stage-2 primitive.

1.0.1

Updated util and event-listener dependencies.

1.0.2

Upgraded to Solid 1.3

2.0.0 - **stage-3**

[PR#113](https://github.com/solidjs-community/solid-primitives/pull/113)

Removed `createMouseInElement`, `createMouseOnScreen`

Renamed:

- `posRelativeToElement` -> `getPositionToElement`
- `posRelativeToScreen` -> `getPositionToScreen`
- `createMouseToElement` -> `createPositionToElement`

Added `makeMousePositionListener`, `makeMouseInsideListener` and `getPositionInElement`

Removed clear() and update() functions from reactive primitives. `createPositionToElement` now only takes accessor position.
