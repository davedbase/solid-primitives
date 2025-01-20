<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Fetch" alt="Solid Primitives Fetch">
</p>

# @solid-primitives/fetch

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/fetch?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/fetch)
[![size](https://img.shields.io/npm/v/@solid-primitives/fetch?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/fetch)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Creates a composable primitive to support requests.

## Installation

```bash
npm install @solid-primitives/fetch
# or
yarn add @solid-primitives/fetch
```

### Additional requirements

Since nodejs 17.5.0, the fetch API is available in node via the `--experimental-fetch` command line option. From version 18.0.0 upwards, it is supposed to become available out of the box. If you want to use `createFetch` on your server, but your nodejs version does not support the fetch API, you need to install node-fetch alongside this primitive:

```bash
npm install node-fetch
# or
yarn add node-fetch
```

If you fail to install it, but still run it on the server, you should see a nice error message that asks you to install it in the logs and your requests are all rejected.

## How to use it

```ts
const [resource, { mutate, refetch }] = createFetch<T>(
  requestInfo: Accessor<RequestInfo | undefined> | RequestInfo,
  requestInit?: Accessor<RequestInit | undefined> | RequestInit | undefined,
  options?: { disable?: boolean } & ResourceOptions<T>,
  modifiers?: RequestModifier[]
);

resource(): T
resource.error: Error | any | undefined
resource.loading: boolean
resource.status: number | null
resource.response: Response
```

Remember, just like with [`createResource`](https://www.solidjs.com/docs/latest/api#createresource), you will need an [`<ErrorBoundary>`](https://www.solidjs.com/docs/latest/api#%3Cerrorboundary%3E) to catch the errors, even if they are accessible inside the resource. Otherwise, uncaught errors might disrupt your application - except if you use the `withCatchAll()` modifier.

If you want to initialize a fetch request without directly starting it, you can use an Accessor that returns undefined before being set to the actual request info or url. Even if you add a RequestInit, the request will not be started without a defined RequestInfo.

### Modifiers

The fetch primitive alone just wraps a simple fetch request in a solid resource for convenience, but its ability to compose modifiers are what makes this primitive really powerful. The following modifiers are supported:

```ts
// makes the request abortable; will automatically abort previous requests or those whose owner got disposed
withAbort()

// will abort the request if abortable and throw an error after a certain timeout
withTimeout(after: number)

// catches all request errors so you no longer require an ErrorBoundary
withCatchAll()

// retries failed requests after a certain time, will by default wait the number of the retry seconds,
// starting with 1, up to 30s
withRetry(retries: number, wait: number | (retry: number) => number)

// refetches the request after certain events
withRefetchEvent({ on: keyof HTMLWindowEventMap[], filter: (...args, data, event) => boolean })

// aggregates response data; depending on existing data, it will handle the response
// you can either use initial data or an optional dataFilter to trigger certain handling
// strings and arrays will be joined, objects merged shallowly, everything else will be put into an array
withAggregation(dataFilter?: (responseData: Result) => Result)

// caches requests
withCache({ cache?: Record<string, CacheEntry>, expires?: number | ((entry: CacheEntry) => boolean); })

// refetch on cache expiry
// (expiry control function requires polling; you can set the delay; 0 = raf; default is 100ms)
withRefetchOnExpiry(pollDelayMs: number)

// makes cache persistent in storage, defaults = [localStorage, 'fetch-cache']
withCacheStorage(storage?: Storage, key?: string)
```

The main advantage of using modifiers like this is that you only import what you need and the rest will be eliminated in tree shaking.

There's also a helper for the cache to serialize the cache key from the request.

```ts
serializeRequest([info: RequestInfo, init?: RequestInit]): string
```

in case you want to debug or manipulate the cache.

## Demo

TODO

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
