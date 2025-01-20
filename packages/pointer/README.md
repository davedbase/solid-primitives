<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Pointer" alt="Solid Primitives Pointer">
</p>

# @solid-primitives/pointer

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/pointer?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/pointer)
[![version](https://img.shields.io/npm/v/@solid-primitives/pointer?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/pointer)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A collection of primitives, giving you a nicer API to handle pointer events in a reactive context.

- [`createPointerListeners`](#createpointerlisteners) - Setups event listeners for pointer events, that will get automatically removed on cleanup,
- [`createPerPointerListeners`](#createperpointerlisteners) - Setup pointer event listeners, while following the pointers individually, from when they appear, until they're gone,
- [`createPointerPosition`](#createpointerposition) - Returns a signal with autoupdating Pointer position,
- [`createPointerList`](#createpointerlist) - Provides a signal of current pointers on screen
- [`pointerHover`](#pointerhover) - A directive for checking if the element is being hovered by at least one pointer.

## Installation

```bash
npm install @solid-primitives/pointer
# or
yarn add @solid-primitives/pointer
```

## `createPointerListeners`

Setups event listeners for pointer events, that will get automatically removed on cleanup

### Import

```ts
import { createPointerListeners } from "@solid-primitives/pointer";
```

### How to use it

Primitive takes one `config` argument, of options:

- `target` - specify the target to attach the listeners to. Will default to `document.body`
- `pointerTypes` - specify array of pointer types you want to listen to. By default listens to `["mouse", "touch", "pen"]`
- `passive` - Add passive option to event listeners. Defaults to `true`.
- your event handlers: e.g. `onenter`, `onLeave`, `onMove`, ...

```ts
createPointerListeners({
  // pass a function if the element is yet to mount
  target: () => el,
  pointerTypes: ["touch"],
  // both lowerace or capitalized kays work
  onEnter: e => console.log("enter", e.x, e.y),
  onmove: e => console.log({ x: e.x, y: e.y }),
  onup: e => console.log("pointer up", e.x, e.y),
  onLostCapture: e => console.log("lost"),
});
```

## `createPerPointerListeners`

Setup pointer event listeners, while following the pointers individually, from when they appear, until they're gone.

### Import

```ts
import { createPerPointerListeners } from "@solid-primitives/pointer";
```

### How to use it

Primitive takes one `config` argument, of options:

- `target` - specify the target to attach the listeners to. Will default to `document.body`
- `pointerTypes` - specify array of pointer types you want to listen to. By default listens to `["mouse", "touch", "pen"]`
- `passive` - Add passive option to event listeners. Defaults to `true`.
- `onDown` - Start following a pointer from when it's down.
- `onEnter` - Start following a pointer from when it enters the screen.

#### onDown

`onDown` starts when pointer is down, and _ends_ when **that pointer** is up. You can create `move` and `up` listeners when the `onStart` runs, to listen to later events of that pointer.

```ts
createPerPointerListeners({
  target: el,
  pointerTypes: ['touch', 'pen'],
  onDown({ x, y, pointerId }, onMove, onUp) {
    console.log(x, y, pointerId);
    onMove(e => {...});
    onUp(e => {...});
  }
})
```

#### onEnter

`onEnter` fires when pointer appears on the screen, and _ends_ then **that pointer** leaves the screen. You can listen to `"down" | "move" | "up" | "leave" | "cancel"` events of that pointer.

```ts
createPerPointerListeners({
  onEnter({ x, y, pointerId }, { onMove, onLeave, onDown }) {
    console.log("New pointer:", pointerId);
    onDown(e => {...});
    onMove(e => {...});
    onLeave(e => {...});
  }
});
```

### DEMO

https://codesandbox.io/s/solid-primitives-pointer-demo-zryr5h?file=/app.tsx

## `createPointerPosition`

Returns a signal with autoupdating Pointer position.

### Import

```ts
import { createPointerPosition } from "@solid-primitives/pointer";
```

### How to use it

Primitive takes one `config` argument, of options:

- `target` - specify the target to attach the listeners to. Will default to `document.body`
- `pointerTypes` - specify array of pointer types you want to listen to. By default listens to `["mouse", "touch", "pen"]`
- `value` - set the initial value of the returned signal _(before the first event)_

```ts
const position = createPointerPosition({
  target: document.querySelector("my-el"),
  pointerTypes: ["touch"],
});

createEffect(() => {
  console.log("position", position().x, position().y);
  console.log("hovering", position().isActive);
});
```

### As a directive

```tsx
import { pointerPosition } from "@solid-primitives/pointer";
// place this in code to avoid being tree-shaken
pointerPosition;

const [pos, setPos] = createSignal({ x: 0, y: 0 });
const [hovering, setHovering] = createSignal(false);

<div
  use:pointerPosition={e => {
    setPos({ x: e.x, y: e.y });
    setHovering(e.isActive);
  }}
/>;
```

## `createPointerList`

Provides a signal of current pointers on screen.

### Import

```ts
import { createPointerList } from "@solid-primitives/pointer";
```

### How to use it

Primitive takes one `config` argument, of options:

- `target` - specify the target to attach the listeners to. Will default to `document.body`
- `pointerTypes` - specify array of pointer types you want to listen to. By default listens to `["mouse", "touch", "pen"]`

Returns a list of pointers on the screen:

```ts
Accessor<Accessor<PointerListItem>[]>;
```

Basic example:

```tsx
const points = createPointerList();

// notice that points is an signal returning an array of signals
<For each={points()}>{poz => <div>{poz()}</div>}</For>;
```

## `pointerHover`

A directive for checking if the element is being hovered by at least one pointer.

### How to use it

```ts
import { pointerHover } from "@solid-primitives/pointer";
// place this in code to avoid being tree-shaken
pointerHover;

const [hovering, setHovering] = createSignal(false);

<div use:pointerHover={setHovering} />;
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
