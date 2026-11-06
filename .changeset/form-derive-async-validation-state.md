---
"@solid-primitives/form": patch
---

Async validation state is now derived instead of mirrored through an effect. After `setValue()` on a field that has async validators, `field.pending()`, `form.pending()` and `form.valid()` are correct in the same flush as the value change; previously the first committed frame reported `pending() === false` and `valid() === true` until the next flush. Error display is unchanged: the previous async error stays visible while the next validation is in flight and is cleared by a sync error, as before. Results for an outdated value are still discarded. One further fix: a result that arrives after a sync error has superseded its run is now discarded too; before, it could be applied and later surface as the error of a newer value.

Behavior changes: `pending()` is `true` from creation (before the first effect flush) while the initial async validation is outstanding, and one transient frame is gone (the torn frame where the new value looked valid). Server output is unchanged (`pending()` stays `false`). Note: `createForm` already desyncs hydration ids between server and client (the server returns a static object that allocates no owners); this change neither introduces nor fixes that.
