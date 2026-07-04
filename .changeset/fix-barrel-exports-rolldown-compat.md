---
"@solid-primitives/date": patch
"@solid-primitives/deep": patch
"@solid-primitives/event-bus": patch
"@solid-primitives/event-listener": patch
"@solid-primitives/filesystem": patch
"@solid-primitives/gestures": patch
"@solid-primitives/idle": patch
"@solid-primitives/mouse": patch
"@solid-primitives/props": patch
"@solid-primitives/range": patch
"@solid-primitives/share": patch
"@solid-primitives/signal-builders": patch
"@solid-primitives/upload": patch
"@solid-primitives/utils": patch
---

Fix named imports breaking under Rolldown (Vite 8+ / Storybook 10.4.6+) bundlers.

These packages re-export their public API via `export * from "./x.js"` barrels. Rollup resolves named imports through these at link time, but Rolldown's static analysis doesn't reliably follow `export *` for named-export resolution, causing errors like:

```
"createEventListener" is not exported by "@solid-primitives/event-listener/dist/index.js"
```

The build now also emits explicit `export { name } from "./x.js"` lines for every runtime export reachable through a barrel's `export *`, derived automatically from each submodule's compiled output — so `dist/` is bundler-agnostic regardless of how a given tool resolves star re-exports.
