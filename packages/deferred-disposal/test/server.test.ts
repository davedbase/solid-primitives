import { describe, test, expect } from "vitest";
import { createDeferredDisposal } from "../src/index.js";

describe("createDeferredDisposal — SSR", () => {
  test("creates without error in a server environment", () => {
    expect(() => createDeferredDisposal()).not.toThrow();
  });

  test("isHeld is false initially", () => {
    const removal = createDeferredDisposal();
    expect(removal.isHeld()).toBe(false);
  });

  test("isDisposing is false initially", () => {
    const removal = createDeferredDisposal();
    expect(removal.isDisposing()).toBe(false);
  });

  test("hold and release work without a reactive owner", () => {
    const removal = createDeferredDisposal();
    const h = removal.hold("ssr-hold");
    expect(h.label).toBe("ssr-hold");
    expect(removal.isHeld()).toBe(true);
    h.release();
    expect(removal.isHeld()).toBe(false);
  });

  test("defer resolves without error on the server", async () => {
    const removal = createDeferredDisposal();
    let done = false;
    const work = Promise.resolve().then(() => {
      done = true;
    });

    removal.defer(work);
    await work;
    expect(done).toBe(true);
  });

  test("allSettled is a Promise", () => {
    const removal = createDeferredDisposal();
    expect(removal.allSettled()).toBeInstanceOf(Promise);
  });
});
