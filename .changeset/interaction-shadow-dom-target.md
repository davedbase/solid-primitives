---
"@solid-primitives/interaction": patch
---

`createInteractOutside` / `makeInteractOutside` now resolve interactions across shadow boundaries. An element rendered inside a shadow root no longer treats clicks, taps, or focus on its own content as outside interactions (which dismissed popovers on pointerdown and caused triggers to close and immediately reopen), and content slotted into the watched element counts as inside. Touch input is covered too: the target is captured while the `pointerdown` is still dispatching, before the outside check is deferred to the following `click`.

The element passed to `shouldExcludeElement`, and the one the outside event is dispatched on, is the target as seen from the watched element's own tree. Siblings inside the same shadow root are reported as themselves, while interactions inside a foreign web component are still reported as its host, so existing `trigger.contains(element)` exclusions keep working for web-component triggers. Behavior for watched elements in the light DOM is unchanged.

Target checks no longer use realm-bound `instanceof`, so outside detection also works for elements that belong to another realm, such as an iframe's document.
