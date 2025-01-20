<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Promise" alt="Solid Primitives Promise">
</p>

# @solid-primitives/promise

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/promise?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/promise)
[![size](https://img.shields.io/npm/v/@solid-primitives/promise?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/promise)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A library of reactive primitives and helpers for handling promises.

- [`promiseTimeout`](#promisetimeout) — Creates a promise that resolves _(or rejects)_ after given time.
- [`raceTimeout`](#racetimeout) — Combination of `Promise.race()` and `promiseTimeout`.
- [`until`](#until) — Promised one-time watch for changes. Await a reactive condition.

## Installation

```bash
npm install @solid-primitives/promise
# or
yarn add @solid-primitives/promise
```

## `promiseTimeout`

Creates a promise that resolves _(or rejects)_ after given time.

### How to use it

```ts
import { promiseTimeout } from "@solid-primitives/promise";

await promiseTimeout(1000); // resolves after 1 second

try {
  await promiseTimeout(1000, true, "timeout"); // rejects with 'timeout' after 1 second
} catch (e) {
  console.log(e); // 'timeout'
}
```

## `raceTimeout`

Combination of `Promise.race()` and `promiseTimeout`.

### How to use it

```ts
import { raceTimeout } from "@solid-primitives/promise";

await raceTimeout(myPromise, 1000); // resolves after 1 second, or when "myPromise" resolves

try {
  await raceTimeout(myPromise, 1000, true, "timeout"); // rejects with 'timeout' after 1 second, or resolves when "myPromise" resolves
} catch (e) {
  console.log(e); // 'timeout'
}
```

## `until`

Promised one-time watch for changes. Await a reactive condition.

### How to use it

It takes a signal or a reactive condition — which will resolve the promise **if truthy** — as an argument.

Returns a promise that resolves a truthy value of a condition. Or rejects when it's root get's disposed.

#### With a custom reactive condition:

no need for createMemo, it's memoized internally

```ts
import { until } from "@solid-primitives/promise";

const [count, setCount] = createSignal(0);

await until(() => count() > 5);
```

#### With `createResource`

It also can be used as a **source** for `createResource`.

```ts
import { until } from "@solid-primitives/promise";

const [state, setState] = createSignal(null);

const [data] = createResource(() => until(state));
```

#### With `raceTimeout`

To limit the maximum time it has for resolving

```ts
import { until, raceTimeout } from "@solid-primitives/promise";

try {
  const result = await raceTimeout(until(condition), 2000, true, "until was too slow");
  // if until is quicker:
  result; // => truthy condition value
} catch (err) {
  // if timeouts:
  console.log(err); // => "until was too slow"
}
```

#### Manually stopping computation

If you don't want to use `raceTimeout`, there are other ways to stop the reactive computation of `until` if needed.

First, it will stop itself "onCleanup".

```ts
// the same goes for components as they are roots too
createRoot(dispose => {

  // disposing root causes the promise to reject,
  // so you need to catch that outcome to prevent errors
  until(condition)
    .then(res => {...})
    .catch(() => {})

  dispose()
})
```

Second, using the `.dispose()` method.

```ts
// until returns a promise with a dispose method in it
const promise = until(condition);

// you need to catch the rejection here too
promise.then().catch();

promise.dispose();
```

## Demo

`until` + `createResource` demo: https://codesandbox.io/s/until-resource-demo-sfs7c?file=/src/index.tsx

`until` as `createResource` fetcher: https://codesandbox.io/s/until-as-resource-fetcher-6sl0e?file=/src/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Inspiration

Original idea for this primitive comes from a [VueUse's function of the same name](https://vueuse.org/shared/until).
