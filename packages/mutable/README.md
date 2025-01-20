<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=mutable" alt="Solid Primitives mutable">
</p>

# @solid-primitives/mutable

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/mutable?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/mutable)
[![version](https://img.shields.io/npm/v/@solid-primitives/mutable?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/mutable)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A primitive for creating a mutable store proxy object. An alternative to `createStore` from `"solid-js/store"`.

- [`createMutable`](#createmutable) - Creates a mutable store proxy object.
- [`modifyMutable`](#modifymutable) - Helper for applying store mutation utilities - like `produce` or `reconcile` from `"solid-js/store"` - to a mutable store.

## Installation

```bash
npm install @solid-primitives/mutable
# or
pnpm add @solid-primitives/mutable
# or
yarn add @solid-primitives/mutable
```

## `createMutable`

```ts
import { createMutable } from "@solid-primitives/mutable";

declare function createMutable<T extends StoreNode>(state: T): T;
```

Creates a new mutable Store proxy object. Stores only trigger updates on values changing. Tracking is done by intercepting property access and automatically tracks deep nesting via proxy.

Useful for integrating external systems or as a compatibility layer with MobX/Vue.

> **Note:** A mutable state can be passed around and mutated anywhere, which can make it harder to follow and easier to break unidirectional flow. It is generally recommended to use `createStore` instead. The `produce` modifier can give many of the same benefits without any of the downsides.

```js
const state = createMutable(initialValue);

// read value
state.someValue;

// set value
state.someValue = 5;

state.list.push(anotherValue);
```

Mutables support setters along with getters.

```js
const user = createMutable({
  firstName: "John",
  lastName: "Smith",
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  set fullName(value) {
    [this.firstName, this.lastName] = value.split(" ");
  },
});
```

## `modifyMutable`

```ts
import { modifyMutable } from "@solid-primitives/mutable";

declare function modifyMutable<T>(mutable: T, modifier: (state: T) => T): void;
```

This helper function simplifies making multiple changes to a mutable Store
(as returned by [`createMutable`](#createmutable))
in a single [`batch`](#batch),
so that dependant computations update just once instead of once per update.

The first argument is the mutable Store to modify,
and the second argument is a Store modifier such as those returned by
[`reconcile`](#reconcile) or [`produce`](#produce).
_(If you pass in your own modifier function, beware that its argument is
an unwrapped version of the Store.)_

For example, suppose we have a UI depending on multiple fields of a mutable:

```tsx
const state = createMutable({
  user: {
    firstName: "John",
    lastName: "Smith",
  },
});

<h1>Hello {state.user.firstName + " " + state.user.lastName}</h1>;
```

Modifying _n_ fields in sequence will cause the UI to update _n_ times:

```ts
state.user.firstName = "Jake"; // triggers update
state.user.lastName = "Johnson"; // triggers another update
```

To trigger just a single update, we could modify the fields in a `batch`:

```ts
batch(() => {
  state.user.firstName = "Jake";
  state.user.lastName = "Johnson";
});
```

`modifyMutable` combined with `reconcile` or `produce`
provides two alternate ways to do similar things:

```ts
// Replace state.user with the specified object (deleting any other fields)
modifyMutable(state.user, reconcile({
  firstName: "Jake",
  lastName: "Johnson",
});

// Modify two fields in batch, triggering just one update
modifyMutable(state.user, produce((u) => {
  u.firstName = "Jake";
  u.lastName = "Johnson";
});
```

## Demo

[Deployed example](https://primitives.solidjs.community/playground/mutable) | [Source code](https://github.com/solidjs-community/solid-primitives/tree/main/packages/mutable/dev/index.tsx)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
