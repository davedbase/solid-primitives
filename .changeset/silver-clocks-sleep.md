---
"@solid-primitives/sse": minor
---

Initial release of `@solid-primitives/sse`.

### Primitives

- `makeSSE(url, options?)` — base non-reactive primitive. Creates an `EventSource`, attaches handlers, and returns `[source, cleanup]`. No Solid lifecycle dependency.
- `createSSE(url, options?)` — reactive primitive. Accepts a static or signal URL, closes on owner disposal, and exposes `data`, `error`, `readyState`, `close`, and `reconnect`.
- `makeSSEWorker(target, options?)` — runs the `EventSource` connection inside a Web Worker or SharedWorker, keeping network I/O off the main thread. The reactive API is identical to `createSSE`.

### Built-in transformers

- `json` — parse message data as a single JSON value
- `ndjson` — parse newline-delimited JSON into an array
- `lines` — split message data into a `string[]` by newline
- `number` — parse message data as a number via `Number()`
- `safe(transform, fallback?)` — fault-tolerant wrapper; returns `fallback` instead of throwing on bad input
- `pipe(a, b)` — compose two transforms into one
