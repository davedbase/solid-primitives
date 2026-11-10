---
"@solid-primitives/timer": patch
---

`createPolled` (and `createIntervalCounter`) return the derived signal directly instead of copying it into a second signal from an effect. The copy delivered each polled value one flush late and cost two flushes per tick (reported as `EFFECT_RELAY_TEAR` with attribution enabled); consumers now see each new value in the same flush as the tick. With `options.equals: false`, consumers are now notified on every tick (previously unchanged values were still dropped by the internal derived signal, so notifications were missed). A function returned by `fn` is now delivered as the value, whereas the first value used to be the result of calling it as a signal initializer.
