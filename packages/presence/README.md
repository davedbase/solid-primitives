<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=presence" alt="Solid Primitives presence">
</p>

# @solid-primitives/presence

[![size](https://img.shields.io/badge/size-863_B-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/presence)
[![version](https://img.shields.io/npm/v/@solid-primitives/presence?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/presence)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

A small SolidJS utility to animate the presence of an element. Inspired by & directly forked from [`use-presence`](https://www.npmjs.com/package/use-presence).

### The problem

There are two problems that you have to solve when animating the presence of an element:

1. During enter animations, you have to render an initial state where the element is hidden and only after the latest state has propagated to the DOM, you can can animate the final state that the element should animate towards.
2. Exit animations are a bit tricky in SolidJS, since this typically means that a component unmounts. However when the component has already unmounted, you can't animate it anymore. A workaround is often to keep the element mounted, but that keeps unnecessary elements around and can hurt accessibility, as hidden interactive elements might still be focusable.

### This solution

This utility provides a lightweight solution where the animating element is only mounted the minimum of time, while making sure the animation is fully visible to the user. The rendering is left to the user to support all kinds of styling solutions.

## Installation

```bash
npm install @solid-primitives/presence
# or
yarn add @solid-primitives/presence
# or
pnpm add @solid-primitives/presence
```

## How to use it

### `createPresence` boolean example

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, Show } from "solid-js";
import { createPresence } from "@solid-primitives/presence";

function Demo() {
  const [show, setShow] = createSignal(true);
  const { isMounted, isVisible, isExiting } = createPresence(show, { transitionDuration: 500 });
  return (
    <>
      <button onClick={() => setShow(v => !v)}>{show() ? "Hide" : "Show"}</button>
      <p>
        mounted: {String(isMounted())}, exiting: {String(isExiting())}
      </p>
      <Show when={isMounted()}>
        <div
          style={{
            transition: "all 500ms ease",
            opacity: isVisible() ? "1" : "0",
            transform: isVisible() ? "translateY(0)" : "translateY(-12px)",
          }}
        >
          I animate in and out!
        </div>
      </Show>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
const FirstExample = () => {
  const [showStuff, setShowStuff] = createSignal(true);
  const { isVisible, isMounted } = createPresence(showStuff, {
    transitionDuration: 500,
  });

  return (
    <div
      style={{
        padding: "2em",
        margin: "2em",
        "border-radius": "2em",
        "box-shadow": "-5px 0px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      <button onclick={() => setShowStuff(!showStuff())}>{`${
        showStuff() ? "Hide" : "Show"
      } stuff`}</button>
      <Show when={isMounted()}>
        <div
          style={{
            transition: "all .5s ease",
            opacity: isVisible() ? "1" : "0",
            transform: isVisible() ? "translateX(0)" : "translateX(50px)",
          }}
        >
          I am the stuff!
        </div>
      </Show>
    </div>
  );
};
```

### `createPresence` switching example

The first argument of `createPresence` is a signal accessor of arbitrary type. This allows you to use it with any kind of data, not just booleans. This is useful if you want to animate between different items. If you utilize the returned `mountedItem` property, you can get the data which should be currently mounted regardless of the animation state

```tsx
const SecondExample = () => {
  const items = ["foo", "bar", "baz", "qux"];
  const [activeItem, setActiveItem] = createSignal(items[0]);
  const presence = createPresence(activeItem, {
    transitionDuration: 500,
  });

  return (
    <div
      style={{
        padding: "2em",
        margin: "2em",
        "border-radius": "2em",
        "box-shadow": "-5px 0px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      <For each={items}>
        {item => (
          <button onClick={() => setActiveItem(p => (p === item ? undefined : item))}>
            {item}
          </button>
        )}
      </For>
      <Show when={presence.isMounted()}>
        <div
          style={{
            transition: "all .5s linear",
            ...(presence.isEntering() && {
              opacity: "0",
              transform: "translateX(-25px)",
            }),
            ...(presence.isExiting() && {
              opacity: "0",
              transform: "translateX(25px)",
            }),
            ...(presence.isVisible() && {
              opacity: "1",
              transform: "translateX(0)",
            }),
          }}
        >
          {presence.mountedItem()}
        </div>
      </Show>
    </div>
  );
};
```

### `createPresence` with a store

`createPresence`'s first argument must be an `Accessor` — a function. Reading a store property directly (`store.panelOpen`) passes its current value once and won't update reactively; wrap the access in a function (`() => store.panelOpen`) so `createPresence` can subscribe to changes:

```tsx
const ThirdExample = () => {
  const [store, setStore] = createStore({ panelOpen: true });

  // ✅ wrapped in an accessor
  const { isVisible, isMounted } = createPresence(() => store.panelOpen, {
    transitionDuration: 500,
  });

  // ❌ createPresence(store.panelOpen, { transitionDuration: 500 })
  //    — this is a boolean, not an Accessor<boolean>, and won't type-check

  return (
    <div>
      <button onclick={() => setStore("panelOpen", open => !open)}>
        {store.panelOpen ? "Hide" : "Show"} panel
      </button>
      <Show when={isMounted()}>
        <div
          style={{
            transition: "all .5s ease",
            opacity: isVisible() ? "1" : "0",
          }}
        >
          I am the panel!
        </div>
      </Show>
    </div>
  );
};
```

### Ending transitions on `transitionend` / `animationend`

By default a transition is considered over once its duration has passed. If the duration lives in CSS, or the animation is driven by JavaScript, you can end the current enter or exit transition yourself with `done`. Hand it to the element's `onTransitionEnd` / `onAnimationEnd`, or call it when your animation finishes. The duration then only acts as a fallback timeout, in case the event never fires (for example when the transition is cancelled or `prefers-reduced-motion` turns it off).

```tsx
// Type
type PresenceResult<TItem> = {
  // ...
  done: (event?: Event) => void;
  bindDone: () => (event?: Event) => void;
};

// Example
const Panel = () => {
  const [open, setOpen] = createSignal(false);
  const presence = createPresence(open, {
    // fallback in case no transitionend event arrives
    transitionDuration: 1000,
  });

  return (
    <>
      <button onClick={() => setOpen(o => !o)}>Toggle</button>
      <Show when={presence.isMounted()}>
        <div
          class={{ panel: true, visible: presence.isVisible() }}
          onTransitionEnd={presence.done}
          onAnimationEnd={presence.done}
        >
          The transition is over as soon as the element's own transition is.
        </div>
      </Show>
    </>
  );
};
```

- When given an event, `done` ignores it unless it was fired by the element the handler is attached to, so transitions of descendants bubbling up don't end the transition early.
- `transitionend` fires once per transitioned property. If several properties transition with different durations, filter for the longest one: `onTransitionEnd={e => e.propertyName === "transform" && presence.done(e)}`.
- Calling `done` while no transition is running does nothing.
- `done` ends whichever transition is running when it is called. A late call, for example from a JS animation that was started for an earlier transition, ends the newer one. The element's own `transitionend` / `animationend` belong to the running transition, so handing `done` to them is safe.
- When the item is swapped, `done` ends the exit of the old item, after which the new item mounts and enters as usual.
- Call it from event handlers or other callbacks, not from inside a component body, memo or effect.

#### Completion callbacks of JavaScript animations

A JavaScript animation can finish after the transition it was started for has been superseded (the item changed back, or changed again). Use `bindDone()` to get a `done` bound to the transition that is running now: once the item has changed again, calling it does nothing, so a late callback cannot end a newer transition.

```tsx
const FadingPanel = (props: { open: boolean }) => {
  let el!: HTMLDivElement;
  // the duration is the fallback in case the animation never finishes
  const presence = createPresence(() => props.open, { transitionDuration: 1000 });

  createEffect(
    () => presence.isExiting(),
    exiting => {
      if (!exiting) return;
      const finish = presence.bindDone();
      const animation = el.animate([{ opacity: 1 }, { opacity: 0 }], 300);
      animation.finished.then(
        () => finish(),
        () => {},
      );
      return () => animation.cancel();
    },
  );

  return (
    <Show when={presence.isMounted()}>
      <div ref={el}>Fades out with the Web Animations API.</div>
    </Show>
  );
};
```

`bindDone()` binds to the state as of the last flush, so call it once the transition has started (as above, in an effect on `isEntering()` / `isExiting()`). Called right after changing the item, before that change is flushed, it binds to the previous transition and its callback is ignored; the duration then still ends the transition.

### `createPresence` options API

```ts
function createPresence<TItem>(
  item: Accessor<TItem | undefined>,
  options: Options,
): PresenceResult<TItem>;

type Options = {
  /** Duration in milliseconds used both for enter and exit transitions. */
  transitionDuration: MaybeAccessor<number>;
  /** Duration in milliseconds used for enter transitions (overrides `transitionDuration` if provided). */
  enterDuration: MaybeAccessor<number>;
  /** Duration in milliseconds used for exit transitions (overrides `transitionDuration` if provided). */
  exitDuration: MaybeAccessor<number>;
  /** Opt-in to animating the entering of an element if `isVisible` is `true` during the initial mount. */
  initialEnter?: boolean;
};

type PresenceResult<TItem> = {
  /** Should the component be returned from render? */
  isMounted: Accessor<boolean>;
  /** The item that is currently mounted. */
  mountedItem: Accessor<TItem | undefined>;
  /** Should the component have its visible styles applied? */
  isVisible: Accessor<boolean>;
  /** Is the component either entering or exiting currently? */
  isAnimating: Accessor<boolean>;
  /** Is the component entering currently? */
  isEntering: Accessor<boolean>;
  /** Is the component exiting currently? */
  isExiting: Accessor<boolean>;
  /** Ends the current enter or exit transition now; the duration then only acts as a fallback. */
  done: (event?: Event) => void;
  /** Returns a `done` bound to the current transition; it does nothing once the item has changed again. */
  bindDone: () => (event?: Event) => void;
};
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Related

- [`use-presence`](https://www.npmjs.com/package/use-presence)
- [`@solid-primitives/transition-group`](https://www.npmjs.com/package/@solid-primitives/transition-group)
