# @solid-primitives/action-helpers

## 0.0.100

### Minor Changes

Initial release. Composable generator wrappers for Solid 2.0 `action(fn*)`.

#### Exports

- **`withRetry(fn*, options)`** — retry on failure with configurable `attempts`, `delay`, `backoff` (`"exponential"` | `"linear"` | `"none"`), and a `when` predicate to skip retrying specific errors. Curried form available for use with `pipe`.
- **`withTimeout(fn*, ms)`** — cancel the action with a `TimeoutError` if it exceeds `ms` milliseconds. Curried form available.
- **`withAbort(fn*)`** — abort any in-flight call when a new one arrives (switchMap semantics). Shared abort state across all invocations of the returned function.
- **`sequential(fn*)`** — queue calls so they never run concurrently; each waits for the previous to finish. Shared queue across all invocations.
- **`once(fn*)`** — return `undefined` for concurrent in-flight calls; sequential calls (after the first completes) run normally.
- **`withProgress(setProgress, fn*)`** — inject a progress callback as the last generator argument, forwarding values to a `setProgress` setter. Curried form available.
- **`tryCatch(fn*, onError*)`** — recover from errors inline using a second generator; handler receives the error and original arguments and can itself yield async work.
- **`withOptimistic(store, fn*)`** — inject `{ optimistic }` setter from a `createOptimisticStore` tuple; user calls `refresh` explicitly after the async write. Curried form available.
- **`pipe(...wrappers)`** — compose wrappers left-to-right; first listed is outermost (executes first). `withAbort`, `sequential`, and `once` are already wrapper-shaped and can be passed directly.
