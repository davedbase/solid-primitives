<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Wake%20Lock" alt="Solid Primitives Wake Lock">
</p>

# @solid-primitives/wake-lock

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/wake-lock?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/wake-lock)
[![version](https://img.shields.io/npm/v/@solid-primitives/wake-lock?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/wake-lock)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — keep the device screen on while your application is active. Useful for video players, navigation apps, recipe guides, presentations, and kiosk displays.

- **`makeWakeLock`** — Non-reactive. No Solid owner required. Returns the raw `WakeLockSentinel` for manual lifecycle control.
- **`createWakeLock`** — Reactive. Signal-based state, automatic cleanup on owner dispose, and optional re-acquisition when the tab regains visibility.

## Installation

```bash
npm install @solid-primitives/wake-lock
# or
pnpm add @solid-primitives/wake-lock
```

## `makeWakeLock`

Low-level wrapper with no Solid lifecycle. Use this when you need to manage the sentinel yourself or call the API outside a reactive context.

```ts
const { isSupported, request, release } = makeWakeLock();

if (isSupported) {
  const sentinel = await request("screen"); // throws on denial
  // ... later
  if (sentinel) await release(sentinel);
}
```

`request()` returns `null` when the API is unavailable and throws on denial — this is the low-level primitive, errors are not swallowed.

```ts
function makeWakeLock(): MakeWakeLockReturn;
```

## `createWakeLock`

Reactive primitive for use inside Solid components. Returns signals for all observable state, handles cleanup on owner dispose, and re-requests the lock automatically when the tab becomes visible again (browsers release locks on tab hide — `autoReacquire: true` by default).

```ts
const wl = createWakeLock();

await wl.request("screen");

wl.isActive(); // Accessor<boolean>  — true while a lock is held
wl.type(); // Accessor<WakeLockType | undefined>  — "screen" or undefined
wl.sentinel(); // Accessor<WakeLockSentinel | null>
wl.error(); // Accessor<Error | null>

await wl.release();
```

The lock is released automatically when the component unmounts.

```ts
function createWakeLock(options?: CreateWakeLockOptions): WakeLockReturn;
```

### Options

| Option          | Type      | Default | Description                                                         |
| --------------- | --------- | ------- | ------------------------------------------------------------------- |
| `autoReacquire` | `boolean` | `true`  | Re-request the lock when the tab becomes visible after being hidden |

### Auto-reacquire behaviour

The browser releases every wake lock the moment a tab is hidden. With `autoReacquire: true` (the default), `createWakeLock` listens for `visibilitychange` and re-requests the lock when the page becomes visible again — but only if:

- `request()` was called at least once before, and
- the lock was not released explicitly by calling `release()`.

Calling `release()` sets an internal flag that suppresses re-acquisition until `request()` is called again. This lets you voluntarily drop the lock (e.g., when a video pauses) without it silently reappearing on the next tab switch.

## Patterns

### Tie the lock to a playing state

```ts
const wl = createWakeLock();
const [playing, setPlaying] = createSignal(false);

createEffect(
  () => playing(), // track: re-run when playing changes
  isPlaying => {
    // apply: side effect runs after flush
    if (isPlaying) {
      wl.request();
    } else {
      wl.release();
    }
  },
);
```

### Show a status indicator

```tsx
<Show when={wl.isActive()}>
  <span>Screen will stay on</span>
</Show>
```

### React to errors

```ts
createEffect(
  () => wl.error(),
  err => {
    if (err) console.error("Wake lock failed:", err.message);
  },
);
```

`request()` on `createWakeLock` never throws — failures are captured into the `error` signal. Common causes: the document was hidden when `request()` was called, or the browser denied the request.

## Browser support

| Browser       | Support |
| ------------- | ------- |
| Chrome / Edge | 84+     |
| Safari        | 16.4+   |
| Opera         | 70+     |
| Firefox       | 126+    |

See [caniuse.com/wake-lock](https://caniuse.com/wake-lock) for current coverage. Always check `isSupported` before calling `request()` — on unsupported browsers it is `false` and `request()` is a no-op.

## SSR

All primitives return safe stubs on the server: `isSupported` is `false`, all signals return neutral values, and `request`/`release` resolve immediately without side effects.

## Types

```ts
type MakeWakeLockReturn = {
  isSupported: boolean;
  request: (type?: WakeLockType) => Promise<WakeLockSentinel | null>;
  release: (sentinel: WakeLockSentinel) => Promise<void>;
};

type CreateWakeLockOptions = {
  autoReacquire?: boolean; // default: true
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
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
