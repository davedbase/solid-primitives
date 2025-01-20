<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=resource" alt="Solid Primitives resource">
</p>

# @solid-primitives/resource

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/resource?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/resource)
[![version](https://img.shields.io/npm/v/@solid-primitives/resource?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/resource)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A collection of composable primitives to augment [`createResource`](https://www.solidjs.com/docs/latest/api#createresource)

- [`createAggregated`](#createaggregated) - wraps the resource to aggregate data instead of overwriting it
- [`createDeepSignal`](#createdeepsignal) - provides a fine-grained signal for the [resource storage option](https://docs.solidjs.com/reference/basic-reactivity/create-resource#options)
- [`makeAbortable`](#makeabortable) - sets up an AbortSignal with auto-abort on re-fetch or timeout
- [`createAbortable`](#createabortable) - like `makeAbortable`, but with automatic abort on cleanup
- [`makeCache`](#makecache) - wraps the fetcher to cache the responses for a certain amount of time
- [`makeRetrying`](#makeretrying) - wraps the fetcher to retry requests after a delay

## Installation

```bash
npm install @solid-primitives/resource
# or
yarn add @solid-primitives/resource
# or
pnpm add @solid-primitives/resource
```

## How to use it

Here's an example of all of them combined:

```ts
// abort signal will abort the resource in-flight if it takes more then 10000ms
const [signal, abort] = makeAbortable({ timeout: 10000 });

const fetcher = (url: string) => fetch(url, { signal: signal() }).then(r => r.json());

// cached fetcher will not be called if something for the same URL is still in cache
const [cachedFetcher, invalidate] = makeCache(fetcher, { storage: localStorage });

// works with createResource, or any wrapping API with the same interface
const [data, { refetch }] = createResource(address, fetcher);
const aggregatedData = createAggregated(data);
```

Obviously, you're not limited to resources using fetch. You can use them on any resource you want.

### createAggregated

Aggregates the output of a resource:

```ts
const aggregated: Accessor<T> = createAggregated(
  resource: Resource<T>, initialValue?: T | U
);
const pages = createAggregated(currentPage, []);
```

- null will not overwrite undefined
- if the previous value is an Array, incoming values will be appended
- if any of the values are Objects, the current one will be shallow-merged into the previous one
- if the previous value is a string, more string data will be appended
- otherwise the incoming data will be put into an array

Objects and Arrays are re-created on each operation, but the values will be left untouched, so `<For>` should work fine.

### createDeepSignal

Usually resources in Solid.js are immutable. Every time the resource updates, every subscriber of it is updated. Starting with Solid.js 1.5, `createResource` allows to receive a function returning something akin to a signal in [`options.storage`](https://docs.solidjs.com/reference/basic-reactivity/create-resource#options). This allows to provide the underlying storage for the resource in order to change its reactivity. This allows to add fine-grained reactivity to resources so that you can subscribe to nested properties and only trigger updates as they actually occur:

```ts
// this adds fine-grained reactivity to the contents of data():
const [data, { refetch }] = createResource(fetcher, { storage: createDeepSignal });
```

> **Warning**
> if your resource is a deep signal, you can no longer rely on reactive changes to the base signal. If you want to combine this with [`createAggregated`](#createaggregated), you will need to wrap the resource to either call [`deepTrack`](https://solid-primitives.netlify.app/package/deep#deeptrack) or read one of the reactive parts that you know for certain will change every time:

```ts
import { deepTrack } from "@solid-primitives/deep";

const [data] = createResource(source, fetcher, { storage: createDeepSignal });
const aggregated = makeAggregated(() => deepTrack(data()));
```

### makeAbortable

Orchestrates AbortController creation and aborting of abortable fetchers, either on refetch or after a timeout, depending on configuration:

```ts
// definition
const [
  signal: AbortSignal,
  abort: () => void,
  filterErrors: <E>(err: E) => E instanceof AbortError ? void : E
] = makeAbortable({
  timeout?: 10000,
  noAutoAbort?: true,
});

// usage
const fetcher = (url: string) => fetch(
  url, { signal: signal() }
).then(r => r.json(), filterErrors);
```

- The `signal` function always returns a signal that is not yet aborted; if `noAutoAbort` is not set to true, calling it will also abort a previous signal, if present
- The `abort` callback will always abort the current signal
- If `timeout` is set, the signal will be aborted after that many Milliseconds
- The `filterErrors` function can be used to filter out abort errors

### createAbortable

This function does exactly the same as `makeAbortable`, but also automatically aborts on cleanup. Only use within a reactive scope.

### makeCache

Creates a caching fetcher, with the ability to persist the cache, to invalidate entries and manage expired entries:

```ts
const [
  fetcher: ResouceFetcher<S, T>,
  invalidate: ((source?: S) => void) & { all: () => void },
  expired: Accessor<{ source: S, data: T }>
] =
  makeCache(
    fetcher: ResourceFetcher<S, T>,
    options?: {
      cache?: Record<string, { source: S, data: T }>,
      expires?: number | (entry: { source: S, data: T }) => number,
      storage?: Storage,
      storageKey?: string,
    }
  );
```

Wraps the fetcher to use a cache. Returns the wrapped fetcher, an invalidate callback that requires the source to invalidate the request and a signal accessor with the last automatically invalidated request.

Can be customized with the following optional options:

- `cache` - allows to use a local cache instead of the global one
- `expires` - allows to define a custom timeout; either accepts a number or a function that receives an object with source and data of the request and returns a number in Milliseconds
- `serialize` - a tuple [serialize, deserialize] used for persistence, default is `[JSON.stringify, JSON.parse]`
- `sourceHash` - a function receiving the source (true if none is used) and returns a hash string
- `storage` - a storage like localStorage to persist the cache over reloads
- `storageKey` - the key which is used to store the cache in the storage

⚠ the default sourceHash function works with simple types as well as Headers and Maps, but will fail on recursive objects and will throw on Symbols. It should work for simple `RequestInit` type objects and is pretty small.

### `makeRetrying`

Creates a fetcher that retries multiple times in case of errors.

```ts
const fetcher = makeRetrying(url => fetch(url).then(r => r.json()), { retries: 5, delay: 500 });
```

Receives the fetcher and an optional options object and returns a wrapped fetcher that retries on error after a delay multiple times.

The optional options object contains the following optional properties:

- `delay` - number of Milliseconds to wait before retrying; default is 5s
- `retries` - number of times a request should be repeated before giving up throwing the last error; default is 3 times

### Recipes: the missing pieces

Maybe you have considered using [TanStack Query](https://tanstack.com/query/latest/docs/solid/overview) instead of this collection and if you have a lot of complex requirements around requests, this might even be a better fit. However, if only a few crucial pieces of it are missing for you, here are some recipes to fill them in:

#### Query keys

Nothing stops you from using keys as Source for your fetch request through [`makeCache`](#makecache). Those keys will be serialized as identifiers for caching, too. All you need is a translation table from keys to the actual request in the fetcher.

#### Network mode

Just filter your source with `isOnline` from the [`connectivity`](https://github.com/solidjs-community/solid-primitives/tree/main/packages/connectivity) package:

```ts
import { createConnectivitySignal } from "@solid-primitives/connectivity";

const isOnline = createConnectivitySignal();
const source = () => isOnline() && url();
const [data] = createResource(source, url => fetch(url));
```

#### Window focus refetching

The `createEventListener` primitive from the [`event-listener`](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener) pacakge comes in helpful to do that:

```ts
import { createEventListener } from "@solid-primitives/event-listener";

const [data, { refetch }] = createResource(() => fetch("url"));
createEventListener(document, "visibilitychange", () => document.hidden || refetch());
```

You could also augment this code with the [`scheduled`](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled) package to throttle the refetch calls not to happen again sooner than after 5s:

```ts
import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";

const [data, { refetch }] = createResource(() => fetch("url"));
const runRefetch = throttle(refetch, 5000);
createEventListener(document, "visibilitychange", () => document.hidden || runRefetch());
```

### Stopping a refetch interval when hidden or offline

If you are polling, this approach might come useful:

```ts
import { createConnectivitySignal } from "@solid-primitives/connectivity";
import { createEventSignal } from "@solid-primitives/event-listener";
import { createTimer } from "@solid-primitives/timer";

const [data, { refetch }] = createResource(() => fetch("url").then(r => r.json()));
const [setPaused] = createTimer(refetch, 5000, setInterval);
const visibilityChange = createEventSignal(document, "visibilitychange");
const isOnline = createConnectivitySignal();
createEffect(() => setPaused((visibilityChange(), document.hidden) || !isOnline());
```

#### Mutations

In TanStack Query, mutations are requests that mutate data on the server, so we are less interested in the answer and more in the timing. Fortunately, Solid already comes with a mutate action in the `createResource` return value:

```ts
const [todos, { mutate, refetch }] = createResource(getTodos);

const addTodo = todo => {
  [mutation] = createResource(() => addTodo(todo));
  const current = todos();
  // optimistic update
  mutate(todos => [...current, todo]);
  // refetch after mutating on the server or error
  createRoot(done =>
    createEffect(() => {
      if (mutation.error || !mutation.loading) {
        refetch();
        done();
      }
    }),
  );
  return () => mutation.state;
};
```

#### Scroll Restoration

This is already covered in [@solidjs/router](https://github.com/solidjs/solid-router).

#### Polling

Just use an interval with refetch; ideally, also use [`makeAbortable`](#makeabortable).

## Demo

You may view a working example of our resource primitives here:
https://primitives.solidjs.community/playground/resource/

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
