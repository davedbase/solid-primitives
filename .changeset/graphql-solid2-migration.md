---
"@solid-primitives/graphql": major
---

Migrate to Solid 2.0. Queries are now async `createMemo`s and mutations are Solid `action`s.

### Breaking changes

- The query function returns a single refreshable accessor instead of a `createResource` tuple (`[data, { refetch, mutate }]`). Wrap reads in `<Loading>` and `<Errored>`, use `isPending(() => data())` for stale-while-revalidating, and `refresh(data)` to refetch.
- The `resourceOptions` argument is replaced by query options (`name`, `loadingValue`, `ssrSource`, `deferStream`, `equals`). `initialValue` becomes `loadingValue`, `ssrLoadFrom` becomes `ssrSource`. The `GraphQLResourceSource` type is removed.
- Requests are aborted (via `AbortSignal`) when the url, options or variables change or the owner is disposed. A `signal` passed in `options` takes precedence.
- Peer dependency is now `solid-js` 2.0.

### New

- `createGraphQLMutation(url, options)` returns a `mutate` function built on `action()`. It supports optimistic writes (`optimistic`), marks the queries it changes as pending while in flight and refreshes them on success (`refresh`), reverts optimistic writes on failure, and can send `multipart/form-data` (`multipart`).
