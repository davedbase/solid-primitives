<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Event%20Listener" alt="Solid Primitives Event Listener">
</p>

# @solid-primitives/event-listener

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/event-listener?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/event-listener)
[![size](https://img.shields.io/npm/v/@solid-primitives/event-listener?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/event-listener)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A set of primitives that help with listening to DOM and Custom Events.

##### Non-reactive primitives:

- [`makeEventListener`](#makeeventlistener) — Non-reactive primitive for adding event listeners that gets removed onCleanup.
- [`makeEventListenerStack`](#makeeventlistenerstack) — Creates a stack of event listeners, that will be automatically disposed on cleanup.

##### Reactive primitives:

- [`createEventListener`](#createeventlistener) — Reactive version of [`makeEventListener`](#makeeventlistener), that takes signal arguments to apply new listeners once changed.
- [`createEventSignal`](#createeventlistener) — Like [`createEventListener`](#createeventlistener), but captured events are stored in a returned signal.
- [`createEventListenerMap`](#createeventlistenermap) — A helpful primitive that listens to a map of events. Handle them by individual callbacks.

##### Component global listeners:

- [`WindowEventListener`](#windoweventlistener) — Listen to the `window` DOM Events, using a component.
- [`DocumentEventListener`](#documenteventlistener) — Listen to the `document` DOM Events, using a component.

##### Callback Wrappers

- [`preventDefault`](#preventdefault) — Wraps event handler with `e.preventDefault()` call.
- [`stopPropagation`](#stoppropagation) — Wraps event handler with `e.stopPropagation()` call.
- [`stopImmediatePropagation`](#stopimmediatepropagation) — Wraps event handler with `e.stopImmediatePropagation()` call.

## Installation

```bash
npm install @solid-primitives/event-listener
# or
yarn add @solid-primitives/event-listener
```

## `makeEventListener`

###### Added id `@2.0.0`

Can be used to listen to DOM or Custom Events on window, document, or any EventTarget.

Event listener is automatically removed on root cleanup. The clear() function is also returned for calling it early.

### How to use it

```tsx
import { makeEventListener } from "@solid-primitives/event-listener";

const clear = makeEventListener(
  document.getElementById("myButton"),
  "mousemove",
  e => console.log("x:", e.pageX, "y:", e.pageY),
  { passive: true }
);

// to clear all of the event listeners
clear();

// when listening to element refs, call it inside onMount
let ref!: HTMLDivElement
onMount(() => {
  makeEventListener(ref, "click", e => {...}, { passive: true });
});

<div ref={ref} />;
```

#### Custom events

```ts
// you can provide your own event map type as well:
// fill both type generics for the best type support
makeEventListener<{ myCustomEvent: MyEvent; other: Event }, "myCustomEvent">(
  window,
  "myCustomEvent",
  () => console.log("yup!"),
);
// just don't use interfaces as EventMaps! (write them using `type` keyword)
```

## `makeEventListenerStack`

###### Added id `@2.0.0`

Creates a stack of event listeners, that will be automatically disposed on cleanup.

### How to use it

```ts
import { makeEventListenerStack } from "@solid-primitives/event-listener";

const [listen, clear] = makeEventListenerStack(target, { passive: true });

listen("mousemove", handleMouse);
listen("dragover", handleMouse);

// remove listener (will also happen on cleanup)
clear();
```

## `createEventListener`

Reactive version of [`makeEventListener`](#makeeventlistener), that can take signal `target` and `type` arguments to apply new listeners once changed.

### How to use it

```tsx
import { createEventListener } from "@solid-primitives/event-listener";

// target element and event name can be reactive signals
const [ref, setRef] = createSignal<HTMLElement>();
const [type, setType] = createSignal("mousemove");
createEventListener(ref, type, e => {...});

// when using ref as a target, pass it in a function – function will be executed after mount
// or wrap the whole primitive in onMount
let ref;
createEventListener(() => ref, "mousemove", e => {});
<div ref={ref} />;

// it can also be used with any HTML Element if you can get a reference to it
createEventListener(
  document.getElementById("myButton"),
  "mousemove",
  e => console.log("x:", e.pageX, "y:", e.pageY),
  { passive: true }
);
```

#### Custom events

```ts
// you can provide your own event map type as well:
// fill both type generics for the best type support
createEventListener<{ myCustomEvent: MyEvent; other: Event }, "myCustomEvent">(
  window,
  "myCustomEvent",
  () => console.log("yup!"),
);
// just don't use interfaces as EventMaps! (write them using `type` keyword)
```

#### Removing event listeners manually

Since version `@2.0.0` `createEventListener` and other reactive primitives aren't returning a `clear()` function, because of it's flawed behavior [described in this issue](https://github.com/solidjs-community/solid-primitives/issues/103).

Although there are still ways to remove attached event listeners:

1. Changing reactive `target` or `type` arguments to an empty array.

```ts
const [type, setType] = createSignal<"click" | []>("click");
createEventListener(window, type, e => {...});
// remove listener:
setType([]);
```

2. Wrapping usage of `createEventListener` primitive in Solid's `createRoot` or `createBranch` | `createDisposable` from ["@solid-primitives/rootless"](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createDisposable).

```ts
import { createDisposable } from "@solid-primitives/rootless";

const clear = createDisposable(() => createEventListener(element, "click", e => {...}));
// remove listener:
clear();
```

#### Listening to multiple events

###### Added in `@1.4.3`

You can listen to multiple events with single `createEventListener` primitive.

```ts
createEventListener(el, ["mousemove", "mouseenter", "mouseleave"], e => {});
```

### Directive Usage

props passed to the directive are also reactive, so you can change handlers on the fly.

```tsx
import { eventListener } from "@solid-primitives/event-listener";
// avoids tree-shaking the directive:
eventListener;

<button use:eventListener={["click", () => console.log("Click")]}>Click!</button>;
```

## `createEventSignal`

Like [`createEventListener`](#createeventlistener), but events are handled with the returned signal, instead of with a callback.

### How to use it

```ts
import { createEventSignal } from "@solid-primitives/event-listener";

// all arguments can be reactive signals
const lastEvent = createEventSignal(el, "mousemove", { passive: true });

createEffect(() => {
  console.log(lastEvent()?.x, lastEvent()?.y);
});
```

## `createEventListenerMap`

A helpful primitive that listens to a map of events. Handle them by individual callbacks.

### How to use it

```ts
import { createEventListenerMap } from "@solid-primitives/event-listener";

createEventListenerMap(element, {
  mousemove: mouseHandler,
  mouseenter: e => {},
  touchend: touchHandler,
});

// both target can be reactive:
const [target, setTarget] = createSignal(document.getElementById("abc"));
createEventListenerMap(
  target,
  {
    mousemove: e => {},
    touchstart: e => {},
  },
  { passive: true },
);

// createEventListenerMap can be used to listen to custom events
// fill both type generics for the best type support
createEventListenerMap<{
  myEvent: MyEvent;
  custom: Event;
  other: Event;
}>(target, {
  myEvent: e => {},
  custom: e => {},
});
```

## `WindowEventListener`

Listen to the `window` DOM Events, using a component.

You can use it with any Solid's Control-Flow components, e.g. `<Show/>` or `<Switch/>`.

The event handler prop is reactive, so you can use it with signals.

### How to use it

```tsx
import { WindowEventListener } from "@solid-primitives/event-listener";

<WindowEventListener onMouseMove={e => console.log(e.x, e.y)} />;
```

## `DocumentEventListener`

The same as [`WindowEventListener`](#windoweventlistener), but listens to `document` events.

### How to use it

```tsx
import { DocumentEventListener } from "@solid-primitives/event-listener";

<DocumentEventListener onMouseMove={e => console.log(e.x, e.y)} />;
```

## Callback Wrappers

### `preventDefault`

Wraps event handler with `e.preventDefault()` call.

```tsx
import { preventDefault, makeEventListener } from "@solid-primitives/event-listener";

const handleClick = e => {
  concole.log("Click!", e);
};

makeEventListener(window, "click", preventDefault(handleClick), true);
// or in jsx:
<div onClick={preventDefault(handleClick)} />;
```

### `stopPropagation`

Wraps event handler with `e.stopPropagation()` call.

```tsx
import { stopPropagation, makeEventListener } from "@solid-primitives/event-listener";

const handleClick = e => {
  concole.log("Click!", e);
};

makeEventListener(window, "click", stopPropagation(handleClick), true);
// or in jsx:
<div onClick={stopPropagation(handleClick)} />;
```

### `stopImmediatePropagation`

Wraps event handler with `e.stopImmediatePropagation()` call.

```tsx
import { stopImmediatePropagation, makeEventListener } from "@solid-primitives/event-listener";

const handleClick = e => {
  concole.log("Click!", e);
};

makeEventListener(window, "click", stopImmediatePropagation(handleClick), true);
// or in jsx:
<div onClick={stopImmediatePropagation(handleClick)} />;
```

## Demo

You may view a working example here: https://codesandbox.io/s/solid-primitives-event-listener-elti5

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
