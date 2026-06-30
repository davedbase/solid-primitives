import { describe, test, expect } from "vitest";
import { createRoot, flush, resolve } from "solid-js";
import { createDeferredDisposal } from "../src/index.js";

// AsyncDisposableStack is not yet a global in Node 22. Polyfill the spec contract
// so these tests run in any environment and document the expected integration behavior.
if (typeof AsyncDisposableStack === "undefined") {
  class _AsyncDisposableStack {
    private _disposed = false;
    private _stack: Array<() => Promise<void>> = [];

    get disposed() {
      return this._disposed;
    }

    use<T extends AsyncDisposable | Disposable>(value: T): T {
      if (Symbol.asyncDispose in value) {
        this._stack.push(() => (value as AsyncDisposable)[Symbol.asyncDispose]());
      } else {
        this._stack.push(() => {
          (value as Disposable)[Symbol.dispose]();
          return Promise.resolve();
        });
      }
      return value;
    }

    adopt<T>(value: T, onDispose: (v: T) => void | Promise<void>): T {
      this._stack.push(async () => onDispose(value));
      return value;
    }

    defer(onDispose: () => void | Promise<void>): void {
      this._stack.push(async () => onDispose());
    }

    async [Symbol.asyncDispose](): Promise<void> {
      if (this._disposed) return;
      this._disposed = true;
      for (let i = this._stack.length - 1; i >= 0; i--) {
        await this._stack[i]!();
      }
    }
  }

  (globalThis as any).AsyncDisposableStack = _AsyncDisposableStack;
}

