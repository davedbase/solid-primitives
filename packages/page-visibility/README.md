<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Page%20Visibility" alt="Solid Primitives Page Visibility">
</p>

# @solid-primitives/page-visibility

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/page-visibility?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/page-visibility)
[![size](https://img.shields.io/npm/v/@solid-primitives/page-visibility?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/page-visibility)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

- [`createPageVisibility`](#createpagevisibility) - Creates a signal with a boolean value identifying the page visibility state
- [`usePageVisibility`](#usepagevisibility) - A [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) alternative.

## Installation

```
npm install @solid-primitives/page-visibility
# or
yarn add @solid-primitives/page-visibility
```

## `createPageVisibility`

Creates a signal with a boolean value identifying the page visibility state.

### How to use it

```ts
import { createPageVisibility } from "@solid-primitives/page-visibility";

const visible = createPageVisibility();

createEffect(() => {
  visible(); // => boolean
});
```

## `usePageVisibility`

`usePageVisibility` is a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) primitive. It is providing the same signal as `createPageVisibility`, but the event-listener and the signal are shared between dependents, making it more optimized to use in multiple places at once.

### How to use it

```ts
import { usePageVisibility } from "@solid-primitives/page-visibility";

const visible = usePageVisibility();

createEffect(() => {
  visible(); // => boolean
});
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
