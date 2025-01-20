<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Tween" alt="Solid Primitives Tween">
</p>

# @solid-primitives/tween

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/tween?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/tween)
[![size](https://img.shields.io/npm/v/@solid-primitives/tween?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/tween)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Creates an efficient tweening derived signal that smoothly transitions
a given signal from its previous value to its next value whenever it changes.

## Installation

```
npm install @solid-primitives/tween
# or
yarn add @solid-primitives/tween
```

## How to use it

```ts
import { createSignal } from "solid-js";
import { createTween } from "@solid-primitives/tween";

const [value, setValue] = createSignal(0);
const tweenedValue = createTween(value, { duration: 500 });

setMyNumber(100);
// tweenedValue will now smoothly transition from 0 to 100 over 500 ms
```

## Definition

```ts
function createTween(
  target: Accessor<number>,
  options: {
    duration?: number = 100; // ms
    easing?: (t: number) => number = (t) => t;
  }
): Accessor<number>;
```

`target` can be any reactive value (signal, memo, or function that calls such).
For example, to use a component prop, specify `() => props.value`.

You can provide two options:

- `duration` is the number of milliseconds to perform the transition
  from the previous value to the next value. Defaults to 100.
- `easing` is a function that maps a number between 0 and 1 to a number
  between 0 and 1, to speed up or slow down different parts of the transition.
  The default easing function `(t) => t` is linear (no easing).
  A common choice is `(t) => 0.5 - Math.cos(Math.PI * t) / 2`.

Internally, `createTween` uses
[`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
to smoothly update the tweened value at the display refresh rate.
After the tweened value reaches the underlying signal value,
it will stop updating via `requestAnimationFrame` for efficiency.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
