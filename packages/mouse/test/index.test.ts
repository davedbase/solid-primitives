import { createStaticStore } from "@solid-primitives/static-store";
import { createRoot, createSignal, flush, OBSERVE } from "solid-js";
import { attribution } from "solid-js/attribution";
import { describe, expect, it, vi } from "vitest";

import { createMousePosition, createPositionToElement } from "../src/index.js";

describe("createMousePosition", () => {
  it("returns fallback", () =>
    createRoot(dispose => {
      const pos = createMousePosition();
      expect(pos).toEqual({
        x: 0,
        y: 0,
        sourceType: null,
        isInside: false,
      });
      dispose();
    }));

  it("initial values can be changed", () =>
    createRoot(dispose => {
      const pos = createMousePosition(undefined, {
        initialValue: { x: 69, y: 420 },
      });
      expect(pos).toEqual({
        x: 69,
        y: 420,
        sourceType: null,
        isInside: false,
      });
      dispose();
    }));
});

describe("createMousePosition listener lifecycle", () => {
  it("swapping the target emits no NO_OWNER_CLEANUP and removes listeners on swap and dispose", () => {
    const release = attribution.enable();
    const cap = OBSERVE!.diagnostics.capture();
    const a = document.createElement("div");
    const b = document.createElement("div");
    const spies = [a, b].map(el => ({
      add: vi.spyOn(el, "addEventListener"),
      remove: vi.spyOn(el, "removeEventListener"),
    }));
    const [target, setTarget] = createSignal<HTMLElement>(a);
    let dispose!: VoidFunction;
    createRoot(d => {
      dispose = d;
      createMousePosition(target);
    });
    flush();
    const live = (i: number) =>
      spies[i]!.add.mock.calls.length - spies[i]!.remove.mock.calls.length;
    expect(spies[0]!.add.mock.calls.length).toBeGreaterThan(0);
    expect(live(0)).toBe(spies[0]!.add.mock.calls.length);
    for (let i = 0; i < 4; i++) {
      setTarget(i % 2 === 0 ? b : a);
      flush();
      const cur = i % 2 === 0 ? 1 : 0;
      expect(live(cur)).toBe(
        spies[cur]!.add.mock.calls.length - spies[cur]!.remove.mock.calls.length,
      );
      expect(live(1 - cur)).toBe(0);
      expect(live(cur)).toBeGreaterThan(0);
    }
    dispose();
    flush();
    expect(live(0)).toBe(0);
    expect(live(1)).toBe(0);
    const codes = cap.stop().map(e => e.code);
    release();
    expect(codes).not.toContain("NO_OWNER_CLEANUP");
  });
});

describe("createMouseToElement", () => {
  it("returns correct values", () =>
    createRoot(dispose => {
      const el = document.createElement("div");
      const [pos, setPos] = createStaticStore({ x: 0, y: 0 });
      const relative = createPositionToElement(el, () => pos);

      expect(relative).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        isInside: true,
      });

      setPos({ x: -20, y: 30 });
      flush();

      expect(relative).toEqual({
        x: -20,
        y: 30,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        isInside: false,
      });

      setPos({ x: 15 });
      flush();

      expect(relative).toEqual({
        x: 15,
        y: 30,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        isInside: false,
      });

      dispose();
    }));

  it("initial values can be changed", () =>
    createRoot(dispose => {
      const pos = createPositionToElement(
        () => undefined,
        () => ({ x: 69, y: 420 }),
        {
          initialValue: {
            x: -1,
            y: 2,
            width: 3,
            height: 4,
            top: 5,
            left: 6,
          },
        },
      );

      expect(pos).toEqual({
        x: -1,
        y: 2,
        width: 3,
        height: 4,
        top: 5,
        left: 6,
        isInside: true,
      });

      dispose();
    }));
});
