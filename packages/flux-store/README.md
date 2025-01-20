<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=store" alt="Solid Primitives store">
</p>

# @solid-primitives/flux-store

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/flux-store?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/flux-store)
[![version](https://img.shields.io/npm/v/@solid-primitives/flux-store?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/flux-store)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A library for creating Solid stores with implementing state management through explicit getters for reads and actions for writes.

- [`createFluxStore`](#createfluxstore) — Creates a store instance with explicit getters and actions.
- [`createFluxStoreFactory`](#createfluxstorefactory) — Create a `FluxStore` encapsulated in a factory function for reusable store implementation.

## Installation

```bash
npm install @solid-primitives/flux-store
# or
yarn add @solid-primitives/flux-store
# or
pnpm add @solid-primitives/flux-store
```

## `createFluxStore`

Creates a `FluxStore` instance - a solid store that implements state management through explicit getters for reads and actions for writes.

### How to use it

`createFluxStore` takes two arguments:

- `initialState` - the initial state of the store.

- `createMethods` - object containing functions to create getters and/or actions.

  - `getters` - functions that return a value from the store's state.
  - `actions` - untracked and batched functions that update the store's state.

```ts
import { createFluxStore } from "@solid-primitives/flux-store";

const counterState = createFluxStore(
  // initial state
  {
    value: 5,
  },
  {
    // reads
    getters: state => ({
      count() {
        return state.value;
      },
    }),
    // writes
    actions: setState => ({
      increment(by = 1) {
        setState("value", p => p + by);
      },
      reset() {
        setState("value", 0);
      },
    }),
  },
);

// read
counterState.getters.count(); // => 5

// write
counterState.actions.increment();
counterState.getters.count(); // => 6
```

## `createFluxStoreFactory`

Creates a [`FluxStore`](#createfluxstore) encapsulated in a factory function for reusable store implementation.

### How to use it

```ts
const createToggleState = createFluxStoreFactory(
  // initial state
  {
    value: false,
  },
  // reads
  getters: state => ({
    isOn() {
      return state.value;
    },
  }),
  // writes
  actions: setState => ({
    toggle() {
      setState("value", p => !p);
    },
  }),
);


// state factory can be reused in different components
const toggleState = createToggleState(
  // initial state can be overridden
  { value: true },
);

// read
toggleState.getters.isOn(); // => true

// write
toggleState.actions.toggle();
toggleState.getters.isOn(); // => false
```

## Demo

View Demo:
https://vu5z5u-3000.preview.csb.app/

Open Demo Editor:
https://codesandbox.io/p/sandbox/solid-primitives-store-web-demo-vu5z5u

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
