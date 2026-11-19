---
"@solid-primitives/virtual": patch
"@solid-primitives/controlled-props": patch
---

Remove the `solid` export condition that pointed to a non-existent `dist/index.jsx`, which broke resolution in Vite with vite-plugin-solid.
