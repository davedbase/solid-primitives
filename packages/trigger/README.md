<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=trigger" alt="Solid Primitives trigger">
</p>

# @solid-primitives/trigger

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/trigger?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/trigger)
[![version](https://img.shields.io/npm/v/@solid-primitives/trigger?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/trigger)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-1.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A set of primitives based on Solid signals, used to trigger computations.

- [`createTrigger`](#createtrigger) - Set listeners in reactive computations and then trigger them when you want.
- [`createTriggerCache`](#createtriggercache) - Creates a cache of triggers that can be used to mark dirty only specific keys.

## Installation

```bash
npm install @solid-primitives/trigger
# or
yarn add @solid-primitives/trigger
# or
pnpm add @solid-primitives/trigger
```

## `createTrigger`

Set listeners in reactive computations and then trigger them when you want.

### How to use it

```ts
import { createTrigger } from "@solid-primitives/trigger";

const [track, dirty] = createTrigger();

createEffect(() => {
  track();
  // ...
});

// later
dirty();
```

## `createTriggerCache`

Creates a cache of triggers that can be used to mark dirty only specific keys.

Cache is a `Map` or `WeakMap` depending on the `mapConstructor` argument. (default: `Map`)

If `mapConstructor` is `WeakMap` then the cache will be weak and the keys will be garbage collected when they are no longer referenced.

Trigger signals added to the cache only when tracked under a computation,
and get deleted from the cache when they are no longer tracked.

### How to use it

`track` and `dirty` are called with a `key` so that each tracker will trigger an update only when his individual `key` would get marked as dirty.

```ts
import { createTriggerCache } from "@solid-primitives/trigger";

const map = createTriggerCache<number>();

createEffect(() => {
  map.track(1);
  //  ...
});

// later
map.dirty(1);
// this won't cause an update:
map.dirty(2);
```

### Triggering all keys

`dirtyAll` will trigger all keys in the cache.

```ts
const [track, _dirty, dirtyAll] = createTriggerCache<number>();

createEffect(() => {
  track(1);
  //  ...
});

// later (will trigger the update)
dirtyAll();
```

### Weak version

`createTriggerCache` constructor can take a `WeakMap` constructor as an argument. This will create a `WeakMap` of triggers instead of a `Map`.

```ts
const map = createTriggerCache<object>(WeakMap);

const obj = {};

createEffect(() => {
  map.track(obj);
  //  ...
});

// later
map.dirty(obj);
```

## Demo

TODO

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