describe("createDeferredDisposal", () => {
  describe("isHeld", () => {
    test("is false with no holds", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("is true when a hold is active", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        const h = removal.hold();
        flush();
        expect(removal.isHeld()).toBe(true);
        h.release();
        dispose();
      });
    });

    test("returns false after all holds are released", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        const h1 = removal.hold();
        const h2 = removal.hold();
        flush();
        expect(removal.isHeld()).toBe(true);

        h1.release();
        flush();
        expect(removal.isHeld()).toBe(true);

        h2.release();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });
  });

  describe("hold", () => {
    test("label is accessible", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        const h = removal.hold("exit animation");
        expect(h.label).toBe("exit animation");
        h.release();
        dispose();
      });
    });

    test("label is undefined when omitted", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        const h = removal.hold();
        expect(h.label).toBeUndefined();
        h.release();
        dispose();
      });
    });

    test("release is idempotent", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        const h = removal.hold();
        h.release();
        h.release();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("[Symbol.dispose] releases the hold", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        const h = removal.hold("test");
        flush();
        expect(removal.isHeld()).toBe(true);

        h[Symbol.dispose]();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("[Symbol.dispose] is idempotent", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        const h = removal.hold();
        h[Symbol.dispose]();
        h[Symbol.dispose]();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });
  });

  describe("defer", () => {
    test("holds until promise resolves", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        let resolveWork!: () => void;
        const work = new Promise<void>(r => {
          resolveWork = r;
        });

        removal.defer(work);
        flush();
        expect(removal.isHeld()).toBe(true);

        resolveWork();
        await resolve(() => removal.allSettled());
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("holds until promise rejects (does not leak on rejection)", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        let rejectWork!: (e: Error) => void;
        const work = new Promise<void>((_, r) => {
          rejectWork = r;
        });

        removal.defer(work);
        flush();
        expect(removal.isHeld()).toBe(true);

        rejectWork(new Error("exit failed"));
        await resolve(() => removal.allSettled());
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });
  });

  describe("allSettled", () => {
    test("resolves immediately when no holds exist", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        await resolve(() => removal.allSettled());
        dispose();
      });
    });

    test("resolves after a single hold is released", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const h = removal.hold();

        let settled = false;
        const settlementPromise = resolve(() => removal.allSettled()).then(() => {
          settled = true;
        });

        expect(settled).toBe(false);
        h.release();
        await settlementPromise;
        expect(settled).toBe(true);
        dispose();
      });
    });

    test("waits for all holds before resolving", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const h1 = removal.hold("one");
        const h2 = removal.hold("two");

        let settled = false;
        const settlementPromise = resolve(() => removal.allSettled()).then(() => {
          settled = true;
        });

        h1.release();
        // let microtasks drain — h2 still held so settlement must not have fired
        await Promise.resolve();
        await Promise.resolve();
        expect(settled).toBe(false);

        h2.release();
        await settlementPromise;
        expect(settled).toBe(true);
        dispose();
      });
    });

    test("can be re-held after settling", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();

        // First cycle
        const h1 = removal.hold("first");
        h1.release();
        await resolve(() => removal.allSettled());

        // Second cycle — new hold after first settled
        const h2 = removal.hold("second");
        let settled = false;
        const settlementPromise = resolve(() => removal.allSettled()).then(() => {
          settled = true;
        });

        expect(settled).toBe(false);
        h2.release();
        await settlementPromise;
        expect(settled).toBe(true);
        dispose();
      });
    });
  });

  describe("isDisposing", () => {
    test("is false before scope is cleaned up", () => {
      createRoot(dispose => {
        const removal = createDeferredDisposal();
        expect(removal.isDisposing()).toBe(false);
        dispose();
      });
    });

    test("becomes true when the owning scope is disposed", () => {
      let removalRef!: ReturnType<typeof createDeferredDisposal>;
      const dispose = createRoot(d => {
        removalRef = createDeferredDisposal();
        return d;
      });

      expect(removalRef.isDisposing()).toBe(false);
      dispose();
      flush();
      expect(removalRef.isDisposing()).toBe(true);
    });

    test("allSettled still resolves after dispose when no holds", async () => {
      let removalRef!: ReturnType<typeof createDeferredDisposal>;
      const dispose = createRoot(d => {
        removalRef = createDeferredDisposal();
        return d;
      });

      dispose();
      await resolve(() => removalRef.allSettled());
    });
  });

  describe("AsyncDisposableStack integration", () => {
    test("hold released when stack is disposed", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const stack = new AsyncDisposableStack();

        stack.use(removal.hold("fade"));
        flush();
        expect(removal.isHeld()).toBe(true);

        await stack[Symbol.asyncDispose]();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("all holds released when stack with multiple holds is disposed", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const stack = new AsyncDisposableStack();

        stack.use(removal.hold("fade"));
        stack.use(removal.hold("slide"));
        stack.use(removal.hold("scale"));
        flush();
        expect(removal.isHeld()).toBe(true);

        await stack[Symbol.asyncDispose]();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("allSettled resolves after stack disposal", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const stack = new AsyncDisposableStack();

        stack.use(removal.hold("exit"));

        let settled = false;
        const settlementPromise = resolve(() => removal.allSettled()).then(() => {
          settled = true;
        });

        expect(settled).toBe(false);
        await stack[Symbol.asyncDispose]();
        await settlementPromise;
        expect(settled).toBe(true);
        dispose();
      });
    });

    test("holds released in LIFO order (last-in first-released)", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const stack = new AsyncDisposableStack();
        const released: string[] = [];

        const h1 = removal.hold("first");
        const h2 = removal.hold("second");
        const h3 = removal.hold("third");

        const wrap = (h: typeof h1, label: string) => ({
          [Symbol.asyncDispose]: async () => {
            h.release();
            released.push(label);
          },
        });

        stack.use(wrap(h1, "first"));
        stack.use(wrap(h2, "second"));
        stack.use(wrap(h3, "third"));

        await stack[Symbol.asyncDispose]();
        expect(released).toEqual(["third", "second", "first"]);
        dispose();
      });
    });

    test("stack.adopt() integrates non-disposable hold with custom release", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const stack = new AsyncDisposableStack();

        const hold = removal.hold("animation");
        stack.adopt(hold, h => h.release());
        flush();
        expect(removal.isHeld()).toBe(true);

        await stack[Symbol.asyncDispose]();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("stack.defer() releases hold via callback", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const stack = new AsyncDisposableStack();

        const hold = removal.hold("deferred");
        stack.defer(() => hold.release());
        flush();
        expect(removal.isHeld()).toBe(true);

        await stack[Symbol.asyncDispose]();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });

    test("disposed flag prevents double-disposal", async () => {
      await createRoot(async dispose => {
        const removal = createDeferredDisposal();
        const stack = new AsyncDisposableStack();

        stack.use(removal.hold("once"));
        await stack[Symbol.asyncDispose]();
        flush();
        expect(removal.isHeld()).toBe(false);

        // Second disposal is a no-op — holds are already released
        await stack[Symbol.asyncDispose]();
        flush();
        expect(removal.isHeld()).toBe(false);
        dispose();
      });
    });
  });
});
