<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Set" alt="Solid Primitives Set">
</p>

# @solid-primitives/set

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/set?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/set)
[![version](https://img.shields.io/npm/v/@solid-primitives/set?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/set)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

The Javascript built-in `Set` & `WeakSet` data structures as a reactive signals.

- **[`ReactiveSet`](#reactiveset)** - A reactive version of a Javascript built-in `Set` class.
- **[`ReactiveWeakSet`](#reactiveweakset)** - A reactive version of a Javascript built-in `WeakSet` class.

## Installation

```bash
npm install @solid-primitives/set
# or
yarn add @solid-primitives/set
# or
pnpm add @solid-primitives/set
```

## `ReactiveSet`

A reactive version of a Javascript built-in `Set` class.

### How to use it

#### Import

```ts
import { ReactiveSet } from "@solid-primitives/set";
```

#### Basic usage

```ts
const set = new ReactiveSet([1, 1, 2, 3]);

// listen for changes reactively
createEffect(() => {
  [...set]; // => [1,2,3] (reactive on any change)
  set.has(2); // => true (reactive on change to the result)
});

// apply like with normal Set
set.add(4);
set.delete(2);
set.clear();
```

## `ReactiveWeakSet`

A reactive version of a Javascript built-in `WeakSet` class.

### How to use it

#### Import

```ts
import { ReactiveWeakSet } from "@solid-primitives/set";
```

#### Basic usage

```ts
const set = new ReactiveWeakSet([1, 1, 2, 3]);

// listen for changes reactively
createEffect(() => {
  set.has(2); // => true (reactive on change to the result)
});

// apply changes like with normal Set
set.add(4);
set.delete(2);
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
