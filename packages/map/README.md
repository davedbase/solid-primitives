<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Map" alt="Solid Primitives Map">
</p>

# @solid-primitives/map

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/map?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/map)
[![version](https://img.shields.io/npm/v/@solid-primitives/map?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/map)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

The reactive versions of `Map` & `WeakMap` built-in data structures.

- **[`ReactiveMap`](#reactivemap-and-reactiveweakmap)** - A reactive `Map`.
- **[`ReactiveWeakMap`](#reactivemap-and-reactiveweakmap)** - A reactive `WeakMap`.

## Installation

```bash
npm install @solid-primitives/map
# or
yarn add @solid-primitives/map
# or
pnpm add @solid-primitives/map
```

## `ReactiveMap` and `ReactiveWeakMap`

A reactive version of `Map`/`WeakMap` data structure. All the reads _(e.g. `get` or `has`)_ are signals, and all the writes _(e.g. `delete` or `set`)_ will cause updates to appropriate signals.

### How to use it

#### Import

```ts
import { ReactiveMap } from "@solid-primitives/map";
// or
import { ReactiveWeakMap } from "@solid-primitives/map";
```

#### Basic usage

The usage is almost the same as the original Javascript structures.

```ts
const userPoints = new ReactiveMap<User, number>();
// reads can be listened to reactively
createEffect(() => {
  userPoints.get(user1); // => T: number | undefined (reactive)
  userPoints.has(user1); // => T: boolean (reactive)
  // ReactiveWeakMap won't have .size or any methods that loop over the values
  userPoints.size; // => T: number (reactive)
});
// apply changes
userPoints.set(user1, 100);
userPoints.delete(user2);
userPoints.set(user1, { foo: "bar" });
```

#### Constructor arguments

`ReactiveMap`'s and `ReactiveWeakMap`'s constructor one optional argument that is the initial entries of the map.

```ts
const map = new ReactiveMap([
  ["foo", [1, 2, 3]],
  ["bar", [3, 4, 5]],
]);
```

#### Values are shallowly wrapped

Treat the values of `ReactiveMap` and `ReactiveMap` as individual signals, to cause updates, they have to be set through the `.set()` method, no mutations.

```ts
const map = new ReactiveMap<string, { age: number }>();
map.set("John", { age: 34 });

// this won't cause any updates:
map.get("John").age = 35;

// this will:
map.set("John", { age: 35 });
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
