---
"@solid-primitives/event-listener": patch
---

`makeEventListenerStack` no longer registers its cleanup when called without an owner (for example from inside an effect's apply function). Previously this emitted a dev-only `NO_OWNER_CLEANUP` diagnostic on every call, which `createMousePosition` with a reactive target triggered twice per target change. Listeners were already removed correctly; behavior under an owner is unchanged. Trade-off: like `makeEventListener`, the stack now stays silent for an unowned caller that never calls `clear()`, so such a leak is no longer flagged in development.
