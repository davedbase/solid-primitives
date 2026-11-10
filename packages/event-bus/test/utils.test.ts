import { describe, test, expect } from "vitest";
import { createRoot, flush, getOwner, OBSERVE } from "solid-js";
import { attribution } from "solid-js/attribution";
import { createEventBus, once, toEffect, toPromise, type Emit } from "../src/index.js";

describe("toPromise", () => {
  test("toPromise turns subscription into a promise", () =>
    createRoot(() => {
      const emitter = createEventBus<string>();
      const promise = toPromise(emitter.listen);

      expect(promise).instanceOf(Promise);

      promise.then(event => {
        expect(event).toBe("foo");
      });

      setTimeout(() => {
        emitter.emit("foo");
      }, 0);
    }));
});

describe("once", () => {
  test("once()", () =>
    createRoot(() => {
      const captured: any[] = [];
      const { listen, emit } = createEventBus<string>();

      once(listen, a => captured.push(a));

      emit("foo");
      expect(captured.length, "first emit should work").toBe(1);

      emit("bar");
      expect(captured.length, "second emit shouldn't be captured").toBe(1);
    }));
});

describe("toEffect", () => {
  test("toEffect()", () =>
    new Promise<void>(resolve =>
      createRoot(dispose => {
        const captured: any[] = [];
        let capturedOwner: any;
        const { listen, emit } = createEventBus<string>();
        const emitInEffect = toEffect(emit);
        listen(e => {
          captured.push(e);
          capturedOwner = getOwner();
        });

        // owner is null after the synchronous root callback returns
        setTimeout(() => {
          emit("foo");
          expect(
            capturedOwner,
            "owner should not be available inside listener after using normal emit",
          ).toBe(null);

          emitInEffect("bar");
          flush();
          expect(captured).toEqual(["foo", "bar"]);
          expect(
            capturedOwner,
            "owner should be available inside listener after using emitInEffect",
          ).not.toBe(null);
          dispose();
          resolve();
        }, 0);
      }),
    ));
});

describe("toEffect queue drain", () => {
  test("emits in order, batched per flush, under the captured owner", () => {
    const { listen, emit } = createEventBus<number>();
    const batches: number[][] = [];
    let current: number[] = [];
    const owners: any[] = [];
    let emitInEffect!: Emit<number>;
    const dispose = createRoot(dispose => {
      emitInEffect = toEffect(emit);
      listen(n => {
        current.push(n);
        owners.push(getOwner());
      });
      return dispose;
    });
    flush();
    emitInEffect(1);
    emitInEffect(2);
    emitInEffect(3);
    expect(current).toEqual([]);
    flush();
    batches.push(current);
    current = [];
    expect(batches[0]).toEqual([1, 2, 3]);
    expect(owners.every(o => o !== null)).toBe(true);
    emitInEffect(4);
    flush();
    expect(current).toEqual([4]);
    flush();
    expect(current).toEqual([4]);
    dispose();
  });

  test("no diagnostics over several emit/flush cycles", () => {
    const { listen, emit } = createEventBus<number>();
    const seen: number[] = [];
    let emitInEffect!: Emit<number>;
    const dispose = createRoot(dispose => {
      emitInEffect = toEffect(emit);
      listen(n => seen.push(n));
      return dispose;
    });
    flush();
    const release = attribution.enable();
    const cap = OBSERVE!.diagnostics.capture();
    for (let i = 0; i < 8; i++) {
      emitInEffect(i);
      flush();
    }
    const codes = cap.stop().map(e => e.code);
    release();
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(codes).toEqual([]);
    dispose();
  });

  test("nothing is emitted after dispose", () => {
    const { listen, emit } = createEventBus<number>();
    const seen: number[] = [];
    let emitInEffect!: Emit<number>;
    const dispose = createRoot(dispose => {
      emitInEffect = toEffect(emit);
      listen(n => seen.push(n));
      return dispose;
    });
    flush();
    emitInEffect(1);
    dispose();
    flush();
    emitInEffect(2);
    flush();
    expect(seen).toEqual([]);
  });
});
