# Wake Lock Package Design

## Purpose

Provides Solid.js primitives for the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), which prevents the device screen from dimming or locking while an application is active.

Typical use cases: video players, map/navigation apps, recipe guides, presentations, kiosk displays.

---

## Primitives

### `makeWakeLock()` — Non-reactive base

Low-level wrapper around `navigator.wakeLock`. No Solid lifecycle. The caller owns the sentinel and cleanup.

**When to use**: when you need fine-grained control over the `WakeLockSentinel` lifecycle, or when integrating the API outside Solid's reactive system.

```ts
const { isSupported, request, release } = makeWakeLock();
const sentinel = await request("screen"); // throws on denial
if (sentinel) await release(sentinel);
```

Returns: `{ isSupported: boolean, request, release }`

### `createWakeLock(options?)` — Reactive

High-level reactive primitive. Manages the sentinel internally, exposes reactive signals, and handles:

- Cleanup via `onCleanup` when the Solid owner disposes.
- Optional auto-reacquire when the tab regains visibility (the browser releases all locks when a tab is hidden).
- Error capture via an `error` signal so callers don't need try/catch.

**When to use**: inside Solid components for declarative wake lock management.

```ts
const wl = createWakeLock({ autoReacquire: true });
wl.isSupported; // boolean — static, does not change
wl.isActive(); // Accessor<boolean>
wl.type(); // Accessor<WakeLockType | undefined>
wl.sentinel(); // Accessor<WakeLockSentinel | null>
wl.error(); // Accessor<Error | null>
await wl.request("screen");
await wl.release();
```

---

## Design Decisions

### `isSupported` as `boolean` (not `Accessor<boolean>`)

Browser capability checks are static — they never change after page load. A plain boolean avoids
unnecessary signal overhead and communicates the static nature to the caller.

### `autoReacquire` defaults to `true`

The browser automatically releases wake locks when a tab is hidden. Without auto-reacquire the user
would need to call `request()` manually every time they return to the tab. Defaulting to `true` is
the ergonomically correct choice for most apps.

### Discriminating user-initiated vs. system-initiated releases

We maintain a `userReleased` boolean flag (not a signal — no reactivity needed, just state).

- Set to `false` when `request()` is called.
- Set to `true` when `release()` is called by the caller.
  The visibility-change handler only re-acquires when `!userReleased`, so a voluntary `release()`
  prevents the lock from being silently re-requested on the next tab switch.

### Error signal over thrown Promises

`navigator.wakeLock.request()` can throw `NotAllowedError` (hidden document, denied permission)
or other `DOMException`s. Rather than letting these propagate (forcing try/catch at every call
site), `createWakeLock.request()` captures errors into an `error` accessor. The caller can react
to the signal declaratively. `makeWakeLock.request()` does NOT catch — low-level primitives
should remain transparent.

### `INTERNAL_OPTIONS` (`{ ownedWrite: true }`) on all internal signals

Signals are written from async Promise continuations and DOM event listeners. Using
`INTERNAL_OPTIONS` suppresses false-positive dev diagnostics about writes in owned scopes,
consistent with the video and mediastream package patterns.

### `{ once: true }` on sentinel `release` listener

The `release` event fires at most once per sentinel. Using `{ once: true }` removes the listener
automatically, avoiding the need for manual cleanup and eliminating potential memory leaks if the
caller replaces the sentinel without releasing the old one.

### Cleanup is fire-and-forget

`onCleanup` cannot be async. Calling `lock.release()` inside `onCleanup` is fire-and-forget
(`.catch(noop)`). The component tree is already disposing — stale signal writes after this point
are harmless because the reactive owner has been released.

---

## API Surface

```ts
type MakeWakeLockReturn = {
  isSupported: boolean;
  request: (type?: WakeLockType) => Promise<WakeLockSentinel>;
  release: (sentinel: WakeLockSentinel) => Promise<void>;
};

type CreateWakeLockOptions = {
  /** Re-request the lock automatically when the tab becomes visible again. Default: true. */
  autoReacquire?: boolean;
};

type WakeLockReturn = {
  isSupported: boolean;
  isActive: Accessor<boolean>;
  type: Accessor<WakeLockType | undefined>;
  sentinel: Accessor<WakeLockSentinel | null>;
  error: Accessor<Error | null>;
  request: (type?: WakeLockType) => Promise<void>;
  release: () => Promise<void>;
};

function makeWakeLock(): MakeWakeLockReturn;
function createWakeLock(options?: CreateWakeLockOptions): WakeLockReturn;
```

---

## Solid 2.0 Considerations

- `createEffect` is not needed — the wake lock lifecycle is imperative (async `request`/`release`),
  not reactive.
- Signal writes from async callbacks are automatically batched (microtask queue). No `flush()`
  or `batch()` needed in production code, only in tests.
- `isServer` is imported from `@solidjs/web` (not `solid-js/web`).
- `onCleanup` is used (not `onSettled`) because we are NOT inside an `onSettled` or
  `createTrackedEffect` scope.

---

## Test Mocking Strategy

The `WakeLock` API does not exist in jsdom. The `test/setup.ts` file installs:

- `MockWakeLockSentinel` — extends `EventTarget`; supports `release()`, `released`, and `type`.
- `mockWakeLock` — implements `navigator.wakeLock.request()`, returning `MockWakeLockSentinel`.
- `setDocumentVisible(visible)` — updates `document.visibilityState` and dispatches
  `visibilitychange` so auto-reacquire behavior can be tested.
- `setWakeLockDenied(denied)` — toggles rejection of all `request()` calls to test error paths.

Async patterns in tests:

- `await Promise.resolve()` (aliased as `tick()`) yields to the microtask queue.
- `flush()` is called after signal writes to drain Solid 2.0's microtask batcher.
