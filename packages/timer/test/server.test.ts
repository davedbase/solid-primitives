import { describe, test, expect } from "vitest";
import { createRoot } from "solid-js";
import { createPolled, createIntervalCounter } from "../src/index.js";

describe("timer (server)", () => {
  test("createPolled runs fn once with the initial value and never updates", () =>
    createRoot(dispose => {
      let calls = 0;
      const p = createPolled(prev => (calls++, prev + 1), 100, 10);
      expect(p()).toBe(11);
      expect(p()).toBe(11);
      expect(calls).toBe(1);
      dispose();
    }));

  test("createIntervalCounter is 0", () =>
    createRoot(dispose => {
      expect(createIntervalCounter(100)()).toBe(0);
      dispose();
    }));
});
