# @solid-primitives/jsx-tokenizer

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

## 1.0.10

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 1.0.9

### Patch Changes

- 48d44c0: Remove unused type exports in utils (`ResolvedJSXElement` and `ResolvedChildren`)
- Updated dependencies [48d44c0]
  - @solid-primitives/utils@6.2.3

## 1.0.8

### Patch Changes

- d23dd74: Add type exports for cjs
- Updated dependencies [d23dd74]
  - @solid-primitives/utils@6.2.2

## 1.0.7

### Patch Changes

- Updated dependencies [92c1e5c4]
  - @solid-primitives/utils@6.2.1

## 1.0.6

### Patch Changes

- Updated dependencies [3c007b92]
  - @solid-primitives/utils@6.2.0

## 1.0.5

### Patch Changes

- Updated dependencies [2e0bcedf]
  - @solid-primitives/utils@6.1.1

## 1.0.4

### Patch Changes

- 6415f2ba: Improve the type generics in `createToken`. Thanks @otonashixav
- Updated dependencies [1edee005]
- Updated dependencies [6415f2ba]
  - @solid-primitives/utils@6.1.0

## 1.0.3

### Patch Changes

- Updated dependencies [2f6d3732]
  - @solid-primitives/utils@6.0.0

## 1.0.2

### Patch Changes

- 83843698: Use `!isServer && DEV` for checking development env to support versions prior to 1.6.12
- Updated dependencies [83843698]
  - @solid-primitives/utils@5.5.2

## 1.0.1

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.
- Updated dependencies [3fad3789]
  - @solid-primitives/utils@5.5.1

## 1.0.0

### Major Changes

- 60d7ac20: Package got renamed from `jsx-parser` to `jsx-tokenizer`.

  Improved jsdoc comments with better descriptions.

  `createJSXParser` renamed to `createTokenizer`.

  `isToken` and `resolveTokens` can now accept an array of tokenizers to match.

  `createToken` can be used without passing a tokenizer. This will create a token with the component function as the tokenizer.

## 0.2.0

### Minor Changes

- b1bf1d74: Merge `resolveData` and `resolveTokens` together. Add option to resolve JSX Elements as well.

## 0.1.3

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0

## 0.1.3-beta.0

### Patch Changes

- Updated dependencies [d6559a32]
  - @solid-primitives/utils@5.4.0-beta.0

## 0.1.2

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)
- Updated dependencies [865d5ee9]
  - @solid-primitives/utils@5.2.1

## 0.1.1

### Patch Changes

- 3f2cc1fb: Warn about invalid elements only if thy are truthy

## 0.1.0

### Minor Changes

- fd0d137a: Add the token object to the `data` property of the token element, instead of spreading it with `Object.assign`.

  Separates available functions into own exports, `parser` is now required to be passed to the functions.

### Patch Changes

- Updated dependencies [c1538561]
  - @solid-primitives/utils@5.1.0

## 0.0.2

### Patch Changes

- e2533800: set returnType createToken from JSX.Element to TokenComponent<Token>
