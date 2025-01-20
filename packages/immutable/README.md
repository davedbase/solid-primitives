<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=immutable" alt="Solid Primitives Immutable">
</p>

# @solid-primitives/immutable

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/immutable?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/immutable)
[![version](https://img.shields.io/npm/v/@solid-primitives/immutable?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/immutable)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-1.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitive for rectifying immutable values and dealing with immutability in Solid.

- [`createImmutable`](#createimmutable) - Creates a store derived from the given immutable source.

## Installation

```bash
npm install @solid-primitives/immutable
# or
yarn add @solid-primitives/immutable
# or
pnpm add @solid-primitives/immutable
```

## `createImmutable`

Creates a store _(deeply nested reactive object)_ derived from the given immutable source. The source can be any signal that is updated in an immutable fashion.

It's an **experimental** primitive, a proof of concept of derived nested reactivity. It's not meant to be used in production, but rather as a playground for experimenting with new ideas.

### How to use it

`createImmutable` is a function that takes a reactive function as the first param, and an optional configuration object as the second param:

- `source` reactive function returning an immutable object
- `options` optional configuration
  - `key` property name to use as unique identifier for objects when their reference changes
  - `merge` controls how objects witohut a unique identifier are identified when reconciling an array. If `true` the index is used, otherwise the object reference itself is used.

```ts
import { createImmutable } from "@solid-primitives/immutable";

// source - can be any reactive function returning an immutable object
const [data, setData] = createSignal({ a: 1, b: 2 });

// reactive state derived from the source
const state = createImmutable(data);

// just like in Solid stores, the updates are fine-grained - only the changed values are updated
createEffect(() => console.log(state.a, state.b));
// logs 1 2

setData({ a: 2, b: 3 });
// logs 2 3
```

### Usage with Redux Toolkit

There are many state management libraries that provide immutable data structures, such as [Immer](https://immerjs.github.io/immer/), [Redux Toolkit](https://redux-toolkit.js.org/), [XState](https://xstate.js.org/docs/), etc.

`createImmutable` can help you turn them into reactive objects, only updating the changed values.

> **Warning** `createStore` with `reconcile` will give you the similar result, while being more efficient.

```tsx
import { createSlice, configureStore } from "@reduxjs/toolkit";
import { createImmutable } from "@solid-primitives/immutable";

const slice = createSlice({
  initialState: [
    { id: 1, title: "Learn Solid", completed: false },
    { id: 2, title: "Learn Redux", completed: false },
  ],
  reducers: {
    /* ... (immutable actions) */
  },
});

const store = configureStore({
  reducer: slice.reducer,
});

const [source, setSource] = createSignal(store.getState());
store.subscribe(() => setSource(store.getState()));

const todos = createImmutable(source);

// the references of todos will be preserved, even though they were destructured in the store
<For each={todos}>
  {todo => (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onClick={() => store.dispatch(slice.actions.toggleTodo(todo.id))}
      />
      {todo.title}
    </div>
  )}
</For>;
```

### Usage with XState

`createImmutable` doesn't mutate the source objects, as opposed to `createStore` with `reconcile`. This makes it a good fit for XState, which uses relies on diffing the previous and next state to determine the changes.

```tsx
import { onCleanup, createSignal } from "solid-js";
import { createMachine, createActor } from "xstate";
import { createImmutable } from "@solid-primitives/immutable";

const toggleMachine = createMachine({
  id: "toggle",
  initial: "inactive",
  states: {
    inactive: {
      on: { TOGGLE: "active" },
    },
    active: {
      on: { TOGGLE: "inactive" },
    },
  },
});

export const Toggler = () => {
  const actor = x.createActor(toggleMachine).start();
  onCleanup(() => actor.stop());

  const [snapshot, setSnapshot] = createSignal(actor.getSnapshot());
  actor.subscribe(setSnapshot);

  const state = createImmutable(snapshot);

  return (
    <button onclick={() => actor.send({ type: "TOGGLE" })}>
      {state.value === "inactive" ? "Click to activate" : "Active! Click to deactivate"}
    </button>
  );
};
```

### Usage with `createResource`

Data fetched from the server is immutable, so `createImmutable` can help you turn it into a reactive object, only updating the changed values.

> **Warning** `createResource` provides an experimental `storage` option that can be used together with `createStore` and `reconcile` to achieve the similar result, while being more efficient
> https://www.solidjs.com/docs/latest/api#createresource

```ts
import { createResource } from "solid-js";
import { createImmutable } from "@solid-primitives/immutable";

const [data, { refetch }] = createResource(() =>
  fetch("https://jsonplaceholder.typicode.com/todos/1").then(res => res.json()),
);

const state = createImmutable(data);

createEffect(() => console.log(state.title, state.completed));

// newely fetched data will be merged with the previous state
refetch();
```

## Demo

You can see the live demo [here](https://primitives.solidjs.community/playground/immutable).

[Source code](./dev/index.tsx)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
