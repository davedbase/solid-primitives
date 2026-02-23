<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=SSE" alt="Solid Primitives SSE">
</p>

# @solid-primitives/sse

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/sse?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/sse)
[![version](https://img.shields.io/npm/v/@solid-primitives/sse?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/sse)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) using the browser's built-in `EventSource` API.

- [`makeSSE`](#makesse) — Base non-reactive primitive. Creates an `EventSource` and returns a cleanup function. No Solid lifecycle.
- [`createSSE`](#createsse) — Reactive primitive. Accepts a reactive URL, integrates with Solid's owner lifecycle, and returns signals for `data`, `error`, and `readyState`.
- [`makeSSEWorker`](./WORKERS.md) — Runs the SSE connection inside a Web Worker or SharedWorker. See [WORKERS.md](./WORKERS.md).
- [Built-in transformers](#built-in-transformers) — `json`, `ndjson`, `lines`, `number`, `safe`, `pipe`.

## Installation

```bash
npm install @solid-primitives/sse
# or
pnpm add @solid-primitives/sse
```

## `makeSSE`

Creates a raw `EventSource` connection without any Solid lifecycle management. Event handlers are attached immediately. You are responsible for calling the returned cleanup function.

This is the foundation primitive — `createSSE` uses it internally.

```ts
import { makeSSE } from "@solid-primitives/sse";

const [source, cleanup] = makeSSE("https://api.example.com/events", {
  onOpen: () => console.log("Connected"),
  onMessage: e => console.log("Message:", e.data),
  onError: e => console.error("Error:", e),
  events: {
    // Named SSE event types (server sends `event: update`)
    update: e => console.log("Update:", e.data),
  },
});

// When done:
cleanup();
```

### Definition

```ts
function makeSSE(
  url: string | URL,
  options?: SSEOptions,
): [source: EventSource, cleanup: VoidFunction];

type SSEOptions = {
  withCredentials?: boolean;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  events?: Record<string, (event: MessageEvent) => void>;
};
```

## `createSSE`

Reactive SSE primitive. Connects on creation, closes when the owner is disposed, and reacts to URL changes.

```ts
import { createSSE, SSEReadyState } from "@solid-primitives/sse";

const { data, readyState, error, close, reconnect } = createSSE<{ message: string }>(
  "https://api.example.com/events",
  {
    transform: JSON.parse,
    reconnect: { retries: 3, delay: 2000 },
  },
);

return (
  <div>
    <Show when={readyState() === SSEReadyState.OPEN} fallback={<p>Connecting…</p>}>
      <p>Latest: {data()?.message ?? "—"}</p>
    </Show>
    <Show when={error()}>
      <p style="color:red">Connection error</p>
    </Show>
    <button onClick={close}>Disconnect</button>
    <button onClick={reconnect}>Reconnect</button>
  </div>
);
```

### Reactive URL

When the URL is a signal accessor, the connection is replaced whenever the URL changes:

```ts
const [userId, setUserId] = createSignal("user-1");

const { data } = createSSE<Notification>(
  () => `https://api.example.com/notifications/${userId()}`,
  { transform: JSON.parse },
);
```

Changing `userId()` will close the existing connection and open a new one to the updated URL.

### Options

| Option            | Type                                        | Default     | Description                              |
| ----------------- | ------------------------------------------- | ----------- | ---------------------------------------- |
| `withCredentials` | `boolean`                                   | `false`     | Send credentials with the request        |
| `onOpen`          | `(e: Event) => void`                        | —           | Called when the connection opens         |
| `onMessage`       | `(e: MessageEvent) => void`                 | —           | Called on each unnamed `message` event   |
| `onError`         | `(e: Event) => void`                        | —           | Called on error                          |
| `events`          | `Record<string, (e: MessageEvent) => void>` | —           | Handlers for named SSE event types       |
| `initialValue`    | `T`                                         | `undefined` | Initial value of the `data` signal       |
| `transform`       | `(raw: string) => T`                        | identity    | Parse raw string data, e.g. `JSON.parse` |
| `reconnect`       | `boolean \| SSEReconnectOptions`            | `false`     | App-level reconnect on terminal errors   |

**`SSEReconnectOptions`:**

| Option    | Type     | Default    | Description                   |
| --------- | -------- | ---------- | ----------------------------- |
| `retries` | `number` | `Infinity` | Max reconnect attempts        |
| `delay`   | `number` | `3000`     | Milliseconds between attempts |

### Return value

| Property     | Type                                     | Description                                      |
| ------------ | ---------------------------------------- | ------------------------------------------------ |
| `source`     | `Accessor<SSESourceHandle \| undefined>` | Underlying source instance; `undefined` on SSR   |
| `data`       | `Accessor<T \| undefined>`               | Latest message data                              |
| `error`      | `Accessor<Event \| undefined>`           | Latest error event                               |
| `readyState` | `Accessor<SSEReadyState>`                | `SSEReadyState.CONNECTING` / `.OPEN` / `.CLOSED` |
| `close`      | `VoidFunction`                           | Close the connection                             |
| `reconnect`  | `VoidFunction`                           | Force-close and reopen                           |

### `SSEReadyState`

Named constants for the connection state, exported as a plain object so they are tree-shakeable and work with every bundler:

```ts
import { SSEReadyState } from "@solid-primitives/sse";

SSEReadyState.CONNECTING; // 0
SSEReadyState.OPEN; // 1
SSEReadyState.CLOSED; // 2
```

### A note on reconnection

`EventSource` has native browser-level reconnection built in. For transient network drops the browser automatically retries. The `reconnect` option in `createSSE` is for _application-level_ reconnection — it fires only when `readyState` becomes `SSEReadyState.CLOSED`, meaning the browser has given up entirely. You generally do not need `reconnect: true` for normal usage.

## Integration with `@solid-primitives/event-bus`

Because `bus.emit` matches the `(event: MessageEvent) => void` shape of `onMessage`, you can wire them directly:

```ts
import { createSSE } from "@solid-primitives/sse";
import { createEventBus } from "@solid-primitives/event-bus";

const bus = createEventBus<string>();

createSSE("https://api.example.com/events", {
  onMessage: e => bus.emit(e.data),
});

bus.listen(msg => console.log("received:", msg));
```

### Multi-channel SSE with `createEventHub`

For streams that use multiple named event types:

```ts
import { createSSE } from "@solid-primitives/sse";
import { createEventBus, createEventHub } from "@solid-primitives/event-bus";

type OrderEvent = { id: string; total: number };
type InventoryEvent = { sku: string; qty: number };

const hub = createEventHub({
  order: createEventBus<OrderEvent>(),
  inventory: createEventBus<InventoryEvent>(),
});

createSSE("https://api.example.com/stream", {
  events: {
    order: e => hub.emit("order", JSON.parse(e.data)),
    inventory: e => hub.emit("inventory", JSON.parse(e.data)),
  },
});

hub.on("order", event => console.log("New order:", event));
```

### Building a reactive message list

```ts
import { createSSE } from "@solid-primitives/sse";
import { createStore } from "solid-js/store";

const [messages, setMessages] = createStore<string[]>([]);

createSSE("https://api.example.com/events", {
  onMessage: e => setMessages(msgs => [...msgs, e.data]),
});

return <For each={messages}>{msg => <p>{msg}</p>}</For>;
```

## Running SSE in a Worker

For high-frequency streams or performance-sensitive apps you can offload the `EventSource` connection to a Web Worker, keeping network I/O off the main thread. The reactive API (`data`, `readyState`, `reconnect`, …) is identical — only the transport moves.

See [WORKERS.md](./WORKERS.md) for setup instructions, SharedWorker usage, and the full type reference.

## Built-in transformers

Ready-made `transform` functions for the most common SSE data formats. Pass one as the `transform` option to `createSSE`:

```ts
import { createSSE, json } from "@solid-primitives/sse";

const { data } = createSSE<{ status: string }>(url, { transform: json });
```

| Transformer                       | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| [`json`](#json)                   | Parse data as a single JSON value                               |
| [`ndjson`](#ndjson)               | Parse newline-delimited JSON into an array                      |
| [`lines`](#lines)                 | Split data into a `string[]` by newline                         |
| [`number`](#number)               | Parse data as a number via `Number()`                           |
| [`safe`](#safetransform-fallback) | Fault-tolerant wrapper — returns `fallback` instead of throwing |
| [`pipe`](#pipea-b)                | Compose two transforms into one                                 |

### `json`

Parse the message data as a single JSON value. Equivalent to `JSON.parse` but named for consistency with the other transformers.

```ts
import { createSSE, json } from "@solid-primitives/sse";

const { data } = createSSE<{ status: string; ts: number }>(url, { transform: json });
// data() === { status: "ok", ts: 1718000000 }
```

### `ndjson`

Parse the message data as [newline-delimited JSON](https://ndjson.org/) (NDJSON / JSON Lines). Each non-empty line is parsed as a separate JSON value and the transformer returns an array.

Use this when the server batches multiple objects into one SSE event:

```
data: {"id":1,"type":"tick"}
data: {"id":2,"type":"tick"}

```

```ts
import { createSSE, ndjson } from "@solid-primitives/sse";

const { data } = createSSE<TickEvent[]>(url, { transform: ndjson });
// data() === [{ id: 1, type: "tick" }, { id: 2, type: "tick" }]
```

### `lines`

Split the message data into individual lines, returning a `string[]`. Empty lines are filtered out. Useful for multi-line text events that are not JSON.

```ts
import { createSSE, lines } from "@solid-primitives/sse";

const { data } = createSSE<string[]>(url, { transform: lines });
// data() === ["line one", "line two"]
```

### `number`

Parse the message data as a number using `Number()` semantics. Handy for streams that emit counters, progress percentages, sensor readings, or prices.

```ts
import { createSSE, number } from "@solid-primitives/sse";

const { data } = createSSE<number>(url, { transform: number });
// data() === 42
```

Note: follows `Number()` coercion — an empty string becomes `0` and non-numeric strings become `NaN`.

### `safe(transform, fallback?)`

Wraps any transform in a `try/catch`. When the inner transform throws, `safe` returns `fallback` instead of propagating the error. This keeps the stream alive across malformed events.

```ts
import { createSSE, json, number, safe } from "@solid-primitives/sse";

// Returns undefined on a bad event instead of throwing
const { data } = createSSE<MyEvent>(url, { transform: safe(json) });

// With an explicit fallback value
const { data } = createSSE<number>(url, { transform: safe(number, 0) });
```

### `pipe(a, b)`

Composes two transforms into one: the output of `a` is passed as the input of `b`. Useful for building custom transforms from existing primitives without writing anonymous functions.

```ts
import { createSSE, ndjson, json, safe, pipe } from "@solid-primitives/sse";

// Parse NDJSON then keep only "tick" rows
type RawEvent = { type: string };
const { data } = createSSE<RawEvent[]>(url, {
  transform: pipe(ndjson<RawEvent>, rows => rows.filter(r => r.type === "tick")),
});

// Safe JSON with a post-processing step
const { data } = createSSE<string>(url, {
  transform: pipe(safe(json<{ label: string }>), ev => ev?.label ?? ""),
});
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
