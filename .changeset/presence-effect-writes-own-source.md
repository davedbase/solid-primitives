---
"@solid-primitives/presence": patch
---

Fix `createPresence` triggering Solid 2's `EFFECT_WRITES_OWN_SOURCE` and `EFFECT_RELAY_TEAR` warnings (#1082), for example when opening a Kobalte `Popover`.

The internal effects used to feed back into themselves: the sync effect tracked `mountedItem()` while writing it, and watched `isMounted()`, which was itself copied from the `shouldBeMounted` signal that effect writes. Each change therefore took extra flushes to settle, and the first frame rendered stale state.

`isMounted`, `isVisible` and `hasEntered` are now derived from the source instead of being copied around by effects. Time-driven state (the exit finished, the next frame arrived) is only written from timer and animation-frame callbacks. The swap to a new item still happens after the exit transition, once `isMounted` has been `false` for a flush, so a `<Show when={isMounted()}>` still unmounts the old item and mounts a fresh one.

The public API is unchanged and the settled state matches the previous implementation. Intermediate frames that used to be inconsistent (for example `isVisible` still `true` for a flush after the exit started) no longer occur, and `isMounted` turns `true` in the same flush as the mount. Transitions may therefore start up to one frame earlier.

Also fixes items that are functions (for example components): they were called instead of being kept, so `mountedItem()` returned the function's result. The item is now stored in a box, because a signal cannot hold a function value directly.

Known limitation: with plain boolean items, `createPresence` still reports `EFFECT_RELAY_TEAR` in dev when `attribution` is enabled (a boolean item is mirrored one to one into the internal mount state). This is unchanged from before.
