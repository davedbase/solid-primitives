<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Intersection%20Observer" alt="Solid Primitives Intersection Observer">
</p>

# @solid-primitives/intersection-observer

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/intersection-observer?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/intersection-observer)
[![size](https://img.shields.io/npm/v/@solid-primitives/intersection-observer?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/intersection-observer)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A range of IntersectionObserver API utilities great for different types of use cases:

- [`createIntersectionObserver`](#createintersectionobserver) - A reactive observer primitive.
- [`createViewportObserver`](#createviewportobserver) - More advanced tracker that creates a store of element signals.
- [`createVisibilityObserver`](#createvisibilityobserver) - Basic visibility observer using a signal.

## Installation

```bash
npm install @solid-primitives/intersection-observer
# or
pnpm add @solid-primitives/intersection-observer
# or
yarn add @solid-primitives/intersection-observer
```

## `createIntersectionObserver`

```tsx
import { createIntersectionObserver } from "@solid-primitives/intersection-observer";

const [targets, setTargets] = createSignal<Element[]>([some_element]);

createIntersectionObserver(els, entries => {
  entries.forEach(e => console.log(e.isIntersecting));
});

<div ref={el => setTargets(p => [...p, el])} />;
```

### Definition

```ts
function createIntersectionObserver(
  elements: Accessor<Element[]>,
  onChange: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
): void;
```

## `createViewportObserver`

This primitive comes with a number of flexible options. You can specify a callback at the root with an array of elements or individual callbacks for individual elements.

```tsx
import { createViewportObserver } from '@solid-primitives/intersection-observer';

// Basic usage:
const [add, { remove, start, stop, instance }] = createViewportObserver(els, e => {...});
add(el, e => console.log(e.isIntersecting))

// Directive usage:
const [intersectionObserver] = createViewportObserver()
<div use:intersectionObserver={(e) => console.log(e.isIntersecting)}></div>
```

### Definition

```ts
function createViewportObserver(
  elements: MaybeAccessor<Element[]>,
  callback: EntryCallback,
  options?: IntersectionObserverInit,
): CreateViewportObserverReturnValue;
function createViewportObserver(
  initial: MaybeAccessor<[Element, EntryCallback][]>,
  options?: IntersectionObserverInit,
): CreateViewportObserverReturnValue;
function createViewportObserver(
  options?: IntersectionObserverInit,
): CreateViewportObserverReturnValue;
```

## `createVisibilityObserver`

Creates reactive signal that changes when a single element's visibility changes.

### How to use it

`createVisibilityObserver` takes a `IntersectionObserverInit` object as the first argument. Use it to set thresholds, margins, and other options.

- `root` — The Element or Document whose bounds are used as the bounding box when testing for intersection.
- `rootMargin` — A string which specifies a set of offsets to add to the root's bounding_box when calculating intersections, effectively shrinking or growing the root for calculation purposes.
- `threshold` — Either a single number or an array of numbers between 0.0 and 1.0, specifying a ratio of intersection area to total bounding box area for the observed target.
- `initialValue` — Initial value of the signal _(default: false)_

It returns a configured _"use"_ function for creating a visibility signal for a single element. The passed element can be a **reactive signal** or a DOM element. Returning a falsy value will remove the element from the observer.

```tsx
import { createVisibilityObserver } from "@solid-primitives/intersection-observer";

let el: HTMLDivElement | undefined;

const useVisibilityObserver = createVisibilityObserver({ threshold: 0.8 });

// make sure that you pass the element reference in a thunk if it is undefined initially
const visible = useVisibilityObserver(() => el);

<div ref={el}>{visible() ? "Visible" : "Hidden"}</div>;
```

You can use this shorthand when creating a visibility signal for a single element:

```tsx
let el: HTMLDivElement | undefined;

const visible = createVisibilityObserver({ threshold: 0.8 })(() => el);

<div ref={el}>{visible() ? "Visible" : "Hidden"}</div>;
```

### Setter callback

`createVisibilityObserver` takes a setter callback as the second argument. It is called when the element's intersection changes. The callback should return a boolean value indicating whether the element is visible — it'll be assigned to the signal.

```ts
const useVisibilityObserver = createVisibilityObserver({ threshold: 0.8 }, entry => {
  // do some calculations on the intersection entry
  return entry.isIntersecting;
});
```

**Exported modifiers**

#### `withOccurrence`

It provides information about element occurrence in the viewport — `"Entering"`, `"Leaving"`, `"Inside"` or `"Outside"`.

```tsx
import { createVisibilityObserver, withOccurrence } from "@solid-primitives/intersection-observer";

const useVisibilityObserver = createVisibilityObserver(
  { threshold: 0.8 },
  withOccurrence((entry, { occurrence }) => {
    console.log(occurrence); // => "Entering" | "Leaving" | "Inside" | "Outside"
    return entry.isIntersecting;
  }),
);
```

#### `withDirection`

It provides information about element direction on the screen — `"Left"`, `"Right"`, `"Top"`, `"Bottom"` or `"None"`.

```ts
import { createVisibilityObserver, withDirection } from "@solid-primitives/intersection-observer";

const useVisibilityObserver = createVisibilityObserver(
  { threshold: 0.8 },
  withDirection((entry, { directionY, directionX, visible }) => {
    if (!entry.isIntersecting && directionY === "Top" && visible) {
      return true;
    }
    return entry.isIntersecting;
  }),
);
```

### Definition

```ts
function createViewportObserver(
  elements: MaybeAccessor<Element[]>,
  callback: EntryCallback,
  options?: IntersectionObserverInit,
): CreateViewportObserverReturnValue;
```

## Demo

[a working example](https://primitives.solidjs.community/playground/intersection-observer/) ([source](https://github.com/solidjs-community/solid-primitives/tree/main/packages/intersection-observer/dev))

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
