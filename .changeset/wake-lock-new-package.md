---
"@solid-primitives/wake-lock": minor
---

New package: `@solid-primitives/wake-lock` — Screen Wake Lock API primitives for Solid 2.0

Provides two layered primitives for the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API):

- **`makeWakeLock()`** — Non-reactive low-level wrapper. No Solid owner required. Returns the raw `WakeLockSentinel` for manual lifecycle control.
- **`createWakeLock(options?)`** — Reactive primitive. Manages the sentinel internally, exposes `isActive`, `type`, `sentinel`, and `error` signals, and optionally re-acquires the lock when the tab regains visibility (`autoReacquire: true` by default).

```ts
const wl = createWakeLock({ autoReacquire: true });

// Request while a video is playing
await wl.request("screen");

createEffect(() => console.log("lock active:", wl.isActive()));

// Drop when paused
await wl.release();
```

The lock is released automatically when the Solid owner disposes.
Errors from `request()` are captured into the `error` signal rather than thrown.
SSR-safe: all primitives return stubs when running on the server.
