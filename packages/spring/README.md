<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=spring" alt="Solid Primitives spring">
</p>

# @solid-primitives/spring

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/spring?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/spring)
[![version](https://img.shields.io/npm/v/@solid-primitives/spring?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/spring)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A small SolidJS hook to interpolate signal changes with spring physics. Inspired by & directly forked from [`svelte-motion/spring`](https://svelte.dev/docs/svelte-motion#spring) as such, has a very familiar API design.

With this primitive, you can easily animate values that can be interpolated like `number`, `date`, and collections (arrays or nested objects) of those datatypes.

- `createSpring` - Provides a getter and setter for the spring primitive.
- `createDerivedSpring` - Provides only a getter for the spring primitive deriving from an accessor parameter. Similar to the [@solid-primitives/tween](https://github.com/solidjs-community/solid-primitives/tree/main/packages/tween) API.

The following physics options are available:

- `stiffness` (number, default `0.15`) — a value between 0 and 1 where higher means a 'tighter' spring
- `damping` (number, default `0.8`) — a value between 0 and 1 where lower means a 'springier' spring
- `precision` (number, default `0.01`) — determines the threshold at which the spring is considered to have 'settled', where lower means more precise

## Installation

```bash
npm install @solid-primitives/spring
# or
yarn add @solid-primitives/spring
# or
pnpm add @solid-primitives/spring
```

## How to use it

```ts
// Basic Example
const [progress, setProgress] = createSpring(0);

// Example with options (less sudden movement)
const [radialProgress, setRadialProgress] = createSpring(0, { stiffness: 0.05 });

// Example with collections (e.g. Object or Array).
const [xy, setXY] = createSpring(
  { x: 50, y: 50 },
  { stiffness: 0.08, damping: 0.2, precision: 0.01 },
);

// Example deriving from an existing signal.
const [myNumber, myNumber] = createSignal(20);
const springedValue = createDerivedSpring(myNumber, { stiffness: 0.03 });
```

## Demo

- **[Playground](https://primitives.solidjs.community/playground/spring)** - [source code](https://github.com/solidjs-community/solid-primitives/blob/main/packages/spring/dev/index.tsx)

- **[CodeSandbox - Basic Example](https://codesandbox.io/p/devbox/ecstatic-borg-k2wqfr)**

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
