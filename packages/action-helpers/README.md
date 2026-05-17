<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=action-helpers" alt="Solid Primitives action-helpers">
</p>

# @solid-primitives/action-helpers

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/action-helpers?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/action-helpers)
[![version](https://img.shields.io/npm/v/@solid-primitives/action-helpers?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/action-helpers)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Composable generator wrappers for Solid 2.0 `action(fn*)`. Each helper transforms a generator function into a generator function, so they compose cleanly via function wrapping or the included `pipe` utility.

```ts
const reliableUpload = action(
  pipe(
    withTimeout(30_000),
    withRetry({ attempts: 3, backoff: "exponential" }),
    withProgress(setUploadProgress),
  )(function* (file, progress) {
    yield api.upload(file, { onProgress: progress });
    refresh(fileList);
  }),
);
```

## Installation

```bash
npm install @solid-primitives/action-helpers
# or
yarn add @solid-primitives/action-helpers
# or
pnpm add @solid-primitives/action-helpers
```

## Available helpers

- [`withRetry`](#withretry) — retry on failure with configurable backoff
- [`withTimeout`](#withtimeout) — cancel if the action exceeds a time limit
- [`withAbort`](#withabort) — cancel any in-flight call when a new one starts
- [`sequential`](#sequential) — queue calls so they never run concurrently
- [`once`](#once) — ignore concurrent calls while one is already in-flight
- [`withProgress`](#withprogress) — inject a progress callback into the generator
- [`tryCatch`](#trycatch) — recover from errors inline with a second generator
- [`withOptimistic`](#withoptimistic) — shorthand for the optimistic-update pattern
- [`pipe`](#pipe) — compose wrappers left-to-right without nesting

## Design convention

Every helper wraps a generator function and returns a generator function:

```ts
type ActionFn<Args extends any[], Return> = (...args: Args) => Generator<unknown, Return>;
```

This means all helpers compose — the return of one is valid input to another — and all work directly with Solid 2.0's `action(fn*)`.

---

### `withRetry`

Retry a failing action automatically. Optionally configure the number of attempts, base delay, backoff strategy, and a predicate that decides whether a specific error should trigger a retry.

```ts
const save = action(
  withRetry(
    function* (data) {
      yield api.save(data);
    },
    {
      attempts: 3,
      delay: 1_000,
      backoff: "exponential", // 1s, 2s, 4s
      when: err => err.code !== 401, // don't retry auth errors
    },
  ),
);
```

#### Definition

```ts
function withRetry<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  options: RetryOptions,
): ActionFn<Args, Return>;

// Curried form for use with pipe
function withRetry(options: RetryOptions): <Args, Return>(fn: ActionFn<Args, Return>) => ActionFn<Args, Return>;
```

```ts
interface RetryOptions {
  attempts?: number;              // default: 3
  delay?: number;                 // base delay in ms, default: 1000
  backoff?: "exponential"         // delay * 2^attempt
           | "linear"             // delay * (attempt + 1)
           | "none";              // constant delay (default)
  when?: (err: unknown) => boolean; // return false to skip retrying
}
```

---

### `withTimeout`

Cancel the action with a `TimeoutError` (a `DOMException`) if it has not completed within the given number of milliseconds.

```ts
const load = action(
  withTimeout(function* (id) {
    return yield api.fetchUser(id);
  }, 5_000),
);
```

#### Definition

```ts
function withTimeout<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  ms: number,
): ActionFn<Args, Return>;

// Curried form for use with pipe
function withTimeout(ms: number): <Args, Return>(fn: ActionFn<Args, Return>) => ActionFn<Args, Return>;
```

---

### `withAbort`

When a new call arrives, abort the previous in-flight call (like RxJS `switchMap`). The aborted call rejects with an `AbortError`.

```ts
const search = action(
  withAbort(function* (query) {
    return yield api.search(query);
  }),
);
```

#### Definition

```ts
function withAbort<Args extends any[], Return>(fn: ActionFn<Args, Return>): ActionFn<Args, Return>;
```

`withAbort` creates a **shared abort controller** across calls. Each new invocation of the returned action function replaces it.

---

### `sequential`

Queue calls so they run one at a time in the order they were made. A new call waits until the previous one finishes before starting.

```ts
const processItem = action(
  sequential(function* (item) {
    yield api.processItem(item);
  }),
);
```

#### Definition

```ts
function sequential<Args extends any[], Return>(fn: ActionFn<Args, Return>): ActionFn<Args, Return>;
```

Like `withAbort`, `sequential` maintains **shared state** across calls. All invocations of the returned action function share the same queue.

---

### `once`

Allow only one in-flight execution at a time. Subsequent calls that arrive while the first is still running return `undefined` immediately without executing the generator. Calls that arrive after the first has finished run normally.

```ts
const init = action(
  once(function* () {
    const config = yield api.getConfig();
    setConfig(config);
  }),
);
```

#### Definition

```ts
function once<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
): ActionFn<Args, Return | undefined>;
```

---

### `withProgress`

Inject a progress callback as the last argument to the generator. When called, the callback forwards the value to the `setProgress` setter you provide (typically the setter from a `createSignal`).

```ts
const [progress, setProgress] = createSignal(0);

const upload = action(
  withProgress(setProgress, function* (file, progress) {
    yield api.uploadWithProgress(file, {
      onProgress: pct => progress(pct),
    });
  }),
);
```

#### Definition

```ts
function withProgress<Args extends any[], Return>(
  setProgress: (pct: number) => void,
  fn: (...args: [...Args, progress: (pct: number) => void]) => Generator<unknown, Return>,
): ActionFn<Args, Return>;

// Curried form for use with pipe
function withProgress(
  setProgress: (pct: number) => void,
): <Args, Return>(
  fn: (...args: [...Args, progress: (pct: number) => void]) => Generator<unknown, Return>
) => ActionFn<Args, Return>;
```

The `progress` parameter is appended to the end of the generator's argument list, so the outer action signature remains `(file) => ...` rather than `(file, progress) => ...`.

---

### `tryCatch`

Recover from errors inline using a second generator as the error handler. The handler receives the error as its first argument followed by the original call arguments, and can itself yield async work.

```ts
const submit = action(
  tryCatch(
    function* (data) {
      yield api.submit(data);
    },
    function* (err, data) {
      console.error("Submit failed", err);
      yield api.submitFallback(data);
    },
  ),
);
```

#### Definition

```ts
function tryCatch<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  onError: (err: unknown, ...args: Args) => Generator<unknown, Return | void>,
): ActionFn<Args, Return | void>;
```

---

### `withOptimistic`

Inject an `{ optimistic }` setter into the generator for the optimistic-update pattern. Pass the `[getter, setter]` tuple returned by `createOptimisticStore`. Call `refresh(getter)` explicitly after the async work to re-sync from the server.

```ts
const todos = createOptimisticStore(() => api.getTodos(), []);

const addTodo = action(
  withOptimistic(todos, function* (todo, { optimistic }) {
    optimistic(d => d.push(todo)); // immediate optimistic update
    yield api.addTodo(todo);       // server write
    refresh(todos[0]);             // re-sync
  }),
);
```

#### Definition

```ts
function withOptimistic<T, Args extends any[], Return>(
  store: readonly [() => T, (updater: (draft: T) => void) => void],
  fn: (...args: [...Args, OptimisticContext<T>]) => Generator<unknown, Return>,
): ActionFn<Args, Return>;

// Curried form for use with pipe
function withOptimistic<T>(
  store: readonly [() => T, (updater: (draft: T) => void) => void],
): <Args, Return>(
  fn: (...args: [...Args, OptimisticContext<T>]) => Generator<unknown, Return>
) => ActionFn<Args, Return>;

interface OptimisticContext<T> {
  optimistic: (updater: (draft: T) => void) => void;
}
```

---

### `pipe`

Compose wrappers left-to-right. The first wrapper listed is outermost — it executes first when the action is called.

```ts
const reliableUpload = action(
  pipe(
    withTimeout(30_000),
    withRetry({ attempts: 3, backoff: "exponential" }),
    withProgress(setUploadProgress),
  )(function* (file, progress) {
    yield api.upload(file, { onProgress: progress });
    refresh(fileList);
  }),
);
```

#### Definition

```ts
function pipe<Args extends any[], Return>(
  ...wrappers: Array<(fn: ActionFn<any, any>) => ActionFn<any, any>>
): (fn: ActionFn<Args, Return>) => ActionFn<Args, Return>;
```

`withAbort`, `sequential`, and `once` are already wrapper-shaped (`fn => fn`) and can be passed directly without calling them:

```ts
pipe(withAbort, withRetry({ attempts: 2, delay: 0 }))(myFn);
```

---

## Stateful wrappers

`withAbort`, `sequential`, and `once` each maintain internal state (an abort controller, a queue, and an in-flight flag respectively). That state is **shared across all invocations** of the returned action function — which is exactly the intended behaviour for Solid actions.

If you need isolated state per call site, wrap the helper in a factory:

```ts
function makeRetryingFetch() {
  return withAbort(function* (url) { return yield fetch(url); });
}

const fetchA = action(makeRetryingFetch());
const fetchB = action(makeRetryingFetch()); // independent abort state
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
