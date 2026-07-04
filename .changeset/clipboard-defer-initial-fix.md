---
"@solid-primitives/clipboard": patch
---

Fix `createClipboard`'s `deferInitial` parameter being completely non-functional — `deferInitial || true` always evaluated to `true` regardless of the argument passed, so explicitly passing `deferInitial={false}` had no effect and the clipboard was never written from the initial signal value (resolves #790). Also corrected the JSDoc, which incorrectly claimed the default was `false` when the intended (and actual, once fixed) default is `true` — skip the initial write unless `deferInitial` is explicitly `false`.
