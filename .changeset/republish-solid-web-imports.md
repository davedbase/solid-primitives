---
"@solid-primitives/controlled-props": patch
"@solid-primitives/drag-drop": patch
"@solid-primitives/favicon": patch
"@solid-primitives/virtual": patch
---

Republish with a clean build. The previously published `next` builds imported `solid-js/web`, which no longer exists in Solid 2.0, so importing the package failed with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The compiled output now imports `@solidjs/web`.
