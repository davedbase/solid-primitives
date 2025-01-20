<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Graphql" alt="Solid Primitives Graphql">
</p>

# @solid-primitives/graphql

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/audio?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/graphql)
[![size](https://img.shields.io/npm/v/@solid-primitives/graphql?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/graphql)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

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
import { createGraphQLClient, gql, request } from "@solid-primitives/graphql";
// gql is a helper for creating GraphQL query strings
// request is an additional function to perform GraphQL requests imperatively
```

#### Using the client

`createGraphQLClient` takes 2 arguments:

- `url` - target api endpoint, as string or signal
- `options` - _optional_, Options for the `fetch` function, `headers`, the `fetcher` method etc.
  - `fetcher` - A fetch function to replace the default one, that is Fetch API on browser and `node-fetch` on server.
  - `headers` - A headers object to be passed to the `fetch` function.

```ts
import { createGraphQLClient, gql } from "@solid-primitives/graphql";

const newQuery = createGraphQLClient("https://foobar.com/v1/api");
const [data, { refetch }] = newQuery(
  gql`
    query data($path: ID!) {
      PageItem(id: $path) {
        content {
          body
        }
      }
    }
  `,
  { path: "home" },
);
```

#### Preventing immediate requests

Query function is based on `createResource`, so it can be deferred in the same way - by passing `false` to the variables.

```ts
const newQuery = createGraphQLClient("https://foobar.com/v1/api");
const [queryVars, setQueryVars] = createSignal<boolean | object>(false);
const [data, { refetch }] = newQuery(gql`...`, queryVars);

setQueryVars({ foo: bar }); // will fetch for the first time
refetch(); // will refetch the second time
```

#### Providing Response Type

```ts
// query function accepts type generic for the response:
const [countries] = newQuery<{ countries: { name: string }[] }>(gql`
  query {
    countries {
      name
      code
    }
  }
`);
countries(); // T: { countries: { name: string }[] } | undefined
```

#### Initial value

By default the returned data type will be `T | undefined`, to make it always `T` you need to provide an initial value.

```ts
const [countries] = newQuery<{ countries: { name: string }[] }>(
  gql`
    query {
      countries {
        name
        code
      }
    }
  `,
  // no variables
  undefined,
  // resource options with the initial value
  {
    initialValue: { countries: [] },
  },
);
countries(); // T: { countries: { name: string }[] }
```

#### Reactive query variables

Variables passed to the query can be reactive. If they change, the resource will be refetched.

```ts
const [code, setCode] = createSignal("BR");
const [data] = query(
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

#### fetch on the server

When running on environments without Browser `fetch`, you should provide a `fetcher` to the options object, or add it to the global `window` object.

```ts
import nodeFetch from "node-fetch";
import { createGraphQLClient, gql } from "@solid-primitives/graphql";

const newQuery = createGraphQLClient("https://foobar.com/v1/api", { fetcher: nodeFetch });
```

Remember, just like with [`createResource`](https://www.solidjs.com/docs/latest/api#createresource), you will need an [`<ErrorBoundary>`](https://www.solidjs.com/docs/latest/api#%3Cerrorboundary%3E) to catch the errors, even if they are accessible inside the resource. Otherwise, uncaught errors might disrupt your application.

## Demo

You may view a working example here:

https://codesandbox.io/s/solid-primitives-graphql-demo-g6fv6?file=/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
