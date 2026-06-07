import { describe, it, expect } from "vitest";
import {
  makeDraggable,
  makeDroppable,
  makeNativeDroppable,
  createDraggable,
  createDroppable,
  createNativeDroppable,
  createDragContext,
  createSortable,
} from "../src/index.js";

describe("SSR safety", () => {
  it("makeDraggable returns a noop cleanup", () => {
    expect(() => {
      const cleanup = makeDraggable({} as HTMLElement);
      cleanup();
    }).not.toThrow();
  });

  it("makeDroppable returns a noop cleanup", () => {
    expect(() => {
      const cleanup = makeDroppable({} as HTMLElement);
      cleanup();
    }).not.toThrow();
  });

  it("makeNativeDroppable returns a noop cleanup", () => {
    expect(() => {
      const cleanup = makeNativeDroppable({} as HTMLElement);
      cleanup();
    }).not.toThrow();
  });

  it("createDraggable returns stub accessors", () => {
    const d = createDraggable("x");
    expect(d.isDragging()).toBe(false);
    expect(d.transform()).toBeNull();
    expect(d.id).toBe("x");
    expect(() => d.ref({} as HTMLElement)).not.toThrow();
  });

  it("createDroppable returns stub accessors", () => {
    const d = createDroppable("zone");
    expect(d.isOver()).toBe(false);
    expect(d.active()).toBeNull();
    expect(d.id).toBe("zone");
    expect(() => d.ref({} as HTMLElement)).not.toThrow();
  });

  it("createNativeDroppable returns stub accessors", () => {
    const d = createNativeDroppable();
    expect(d.isOver()).toBe(false);
    expect(() => d.ref({} as HTMLElement)).not.toThrow();
  });

  it("createDragContext returns stub state and passthrough Provider", () => {
    const ctx = createDragContext();
    expect(ctx.active()).toBeNull();
    expect(ctx.over()).toBeNull();
    expect(ctx.transform()).toBeNull();
    expect(() =>
      ctx.Provider({ get children() { return null; } } as never),
    ).not.toThrow();
  });

  it("createSortable returns stub accessors", () => {
    const s = createSortable("s1");
    expect(s.isDragging()).toBe(false);
    expect(s.isOver()).toBe(false);
    expect(s.isActiveDropzone()).toBe(false);
    expect(s.transform()).toBeNull();
    expect(s.active()).toBeNull();
    expect(s.id).toBe("s1");
  });
});
