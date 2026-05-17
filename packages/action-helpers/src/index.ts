export type ActionFn<Args extends any[], Return> = (...args: Args) => Generator<unknown, Return>;

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  attempts?: number;
  /** Base delay in milliseconds between retries (default: 1000) */
  delay?: number;
  /** Backoff strategy (default: "none") */
  backoff?: "exponential" | "linear" | "none";
  /** Return false to skip retrying for a specific error */
  when?: (err: unknown) => boolean;
}

export interface OptimisticContext<T> {
  optimistic: (updater: (draft: T) => void) => void;
}

function driveGenerator<T>(gen: Generator<unknown, T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    function step(value: unknown, isThrow: boolean): void {
      let result: IteratorResult<unknown, T>;
      try {
        result = isThrow ? gen.throw(value) : gen.next(value);
      } catch (e) {
        reject(e);
        return;
      }
      if (result.done) {
        resolve(result.value);
      } else {
        Promise.resolve(result.value).then(v => step(v, false), e => step(e, true));
      }
    }
    step(undefined, false);
  });
}

function driveGeneratorWithAbort<T>(gen: Generator<unknown, T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    safeReturn(gen);
    return Promise.reject(toAbortError(signal));
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const onAbort = () => {
      if (settled) return;
      settled = true;
      safeReturn(gen);
      reject(toAbortError(signal));
    };

    signal.addEventListener("abort", onAbort, { once: true });

    function step(value: unknown, isThrow: boolean): void {
      if (settled) return;
      let result: IteratorResult<unknown, T>;
      try {
        result = isThrow ? gen.throw(value) : gen.next(value);
      } catch (e) {
        settled = true;
        signal.removeEventListener("abort", onAbort);
        reject(e);
        return;
      }
      if (result.done) {
        settled = true;
        signal.removeEventListener("abort", onAbort);
        resolve(result.value);
      } else {
        Promise.resolve(result.value).then(
          v => { if (!settled) step(v, false); },
          e => { if (!settled) step(e, true); },
        );
      }
    }

    step(undefined, false);
  });
}

function toAbortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
}

function safeReturn<T>(gen: Generator<unknown, T>): void {
  try { gen.return(undefined as unknown as T); } catch (_) { /* noop */ }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a generator action on failure with configurable delay and backoff.
 *
 * @example
 * const save = action(withRetry(function*(data) {
 *   yield api.save(data);
 * }, { attempts: 3, delay: 1000, backoff: "exponential" }));
 */
export function withRetry<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  options: RetryOptions,
): ActionFn<Args, Return>;
export function withRetry(
  options: RetryOptions,
): <Args extends any[], Return>(fn: ActionFn<Args, Return>) => ActionFn<Args, Return>;
export function withRetry(
  fnOrOptions: ActionFn<any, any> | RetryOptions,
  options?: RetryOptions,
): ActionFn<any, any> | (<A extends any[], R>(fn: ActionFn<A, R>) => ActionFn<A, R>) {
  if (typeof fnOrOptions === "function") {
    return withRetryImpl(fnOrOptions, options ?? {});
  }
  return <A extends any[], R>(fn: ActionFn<A, R>) => withRetryImpl(fn, fnOrOptions);
}

function withRetryImpl<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  opts: RetryOptions,
): ActionFn<Args, Return> {
  const maxAttempts = opts.attempts ?? 3;
  const baseDelay = opts.delay ?? 1000;
  const backoff = opts.backoff ?? "none";
  const shouldRetry = opts.when;

  return function* (...args: Args): Generator<unknown, Return> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return (yield driveGenerator(fn(...args))) as Return;
      } catch (err) {
        if (attempt === maxAttempts - 1) throw err;
        if (shouldRetry && !shouldRetry(err)) throw err;
        if (baseDelay > 0) {
          const wait =
            backoff === "exponential" ? baseDelay * 2 ** attempt :
            backoff === "linear" ? baseDelay * (attempt + 1) :
            baseDelay;
          yield sleep(wait);
        }
      }
    }
    throw new Error("unreachable");
  };
}

/**
 * Cancel the action if it takes longer than `ms` milliseconds.
 *
 * @example
 * const load = action(withTimeout(function*(id) {
 *   return yield api.fetchUser(id);
 * }, 5_000));
 */
