<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=bounds" alt="Solid Primitives Bounds">
</p>

# @solid-primitives/bounds

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/bounds?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/bounds)
[![version](https://img.shields.io/npm/v/@solid-primitives/bounds?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/bounds)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-1.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for tracking HTML element size and position on screen as it changes.

- [`createElementBounds`](#createelementbounds) - Creates a reactive store-like object of current element bounds — position on the screen, and size dimensions.

## Installation

```bash
npm install @solid-primitives/bounds
# or
yarn add @solid-primitives/bounds
```

## `createElementBounds`

Creates a reactive store-like object of current element bounds — position on the screen, and size dimensions. Bounds will be automatically updated on scroll, resize events and updates to the DOM.

```ts
import { createElementBounds } from "@solid-primitives/bounds";

const target = document.querySelector("#my_elem")!;
const bounds = createElementBounds(target);

createEffect(() => {
  console.log(
    bounds.width, // => number
    bounds.height, // => number
    bounds.top, // => number
    bounds.left, // => number
    bounds.right, // => number
    bounds.bottom, // => number
  );
});
```

### Reactive target

The element target can be a reactive signal. Set to falsy value to disable tracking.

```tsx
const [target, setTarget] = createSignal<HTMLElement>();

const bounds = createElementBounds(target);

// if target is undefined, scroll values will be null
createEffect(() => {
  bounds.width; // => number | null
  bounds.height; // => number | null
});

// bounds object will always be in sync with current target
<div ref={setTarget} />;
```

### Disabling types of tracking

These types of tracking are available: _(all are enabled by default)_

- `trackScroll` — listen to window scroll events
- `trackMutation` — listen to changes to the dom structure/styles
- `trackResize` — listen to element's resize events

```ts
// won't track mutations nor scroll events
const bounds = createElementBounds(target, {
  trackScroll: false,
  trackMutation: false,
});
```

### Throttling updates

Options [above](#disabling-types-of-tracking) allow passing a guarding function for controlling frequency of updates.

The scroll event/mutations/resizing can be triggered dozens of times per second, causing calculating bounds and updating the store every time. Hence it is a good idea to [throttle/debounce](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled#readme) updates.

```ts
import { UpdateGuard, createElementBounds } from "@solid-primitives/bounds";
import { throttle } from "@solid-primitives/scheduled";

const throttleUpdate: UpdateGuard = fn => throttle(fn, 500);

const bounds = createElementBounds(target, {
  trackMutation: throttleUpdate,
  trackScroll: throttleUpdate,
});
```

## Demo

https://codesandbox.io/s/solid-primitives-bounds-64rls0?file=/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
