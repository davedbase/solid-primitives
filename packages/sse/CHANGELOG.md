# @solid-primitives/sse

## 0.0.103

### Patch Changes

- Updated dependencies [59c9702]
  - @solid-primitives/utils@6.4.1

## 0.0.102

### Patch Changes

- 326d05f: Fix memory leak when app-level retries are exhausted in `createSSE`. Previously, when all reconnect attempts were used up and the `EventSource` was permanently closed, `currentCleanup` was never called — leaving the `EventSource` instance and its event listeners alive in memory, and the `source` signal pointing to a stale handle. Now an `else if` branch explicitly calls `currentCleanup()`, clears the reference, and sets the `source` signal to `undefined`.

## 0.0.101

### Patch Changes

- Updated dependencies [6680ab9]
  - @solid-primitives/utils@6.4.0

## 0.0.100

### Initial release

- `makeSSE` — base non-reactive primitive wrapping the browser `EventSource` API
- `createSSE` — reactive primitive with signals for `data`, `error`, and `readyState`, reactive URL support, SSR safety, and configurable app-level reconnection
