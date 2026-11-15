---
Name: analytics
Stage: 0
Package: "@solid-primitives/analytics"
Primitives:
  - makeAnalytics
  - createAnalytics
  - AnalyticsProvider
  - useAnalytics
  - makeAnalyticsGuard
  - createAnalyticsGuard
  - createServerPlugin
  - createSolidStartRelayPlugin
  - createTanStackRelayPlugin
Category: Utilities
---

<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Analytics" alt="Solid Primitives Analytics">
</p>

# @solid-primitives/analytics

[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Analytics tracking primitives for Solid.js with a queue-based dispatch pipeline, reactive signals, context sharing, navigation guards, and server relay support.

Plugins are **not bundled** — install any plugin from the [analytics plugin catalogue](https://www.npmjs.com/package/analytics#analytic-plugins) (Google Analytics, Segment, Amplitude, Mixpanel, …) and pass it straight in.

## Installation

```bash
npm install @solid-primitives/analytics
# or
pnpm add @solid-primitives/analytics
```

Install analytics plugins separately:

```bash
npm install @analytics/google-analytics
```

---

## Primitives

The package follows the standard `make*` / `create*` pattern:

| Primitive              | Reactive?                   | Cleanup                |
| ---------------------- | --------------------------- | ---------------------- |
| `makeAnalytics`        | No                          | manual `cleanup()`     |
| `createAnalytics`      | Yes                         | auto on owner disposal |
| `AnalyticsProvider`    | Yes (via `createAnalytics`) | auto on unmount        |
| `makeAnalyticsGuard`   | No                          | manual `cleanup()`     |
| `createAnalyticsGuard` | Yes                         | auto on owner disposal |

`createAnalytics` is built on top of `makeAnalytics`. `AnalyticsProvider` creates a `createAnalytics` instance and shares it via context.

---

## `makeAnalytics`

The base primitive. Returns `[controls, cleanup]`. Use this at module level or anywhere Solid's owner tree is unavailable.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For, onCleanup } from "solid-js";
import { makeAnalytics } from "@solid-primitives/analytics";

function Demo() {
  const [log, setLog] = createSignal<string[]>([]);
  const [analytics, cleanup] = makeAnalytics([
    {
      name: "logger",
      page: ({ payload }) => void setLog(l => [...l, `page ${payload.properties.title}`]),
      track: ({ payload }) => void setLog(l => [...l, `track ${payload.event}`]),
      identify: ({ payload }) => void setLog(l => [...l, `identify ${payload.userId}`]),
    },
  ]);
  onCleanup(cleanup);
  return (
    <>
      <button onClick={() => analytics.page({ title: "Home" })}>page</button>
      <button onClick={() => analytics.track("signup", { plan: "pro" })}>track</button>
      <button onClick={() => analytics.identify("user-1")}>identify</button>
      <ul>
        <For each={log()}>{entry => <li>{entry}</li>}</For>
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
import { makeAnalytics } from "@solid-primitives/analytics";
import googleAnalytics from "@analytics/google-analytics";

const [analytics, cleanup] = makeAnalytics([googleAnalytics({ measurementId: "G-XXXXXXXXXX" })]);

analytics.page({ title: "Home" });
analytics.track("signup", { plan: "pro" });
analytics.identify("user-1", { email: "alice@example.com" });
analytics.use(anotherPlugin); // register a plugin at any time

cleanup();
```

---

## `createAnalytics`

Reactive wrapper built on `makeAnalytics`. Disposes automatically when the owning scope is destroyed. Exposes a reactive signal:

- `pendingCount: Accessor<number>` — number of events waiting in the queue (non-zero while plugins are still initializing)

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { createAnalytics } from "@solid-primitives/analytics";

function Demo() {
  const [log, setLog] = createSignal<string[]>([]);
  let loaded = false; // stand-in for a provider script that hasn't loaded yet
  const analytics = createAnalytics([
    {
      name: "slow-logger",
      loaded: () => loaded,
      track: ({ payload }) => void setLog(l => [...l, payload.event]),
    },
  ]);
  return (
    <>
      <button onClick={() => analytics.track("cta_click")}>track</button>
      <button onClick={() => (loaded = true)}>load provider script</button>
      <p>pendingCount: {analytics.pendingCount()}</p>
      <ul>
        <For each={log()}>{event => <li>{event}</li>}</For>
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
import { createAnalytics } from "@solid-primitives/analytics";
import googleAnalytics from "@analytics/google-analytics";
import { Show } from "solid-js";

function Root() {
  const analytics = createAnalytics([googleAnalytics({ measurementId: "G-XXXXXXXXXX" })]);

  return (
    <>
      <Show when={analytics.pendingCount() > 0}>
        <p>{analytics.pendingCount()} events queued — analytics loading</p>
      </Show>
      <button onClick={() => analytics.track("cta_click", { location: "hero" })}>
        Get Started
      </button>
    </>
  );
}
```

---

## `AnalyticsProvider` / `useAnalytics`

The easiest way to share analytics across a component tree. Wrap your app once; call `useAnalytics()` in any descendant.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { AnalyticsProvider, useAnalytics, type AnalyticsPlugin } from "@solid-primitives/analytics";

const [count, setCount] = createSignal(0);
const [last, setLast] = createSignal("none");
const logger: AnalyticsPlugin = {
  name: "logger",
  track: ({ payload }) => {
    setCount(n => n + 1);
    setLast(payload.event);
  },
};

function TrackButton(props: { event: string }) {
  const analytics = useAnalytics(); // same instance in every descendant
  return <button onClick={() => analytics.track(props.event)}>{props.event}</button>;
}

function Demo() {
  return (
    <AnalyticsProvider plugins={[logger]}>
      <TrackButton event="hero_cta" />
      <TrackButton event="add_to_cart" />
      <p>
        events received by the shared instance: {count()} (last: {last()})
      </p>
    </AnalyticsProvider>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
import { AnalyticsProvider, useAnalytics } from "@solid-primitives/analytics";
import googleAnalytics from "@analytics/google-analytics";

// At the root
<AnalyticsProvider plugins={[googleAnalytics({ measurementId: "G-XXXXXXXXXX" })]}>
  <App />
</AnalyticsProvider>;

// Anywhere inside the tree
function BuyButton() {
  const analytics = useAnalytics();
  return <button onClick={() => analytics.track("purchase", { plan: "pro" })}>Buy now</button>;
}
```

`AnalyticsProvider` creates and owns the `createAnalytics` instance, disposing automatically when the provider unmounts. `useAnalytics()` throws `ContextNotFoundError` if called outside a provider.

---

## Navigation guard

`makeAnalyticsGuard` / `createAnalyticsGuard` pause navigation until all in-flight plugin dispatches complete, preventing events from being lost when users navigate away before async network calls finish.

Both guards:

- Show a browser confirmation dialog on hard navigation (tab close, URL bar, page refresh) via [`makePageLeave`](https://github.com/solidjs-community/solid-primitives/tree/main/packages/page-utilities) from `@solid-primitives/page-utilities`
- Return an `onBeforeLeave` handler compatible with SolidJS Router's `useBeforeLeave` for soft navigation

### `makeAnalyticsGuard`

Non-reactive guard returning `[onBeforeLeave, cleanup]`.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, onCleanup } from "solid-js";
import { makeAnalytics, makeAnalyticsGuard } from "@solid-primitives/analytics";

function Demo() {
  const [status, setStatus] = createSignal("idle");
  const slowPlugin = { name: "slow", track: () => new Promise<void>(r => setTimeout(r, 1500)) };
  const [analytics, cleanupAnalytics] = makeAnalytics([slowPlugin]);
  const [onBeforeLeave, cleanupGuard] = makeAnalyticsGuard(analytics);
  onCleanup(cleanupGuard);
  onCleanup(cleanupAnalytics);

  const navigate = () => {
    analytics.track("checkout_click");
    setStatus("waiting for analytics to drain…");
    // stand-in for a router's BeforeLeaveEvent
    onBeforeLeave({
      defaultPrevented: false,
      preventDefault: () => {},
      retry: () => setStatus("navigated"),
    });
  };
  return (
    <>
      <button onClick={navigate}>Go to checkout</button>
      <p>{status()}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### `createAnalyticsGuard`

Reactive guard returning `onBeforeLeave`; the `beforeunload` listener is removed when the owner disposes.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createAnalytics, createAnalyticsGuard } from "@solid-primitives/analytics";

function Demo() {
  const [status, setStatus] = createSignal("idle");
  const slowPlugin = { name: "slow", track: () => new Promise<void>(r => setTimeout(r, 1500)) };
  const analytics = createAnalytics([slowPlugin]);
  // also blocks tab close / reload with a confirmation dialog while mounted
  const onBeforeLeave = createAnalyticsGuard(analytics);

  const navigate = () => {
    analytics.track("checkout_click");
    setStatus("waiting for analytics to drain…");
    // with @solidjs/router you would pass onBeforeLeave to useBeforeLeave instead
    onBeforeLeave({
      defaultPrevented: false,
      preventDefault: () => {},
      retry: () => setStatus("navigated"),
    });
  };
  return (
    <>
      <button onClick={navigate}>Go to checkout</button>
      <p>{status()}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### With SolidJS Router

`createAnalyticsGuard` returns the callback directly — pass it straight to `useBeforeLeave`:

```tsx
import { useBeforeLeave } from "@solidjs/router";
import { useAnalytics, createAnalyticsGuard } from "@solid-primitives/analytics";

function App() {
  useBeforeLeave(createAnalyticsGuard(useAnalytics()));
}
```

### Without a router

`makeAnalyticsGuard` returns a tuple `[onBeforeLeave, cleanup]`, consistent with `makeAnalytics`:

```ts
import { makeAnalytics, makeAnalyticsGuard } from "@solid-primitives/analytics";

const [analytics, cleanupAnalytics] = makeAnalytics([...]);
const [onBeforeLeave, cleanup] = makeAnalyticsGuard(analytics);

// wire onBeforeLeave into your routing solution
cleanup(); // call when tearing down
```

### How it works

For **soft navigation** (SolidJS Router), when `onBeforeLeave` fires:

1. Navigation is paused via `event.preventDefault()`
2. `analytics.drain()` waits for all in-flight plugin dispatches to settle
3. Navigation resumes via `event.retry(true)`

For **hard navigation** (tab close, URL bar, page refresh), the browser confirmation dialog gives the drain a chance to complete before the page unloads.

---

## Server relay

Route analytics events through your own server function instead of calling providers directly from the browser. This keeps API keys off the client and lets you enrich events with server-side context (session data, IP-based geo, etc.) before forwarding to the provider.

```text
browser → createServerPlugin → your server function → GA / Mixpanel / Segment
```

### `createServerPlugin`

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createAnalytics, type AnyPayload } from "@solid-primitives/analytics";
import { createServerPlugin } from "@solid-primitives/analytics/relay";

function Demo() {
  const [received, setReceived] = createSignal("nothing yet");
  // stand-in for a server function ("use server" / createServerFn)
  const relayEvent = async (payload: AnyPayload) => {
    await new Promise(r => setTimeout(r, 300));
    setReceived(JSON.stringify(payload, null, 2));
  };
  const analytics = createAnalytics([createServerPlugin(relayEvent, { events: ["track"] })]);
  return (
    <>
      <button onClick={() => analytics.track("purchase", { orderId: "123" })}>track</button>
      <button onClick={() => analytics.page()}>page (not relayed)</button>
      <pre>server received: {received()}</pre>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
import { createServerPlugin } from "@solid-primitives/analytics/relay";
```

Creates a client-side plugin that forwards every event to a server function. The server function receives the full `AnyPayload` (including the original `rid` and `ts`) and is responsible for calling the actual provider.

```ts
// client
import { createAnalytics } from "@solid-primitives/analytics";
import { createServerPlugin } from "@solid-primitives/analytics/relay";
import { relayEvent } from "./analytics.server";

const analytics = createAnalytics([
  createServerPlugin(relayEvent, { events: ["track", "identify"] }),
]);

analytics.track("purchase", { orderId: "123" }); // → server → GA
```

**Options:**

| Option   | Type                                     | Description                                             |
| -------- | ---------------------------------------- | ------------------------------------------------------- |
| `name`   | `string`                                 | Plugin name. Default: `"server"`                        |
| `events` | `Array<"page" \| "track" \| "identify">` | Limit which event types are relayed. Omit to relay all. |

---

### SolidStart

```ts
import { createSolidStartRelayPlugin } from "@solid-primitives/analytics/relay/solidstart";
```

Because SolidStart requires `"use server"` as a literal in your source code, define the action yourself and pass it to `createSolidStartRelayPlugin`:

```ts
// analytics.server.ts
import { action } from "@solidjs/router";
import googleAnalytics from "@analytics/google-analytics";
import type { AnyPayload } from "@solid-primitives/analytics";

const ga = googleAnalytics({ measurementId: import.meta.env.VITE_GA_ID });

export const relayEvent = action(async (payload: AnyPayload) => {
  "use server";
  await ga.track?.({ payload, config: {}, abort: () => {} });
});
```

```ts
// app.tsx
import { createAnalytics } from "@solid-primitives/analytics";
import { createSolidStartRelayPlugin } from "@solid-primitives/analytics/relay/solidstart";
import { relayEvent } from "./analytics.server";

const analytics = createAnalytics([
  createSolidStartRelayPlugin(relayEvent, { events: ["track", "identify"] }),
]);
```

---

### TanStack Start

```ts
import { createTanStackRelayPlugin } from "@solid-primitives/analytics/relay/tanstack";
```

`createTanStackRelayPlugin` wraps your TanStack Start server function and handles the `{ data }` call-site signature automatically:

```ts
// analytics.server.ts
import { createServerFn } from "@tanstack/start";
import googleAnalytics from "@analytics/google-analytics";
import type { AnyPayload } from "@solid-primitives/analytics";

const ga = googleAnalytics({ measurementId: process.env.GA_ID });

export const relayEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as AnyPayload)
  .handler(async ({ data: payload }) => {
    await ga.track?.({ payload, config: {}, abort: () => {} });
  });
```

```ts
// app.tsx
import { createAnalytics } from "@solid-primitives/analytics";
import { createTanStackRelayPlugin } from "@solid-primitives/analytics/relay/tanstack";
import { relayEvent } from "./analytics.server";

const analytics = createAnalytics([
  createTanStackRelayPlugin(relayEvent, { events: ["track", "identify"] }),
]);
```

---

## `drain()`

All controls expose `drain(): Promise<void>`, which resolves once every currently in-flight plugin call has settled. Useful for imperative navigation:

```ts
await analytics.drain();
router.navigate("/checkout");
```

> Events still in the queue (waiting for a plugin to initialize) are not awaited by `drain()`. In practice, plugins are ready long before a user navigates.

---

## Controls reference

`makeAnalytics`, `createAnalytics`, and `useAnalytics()` all return the same control surface:

| Method                      | Description                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `page(properties?)`         | Track a page view. Auto-fills `path`, `url`, `title`, and `referrer` from `window.location` in the browser. |
| `track(event, properties?)` | Track a named event with optional properties.                                                               |
| `identify(userId, traits?)` | Associate subsequent events with a user identity.                                                           |
| `use(plugin)`               | Register an additional plugin at any time.                                                                  |
| `reset()`                   | Stop the poll timer and discard all queued events.                                                          |
| `drain()`                   | `Promise<void>` — resolves when all in-flight dispatches have settled.                                      |

`createAnalytics` and `useAnalytics()` additionally expose:

| Property       | Type               | Description                                                                |
| -------------- | ------------------ | -------------------------------------------------------------------------- |
| `pendingCount` | `Accessor<number>` | Events waiting in the queue; non-zero while plugins are still initializing |

---

## How the queue works

Events fire immediately to all ready plugins. When one or more plugins are still initializing (async script load, consent check, etc.), events are held in a bounded FIFO queue and replayed in order once all plugins become ready. A poll timer (default: 500 ms) handles `loaded()` checks for external scripts.

Dispatch is **sequential** through the plugin list. A plugin can call `abort()` to prevent subsequent plugins from receiving that event.

---

## Plugin interface

`AnalyticsPlugin` matches the [analytics npm package plugin interface](https://getanalytics.io/plugins/writing-plugins/), so any plugin from the [catalogue](https://www.npmjs.com/package/analytics#analytic-plugins) is compatible without modification.

```ts
import type { AnalyticsPlugin } from "@solid-primitives/analytics";

const myPlugin: AnalyticsPlugin = {
  name: "my-service",
  config: { apiKey: "abc123" },

  // optional async setup (e.g. inject a script tag)
  initialize: async ({ config }) => {
    await loadScript(`https://cdn.example.com/sdk.js?key=${config.apiKey}`);
  },

  // polled until true before queued events are flushed
  loaded: () => typeof window.myService !== "undefined",

  page: ({ payload }) => {
    window.myService.page(payload.properties);
  },
  track: ({ payload }) => {
    window.myService.track(payload.event, payload.properties);
  },
  identify: ({ payload }) => {
    window.myService.identify(payload.userId, payload.traits);
  },
};
```

All event payloads carry a `meta` object with a unique request ID (`rid`) and a Unix timestamp (`ts`).

---

## Options

```ts
type AnalyticsOptions = {
  /** Maximum events to hold in the queue before discarding. Default: 100 */
  queueLimit?: number;
  /** Milliseconds between plugin-readiness polls. Default: 500 */
  retryInterval?: number;
  /**
   * When set, switches to batch mode: events accumulate and flush on this
   * interval (ms) rather than immediately.
   */
  drainInterval?: number;
  /**
   * Maximum events dispatched per drain cycle. Only applies when
   * `drainInterval` is set. Remaining events stay queued for the next cycle.
   */
  drainSize?: number;
};
```

---

## SSR

Both `makeAnalytics` and `createAnalytics` are isomorphic. On the server, `page()` omits browser-only defaults (`url`, `referrer`, `title`) since `window` is unavailable, but all other behaviour — plugin dispatch, queuing, `drain()` — works identically.

`makeAnalyticsGuard` / `createAnalyticsGuard` are no-ops on the server.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
