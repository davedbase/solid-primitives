# @solid-primitives/storage

## 4.3.5

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 4.3.4

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 4.3.3

### Patch Changes

- 396812d: Enable verbatimModuleSyntax -> add `type` keyword to all type imports.
- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 4.3.2

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 4.3.1

### Patch Changes

- e2e290e: Correct package.json exports.

## 4.3.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 4.2.1

### Patch Changes

- 7e50e35: Fix `makePersisted` type narrowing

## 4.2.0

### Minor Changes

- 89117a6: storage: expose init promise/value, resource: docs clarification

## 4.1.0

### Minor Changes

- fd4e161: fixes utf8 escaping in cookieStorage

## 4.0.0

### Major Changes

- 94d1bcc: storage: remove deprecated primitives, simplify types, add makeObjectStorage

## 3.8.0

### Minor Changes

- b9d7b28: fix ssr handling

## 3.7.1

### Patch Changes

- bebccc1: Set-Cookie header will be sent with trailing `, ` in some cases which prefixes the name in the browser too

  Don't append false boolean values from `cookieOptions`
  Stability improvements: ignore unexpected `cookieOption` keys

## 3.7.0

### Minor Changes

- 4ec7533: storage: fix exports

## 3.6.0

### Minor Changes

- bb4fc57: move tauri storage to submodule
- 1382d8f: fix cookie serialization

## 3.5.0

### Minor Changes

- 72db58b: type fixes for makePersisted

## 3.4.0

### Minor Changes

- 5d89290: add tauriStorage

## 3.3.0

### Minor Changes

- 99c6e09: Add back the return statement to withOptions

## 3.2.0

### Minor Changes

- 40380a2: safe sync deserialization
- 407a630: Bugfix for newly introduced sync api. Now BroadcastChannel for `messageSync` should also work as expected.
- c5145af: fix withOptions

## 3.1.0

### Minor Changes

- 713cac6: add forgotten withOptions method to cookieStorage

## 3.0.0

### Major Changes

- bf7605c: storage: new sync API, multiplexing, cookieStorage fixes, withOptions

## 2.1.4

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 2.1.3

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 2.1.2

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 2.1.1

### Patch Changes

- a5f01c30: Loosen solid-start peer dependency

## 2.1.0

### Minor Changes

- 92041fd3: allow providing request getter / cookie setter on the server

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 2.0.0

### Major Changes

- d0453ccf: new makePersisted primitive, deprecated old API

## 1.3.11

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 1.3.10

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 1.3.9

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 1.3.8

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 1.3.7

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 1.3.7-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 1.3.6

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 1.3.5

### Patch Changes

- 51e80d27: Fix: hydration issue

## 1.3.4

### Patch Changes

- dd2d7d1c: Improve export conditions.

## 1.3.3

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)

## 1.3.2

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5

## Changelog up to version 1.3.1

0.0.100

Initial release

1.0.0

First proper release of storage engine with CJS support.

1.0.7

Patch CJS support.

1.0.10

Minor patch fixed missing types.

1.1.0

Updated to Solid 1.3

1.1.1

Patched peerDependency issue

1.1.2

Added sync option to disable event synching
