---
"@solid-primitives/event-bus": patch
---

`toEffect` now keeps pending payloads in a plain queue and uses a counter signal to schedule the drain, instead of writing an empty array back into the signal its own effect reads. Payloads are still emitted in order, once per flush, under the captured owner; the only observable difference is that the extra empty re-run of the effect (and its `EFFECT_WRITES_OWN_SOURCE` dev diagnostic) is gone. Calling the wrapped emit from inside a listener during a drain still throws, as before.
