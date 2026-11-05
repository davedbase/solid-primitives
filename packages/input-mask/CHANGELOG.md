# @solid-primitives/input-mask

## 1.0.0-next.5

### Patch Changes

- 4ac94b5: input-mask: add story illustrating function-type masks

## 1.0.0-next.4

### Patch Changes

- 1b703e1: Bump the `solid-js`/`@solidjs/web`/`@solidjs/signals` peer and dev dependency range to `2.0.0-rc.14`.

## 1.0.0-next.3

### Patch Changes

- 638c530: Bump the `solid-js`/`@solidjs/web`/`@solidjs/signals` peer and dev dependency range to `2.0.0-rc.9`, and `babel-preset-solid` to `2.0.0-rc.2`.

  Two behavior fixes were needed to keep up with upstream changes in this range:

  - `@solid-primitives/deep`: `captureStoreUpdates` no longer missed property changes. As of `2.0.0-rc.1` a store's `[$TRACK]` only fires for structural changes (key additions/removals), so leaf value changes stopped being reported. Each node's direct property values are now tracked individually. Updates are still reported at the shallowest node that actually changed.
  - `@solid-primitives/storage`: `makePersisted` no longer persists stale data. Signal writes stay pending until the next flush in `2.0.0-rc.1`+, so reading the value back inside the setter returned the _previous_ one — persisting stale data, or removing the stored entry entirely when the previous value was nullish. The value returned by the setter is now persisted directly.

## 1.0.0-next.2

### Patch Changes

- Bump the `solid-js`/`@solidjs/web`/`@solidjs/signals`/`babel-preset-solid` peer and dev dependency range to `2.0.0-rc.0`. No API or behavior changes on our end — this tracks upstream's move from the beta series into the release candidate.

## 1.0.0-next.1

### Patch Changes

- 50e36c9: Bump the `solid-js`/`@solidjs/web` peer and dev dependency range to `2.0.0-beta.20`. No API or behavior changes; beta.19/beta.20 introduced no breaking changes upstream (internal tree-shaking work, a new `solid-js/refresh` HMR entry point, and SSR/hydration/`lazy()` bug fixes).

## 1.0.0-next.0

### Major Changes

- b6642c5: Migrate to Solid.js v2.0 (beta.14)

  ## Breaking Changes

  **Peer dependency**: `solid-js@^2.0.0-beta.14` is now required.

  - The `solid-js/web` sub-path no longer exists in Solid 2.0; consumers using `render` must import it from `@solidjs/web`

  ## Fixes
  - Corrected `maskArrayToFn` export name in README examples (was incorrectly documented as `arrayMaskToFn`)
  - Fixed optional-letter mask character documentation: `o` (was incorrectly documented as `z`)

## 0.3.1

### Patch Changes

- 53f08cc: fix: Move `"@solid-primitives/source"` export condition under import in package.json
  (Fixes #774, Fixes #749)

## 0.3.0

### Minor Changes

- ea09f71: Remove CJS support. The package is ESM only now.

## 0.2.2

### Patch Changes

- 74db287: Correct the "homepage" field in package.json

## 0.2.1

### Patch Changes

- d23dd74: Add type exports for cjs

## 0.2.0

### Minor Changes

- 281006e4: added mask-pattern primitive

## 0.1.7

### Patch Changes

- 3fad3789: Revert from publishing separate server, development, and production builds that has to rely on export conditions
  to publishing a single build that can be used in any environment.
  Envs will be checked at with `isDev`and `isServer` consts exported by `"solid-js/web"` so it's still tree-shakeable.

## 0.1.6

### Patch Changes

- 865d5ee9: Fix build. (remove keepNames option)

## 0.1.5

### Patch Changes

- dd2d7d1c: Improve export conditions.

## 0.1.4

### Patch Changes

- b662fe9f: Improve package export contidions for SSR (node, workers, deno)

## 0.1.3

### Patch Changes

- 7ac41ed: Update to solid-js version 1.5

## Changelog up to version 0.1.2

0.0.100

Initial release as a Stage-0 primitive.

0.0.101

Document onPaste event.

0.1.1

Expose string replacements.

Optional generic to type events.

0.1.2

New regexMaskToFn helper.
