import { describe, it, expect } from "vitest";
import {
  withRetry,
  withTimeout,
  withAbort,
  sequential,
  once,
  withProgress,
  tryCatch,
  withOptimistic,
  pipe,
  type ActionFn,
} from "../src/index.js";

/** Drive a generator to completion — same helper as in index.test.ts. */
function run<T>(gen: Generator<unknown, T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    function step(value: unknown, isThrow: boolean): void {
      let result: IteratorResult<unknown, T>;
      try {
        result = isThrow ? gen.throw(value) : gen.next(value);
      } catch (e) {
        reject(e);
        return;
      }
      if (result.done) resolve(result.value);
      else Promise.resolve(result.value).then(v => step(v, false), e => step(e, true));
    }
    step(undefined, false);
  });
}

function invoke<A extends any[], R>(fn: ActionFn<A, R>, ...args: A): Promise<R> {
  return run(fn(...args));
}

// All wrappers are pure generator transformers with no DOM or browser APIs,
// so they should work identically in server (SSR) context.

describe("server (SSR) safety", () => {
  it("withRetry works in server context", async () => {
    const fn = withRetry(function* () { return yield Promise.resolve("ssr"); }, { attempts: 1 });
    expect(await invoke(fn)).toBe("ssr");
  });

  it("withRetry retries in server context", async () => {
    let attempts = 0;
    const fn = withRetry(function* () {
      attempts++;
      if (attempts < 2) throw new Error("try again");
      return yield Promise.resolve("ok");
    }, { attempts: 3, delay: 0 });
    expect(await invoke(fn)).toBe("ok");
    expect(attempts).toBe(2);
  });

  it("withTimeout works in server context", async () => {
    const fn = withTimeout(function* () { return yield Promise.resolve("fast"); }, 1_000);
    expect(await invoke(fn)).toBe("fast");
  });

  it("withAbort works in server context", async () => {
    const fn = withAbort(function* (n: number) { return yield Promise.resolve(n); });
    expect(await invoke(fn, 7)).toBe(7);
  });

  it("sequential works in server context", async () => {
    const fn = sequential(function* (n: number) { return yield Promise.resolve(n); });
    expect(await invoke(fn, 7)).toBe(7);
  });

  it("once works in server context", async () => {
    const fn = once(function* () { return yield Promise.resolve("one"); });
    // First call runs normally
    expect(await invoke(fn)).toBe("one");
    // Sequential second call also runs — once only blocks concurrent in-flight calls
    expect(await invoke(fn)).toBe("one");
  });

  it("withProgress works in server context", async () => {
    const reports: number[] = [];
    const fn = withProgress(
      (n: number) => reports.push(n),
      function* (x: number, progress: (n: number) => void) {
        progress(x);
        return yield Promise.resolve(x);
      },
    );
    expect(await invoke(fn, 42)).toBe(42);
    expect(reports).toEqual([42]);
  });

  it("tryCatch works in server context", async () => {
    const fn = tryCatch(
      function* () { throw new Error("server-err"); },
      function* (err) { return `handled:${(err as Error).message}`; },
    );
    expect(await invoke(fn)).toBe("handled:server-err");
  });

  it("withOptimistic works in server context", async () => {
    const sets: string[] = [];
    const store = [
      () => [] as string[],
      (_fn: (d: string[]) => void) => sets.push("optimistic"),
    ] as const;
    const fn = withOptimistic(store, function* (item: string, { optimistic }) {
      optimistic(d => d.push(item));
      return yield Promise.resolve(item);
    });
    expect(await invoke(fn, "x")).toBe("x");
    expect(sets).toEqual(["optimistic"]);
  });

  it("pipe works in server context", async () => {
    const fn = pipe(
      withRetry({ attempts: 2, delay: 0 }),
    )(function* () { return yield Promise.resolve("piped"); });
    expect(await invoke(fn)).toBe("piped");
  });
});
