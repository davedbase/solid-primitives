# @solid-primitives/deferred-disposal

## 0.1.0

### Minor Changes

- Initial release of `@solid-primitives/deferred-disposal`

  **`createDeferredDisposal()`** — reactive deferred disposal coordinator. Integrates with
  Solid's `onCleanup` lifecycle and async memo system to allow async work (e.g. exit animations)
  to complete before downstream cleanup proceeds.

  - `hold(label?)` — creates a hold that blocks `allSettled` from resolving. Supports the
    `using` keyword via `[Symbol.dispose]()`.
  - `defer(promise)` — convenience wrapper that holds until a Promise settles (resolved or rejected).
  - `isHeld` — reactive boolean, true while any hold is active.
  - `isDisposing` — reactive boolean, true once the owning reactive scope has been cleaned up.
  - `allSettled` — async memo that settles when all holds are released. Integrates with
    `resolve()`, `isPending()`, and `<Loading>` boundaries.