export function withTimeout<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  ms: number,
): ActionFn<Args, Return>;
export function withTimeout(
  ms: number,
): <Args extends any[], Return>(fn: ActionFn<Args, Return>) => ActionFn<Args, Return>;
export function withTimeout(
  fnOrMs: ActionFn<any, any> | number,
  ms?: number,
): ActionFn<any, any> | (<A extends any[], R>(fn: ActionFn<A, R>) => ActionFn<A, R>) {
  if (typeof fnOrMs === "function") {
    return withTimeoutImpl(fnOrMs, ms!);
  }
  return <A extends any[], R>(fn: ActionFn<A, R>) => withTimeoutImpl(fn, fnOrMs);
}

function withTimeoutImpl<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  ms: number,
): ActionFn<Args, Return> {
  return function* (...args: Args): Generator<unknown, Return> {
    const controller = new AbortController();
    const id = setTimeout(
      () => controller.abort(new DOMException(`Action timed out after ${ms}ms`, "TimeoutError")),
      ms,
    );
    try {
      return (yield driveGeneratorWithAbort(fn(...args), controller.signal)) as Return;
    } finally {
      clearTimeout(id);
    }
  };
}

/**
 * Abort any in-flight call when a new one arrives (like RxJS switchMap).
 * The previous call rejects with an AbortError.
 *
 * @example
 * const search = action(withAbort(function*(query) {
 *   return yield api.search(query);
 * }));
 */
export function withAbort<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
): ActionFn<Args, Return> {
  let current: AbortController | null = null;

  return function* (...args: Args): Generator<unknown, Return> {
    current?.abort();
    const controller = new AbortController();
    current = controller;
    try {
      return (yield driveGeneratorWithAbort(fn(...args), controller.signal)) as Return;
    } finally {
      if (current === controller) current = null;
    }
  };
}

/**
 * Queue calls so they never run concurrently — each waits for the previous to finish.
 *
 * @example
 * const processItem = action(sequential(function*(item) {
 *   yield api.processItem(item);
 * }));
 */
export function sequential<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
): ActionFn<Args, Return> {
  const queue: Array<() => void> = [];
  let running = false;

  return function* (...args: Args): Generator<unknown, Return> {
    if (running) {
      yield new Promise<void>(resolve => queue.push(resolve));
    } else {
      running = true;
    }
    try {
      return (yield driveGenerator(fn(...args))) as Return;
    } finally {
      const next = queue.shift();
      if (next) next();
      else running = false;
    }
  };
}

/**
 * Let the first call run; ignore (return undefined) subsequent calls while in-flight.
 *
 * @example
 * const init = action(once(function*() {
 *   const config = yield api.getConfig();
 *   setConfig(config);
 * }));
 */
export function once<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
): ActionFn<Args, Return | undefined> {
  let inflight = false;

  return function* (...args: Args): Generator<unknown, Return | undefined> {
    if (inflight) return undefined;
    inflight = true;
    try {
      return (yield driveGenerator(fn(...args))) as Return;
    } finally {
      inflight = false;
    }
  };
}

/**
 * Inject a progress callback into the generator as an extra trailing argument.
 *
 * @example
 * const upload = action(withProgress(setProgress, function*(file, progress) {
 *   yield api.uploadWithProgress(file, { onProgress: pct => progress(pct) });
 * }));
 */
export function withProgress<Args extends any[], Return>(
  setProgress: (pct: number) => void,
  fn: (...args: [...Args, progress: (pct: number) => void]) => Generator<unknown, Return>,
): ActionFn<Args, Return>;
export function withProgress(
  setProgress: (pct: number) => void,
): <Args extends any[], Return>(
  fn: (...args: [...Args, progress: (pct: number) => void]) => Generator<unknown, Return>,
) => ActionFn<Args, Return>;
export function withProgress(
  setProgress: (pct: number) => void,
  fn?: (...args: any[]) => Generator<unknown, any>,
): ActionFn<any, any> | ((fn: (...args: any[]) => Generator<unknown, any>) => ActionFn<any, any>) {
  if (fn) return withProgressImpl(setProgress, fn);
  return (innerFn: (...args: any[]) => Generator<unknown, any>) =>
    withProgressImpl(setProgress, innerFn);
}

