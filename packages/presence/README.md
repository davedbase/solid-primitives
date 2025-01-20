<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=presence" alt="Solid Primitives presence">
</p>

# @solid-primitives/presence

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/presence?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/presence)
[![version](https://img.shields.io/npm/v/@solid-primitives/presence?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/presence)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

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
};
```

## Demo

Demo can be seen [here](https://stackblitz.com/edit/presence-demo).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Related

- [`use-presence`](https://www.npmjs.com/package/use-presence)
- [`@solid-primitives/transition-group`](https://www.npmjs.com/package/@solid-primitives/transition-group)
