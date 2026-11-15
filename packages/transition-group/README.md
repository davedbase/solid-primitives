<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=transition" alt="Solid Primitives transition">
</p>

# @solid-primitives/transition-group

[![size](https://img.shields.io/badge/size-1.25_kB-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/transition-group)
[![version](https://img.shields.io/npm/v/@solid-primitives/transition-group?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/transition-group)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Provides reactive primitives for implementing transition effects on a group of elements, or your own `<Transition>` and `<TransitionGroup>` components.

- [`createSwitchTransition`](#createswitchtransition) - Create an element transition interface for switching between single elements.
- [`createListTransition`](#createlisttransition) - Create an element list transition interface for changes to the list of elements.

## Installation

```bash
npm install @solid-primitives/transition-group
# or
yarn add @solid-primitives/transition-group
# or
pnpm add @solid-primitives/transition-group
```

## `createSwitchTransition`

Create an element transition interface for switching between single elements.
It can be used to implement own transition effect, or a custom `<Transition>`-like component.

```tsx repl
import { render } from "@solidjs/web";
import { createMemo, createSignal } from "solid-js";
import { createSwitchTransition } from "@solid-primitives/transition-group";

function Demo() {
  const [count, setCount] = createSignal(1);
  // a fresh element per value, so the transition sees a new source
  const current = createMemo(() => {
    const n = count();
    return (<p>Element {n}</p>) as HTMLElement;
  });
  const rendered = createSwitchTransition(current, {
    mode: "out-in",
    onEnter(el, done) {
      queueMicrotask(() => el.animate([{ opacity: 0 }, { opacity: 1 }], 300).finished.then(done));
    },
    onExit(el, done) {
      el.animate([{ opacity: 1 }, { opacity: 0 }], 300).finished.then(done);
    },
  });
  return (
    <>
      <button onClick={() => setCount(n => n + 1)}>Next</button>
      {rendered()}
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### How to use it

It will observe the source and return a signal with array of elements to be rendered (current one and exiting ones).

`createSwitchTransition` takes two parameters:

- `source` a signal with the current element. Any nullish value will mean there is no element.
  Any object can used as the source, but most likely you will want to use a `HTMLElement` or `SVGElement`.

- `options` transition options:

  - `onEnter` - a function to be called when a new element is entering. It receives the element and a callback to be called when the transition is done.

  - `onExit` - a function to be called when an exiting element is leaving. It receives the element and a callback to be called when the transition is done.

  - `mode` - transition mode. Defaults to `"parallel"`. Other options are `"out-in"` and `"in-out"`.

  - `appear` - whether to run the transition on the initial element. Defaults to `false`.

    If enabled, the initial element will still be included in the initial render (for SSR), but the transition fill happen when the first client-side effect is run. So to avoid the initial element to be visible, you can set the initial element's style to `display: none` and set it to `display: block` in the `onEnter` callback.

Returns a signal with an array of the current element and exiting previous elements.

```ts
import { createSwitchTransition } from "@solid-primitives/transition-group";

const [el, setEl] = createSignal<HTMLDivElement>();

const rendered = createSwitchTransition(el, {
  onEnter(el, done) {
    // the enter callback is called before the element is inserted into the DOM
    // so run the animation in the next animation frame / microtask
    queueMicrotask(() => {
      /*...*/
    });
  },
  onExit(el, done) {
    // the exitting element is kept in the DOM until the done() callback is called
  },
});

// change the source to trigger the transition
setEl(refToHtmlElement);
```

### Resolving JSX

Usually the source will be a JSX element, and you will want to resolve it to a DOM element before passing it to `createSwitchTransition`. It leaves the resolving to you, so you can do it in any way you want.

For example, you can `children` helper from `solid-js`, to get the first found HTML element.

```ts
import { children } from "solid-js";
import { createSwitchTransition } from "@solid-primitives/transition-group";

const resolved = children(() => props.children);
const filtered = createMemo(() => resolved.toArray().find(el => el instanceof HTMLElement));
return createSwitchTransition(filtered, {/*...*/});
```

Or use a `resolveFirst` helper from `@solid-primitives/refs`

```ts
import { resolveFirst } from "@solid-primitives/refs";
import { createSwitchTransition } from "@solid-primitives/transition-group";

const resolved = resolveFirst(() => props.children);
return createSwitchTransition(resolved, {/*...*/});
```

## `createListTransition`

Create an element list transition interface for changes to the list of elements.
It can be used to implement own transition effect, or a custom `<TransitionGroup>`-like component.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createListTransition } from "@solid-primitives/transition-group";

function Demo() {
  let nextId = 4;
  const [items, setItems] = createSignal([1, 2, 3]);
  const remove = (id: number) => setItems(list => list.filter(i => i !== id));
  // cache one element per item so unchanged items keep their identity
  const cache = new Map<number, HTMLElement>();
  const getEl = (id: number) => {
    const el = cache.get(id) ?? ((<li onClick={() => remove(id)}>Item {id}</li>) as HTMLElement);
    cache.set(id, el);
    return el;
  };
  const rendered = createListTransition(() => items().map(getEl), {
    onChange({ added, removed, finishRemoved }) {
      queueMicrotask(() => added.forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], 300)));
      if (!removed.length) return;
      const exits = removed.map(el => el.animate([{ opacity: 1 }, { opacity: 0 }], 300).finished);
      Promise.all(exits).then(() => finishRemoved(removed));
    },
  });
  return (
    <>
      <button onClick={() => setItems(list => [...list, nextId++])}>Add item</button>
      <p>Click an item to remove it.</p>
      <ul>{rendered()}</ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### How to use it

It will observe the source and return a signal with array of elements to be rendered (current ones and exiting ones).

`createListTransition` takes two parameters:

- `source` a signal with the current list of elements.
  Any object can used as the element, but most likely you will want to use a `HTMLElement` or `SVGElement`.

- `options` transition options:

  - `onChange` - a function to be called when the list changes. It receives the list of added elements, removed elements, and moved elements. It also receives a callback to be called when the removed elements are finished animating (they can be removed from the DOM).

  - `appear` - whether to run the transition on the initial elements. Defaults to `false`.

  If enabled, the initial elements will still be included in the initial render (for SSR), but the transition fill happen when the first client-side effect is run. So to avoid the initial elements to be visible, you can set the initial element's style to `display: none` and set it to `display: block` in the `onChange` callback.

  - `exitMethod` - This controls how the elements exit.

    - `"remove"` removes the element immediately.
    - `"move-to-end"` (default) will move elements which have exited to the end of the array.
    - `"keep-index"` will splice them in at their previous index.

Returns a signal with an array of the current elements and exiting previous elements.

```ts
import { createListTransition } from "@solid-primitives/transition-group";

const [els, setEls] = createSignal<HTMLElement[]>([]);

const rendered = createListTransition(els, {
  onChange({ list, added, removed, unchanged, finishRemoved }) {
    // the callback is called before the added elements are inserted into the DOM
    // so run the animation in the next animation frame / microtask
    queueMicrotask(() => {
      /*...*/
    });

    // the removed elements are kept in the DOM until the finishRemoved() callback is called
    finishRemoved(removed);
  },
});

// change the source to trigger the transition
setEls([...refsToHTMLElements]);
```

### Resolving JSX

Usually the source will be a JSX Element, and you will want to resolve it to a list of DOM elements before passing it to `createListTransition`. It leaves the resolving to you, so you can do it in any way you want.

For example, you can `children` helper from `solid-js`, and filter out non-HTML elements:

```ts
import { children } from "solid-js";
import { createListTransition } from "@solid-primitives/transition-group";

const resolved = children(() => props.children);
const filtered = createMemo(() => resolved.toArray().filter(el => el instanceof HTMLElement));
return createListTransition(filtered, {/*...*/});
```

Or use a `resolveElements` helper from `@solid-primitives/refs`

```ts
import { resolveElements } from "@solid-primitives/refs";
import { createSwitchTransition } from "@solid-primitives/transition-group";

const resolved = resolveElements(() => props.children);
return createListTransition(resolved.toArray, {/*...*/});
```

## Usage references

Packages that use `@solid-primitives/transition-group`:

- [`solid-transition-group`](https://github.com/solidjs-community/solid-transition-group/tree/main/src)
- [`motionone/solid`](https://github.com/motiondivision/motionone/tree/main/packages/solid/src)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