function withProgressImpl<Args extends any[], Return>(
  setProgress: (pct: number) => void,
  fn: (...args: any[]) => Generator<unknown, Return>,
): ActionFn<Args, Return> {
  return function* (...args: Args): Generator<unknown, Return> {
    return (yield driveGenerator(fn(...args, setProgress))) as Return;
  };
}

/**
 * Recover from errors inline using a second generator as the error handler.
 * The error handler receives the error and the original arguments.
 *
 * @example
 * const submit = action(tryCatch(
 *   function*(data) { yield api.submit(data); },
 *   function*(err, data) { yield api.submitFallback(data); }
 * ));
 */
export function tryCatch<Args extends any[], Return>(
  fn: ActionFn<Args, Return>,
  onError: (err: unknown, ...args: Args) => Generator<unknown, Return | void>,
): ActionFn<Args, Return | void> {
  return function* (...args: Args): Generator<unknown, Return | void> {
    try {
      return (yield driveGenerator(fn(...args))) as Return;
    } catch (err) {
      return (yield driveGenerator(onError(err, ...args))) as Return | void;
    }
  };
}

/**
 * Inject an `optimistic` setter into the generator for the optimistic-update pattern.
 * Pass the `[getter, setter]` tuple from `createOptimisticStore`.
 * Call `refresh(getter)` explicitly in your generator after the async work if needed.
 *
 * @example
 * const todos = createOptimisticStore(() => api.getTodos(), []);
 * const addTodo = action(withOptimistic(todos, function*(todo, { optimistic }) {
 *   optimistic(d => d.push(todo));
 *   yield api.addTodo(todo);
 *   refresh(todos[0]);
 * }));
 */
export function withOptimistic<T, Args extends any[], Return>(
  store: readonly [() => T, (updater: (draft: T) => void) => void],
  fn: (...args: [...Args, OptimisticContext<T>]) => Generator<unknown, Return>,
): ActionFn<Args, Return>;
export function withOptimistic<T>(
  store: readonly [() => T, (updater: (draft: T) => void) => void],
): <Args extends any[], Return>(
  fn: (...args: [...Args, OptimisticContext<T>]) => Generator<unknown, Return>,
) => ActionFn<Args, Return>;
export function withOptimistic<T>(
  store: readonly [() => T, (updater: (draft: T) => void) => void],
  fn?: (...args: any[]) => Generator<unknown, any>,
): ActionFn<any, any> | ((fn: (...args: any[]) => Generator<unknown, any>) => ActionFn<any, any>) {
  if (fn) return withOptimisticImpl(store, fn);
  return (innerFn: (...args: any[]) => Generator<unknown, any>) =>
    withOptimisticImpl(store, innerFn);
}

function withOptimisticImpl<T, Args extends any[], Return>(
  store: readonly [() => T, (updater: (draft: T) => void) => void],
  fn: (...args: any[]) => Generator<unknown, Return>,
): ActionFn<Args, Return> {
  const setter = store[1];
  return function* (...args: Args): Generator<unknown, Return> {
    const ctx: OptimisticContext<T> = { optimistic: setter };
    return (yield driveGenerator(fn(...args, ctx))) as Return;
  };
}

/**
 * Compose action wrappers left-to-right without nesting.
 *
 * @example
 * const reliableUpload = action(
 *   pipe(
 *     withTimeout(30_000),
 *     withRetry({ attempts: 3, backoff: "exponential" }),
 *     withProgress(setUploadProgress),
 *   )(function*(file, progress) {
 *     yield api.upload(file, { onProgress: progress });
 *   })
 * );
 */
export function pipe<Args extends any[], Return>(
  ...wrappers: Array<(fn: ActionFn<any, any>) => ActionFn<any, any>>
): (fn: ActionFn<Args, Return>) => ActionFn<Args, Return> {
  // reduceRight so that pipe(A, B)(fn) = A(B(fn)), meaning A executes first
  return fn => wrappers.reduceRight((acc, wrap) => wrap(acc), fn) as ActionFn<Args, Return>;
}
