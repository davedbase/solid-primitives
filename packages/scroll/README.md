<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Scroll" alt="Solid Primitives Scroll">
</p>

# @solid-primitives/scroll

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/scroll?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/scroll)
[![size](https://img.shields.io/npm/v/@solid-primitives/scroll?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/scroll)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Reactive primitives to react to element/window scrolling.

- [`createScrollPosition`](#createscrollposition) - Reactive primitive providing a store-like object with current scroll position of specified target.
- [`useWindowScrollPosition`](#usewindowscrollposition) - Returns a reactive object with current window scroll position.

## Installation

```
npm install @solid-primitives/scroll
# or
yarn add @solid-primitives/scroll
```

## `createScrollPosition`

Reactive primitive providing a store-like object with current scroll position of specified target.

### How to use it

```ts
import { createScrollPosition } from "@solid-primitives/scroll";

// target will be window by default
const windowScroll = createScrollPosition();

createEffect(() => {
  // returned object is a reactive store-like structure
  windowScroll.x; // => number
  windowScroll.y; // => number
});
```

#### With element refs

```tsx
let ref: HTMLDivElement | undefined;

// pass as function
const scroll = createScrollPosition(() => ref);
// or wrap with onMount
onMount(() => {
  const scroll = createScrollPosition(ref!);
});

<div ref={e => (ref = e)} />;
```

#### Reactive Target

The element target can be a reactive signal.

```tsx
const [target, setTarget] = createSignal<Element | undefined>(element);

const scroll = createScrollPosition(target);

// if target is undefined, scroll values will be 0
scroll.x; // => number
scroll.y; // => number

// update the tracking element
setTarget(ref);

// disable tracking
setTarget(undefined);
```

#### Destructuring

If you are interested in listening to only single axis, you'd still have to access `scroll.y` as a property. To use it as a separate signal, you can wrap it with a function, or use [`destructure`](https://github.com/solidjs-community/solid-primitives/tree/main/packages/destructure#destructure) helper.

```ts
const scroll = createScrollPosition();
const x = () => scroll.x;
x(); // => number

// or destructure

import { destructure } from "@solid-primitives/destructure";
const { x, y } = destructure(createScrollPosition());
x(); // => number
y(); // => number
```

### Demo

https://codesandbox.io/s/solid-primitives-scroll-xy19c8?file=/index.tsx

## `useWindowScrollPosition`

Returns a reactive object with current window scroll position.

`useWindowScrollPosition` is a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) primitive, hence the object instance, signals and event-listeners are shared between dependents, making it more optimized to use in multiple places at once.

```ts
const scroll = useWindowScrollPosition();

createEffect(() => {
  console.log(
    scroll.x, // => number
    scroll.y, //  => number
  );
});
```

## Additional helpers

### `getScrollPosition`

Get an `{ x: number, y: number }` object of element/window scroll position.

## Primitive ideas:

_PRs Welcome :)_

- `createScrollTo` - A primitive to support scroll to a target
- `createHashScroll` - A primitive to support scrolling based on a hashtag change

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
