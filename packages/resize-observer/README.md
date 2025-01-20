<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Resize%20Observer" alt="Solid Primitives Resize Observer">
</p>

# @solid-primitives/resize-observer

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/resize-observer?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/resize-observer)
[![size](https://img.shields.io/npm/v/@solid-primitives/resize-observer?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/resize-observer)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Reactive primitives for observing resizing of HTML elements.

- [`makeResizeObserver`](#makeresizeobserver) — Instantiate a new ResizeObserver that automatically get's disposed on cleanup.
- [`createResizeObserver`](#createresizeobserver) — Create resize observer instance, listening for changes to size of reactive element targets array.
- [`createWindowSize`](#createwindowsize) — Creates a reactive store-like object of current width and height dimensions of the browser window.
- [`createElementSize`](#createelementsize) — Creates a reactive store-like object of current width and height dimensions of html element.

## Installation

```bash
npm install @solid-primitives/resize-observer
# or
pnpm add @solid-primitives/resize-observer
# or
yarn add @solid-primitives/resize-observer
```

## `makeResizeObserver`

Instantiate a new ResizeObserver that automatically get's disposed on cleanup.

### How to use it

`makeResizeObserver` returns `observe` and `unobserve` functions for managing targets.

```ts
import { makeResizeObserver } from "@solid-primitives/resize-observer";

const { observe, unobserve } = makeResizeObserver(handleObserverCallback, { box: "content-box" });
observe(document.body);
observe(ref);

function handleObserverCallback(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    console.log(entry.contentRect.width);
  }
}
```

#### Disposing

`makeResizeObserver` will dispose itself with it's parent reactive owner.

To dispose early, wrap the primitive with a [`createRoot`](https://www.solidjs.com/docs/latest/api#createroot).

```ts
const { dispose } = createRoot(dispose => {
  const { observe, unobserve } = makeResizeObserver(handleObserverCallback);
  return { dispose, observe, unobserve };
});
// dispose early
dispose();
```

## `createResizeObserver`

Create resize observer instance, listening for changes to size of reactive element targets array.

Disposes automatically itself with it's parent reactive owner.

### How to use it

```tsx
import { createResizeObserver } from "@solid-primitives/resize-observer";

let ref!: HTMLDivElement;

// can in onMount if the target variable isn't yet populated
onMount(() => {
  createResizeObserver(ref, ({ width, height }, el) => {
    if (el === ref) console.log(width, height);
  });
});

<div ref={ref} />;
```

#### Reactive targets

The `targets` argument can be a reactive signal or top-level store array.

```ts
const [targets, setTargets] = createSignal([document.body]);
createResizeObserver(targets, ({ width, height }, el) => {});
// updating the signal will unobserve removed elements and observe added ones
setTargets(p => [...p, element]);

// createResizeObserver supports top-lever store arrays too
const [targets, setTargets] = createStore([document.body]);
createResizeObserver(targets, ({ width, height }, el) => {});
setTargets(targets.length, element);
```

## `createWindowSize`

Creates a reactive store-like object of current width and height dimensions of the browser window.

### How to use it

```ts
import { createWindowSize } from "@solid-primitives/resize-observer";

const size = createWindowSize();

createEffect(() => {
  size.width; // => number
  size.height; // => number
});
```

### `useWindowSize`

`useWindowSize` is a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) primitive. It is providing the same reactive object as `createWindowSize`, but the object instance, signals and event-listeners are shared between dependents, making it more optimized to use in multiple places at once.

```ts
import { useWindowSize } from "@solid-primitives/resize-observer";

const size = useWindowSize();

createEffect(() => {
  size.width; // => number
  size.height; // => number
});
```

### Media Queries

**The `createWindowSize` isn't meant to be used for creating media queries.**

If you want a reactive interface for media-queries, please checkout [the media package](https://github.com/solidjs-community/solid-primitives/tree/main/packages/media#readme).

## `createElementSize`

Creates a reactive store-like object of current width and height dimensions of html element.

It uses `ResizeObserver` under the hood—to observe when the element size changes—and `getBoundingClientRect` to get the current size.

### How to use it

`createElementSize` needs to be provided a target. It can be an HTML element, or a reactive signal returning one. Target also takes falsy values to disable tracking.

```tsx
import { createElementSize } from "@solid-primitives/resize-observer";

const size = createElementSize(document.body);
createEffect(() => {
  size.width; // => number
  size.height; // => number
});

// reactive target

const [target, setTarget] = createSignal<HTMLElement>();

const size = createElementSize(target);
createEffect(() => {
  size.width; // => number | null
  size.height; // => number | null
});

<div ref={setTarget} />;
```

## Demo

https://codesandbox.io/s/solid-primitives-resize-observer-yg41gd?file=/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Contributors

Thanks to Moshe Udimar for this contribution!
