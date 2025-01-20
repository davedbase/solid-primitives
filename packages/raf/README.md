<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=RAF" alt="Solid Primitives RAF">
</p>

# @solid-primitives/raf

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/raf?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/raf)
[![size](https://img.shields.io/npm/v/@solid-primitives/raf?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/raf)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Reactive primitives providing support to `window.requestAnimationFrame`.

- [`createRAF`](#createraf) - Creates an auto-disposing requestAnimationFrame loop.
- [`targetFPS`](#targetfps) - Used to limit the FPS of [`createRAF`](#createraf)

## Installation

```
npm install @solid-primitives/raf
# or
yarn add @solid-primitives/raf
```

## `createRAF`

A primitive creating reactive `window.requestAnimationFrame`, that is automatically disposed onCleanup.

It takes a `callback` argument that will run on every frame.

Returns a signal if currently running as well as start and stop methods

```ts
import createRAF from "@solid-primitives/raf";

const [running, start, stop] = createRAF(timeStamp => console.log("Time stamp is", timeStamp));

running(); // => false
start();
running(); // => true
```

#### Definition

```ts
function createRAF(
  callback: FrameRequestCallback,
): [running: Accessor<boolean>, start: VoidFunction, stop: VoidFunction];
```

#### Warning

To respect clients refresh rate, timeStamp should be used to calculate how much the animation should progress in a given frame, otherwise the animation will run faster on high refresh rate screens. As an example: A screen refreshing at 300fps will run the animations 5x faster than a screen with 60fps if you use other forms of time keeping that don't consider this. Please see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame

## `targetFPS`

A primitive for wrapping `window.requestAnimationFrame` callback function to limit the execution of the callback to specified number of FPS.

Keep in mind that limiting FPS is achieved by not executing a callback if the frames are above defined limit. This can lead to not consistant frame duration.

The `targetFPS` primitive takes two arguments:

- `callback` - The callback to run each _allowed_ frame
- `fps` - The target FPS limit

```ts
import createRAF, { targetFPS } from "@solid-primitives/raf";

const [running, start, stop] = createRAF(
  targetFPS(timeStamp => console.log("Time stamp is", timeStamp), 60)
);

// the target fps value can be a reactive sigmal
const [fps, setFps] = createSignal(60);
createRAF(targetFPS((timestamp) => {...}, fps));
```

#### Definition

```ts
function targetFPS(
  callback: FrameRequestCallback,
  fps: MaybeAccessor<number>,
): FrameRequestCallback;
```

## createMs

Using createRAF and targetFPS to create a signal giving the passed milliseconds since it was called with a configurable frame rate, with some added methods for more control:

- `reset()`: manually resetting the counter
- `running()`: returns if the counter is currently setRunning
- `start()`: restarts the counter if stopped
- `stop()`: stops the counter if running

It takes the framerate as single argument, either as `number` or `Accessor<number>`. It also accepts the limit as an optional second argument, either as `number` or `Accessor<number>`; the counter is reset if the limit is passed.

```tsx
import { createMs } from "@solid-primitives/raf";

const MovingRect() {
  const ms = createMs(60);
  return <rect x="0" y="0" width={1000 / 3000 * Math.min(ms(), 3000)} height="10" />;
}
```

#### Defintion

```ts
function createMs(
  fps: MaybeAccessor<number>,
  limit?: MaybeAccessor<number>,
): Accessor<number> & {
  reset: () => void;
  running: () => boolean;
  start: () => void;
  stop: () => void;
};
```

## Demo

You may view a working example here: https://codesandbox.io/s/solid-primitives-raf-demo-4xvmjd?file=/src/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
