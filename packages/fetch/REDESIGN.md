# `@solid-primitives/fetch` — Solid 2.0 Redesign

## What's Wrong With the Current Design

The entire package is architecturally coupled to `createResource`, which is gone in 2.0. Beyond that, the design has deeper problems:

1. **Reads and mutations are conflated.** `createFetch` handles both fetching data *and* triggering updates, using the same primitive with modifiers layered on top. Solid 2.0 draws a hard line: reads are async memos, mutations are actions.

2. **The modifier chain is inside-out.** `withAbort`, `withRetry`, `withTimeout` wrap the *resource* — meaning they're interleaved with Solid's reactive scheduling. In 2.0 these belong on the *action* (generator) side where they compose naturally via `yield`.

3. **`withCatchAll` is an anti-pattern in 2.0.** The whole point of async memos + `<Loading>` / `<Errored>` is that you don't need to defensively catch at the data layer. `withCatchAll` exists because `createResource` required it. It shouldn't.

4. **`withAggregation` is unrelated to fetching.** It's a data transformation concern that happens to be bundled here because it was convenient with `createResource`.

5. **`withRefetchEvent` is side-effectful in a read primitive.** Visibility change listeners on a resource that's supposed to be a pure derivation of its inputs.

6. **`withCache` is doing too much.** Storage persistence, TTL, invalidation, polling — all wired into a resource modifier.

---

## The Solid 2.0 Mental Model Applied to Fetch

```
Read:     URL signal → async createMemo → <Loading> → render
Mutation: user event → action(fn*) → yield fetch → refresh(memo) → rerender
```

These are separate concerns. The package should reflect that.

---

## Redesigned API

### Reads — `createFetch`

An async `createMemo` wrapper with DX helpers. Returns an accessor that throws while pending (integrating with `<Loading>`) and propagates errors to `<Errored>`.

```ts
// Minimal
const user = createFetch<User>(() => `/api/users/${id()}`);

// With reactive init
const feed = createFetch<Post[]>(
  () => `/api/feed`,
  () => ({ headers: { Authorization: `Bearer ${token()}` } }),
);

// With options
const data = createFetch<User>(
  () => `/api/users/${id()}`,
  () => ({ headers: auth() }),
  {
    transform: res => res.json(),   // default: auto content-type detection
    timeout: 5_000,
    abort: true,                    // abort in-flight when reactive deps change
  }
);

// In JSX — no special wrapper needed
<Loading fallback={<Spinner />}>
  <Errored fallback={(err, reset) => <Error error={err()} retry={reset} />}>
    <Profile user={user()} />
  </Errored>
</Loading>
```

**Type signature:**

```ts
function createFetch<T>(
  url: () => string | Request | null | undefined,
  init?: () => RequestInit,
  options?: {
    transform?: (res: Response) => Promise<T>;
    timeout?: number;
    abort?: boolean;           // default: true — abort on reactive re-run
    fetch?: typeof globalThis.fetch;
  }
): Accessor<T>
```

Returning `null | undefined` from the url accessor suspends fetching (replaces the "lazy" Accessor-returning-undefined pattern from 1.x).

---

### Cache — `createFetch` with `cache` option + `createFetchCache`

Caching is an opt-in option on reads, not a modifier chain:

```ts
// Inline TTL cache
const user = createFetch<User>(
  () => `/api/users/${id()}`,
  undefined,
  { cache: { ttl: 60_000 } }
);

// Shared cache instance (cross-component)
const userCache = createFetchCache<User>({ ttl: 60_000 });

const user = createFetch<User>(() => `/api/users/${id()}`, undefined, { cache: userCache });
const admin = createFetch<User>(() => `/api/admin/${id()}`, undefined, { cache: userCache });

// Explicit invalidation — integrates with Solid 2.0's refresh()
refresh(user);          // re-fetches, bypasses cache
userCache.delete(key);  // remove specific entry
userCache.clear();      // flush all
```

**Persistent cache** becomes a separate layer, not baked into the core:

```ts
const userCache = createFetchCache<User>({
  ttl: 60_000,
  storage: localStorage,   // serializes/deserializes automatically
  key: "user-cache",
});
```

---

### Mutations — `fetchAction` helper + native `action()`

Mutations use Solid 2.0's `action(fn*)` directly. The package provides typed fetch helpers designed to be `yield`-ed inside generators:

```ts
import { fetchJSON, fetchText, fetchBlob } from "@solid-primitives/fetch";
import { action } from "solid-js";

// fetchJSON / fetchText / fetchBlob return promises — yield them inside action()
const updateUser = action(function*(user: User) {
  const updated = yield fetchJSON<User>(`/api/users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  });
  refresh(userFetch);   // recompute the read memo
  return updated;
});

// Compose with action-helpers for retry/abort/optimistic
import { withRetry, withAbort, withOptimistic } from "@solid-primitives/action-helpers";

const searchUsers = action(withAbort(function*(query: string) {
  return yield fetchJSON<User[]>(`/api/users?q=${query}`);
}));

