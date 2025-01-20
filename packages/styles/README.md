<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=styles" alt="Solid Primitives styles">
</p>

# @solid-primitives/styles

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/styles?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/styles)
[![version](https://img.shields.io/npm/v/@solid-primitives/styles?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/styles)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Collection of reactive primitives focused on styles.

- [`createRemSize`](#createremsize) - Create a reactive signal of css `rem` size in pixels.

## Installation

```bash
npm install @solid-primitives/styles
# or
yarn add @solid-primitives/styles
# or
pnpm add @solid-primitives/styles
```

## `createRemSize`

Creates a reactive signal with value of the current rem size in pixels, and tracks it's changes.

### How to use it

It takes no arguments and returns a number signal.

```ts
import { createRemSize } from "@solid-primitives/styles";

const remSize = createRemSize();
console.log(remSize()); // 16

createEffect(() => {
  console.log(remSize()); // remSize value will be logged on every change to the root font size
});
```

### `useRemSize`

This primitive provides a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) variant that will reuse signals, HTML elements and the ResizeObserver instance across all dependents that use it.

It's behavior is the same as [`createRemSize`](#createremsize).

```ts
import { useRemSize } from "@solid-primitives/styles";

const remSize = useRemSize();
console.log(remSize()); // 16
```

### Server fallback

When using this primitive on the server, it will return a signal with a value of `16` by default. You can override this value by calling the `setServerRemSize` helper with a new value, before calling `createRemSize` or `useRemSize`.

```ts
import { setServerRemSize, createRemSize } from "@solid-primitives/styles";

setServerRemSize(10);

const remSize = createRemSize();
console.log(remSize()); // 10 instead of 16 (only on the server!)
```

## Demo

TODO

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
