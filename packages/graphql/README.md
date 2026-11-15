<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Graphql" alt="Solid Primitives Graphql">
</p>

# @solid-primitives/graphql

[![size](https://img.shields.io/badge/size-1.21_kB-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/graphql)
[![size](https://img.shields.io/npm/v/@solid-primitives/graphql?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/graphql)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Creates a reactive GraphQL query client.

## Installation

```bash
npm install @solid-primitives/graphql
# or
yarn add @solid-primitives/graphql
# or
pnpm add @solid-primitives/graphql
```

## How to use it

#### Import

```ts
import {
  createGraphQLClient,
  createGraphQLMutation,
  gql,
  request,
} from "@solid-primitives/graphql";
// gql is a helper for creating GraphQL query strings
// request is an additional function to perform GraphQL requests imperatively
```

<a id="creategraphqlclient"></a>

#### Using the client

`createGraphQLClient` takes 2 arguments:

- `url` - target api endpoint, as string or accessor
- `options` - _optional_, options for the `fetch` function, `headers`, the `fetcher` method etc. (object or accessor)
  - `fetcher` - A fetch function to replace the default one, that is Fetch API on browser and `node-fetch` on server.
  - `headers` - A headers object to be passed to the `fetch` function.

It returns a query function. Calling it returns an **async accessor**: an async `createMemo` that runs the request, so it works with `<Loading>` and `<Errored>` like any other Solid 2.0 async source.

```tsx repl
// Type
// createGraphQLClient(url, options?) => query(document, variables?, options?) => SourceAccessor<TResult | undefined>

// Example
import { render } from "@solidjs/web";
import { createSignal, Errored, For, isPending, Loading, Show } from "solid-js";
import { createGraphQLClient, gql } from "@solid-primitives/graphql";

const query = createGraphQLClient("https://countries.trevorblades.com/");

const CODES = ["BR", "JP", "CA", "ZA"];

function Demo() {
  const [code, setCode] = createSignal("BR");

  // Reactive variables: changing `code` refetches and aborts the superseded request.
  const country = query<{ country: { name: string; capital: string; emoji: string } | null }>(
    gql`
      query ($code: ID!) {
        country(code: $code) {
          name
          capital
          emoji
        }
      }
    `,
    () => ({ code: code() }),
  );

  return (
    <>
      <For each={CODES}>
        {c => (
          <button disabled={code() === c} onClick={() => setCode(c)}>
            {c}
          </button>
        )}
      </For>
      <Errored fallback={err => <p>Failed: {err().message}</p>}>
        <Loading fallback={<p>Loading…</p>}>
          <p>
            {country()?.country?.emoji} {country()?.country?.name} — capital:{" "}
            {country()?.country?.capital}
          </p>
          <Show when={isPending(() => country())}>
            <small>refreshing…</small>
          </Show>
        </Loading>
      </Errored>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

- **Loading** - the initial request suspends the nearest `<Loading>`. While new variables load, the previous result stays on screen; use `isPending(() => data())` for a "refreshing" indicator. Render that indicator _inside_ the `<Loading>` boundary: reading a pending query outside any boundary defers the whole root mount (`ASYNC_OUTSIDE_LOADING_BOUNDARY`).
- **Errors** - a failed request (or a GraphQL `errors` response, thrown as `GraphQLError`) is thrown when the accessor is read, so catch it with `<Errored>`.
- **Aborting** - the request receives an `AbortSignal` that is aborted when the url, options or variables change, or when the owner is disposed. A `signal` passed in `options` is combined with it, so aborting either one cancels the request.

#### Refetching

Call `refresh` on the returned accessor to run the same request again. A bare `refresh` is a quiet re-ask: the new result swaps in without `isPending` turning `true`. To show a "refetching" state, use a [mutation](#mutations) (which marks the queries it changes as pending) or wrap `affects(data); refresh(data);` in your own `action`.

```ts
import { refresh } from "solid-js";

const data = newQuery(gql`...`, { foo: "bar" });
const onClick = () => refresh(data);
```

#### Query options

The query function takes a third argument that is passed on to the underlying `createMemo`:

- `name` - debug name shown in diagnostics
- `loadingValue` - a value shown until the first response lands. Nothing suspends and `isPending` stays `false`, so drive first-load UI from the value itself (a `null` placeholder, a `skeleton: true` field...). This replaces the `initialValue` of Solid 1.x resources.
- `ssrSource` / `deferStream` - control server rendering and hydration, see the Solid 2.0 SSR docs
- `equals` - custom equality of consecutive responses

```ts
const countries = newQuery<{ countries: { name: string }[] }>(
  gql`
    query {
      countries {
        name
      }
    }
  `,
  {}, // no variables (omitting the argument works too, but `undefined` would skip the request)
  { name: "countries", loadingValue: { countries: [] } },
);
countries(); // T: { countries: { name: string }[] }
```

#### Preventing immediate requests

Pass `false`, `null` or `undefined` as the variables (or an accessor returning one) to skip the request. The accessor returns `undefined` until the variables are provided.

```ts
const newQuery = createGraphQLClient("https://foobar.com/v1/api");
const [queryVars, setQueryVars] = createSignal<false | object>(false);
const data = newQuery(gql`...`, queryVars);

setQueryVars({ foo: "bar" }); // will fetch for the first time
refresh(data); // will refetch the second time
```

#### Providing Response Type

```ts
// query function accepts type generic for the response:
const countries = newQuery<{ countries: { name: string }[] }>(gql`
  query {
    countries {
      name
      code
    }
  }
`);
countries(); // T: { countries: { name: string }[] } | undefined
```

#### Reactive query variables

Variables passed to the query can be reactive. If they change, the query is refetched.

```ts
const [code, setCode] = createSignal("BR");
const data = query(
  gql`
    query data($code: ID!) {
      country(code: $code) {
        name
      }
    }
  `,
  // function returning an object
  () => ({
    code: code(),
  }),
);
```

<a id="creategraphqlmutation"></a>

#### Mutations

`createGraphQLMutation` takes the same `url` and `options` as `createGraphQLClient` and returns a `mutate` function. It is built on Solid 2.0's `action`: every call is one transaction, so optimistic writes, the request and the follow-up refresh settle together.

```tsx repl
// Type
// createGraphQLMutation(url, options?) =>
//   mutate(document, variables?, { optimistic?, refresh?, multipart?, signal? }) => Promise<TResult>

// Example
import { render } from "@solidjs/web";
import { createOptimistic, createSignal, Errored, For, isPending, Loading, Show } from "solid-js";
import { createGraphQLClient, createGraphQLMutation, gql } from "@solid-primitives/graphql";

// A tiny in-memory GraphQL "server" so the demo needs no backend.
const todos = ["Read the docs"];
const fetcher = (async (_url: string, init: RequestInit) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const { query, variables } = JSON.parse(init.body as string);
  if (query.includes("mutation")) {
    if (variables.text.includes("fail")) {
      return new Response(JSON.stringify({ errors: [{ message: "Rejected by the server" }] }));
    }
    todos.push(variables.text);
    return new Response(JSON.stringify({ data: { addTodo: { text: variables.text } } }));
  }
  return new Response(JSON.stringify({ data: { todos: [...todos] } }));
}) as typeof fetch;

const query = createGraphQLClient("/graphql", { fetcher });
const mutate = createGraphQLMutation("/graphql", { fetcher });

function Demo() {
  const list = query<{ todos: string[] }>(gql`
    query {
      todos
    }
  `);
  const [optimistic, setOptimistic] = createOptimistic<string[]>([]);
  const [error, setError] = createSignal<string>();
  let input!: HTMLInputElement;

  const add = async () => {
    const text = input.value;
    input.value = "";
    setError(undefined);
    try {
      await mutate(
        gql`
          mutation ($text: String!) {
            addTodo(text: $text) {
              text
            }
          }
        `,
        { text },
        {
          optimistic: () => setOptimistic(l => [...l, text]), // shown right away, reverted on failure
          refresh: [list], // pending while in flight, refetched on success
        },
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      <input ref={input} placeholder='Todo (include "fail" to see a rollback)' />
      <button onClick={add}>Add</button>
      <Show when={error()}>{message => <p>Error: {message()}</p>}</Show>
      <Errored fallback={err => <p>Failed: {err().message}</p>}>
        <Loading fallback={<p>Loading…</p>}>
          <ul>
            <For each={[...(list()?.todos ?? []), ...optimistic()]}>{text => <li>{text}</li>}</For>
          </ul>
          <Show when={isPending(() => list())}>
            <small>saving…</small>
          </Show>
        </Loading>
      </Errored>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

- **Call it from event handlers.** `mutate` is an `action`, so calling it from a component body or computation throws `ACTION_CALLED_IN_OWNED_SCOPE`.
- **`optimistic`** runs first, synchronously, with the variables. Write to `createOptimistic` / `createOptimisticStore` setters there: they revert automatically if the request fails.
- **`refresh`** lists the queries the mutation changes. They read as pending (`isPending`) while the request is in flight, and are refreshed once it succeeds. If it fails they are left alone.
- **Errors** - a failed mutation rejects the returned promise with a `GraphQLError` and reverts the optimistic writes.
- **`multipart: true`** sends the request as `multipart/form-data`, see [file upload support](#file-upload-support).

#### File upload support

If the server supports the [GraphQL multipart request specification](https://github.com/jaydenseric/graphql-multipart-request-spec) it is possible to upload a `File` or a binary `Blob` of data by calling the `multipartRequest` function with the `File`/`Blob` instances in the variables variables.
This is especially useful for GraphQL mutations, because allows for binary uploads without the necessity to first encode the data to some text-based format like base64.

```ts
import { request, gql } from "@solid-primitives/graphql";

const result = multipartRequest(
  "https://foobar.com/v1/api",
  gql`
    mutation UploadImage($file: Upload!, $caption: String!) {
      uploadImage(file: $file, caption: $caption) {
        id
      }
    }
  `,
  {
    variables: { caption: "A nice image", file: inputElement.files[0] },
  },
);
```

#### Migrating from Solid 1.x

- Mutations: instead of calling `request` by hand and refetching manually, use [`createGraphQLMutation`](#mutations).
- `query(...)` no longer returns a `createResource` tuple. Use the returned accessor directly: `const [data, { refetch }] = query(...)` becomes `const data = query(...)` and `refresh(data)`.
- The `resourceOptions` argument is replaced by [query options](#query-options): `initialValue` becomes `loadingValue` and `ssrLoadFrom` becomes `ssrSource`.
- `data.loading` and `data.error` are replaced by `<Loading>`, `isPending` and `<Errored>`.
- The `GraphQLResourceSource` type is removed.

#### fetch on the server

When running on environments without Browser `fetch`, you should provide a `fetcher` to the options object, or add it to the global `window` object.

```ts
import nodeFetch from "node-fetch";
import { createGraphQLClient, gql } from "@solid-primitives/graphql";

const newQuery = createGraphQLClient("https://foobar.com/v1/api", { fetcher: nodeFetch });
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
