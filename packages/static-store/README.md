<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=static-store" alt="Solid Primitives Static Store">
</p>

# @solid-primitives/static-store

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/static-store?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/static-store)
[![version](https://img.shields.io/npm/v/@solid-primitives/static-store?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/static-store)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for creating small reactive objects that doesn't change their shape over time - don't need a proxy wrapper.

- [`createStaticStore`](#createstaticstore) - Creates a writable static store object.
- [`createDerivedStaticStore`](#createderivedstaticstore) - Creates a static store that is derived from a source function.

## Installation

```bash
npm install @solid-primitives/static-store
# or
yarn add @solid-primitives/static-store
# or
pnpm add @solid-primitives/static-store
```

## `createStaticStore`

Creates read-only object that is shallowly reactive — only reactive on its first level and for the enumerable properties specified in the initial value — and a setter. It behaves similarly to createStore, but with limited features to keep it simple and performant. Designed to be used for reactive objects with static keys and dynamic values, like reactive Event State, location, etc.

### How to use it

It takes a single argument - an initial value. It returns a tuple with the store object and a setter function.

```ts
import { createStaticStore } from "@solid-primitives/static-store";

const [size, setSize] = createStaticStore({ width: 0, height: 0 });

createEffect(() => {
  // both of these are separate signals, that can be listened to independently
  console.log(size.width, size.height);
});

// changing the property will trigger observers of that property only
setSize("width", 100);

el.addEventListener("resize", () => {
  // passed object will get merged with the existing store
  setSize({ width: el.offsetWidth, height: el.offsetHeight });
});

// adding a new property will NOT work
// the shape of the store is static
setSize("new-property", "value");
```

## `createDerivedStaticStore`

A derived version of the [`createStaticStore`](#createstaticstore). It will use the update function to derive the value of the store. It will only update when the dependencies of the update function change.

### How to use it

It works similarly to the `createMemo` primitive and it takes the same arguments, but it returns a reactive object rather than an accessor function.

```ts
// source
const [size, setSize] = createSignal({ width: 0, height: 0 });

const store = createDerivedStaticStore(size);

createEffect(() => {
  // both of these are separate signals, that can be listened to independently
  console.log(store.width, store.height);
});

el.addEventListener("resize", () => {
  // only the changed properties that changed will trigger their observers
  setSize(p => ({ ...p, height: el.offsetHeight }));
});
```

## `createHydratableStaticStore`

A "hydratable" version of the [`createStaticStore`](#createstaticstore) - it will use the `serverValue` on the server and the `update` function on the client. If initialized during hydration it will use `serverValue` as the initial value and update it once hydration is complete.

> **Warning** This primitive version is experimental, and mostly used internally by other primitives. It is not recommended to use it directly.

```ts
import { createHydratableStaticStore } from "@solid-primitives/static-store";

// reads from the DOM
const getSize = () => ({ width: el.offsetWidth, height: el.offsetHeight });

const [size, setSize] = createHydratableStaticStore(
  // server fallback value
  { width: 0, height: 0 },
  // update function (called onMount)
  () => {
    el.addEventListener("resize", () => setSize(getSize()));
    return getSize();
  },
);

createEffect(() => {
  console.log(size.width, size.height);
});
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
