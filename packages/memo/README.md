<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Memo" alt="Solid Primitives Memo">
</p>

# @solid-primitives/memo

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/memo?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/memo)
[![version](https://img.shields.io/npm/v/@solid-primitives/memo?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/memo)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Collection of custom `createMemo` primitives. They extend it's functionality while keeping the usage similar.

- [`createLatest`](#createlatest) - A combined memo of a list of sources, returns the value of last updated one.
- [`createLatestMany`](#createlatestmany) - A combined memo of a list of sources, returns the value of all last updated ones.
- [`createWritableMemo`](#createwritablememo) - Solid's `createMemo` which value can be overwritten by a setter.
- [`createLazyMemo`](#createlazymemo) - Lazily evaluated memo. Will run the calculation only if is being listened to.
- [`createPureReaction`](#createpurereaction) - A `createReaction` that runs before render _(non-batching)_.
- [`createMemoCache`](#creatememocache) - Custom, lazily-evaluated, memo, with caching based on keys.
- [`createReducer`](#createreducer) - Primitive for updating signal in a predictable way.

## Installation

```bash
npm install @solid-primitives/memo
# or
pnpm add @solid-primitives/memo
# or
yarn add @solid-primitives/memo
```

## `createLatest`

A combined memo of multiple sources, last updated source will be the value of the returned signal.

### How to use it

`createLatest` takes two arguments:

- `sources` - list of reactive calculations/signals/memos
- `options` - memo options

And returns a signal with value of the last change

```ts
import { createLatest } from "@solid-primitives/memo";

const [count, setCount] = createSignal(1);
const [text, setText] = createSignal("hello");

const lastUpdated = createLatest([count, text]);

lastUpdated(); // => "hello"
setCount(4);
lastUpdated(); // => 4
```

## `createLatestMany`

A combined memo of multiple sources, returns the values of sources updated in the last tick.

### How to use it

`createLatestMany` takes two arguments:

- `sources` - list of reactive calculations/signals/memos
- `options` - memo options

And returns a signal with value of the last updated sources

```ts
import { createLatestMany } from "@solid-primitives/memo";

const [count, setCount] = createSignal(1);
const [text, setText] = createSignal("hello");

const lastUpdated = createLatestMany([count, text]);

lastUpdated(); // => [1, "hello"]
setCount(4);
lastUpdated(); // => [4]
```

## `createWritableMemo`

Solid's `createMemo` which value can be overwritten by a setter.

### How to use it

`createWritableMemo` takes the same arguments as Solid's `createMemo`:

- `calc` - callback that calculates the value
- `value` - initial value (for calcultion)
- `options` - give a name to the reactive computation, or change `equals` method.

And returns a signal with value of the last change, set by a setter or a memo calculation.

```ts
import { createWritableMemo } from "@solid-primitives/memo";

const [count, setCount] = createSignal(1);
const [result, setResult] = createWritableMemo(() => count() * 2);
result(); // => 2
setResult(5); // overwrites calculation result
result(); // => 5
```

### Props derived signals

Using `createWritableMemo` will let you create a signal from a prop, that can be overwritten by a setter. This is useful for creating a signal from a prop, that can be used in a child component, but also be overwritten by a parent.

```tsx
const Child: Component<{ selectedId: string }> = props => {
  const [selectedId, setSelectedId] = createWritableMemo(() => props.selectedId);

  return (
    <div>
      <div>Selected id: {selectedId()}</div>
      <button onClick={() => setSelectedId("1")}>Select 1</button>
      <button onClick={() => setSelectedId("2")}>Select 2</button>
    </div>
  );
};
```

## `createLazyMemo`

Lazily evaluated `createMemo`. Will run the calculation only if is being listened to.

It may be useful for memos that aren't being listened to all the time, to reduce performance cost of wastefull computations.

### How to use it

It's usage is almost the same as Solid's `createMemo`. Similarly it should be placed inside a reactive root — component or createRoot.

```ts
import { createLazyMemo } from "@solid-primitives/memo";

// use like a createMemo
const double = createLazyMemo(() => count() * 2);
double(); // T: number
```

Set the initial value, or type of the previous value in calculation function will be `T | undefined`.

```ts
// set the initial value
const memo = createLazyMemo(prev => count() + prev, 123);
memo(); // T: number
```

###### See [the tests](https://github.com/solidjs-community/solid-primitives/blob/main/packages/memo/test/lazy.test.ts) for better usage reference.

### No `equals`

The lazy memo, as it is implemented now, doesn't allow for setting a `equals` function like you could with normal memo. It is always set to `equals: false` as a lazy memo cannot eagerly evaluate to check if the next value is the same as the previous, it needs to always notify it's observers so they can read from it and evaluate the memo.

### Not ownerless

Lazy memos in Solid 2.0 will be ownerless — the reactive context of the callback will depend of the place of read, not creation.

This implementation will always execute it's callback with the context of owner it was created under. So ti won't work with [Suspense](https://www.solidjs.com/docs/latest/api#<suspense>) the way you might expect — meaning that it won't activate any Suspense that is below place of creation.

Although if you only need the ownerless characteristics so that the memo can be garbage-collected when not referenced, instead of waiting for owner cleanup, you can wrap it with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner) to create it without an owner:

```ts
const memo = runWithOwner(null, () => {
  return createLazyMemo(() => /* ... */)
})
```

### You may not need a lazy memo

There are very few actual good applications of a lazy memo, that couldn't be solved with other means — like improving the data architecture. For example, you can always only create memos in places that you intend to use it in, instead of declaring it prematurely.

```ts
// instead of memo, distribute only a calculation function
const getDouble = (n: number) => n * 2;
// and only declare memo where you want to use it
const double = createMemo(() => getDouble(count()));
```

### Demo

https://codesandbox.io/s/solid-primitives-memo-demo-3w0oz?file=/index.tsx

## `createDebouncedMemo`

`createDebouncedMemo` is deprecated. Please use `createSchedule` from [`@solid-primitives/schedule`](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled#readme) instead.

```ts
import { createSchedule, debounce } from "@solid-primitives/schedule";

const scheduled = createScheduled(fn => debounce(fn, 200));

const double = createMemo(p => {
  const value = count();
  return scheduled() ? value * 2 : p;
}, 0);
```

## `createThrottledMemo`

`createThrottledMemo` is deprecated. Please use `createSchedule` from [`@solid-primitives/schedule`](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled#readme) instead.

```ts
import { createSchedule, throttle } from "@solid-primitives/schedule";

const scheduled = createScheduled(fn => throttle(fn, 200));

const double = createMemo(p => {
  const value = count();
  return scheduled() ? value * 2 : p;
}, 0);
```

## `createPureReaction`

Solid's [`createReaction`](#https://www.solidjs.com/docs/latest/api#createreaction) that is based on pure computation _(runs before render, and is non-batching)_

### How to use it

It's usage exactly matches the original. The only difference is in when the callback is being executed, the normal createReaction runs it after render, similar to how effects work, while the createPureReaction is more like createComputed.

```ts
import { createPureReaction } from "@solid-primitives/memo"

const [count, setCount] = createSignal(0);
const track = createPureReaction(() => {...});
track(count);
setCount(1); // triggers callback

// sources need to be re-tracked every time
setCount(2); // doesn't trigger callback
```

### Definition

```ts
function createPureReaction(onInvalidate: Fn, options?: EffectOptions): (tracking: Fn) => void;
```

## `createMemoCache`

Custom, lazily-evaluated, cached memo. The caching is based on a `key`, it has to be declared up-front as a reactive source, or passed to the signal access function.

### how to use it

It takes params:

- `key` a reactive source, that will serve as cache key (later value access for the same key will be taken from cache instead of recalculated)
- `calc` calculation function returning value to cache. the function is **tracking** - will recalculate when the accessed signals change.
- `options` set maximum **size** of the cache, or memo options.

Returns a signal access function.

#### Import

```ts
import { createMemoCache } from "@solid-primitives/memo";
```

#### Setting the key up-front as a reactive source

```ts
const [count, setCount] = createSignal(1);
const double = createMemoCache(count, n => n * 2);
// access value:
double();
```

#### Provide the key by passing it to the access function

let's accessing different keys in different places

```ts
const [count, setCount] = createSignal(1);
const double = createMemoCache((n: number) => n * 2);
// access value with key:
double(count());
```

#### Calculation function is reactive

will recalculate when the accessed signals change.

```ts
// changing number creates new entry in cache
const [number, setNumber] = createSignal(1);
// changing divisor will force cache to be recalculated
const [divisor, setDivisor] = createSignal(1);

// calculation subscribes to divisor signal
const result = createMemoCache(number, n / divisor());
```

### Definition

```ts
function createMemoCache<Key, Value>(
  key: Accessor<Key>,
  calc: CacheCalculation<Key, Value>,
  options?: CacheOptions<Value>,
): Accessor<Value>;
function createMemoCache<Key, Value>(
  calc: CacheCalculation<Key, Value>,
  options?: CacheOptions<Value>,
): CacheKeyAccessor<Key, Value>;

type CacheCalculation<Key, Value> = (key: Key, prev: Value | undefined) => Value;
type CacheKeyAccessor<Key, Value> = (key: Key) => Value;
type CacheOptions<Value> = MemoOptions<Value> & { size?: number };
```

## `createReducer`

Primitive for updating signal in a predictable way. SolidJS equivalent of React's [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer).

### When to use it

`createReducer` is useful for:

1. DRY the code of the `set`s of a signal
2. Ensure the signal is always in a valid state
3. Make it easier to understand for what a signal is used

### How to use it

```ts
function createReducer<T, ActionData extends any[]>(
  dispatcher: (state: T, ...args: ActionData) => T,
  initialValue: T,
  options?: SignalOptions<T>,
): [accessor: Accessor<T>, dispatch: (...args: ActionData) => void];
```

`dispatcher` is the reducer, it's 1st parameter always is the current state of the reducer and it returns the new state of the reducer.

`accessor` can be used as you use a normal signal: `accessor()`. It contains the state of the reducer.

`dispatch` is the action of the reducer, it is a sort of `setSignal` that does NOT receive the new state, but instructions to create it from the current state.

For example:

```tsx
import { createReducer } from "@solid-primitives/memo";

function Counter() {
  const [count, double] = createReducer(c => c * 2, 1);

  return <button onClick={double}>{count()}</button>;
}
```

The reducer also can receive other arguments:

```tsx
import { createReducer } from "@solid-primitives/memo";

const dispatcher = (c: number, type: "double" | "increment") => {
  if (type == "double") {
    return c * 2;
  } else {
    return c + 1;
  }
};

function Counter() {
  const [count, handleClick] = createReducer(dispatcher, 1);

  return (
    <div>
      <span>{count()}</span>
      <button onClick={() => handleClick("double")}>Double</button>
      <button onClick={() => handleClick("increment")}>Increment</button>
    </div>
  );
}
```

React allows a 3rd argument:

```ts
const fib = (n: number) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
const nextFib = (n: number) => Math.round((n * (1 + sqrt(5))) / 2);

const [fibonacci, nextFibonacci] = useReducer(nextFib, 1, fib);
```

You need to convert that to the following format:

```ts
const [fibonacci, nextFibonacci] = createReducer(nextFib, fib(1));
```

### Demo

https://codesandbox.io/s/solid-primitives-reducer-demo-7nrfs2?file=/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
