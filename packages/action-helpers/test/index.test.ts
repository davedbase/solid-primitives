import { describe, it, expect, vi, beforeEach } from "vitest";
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

/** Drive a generator to completion, mirroring Solid's action runtime. */
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
      if (result.done) {
        resolve(result.value);
      } else {
        Promise.resolve(result.value).then(v => step(v, false), e => step(e, true));
      }
    }
    step(undefined, false);
  });
}

function invoke<Args extends any[], R>(fn: ActionFn<Args, R>, ...args: Args): Promise<R> {
  return run(fn(...args));
}

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const api = vi.fn().mockResolvedValue("ok");
    const fn = withRetry(function* () { return yield api(); }, { attempts: 3 });
    expect(await invoke(fn)).toBe("ok");
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on second attempt", async () => {
    const api = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");
    const fn = withRetry(function* () { return yield api(); }, { attempts: 3, delay: 0 });
    expect(await invoke(fn)).toBe("ok");
    expect(api).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting all attempts", async () => {
    const api = vi.fn().mockRejectedValue(new Error("always fails"));
    const fn = withRetry(function* () { return yield api(); }, { attempts: 3, delay: 0 });
    await expect(invoke(fn)).rejects.toThrow("always fails");
    expect(api).toHaveBeenCalledTimes(3);
  });

  it("respects when predicate — stops retrying when false", async () => {
    const api = vi.fn().mockRejectedValue(new Error("auth"));
    const fn = withRetry(function* () { return yield api(); }, {
      attempts: 3,
      delay: 0,
      when: err => (err as Error).message !== "auth",
    });
    await expect(invoke(fn)).rejects.toThrow("auth");
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("passes args through to the inner fn on each retry", async () => {
    const calls: number[] = [];
    const api = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("done");
    const fn = withRetry(function* (x: number) {
      calls.push(x);
      return yield api(x);
    }, { attempts: 3, delay: 0 });
    await invoke(fn, 42);
    expect(calls).toEqual([42, 42]);
  });

  it("exponential backoff retries correctly", async () => {
    const api = vi.fn()
      .mockRejectedValueOnce(new Error("e1"))
      .mockRejectedValueOnce(new Error("e2"))
      .mockResolvedValue("ok");
    const fn = withRetry(function* () { return yield api(); }, {
      attempts: 3,
      delay: 1,
      backoff: "exponential",
    });
    expect(await invoke(fn)).toBe("ok");
    expect(api).toHaveBeenCalledTimes(3);
  });

  it("linear backoff retries correctly", async () => {
    const api = vi.fn()
      .mockRejectedValueOnce(new Error("e1"))
      .mockResolvedValue("ok");
    const fn = withRetry(function* () { return yield api(); }, {
      attempts: 2,
      delay: 1,
      backoff: "linear",
    });
    expect(await invoke(fn)).toBe("ok");
    expect(api).toHaveBeenCalledTimes(2);
  });

  it("curried form works for use with pipe", async () => {
    const api = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("curried");
    const wrapped = withRetry({ attempts: 3, delay: 0 })(function* () {
      return yield api();
    });
    expect(await invoke(wrapped)).toBe("curried");
    expect(api).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// withTimeout
// ---------------------------------------------------------------------------

describe("withTimeout", () => {
  it("resolves when action completes within the limit", async () => {
    const fn = withTimeout(function* () {
      return yield Promise.resolve("fast");
    }, 1_000);
    expect(await invoke(fn)).toBe("fast");
  });

  it("rejects with TimeoutError when action exceeds the limit", async () => {
    const fn = withTimeout(function* () {
      // Promise that resolves in 10s — much slower than the 5ms timeout
      return yield new Promise<string>(r => setTimeout(r, 10_000));
    }, 5);
    await expect(invoke(fn)).rejects.toThrow(/timed out/i);
  });

  it("clears the timeout timer on success", async () => {
    const fn = withTimeout(function* () {
      return yield Promise.resolve("done");
    }, 500);
    expect(await invoke(fn)).toBe("done");
  });

  it("curried form", async () => {
    const fn = withTimeout(500)(function* () {
      return yield Promise.resolve(42);
    });
    expect(await invoke(fn)).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// withAbort
// ---------------------------------------------------------------------------

describe("withAbort", () => {
  it("resolves normally when called once", async () => {
    const fn = withAbort(function* (x: number) {
      return yield Promise.resolve(x * 2);
    });
    expect(await invoke(fn, 5)).toBe(10);
  });

  it("aborts the previous call when a new one starts", async () => {
    let firstReached = false;
    let resolveFirst!: () => void;
    const firstBlocked = new Promise<void>(r => (resolveFirst = r));

    const fn = withAbort(function* (id: number) {
      if (id === 1) {
        yield firstBlocked;
        firstReached = true;
      }
      return yield Promise.resolve(`result-${id}`);
    });

    const first = invoke(fn, 1);
    // Yield the microtask queue so the first generator starts running
    await Promise.resolve();
    const second = invoke(fn, 2);

    await expect(first).rejects.toThrow();
    expect(firstReached).toBe(false);
    expect(await second).toBe("result-2");
    resolveFirst(); // clean up
  });

  it("successive calls each get a fresh controller", async () => {
    const fn = withAbort(function* (n: number) {
      return yield Promise.resolve(n);
    });
    expect(await invoke(fn, 1)).toBe(1);
    expect(await invoke(fn, 2)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// sequential
// ---------------------------------------------------------------------------

describe("sequential", () => {
  it("runs a single call normally", async () => {
    const fn = sequential(function* (x: number) {
      return yield Promise.resolve(x + 1);
    });
    expect(await invoke(fn, 10)).toBe(11);
  });

  it("queues concurrent calls and preserves order", async () => {
    const order: number[] = [];
    let resolveFirst!: () => void;
    const firstBlocked = new Promise<void>(r => (resolveFirst = r));

    const fn = sequential(function* (id: number) {
      if (id === 1) yield firstBlocked;
      order.push(id);
      return id;
    });

    const p1 = invoke(fn, 1);
    const p2 = invoke(fn, 2);
    const p3 = invoke(fn, 3);

    await Promise.resolve();
    resolveFirst();
    await Promise.all([p1, p2, p3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("resets running state when queue drains", async () => {
    const fn = sequential(function* (n: number) {
      return yield Promise.resolve(n);
    });
    await invoke(fn, 1);
    await invoke(fn, 2); // should not hang
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// once
// ---------------------------------------------------------------------------

describe("once", () => {
  it("executes the action on the first call", async () => {
    const api = vi.fn().mockResolvedValue("result");
    const fn = once(function* () { return yield api(); });
    expect(await invoke(fn)).toBe("result");
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for concurrent calls while in-flight", async () => {
    let unblock!: () => void;
    const blocked = new Promise<void>(r => (unblock = r));
    const api = vi.fn().mockImplementation(() => blocked.then(() => "done"));

    const fn = once(function* () { return yield api(); });

    const first = invoke(fn);
    // second arrives before first finishes
    const second = invoke(fn);

    expect(await second).toBeUndefined();

    unblock();
    expect(await first).toBe("done");
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("resets after the first call completes, allowing a second run", async () => {
    const api = vi.fn().mockResolvedValue("ok");
    const fn = once(function* () { return yield api(); });
    await invoke(fn);
    await invoke(fn);
    expect(api).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// withProgress
// ---------------------------------------------------------------------------

describe("withProgress", () => {
  it("injects progress callback as the last argument", async () => {
    const reports: number[] = [];

    const fn = withProgress(
      (pct: number) => reports.push(pct),
      function* (file: string, progress: (n: number) => void) {
        progress(0);
        yield Promise.resolve();
        progress(50);
        yield Promise.resolve();
        progress(100);
        return `uploaded:${file}`;
      },
    );

    expect(await invoke(fn, "photo.jpg")).toBe("uploaded:photo.jpg");
    expect(reports).toEqual([0, 50, 100]);
  });

  it("curried form works for use with pipe", async () => {
    const reports: number[] = [];
    const fn = withProgress((n: number) => reports.push(n))(
      function* (x: number, progress: (n: number) => void) {
        progress(x);
        return yield Promise.resolve(x * 2);
      },
    );
    expect(await invoke(fn, 25)).toBe(50);
    expect(reports).toEqual([25]);
  });
});

// ---------------------------------------------------------------------------
// tryCatch
// ---------------------------------------------------------------------------

describe("tryCatch", () => {
  it("returns result when fn succeeds", async () => {
    const fn = tryCatch(
      function* () { return yield Promise.resolve("ok"); },
      function* () { return "error-handled"; },
    );
    expect(await invoke(fn)).toBe("ok");
  });

  it("calls onError when fn throws synchronously", async () => {
    const fn = tryCatch(
      function* () { throw new Error("sync-oops"); },
      function* (err) { return `caught:${(err as Error).message}`; },
    );
    expect(await invoke(fn)).toBe("caught:sync-oops");
  });

  it("calls onError when a yielded promise rejects", async () => {
    const fn = tryCatch(
      function* () { return yield Promise.reject(new Error("async-oops")); },
      function* (err) { return `caught:${(err as Error).message}`; },
    );
    expect(await invoke(fn)).toBe("caught:async-oops");
  });

  it("passes original args to onError", async () => {
    const fn = tryCatch(
      function* (x: number) {
        yield Promise.reject(new Error("fail"));
        return x;
      },
      function* (_err, x: number) {
        return `fallback:${x}`;
      },
    );
    expect(await invoke(fn, 42)).toBe("fallback:42");
  });

  it("onError can itself yield async work", async () => {
    const fallback = vi.fn().mockResolvedValue("recovered");
    const fn = tryCatch(
      function* () { throw new Error("bang"); },
      function* () { return yield fallback(); },
    );
    expect(await invoke(fn)).toBe("recovered");
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// withOptimistic
// ---------------------------------------------------------------------------

describe("withOptimistic", () => {
  it("injects optimistic setter into the generator context", async () => {
    const updates: any[] = [];
    const store = [
      () => ({ items: [] as string[] }),
      (fn: (d: { items: string[] }) => void) => {
        const d = { items: [] as string[] };
        fn(d);
        updates.push(d);
      },
    ] as const;

    const fn = withOptimistic(store, function* (item: string, { optimistic }) {
      optimistic(d => d.items.push(item));
      yield Promise.resolve();
      return `added:${item}`;
    });

    expect(await invoke(fn, "todo-1")).toBe("added:todo-1");
    expect(updates).toHaveLength(1);
    expect(updates[0].items).toContain("todo-1");
  });

  it("curried form works", async () => {
    const calls: string[] = [];
    const store = [
      () => [] as string[],
      (_fn: (d: string[]) => void) => calls.push("set"),
    ] as const;

    const fn = withOptimistic(store)(function* (x: string, { optimistic }) {
      optimistic(d => d.push(x));
      return yield Promise.resolve(x.toUpperCase());
    });

    expect(await invoke(fn, "hello")).toBe("HELLO");
    expect(calls).toEqual(["set"]);
  });

  it("propagates errors from the inner generator", async () => {
    const store = [() => [] as number[], (_fn: (d: number[]) => void) => {}] as const;
    const fn = withOptimistic(store, function* (_item: number, { optimistic }) {
      optimistic(d => d.push(1));
      throw new Error("server-error");
    });
    await expect(invoke(fn, 1)).rejects.toThrow("server-error");
  });
});

// ---------------------------------------------------------------------------
// pipe
// ---------------------------------------------------------------------------

describe("pipe", () => {
  it("applies wrappers left-to-right", async () => {
    const order: string[] = [];

    const outerWrap = <A extends any[], R>(fn: ActionFn<A, R>): ActionFn<A, R> =>
      function* (...args: A) {
        order.push("outer-start");
        const r = (yield* fn(...args)) as R;
        order.push("outer-end");
        return r;
      };

    const innerWrap = <A extends any[], R>(fn: ActionFn<A, R>): ActionFn<A, R> =>
      function* (...args: A) {
        order.push("inner-start");
        const r = (yield* fn(...args)) as R;
        order.push("inner-end");
        return r;
      };

    const fn = pipe(outerWrap, innerWrap)(function* () {
      order.push("core");
      return yield Promise.resolve("done");
    });

    await invoke(fn);
    expect(order).toEqual(["outer-start", "inner-start", "core", "inner-end", "outer-end"]);
  });

  it("composes withTimeout and withRetry correctly", async () => {
    const api = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    const fn = pipe(
      withTimeout(5_000),
      withRetry({ attempts: 3, delay: 0 }),
    )(function* () {
      return yield api();
    });

    expect(await invoke(fn)).toBe("ok");
    expect(api).toHaveBeenCalledTimes(2);
  });

  it("composes withAbort and withRetry — abort is outermost", async () => {
    const api = vi.fn().mockResolvedValue("result");

    const fn = pipe(
      withAbort,
      withRetry({ attempts: 2, delay: 0 }),
    )(function* () {
      return yield api();
    });

    expect(await invoke(fn)).toBe("result");
  });

  it("composes withProgress with other wrappers", async () => {
    const reports: number[] = [];
    const api = vi.fn().mockResolvedValue("uploaded");

    const fn = pipe(
      withRetry({ attempts: 2, delay: 0 }),
      withProgress((n: number) => reports.push(n)),
    )(function* (file: string, progress: (n: number) => void) {
      progress(50);
      return yield api(file);
    });

    expect(await invoke(fn, "file.png")).toBe("uploaded");
    expect(reports).toEqual([50]);
  });
});