const addTodo = action(withOptimistic(todos, withRetry(function*(todo: Todo) {
  yield fetchJSON("/api/todos", { method: "POST", body: JSON.stringify(todo) });
  refresh(todosFetch);
}, { attempts: 3 })));
```

**Type signatures:**

```ts
function fetchJSON<T>(url: string | Request, init?: RequestInit): Promise<T>
function fetchText(url: string | Request, init?: RequestInit): Promise<string>
function fetchBlob(url: string | Request, init?: RequestInit): Promise<Blob>
function fetchVoid(url: string | Request, init?: RequestInit): Promise<void>

// Lower level — run fetch + get raw Response, throws on non-ok
function fetchRequest(url: string | Request, init?: RequestInit): Promise<Response>
```

Each throws a typed `FetchError` on non-2xx that carries `.status`, `.response`, and `.body`.

---

### Auto Content-Type Detection

Kept from the 1.x design — it's a genuinely useful DX convenience:

```ts
// Exported as standalone transforms for explicit use
export const autoTransform = (res: Response): Promise<unknown> => {
  const ct = res.headers.get("Content-Type") ?? "";
  if (ct.includes("application/json")) return res.json();
  if (ct.startsWith("text/"))           return res.text();
  return res.blob();
};
```

`createFetch` uses this by default. Override via `transform` option.

---

### Stale-While-Revalidate — `isPending` integration

Solid 2.0's `isPending` tells you if a memo is re-computing while serving stale data. No custom `withRefetchEvent` needed:

```ts
const users = createFetch<User[]>(() => `/api/users`);
const isRefreshing = () => isPending(users);

// Refetch on window focus — raw effect + refresh()
createEffect(() => {}, () => {
  window.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh(users);
  });
});

// Or as a small utility
import { createRefetchOn } from "@solid-primitives/fetch";
createRefetchOn(users, ["visibilitychange", "online"]);
```

---

### Error Handling

No `withCatchAll`. Use `<Errored>` or read the error at the signal level:

```ts
// Boundary approach (preferred)
<Errored fallback={(err, reset) => <RetryUI error={err()} onRetry={reset} />}>
  <UserList users={users()} />
</Errored>

// Inline approach — createFetchResult returns [data, error] instead of throwing
const [users, usersError] = createFetchResult<User[]>(() => `/api/users`);

if (usersError()) return <ErrorMessage error={usersError()} />;
return <UserList users={users()} />;
```

`createFetchResult` is a thin wrapper that catches and exposes the error as a signal rather than propagating it — for cases where boundaries aren't practical.

---

## Package Structure

```
packages/fetch/src/
├── index.ts              # public re-exports
├── createFetch.ts        # async memo wrapper (reads)
├── createFetchResult.ts  # [data, error] tuple variant
├── fetchRequest.ts       # fetchJSON / fetchText / fetchBlob / fetchVoid
├── cache.ts              # createFetchCache, CacheOptions, CacheEntry
├── transforms.ts         # json, text, blob, autoTransform
└── refetch.ts            # createRefetchOn utility
```

---

## Migration from 1.x → 2.0

| 1.x | 2.0 |
|---|---|
| `createFetch(url)` | `createFetch(url)` — same shape, different internals |
| `createFetch(url, init, {}, [withAbort()])` | `createFetch(url, init)` — abort is default |
| `createFetch(url, init, {}, [withRetry(3)])` | `action(withRetry(fn*, {attempts:3}))` — retry is on mutations |
| `createFetch(url, init, {}, [withTimeout(5000)])` | `createFetch(url, init, { timeout: 5000 })` for reads; `action(withTimeout(fn*, 5000))` for mutations |
| `createFetch(url, init, {}, [withCache({expires: 60000})])` | `createFetch(url, init, { cache: { ttl: 60000 } })` |
| `createFetch(url, init, {}, [withCacheStorage()])` | `createFetchCache({ storage: localStorage })` |
| `createFetch(url, init, {}, [withCatchAll()])` | `createFetchResult(url)` or `<Errored>` boundary |
| `createFetch(url, init, {}, [withRefetchEvent()])` | `createRefetchOn(fetch, ["visibilitychange"])` |
| `createFetch(url, init, {}, [withAggregation()])` | Remove — compose with `createMemo` or `reduce` |
| `resource.aborted` | `isPending(fetch)` + action state |
| `actions.abort()` | `withAbort` action helper |
| `actions.invalidate()` | `refresh(fetch)` (Solid 2.0 native) |

---

## What Gets Removed Entirely

- `wrapFetcher` / `wrapResource` — internal implementation detail of the modifier chain, gone with it
- `RequestContext` — the extensible context object that modifiers mutated; not needed when mutations and reads are separate
- `withAggregation` — data transformation, not a fetch concern
- `withRefetchEvent` — replaced by `createRefetchOn` helper (or just raw effect + `refresh`)
- `withCatchAll` — `<Errored>` does this better
- `node-fetch` optional dependency — Node 18+ has native `fetch`

---

## Key Insight

The 1.x modifier chain was trying to solve the problem that `createResource` was the only async primitive and everything had to bolt onto it. In 2.0, async memos handle reads natively and `action(fn*)` handles mutations natively. The fetch package stops being a resource-management system and becomes what it should always have been: **a typed HTTP utility layer with good Solid integration**.
