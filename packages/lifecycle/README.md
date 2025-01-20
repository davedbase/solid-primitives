<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=lifecycle" alt="Solid Primitives lifecycle">
</p>

# @solid-primitives/lifecycle

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/lifecycle?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/lifecycle)
[![version](https://img.shields.io/npm/v/@solid-primitives/lifecycle?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/lifecycle)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Package providing extra layer of lifecycle primitives for Solid.

- [`createIsMounted`](#createismounted) - Returns a boolean signal indicating whether the component is mounted or not.
- [`isHydrated`](#ishydrated) - A signal with the same behavior as [`isHydrating`](#ishydrating) but this one focused only on client-side updates.
- [`onElementConnect`](#onelementconnect) - Calls the given callback when the target element is connected to the DOM.

## Installation

```bash
npm install @solid-primitives/lifecycle
# or
yarn add @solid-primitives/lifecycle
# or
pnpm add @solid-primitives/lifecycle
```

## `createIsMounted`

Returns a boolean signal indicating whether the component is mounted or not.

It's a simple wrapper around `createSignal` and `onMount`,
but it can make your code feel more declarative - especially when used with `createMemo`.

```tsx
import { createIsMounted } from "@solid-primitives/lifecycle";

const isMounted = createIsMounted();
const windowWidth = createMemo(() => (isMounted() ? ref.offsetWidth : 0));

let ref: HTMLElement;
<div ref={ref}>{windowWidth()}</div>;
```

## `isHydrated`

A signal accessor indicating if the owner is done hydrating.

- `false` during SSR (always)
- `false` on the client if the component evaluation is during a hydration process.
- `true` on the client if the component evaluates after hydration or during clinet-side rendering.

If it returns `true` it means that you can safely change the initial values of signals
that are used in the JSX, without causing a mismatch between the server and client.

It can be used in computations as a signal, and it will trigger a re-evaluation when the hydration state changes.

But it can also be used as a simple check of the hydration state.

```tsx
import { isHydrated } from "@solid-primitives/lifecycle";

const serverFallback = 0;

const [vw, setVw] = createSignal(
  // if the component is hydrated, we can safely use the window width immediately
  isHydrated() ? window.innerWidth / 100 : serverFallback,
);

<p>Window width: {vw()}vw</p>;
```

### Implementing `ClientOnly` component

`isHydrated` can be used to easily implement a `ClientOnly` component that will only render its children on the client.

```tsx
import { createMemo, FlowComponent, JSX } from "solid-js";
import { isHydrated } from "@solid-primitives/lifecycle";

// This component will only render its children on the client
export const ClientOnly: FlowComponent = props => {
  const children = createMemo(() => isHydrated() && props.children);
  return <>{children()}</>;
};

// Usage
<ClientOnly>
  <ComponentThatBreaksOnServer />
</ClientOnly>;
```

## `onElementConnect`

`onMount` is a common lifecycle hook that is used to perform side-effects when the component is mounted.
However, it is not certain that the elements are actually connected to the DOM when the mount callback is called.

> **Note** If that's the case, it might be a sign that you are executing components that are not visible to the users my mistake.
>
> And if this is something intentional, you probably already have a way to hook into the actual DOM rendering.
>
> If you are not sure, you can use `onElementConnect` instead of `onMount` to make sure that you are caling your callback when the elements are connected to the DOM.

```tsx
<div
  ref={el => {
    // often false, but will be true during hydration
    el.isConnected;

    onMount(() => {
      // often true, but will be false if the executed component is not actually getting rendered
      el.isConnected;
    });

    onElementConnect(el, () => {
      // always true
      el.isConnected;
    });
  }}
/>
```

## Demo

You can see the primitives in action in the following sandbox: https://primitives.solidjs.community/playground/lifecycle/

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
