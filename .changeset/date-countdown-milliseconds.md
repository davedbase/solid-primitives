---
"@solid-primitives/date": patch
---

`getCountdown` (and so `createCountdown` / `createCountdownFromNow`) now returns the milliseconds left after the whole seconds (`% 1000` instead of `% 100`). `formatDateRelative` returns `messages.justNow` instead of `"in 0 second"` / `"0 second ago"` for differences under half a second.
