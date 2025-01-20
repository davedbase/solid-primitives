<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Rootless" alt="Solid Primitives Rootless">
</p>

# @solid-primitives/rootless

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/rootless?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/rootless)
[![version](https://img.shields.io/npm/v/@solid-primitives/rootless?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/rootless)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A collection of helpers that aim to simplify using reactive primitives outside of reactive roots, and managing disposal of reactive roots.

- [`createSubRoot`](#createsubroot) - Creates a reactive **sub root**, that will be automatically disposed when it's owner does.
- [`createCallback`](#createcallback) - A wrapper for creating callbacks with `runWithOwner`.
- [`createDisposable`](#createdisposable) - For disposing computations early – before the root cleanup.
- [`createSingletonRoot`](#createsingletonroot) - Share "global primitives" across multiple reactive scopes.
- [`createRootPool`](#createrootpool) - Creates a pool of reactive roots, that can be reused.

## Installation

```bash
npm install @solid-primitives/rootless
# or
pnpm add @solid-primitives/rootless
# or
yarn add @solid-primitives/rootless
```

## `createSubRoot`

###### Previously `createSubRoot`

Creates a reactive **root branch**, that will be automatically disposed when it's owner does.

### How to use it

Use it for nested roots _(literally nested, or provided manually to dependency array)_ that should be disposed before or with their owner.

```ts
import { createSubRoot } from "@solid-primitives/rootless";

createRoot(dispose => {
  createSubRoot(disposeBranch => {
    // computations will be disposed with branch
    createEffect(() => {...});

    // disposes only the branch
    disposeBranch();
  });

  // disposes the outer root, AND all the nested branches
  dispose();
});
```

### Definition

```ts
function createSubRoot<T>(fn: (dispose: VoidFunction) => T, ...owners: (Owner | null)[]): T;
```

## `createCallback`

A wrapper for creating callbacks with `runWithOwner`.
It gives you the option to use reactive primitives after root setup and outside of effects.

**Why?**

All of the callback-based (in opposite to effect-based) events is Solid don't have a root, because the root is changed synchronously after initialization finishes. So normally that would prevent you from using reactive primitives there.

`runWithOwner` attatches whatever computations created inside, to the owner passed to it.

### How to use it

```tsx
// in component body
const handleClick = createCallback(() => {
   // the effect will be created normally, attached to the component's reactive root
   createEffect(() => {...})
})

// in jsx
<button onClick={handleClick} />
```

### Definition

```ts
function createCallback<T extends AnyFunction>(callback: T, owner?: Owner | null): T;
```

## `createDisposable`

###### Previously `runWithSubRoot`

For disposing computations early – before the root cleanup.

### How to use it

Executes provided function in a [`createSubRoot`](#createsubroot) _(auto-disposing root)_, and returns a dispose function, to dispose computations used inside before automatic cleanup.

```ts
const dispose = createDisposable(dispose => {
   createEffect(() => {...})
});

// dispose later (if not, will dispose automatically)
dispose()
```

### Definition

```ts
type runWithRootReturn<T> = T extends void | undefined | null
  ? Dispose
  : [returns: T, dispose: Dispose];
const createDisposable = <T>(fn: () => T, detachedOwner?: Owner): runWithRootReturn<T>
```

## `createSingletonRoot`

Creates a reactive root that is shared across every instance it was used in. Shared root gets created when the returned function gets first called, and disposed when last reactive context listening to it gets disposed. Only to be recreated again when a new listener appears.

Designed to make "global primitives" shareable, without instanciating them (recreating, state, computations, event listeners, etc.) every time they're used. For example a `createLocationState` primitive would work the same for every instance and provide the same data, so reinitializeing it every time is wastefull.

### How to use it

`createSingletonRoot` primitive takes a single argument:

- `factory` - a function where can you initialize some reactive primitives, returned value will be shared across instances.

And returns a function registering reactive owner as one of the listeners, returns the value `factory` function returned.

```ts
import { createSingletonRoot } from "@solid-primitives/rootless";

const useState = createSingletonRoot(() => {
   return createMemo(() => {...})
});

// later in a component:
const state = useState();
state()

// in another component
// previously created primitive would get reused
const state = useState();
...
```

### Type Definition

```ts
function createSingletonRoot<T>(factory: (dispose: Fn) => T): () => T;
```

### `createHydratableSingletonRoot`

A experimental version of `createSingletonRoot` that will deopt of creating a singleton root if used in SSR or during hydration.

The reason for this is that `createSingletonRoot` will create a root that will be shared across all instances of the primitive, and this could mean state leaking between different requests.
And during hydration, if you were to update the shared state before the hydration is finished, it could cause a mismatch between the server and client.

The API is experimental, and likely to change or be merged into `createSingletonRoot` in the future.

### Demo

Usage of combining `createSingletonRoot` with `createMousePosition`: https://codesandbox.io/s/shared-root-demo-fjl1l9?file=/index.tsx

## `createRootPool`

Creates a pool of roots, that can be reused. Useful for creating components that are mounted and unmounted frequently.
When the root is created, it will call the factory function.
Roots are created by calling the returned function, after cleanup they won't be disposed but instead put back into the pool to be reused.
Next time the function is called, it will reuse the root from the pool and update it with the new data.

### How to use it

`createRootPool` primitive takes two arguments:

- `factory` - A function that will be called when a new root is created.
- `options` - Options for the root pool.
  - `limit` - Pool limit, defaults to `100`. Roots that are not used will be disposed when the limit is reached.

Returns a function that creates and reuses roots.

```tsx
import { createRootPool } from "@solid-primitives/rootless";

const useCounter = createRootPool((arg, active, dispose) => {
  const [count, setCount] = createSignal(arg());

  createEffect(() => {
    if (!active()) return;
    // so some side effect
    console.log("count", count());
  });

  return <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>;
});

return <Show when={frequentlyChangedCondidion()}>{useCounter(1)}</Show>;
```

### Usage with `<For>`

`createRootPool` can be combined with `<For>` (or any other control-flow component) to reuse already created HTML Elements while getting the same benefits of stable connection between rendered elements and the reference to the source item.

```tsx
const pool = createRootPool(item => <MyListItem item={item()}>)

return <For each={items()}>{item => pool(item)}</For>
```

> **Warning**
> Using `createRootPool` with `<For>` creates an un-keyed control-flow — meaning that a single element can be reused by more than one item (not at the same time). Which can cause styles, animations, and other side effects to leak between items.
> It's meant to be used only as a performance optimization, and only when you're sure that the side effects won't leak between items.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
