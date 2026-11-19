# @solid-primitives/graphql

## 2.2.6

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 2.2.5

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 2.2.4

### Patch Changes

- f32f209: Update author email for David Di Biase.

## 2.2.3

### Patch Changes

- f5abdc3: @solid-primitives/graphql: Fix a build issue occurring during the bundling process.
  @solid-primitives/share: Fix a typo for Facebook Messenger

## 2.2.2

### Patch Changes

- Updated dependencies [396812d]
  - @solid-primitives/utils@6.3.2

## 2.2.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)
- Updated dependencies [53f08cc]
  - @solid-primitives/utils@6.3.1

## 2.2.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

### Patch Changes

- Updated dependencies [ea09f71]
  - @solid-primitives/utils@6.3.0

## 2.1.0

### Minor Changes

- c4e992a: Add a `GraphQLError` error class, and throw it in case of a request error, instead of thowing an errors array

## 2.0.4

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 2.0.3

### Patch Changes

- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 2.0.2

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 2.0.1

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 2.0.0

### Major Changes

- 58c3c43d: **Breaking:** The query primitive now accepts a `ResourceOptions` object, instead of just `initialValue`.

  Changes to `url` or `options` will invalidate the resource now. Fixes #328

  Changes `@graphql-typed-document-node/core` and `graphql` to be peer dependencies.

## 1.5.9

### Patch Changes

- c4fd5890: fix resource states by omitting `initialValue` option if passed `undefined`
- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 1.5.8

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 1.5.7

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 1.5.6

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 1.5.5

### Patch Changes

- 48100cf3: Improve `gql` function and used regex

## 1.5.4

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 1.5.4-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 1.5.3

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 1.5.2

### Patch Changes

- Updated dependencies [c2866ea6]
  - @solid-primitives/utils@5.0.0

## 1.5.1

### Patch Changes

- dd2d7d1c: Improve export conditions.
- Updated dependencies [dd2d7d1c]
  - @solid-primitives/utils@4.0.1

## 1.5.0

### Minor Changes

- 2b25bd5b: Added support for multipart uploads

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

- e706297: Allow passing options to `createGraphQLClient`

## 1.3.0

### Minor Changes

- 6fcf348: Adjustments to support Solid 1.5

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5
- Updated dependencies [7ac41ed]
  - @solid-primitives/utils@3.0.2

## 1.2.1

### Patch Changes

- c576d1c: Fix query input type

## 1.2.0

### Minor Changes

- 3f4afed: Add support for `DocumentNode` and `TypedDocumentNode` types

## 1.1.2

### Patch Changes

- Updated dependencies [73b6a34]
  - @solid-primitives/utils@3.0.0

## Changelog up to version 1.1.1

1.0.0

Initial commit and publish of primitive.

1.0.3

Released with CJS support.

1.0.4

Updated to latest Solid.

1.0.6

Function argument improvements, named exports.

1.0.7

Added export request function to make gql requests more imperative.

1.1.1

Correct types for solid-js@1.4.3
