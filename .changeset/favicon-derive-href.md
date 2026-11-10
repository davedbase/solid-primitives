---
"@solid-primitives/favicon": patch
---

`createFaviconScheme` and `createFavicon` now derive the `href` they return from their inputs (a memo resolved against the document base URL, the same value the `<link>` reports) instead of copying it back out of the `<link>` element after an effect. Previously a consumer reading `scheme()` together with `href()`, or `createFavicon`'s result together with another signal changed in the same write, could see the new value next to the previous href for one flush. The `<link>` element is still written by the effect, and the public API and types are unchanged.

Behavior notes: the returned `href()` now already holds the new value while the flush is still running, before the effect writes it to the `<link>` (so a reader in that window sees `href()` ahead of the element). A `<base href>` change alone does not update a reactive `href()`; it re-resolves on the next change of the icon/scheme. For a static string passed to `createFavicon`, the returned function re-resolves on every call, so it follows a later `<base>` change (before, it held the value frozen at creation).
