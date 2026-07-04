---
"@solid-primitives/keyboard": patch
---

Fix `useKeyDownList` (and everything built on it: `useCurrentlyHeldKey`, `useKeyDownSequence`, `createKeyHold`, `createShortcut`) failing to re-trigger on repeated presses of shortcuts involving the `Meta` key, e.g. `["Meta", "P"]` on macOS. macOS never fires `keyup` for other keys held down together with Meta, only for Meta itself, so `useKeyDownList` now treats Meta's `keyup` as a signal to clear all tracked keys, preventing stale key state from corrupting the next press.
