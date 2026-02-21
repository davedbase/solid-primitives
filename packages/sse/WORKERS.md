# Running SSE in a Worker

`@solid-primitives/sse` ships a `makeSSEWorker` adapter that moves the `EventSource` connection into a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) or a [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker). The reactive API you get back from `createSSE` is identical — `data`, `readyState`, `reconnect`, etc. work exactly as documented in the [README](./README.md).

## When to use this

- **High-frequency streams** — parsing and dispatching many events per second on the main thread can cause jank. Moving the connection to a Worker keeps that work off the UI thread.
- **SharedWorker** — if multiple tabs in the same origin connect to the same SSE endpoint, a SharedWorker lets them share a single Worker process (though each tab still gets its own `EventSource` connection inside the worker).

For typical usage — a handful of events per second — the standard `createSSE` is simpler and sufficient.

## Setup

The adapter is in a separate subpath so it adds zero bytes to the main bundle when not used.

```ts
import { makeSSEWorker } from "@solid-primitives/sse/worker";
```

You also need the companion handler script that runs inside the Worker:

```ts
import "@solid-primitives/sse/worker-handler";
```

Load it via your bundler's `new URL(…, import.meta.url)` syntax to get a correctly resolved URL at build time.

## Dedicated Worker

```ts
import { createSSE } from "@solid-primitives/sse";
import { makeSSEWorker } from "@solid-primitives/sse/worker";

const worker = new Worker(
  new URL("@solid-primitives/sse/worker-handler", import.meta.url),
  { type: "module" },
);

const { data, readyState, error, close, reconnect } = createSSE<{ msg: string }>(
  "https://api.example.com/events",
  {
    source: makeSSEWorker(worker),
    transform: JSON.parse,
    reconnect: { retries: 3, delay: 2000 },
  },
);
```

That's the only change compared to a standard `createSSE` call — pass `source: makeSSEWorker(worker)` and everything else stays the same.

## SharedWorker

A SharedWorker is shared across all tabs on the same origin. Pass `sw.port` (a `MessagePort`) in place of the `Worker` instance:

```ts
import { createSSE } from "@solid-primitives/sse";
import { makeSSEWorker } from "@solid-primitives/sse/worker";

const sw = new SharedWorker(
  new URL("@solid-primitives/sse/worker-handler", import.meta.url),
  { type: "module" },
);
sw.port.start(); // required to activate a MessagePort

const { data } = createSSE("https://api.example.com/events", {
  source: makeSSEWorker(sw.port),
});
```

`makeSSEWorker` accepts anything that satisfies `SSEWorkerTarget` — both `Worker` and `MessagePort` do.

## How it works

`makeSSEWorker(target)` returns an `SSESourceFn`, the same factory interface that `createSSE` uses internally. When `createSSE` opens a connection it calls this factory instead of the default `makeSSE`, which:

1. Creates a `WorkerEventSource` — an `EventTarget` that posts a `connect` message to the Worker and re-dispatches `open` / `message` / `error` events received back from it.
2. The Worker script (`worker-handler`) receives the `connect` message, creates a real `EventSource` there, and posts events back via `postMessage`.
3. `createSSE`'s reactive machinery — signals, reconnect timer, URL tracking, `onCleanup` — runs on the main thread as normal; it just talks to a `WorkerEventSource` instead of a real `EventSource`.

## Type reference

```ts
// @solid-primitives/sse/worker

function makeSSEWorker(target: SSEWorkerTarget): SSESourceFn;

/** Accepted by makeSSEWorker — satisfied by both Worker and SharedWorker.port */
type SSEWorkerTarget = {
  postMessage(data: SSEWorkerMessage): void;
  addEventListener(type: "message", listener: (e: MessageEvent<SSEWorkerMessage>) => void): void;
  removeEventListener(type: "message", listener: (e: MessageEvent<SSEWorkerMessage>) => void): void;
};

/** Messages exchanged between the main thread and the Worker */
type SSEWorkerMessage =
  | { type: "connect";    id: string; url: string; withCredentials?: boolean; events?: string[] }
  | { type: "disconnect"; id: string }
  | { type: "open";       id: string }
  | { type: "message";    id: string; data: string; eventType: string }
  | { type: "error";      id: string; readyState: SSEReadyState };
```
