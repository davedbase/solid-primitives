import "./setup.js";
import { createRoot, flush } from "solid-js";
import { render } from "@solidjs/web";
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
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
} from "../src/index.js";
import type { DraggableReturn, DroppableReturn, Transform } from "../src/index.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ptr(target: EventTarget, type: string, init: PointerEventInit = {}) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
}

function drag(target: EventTarget, type: string, init: DragEventInit = {}) {
  target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, ...init }));
}

function el() {
  return document.createElement("div");
}

function mockRect(element: HTMLElement, rect: Partial<DOMRect>) {
  Object.defineProperty(element, "getBoundingClientRect", {
    value: () => ({
      left: 0, top: 0, right: 100, bottom: 100,
      width: 100, height: 100, x: 0, y: 0,
      toJSON: () => ({}),
      ...rect,
    }),
    configurable: true,
  });
}

// ── makeDraggable ─────────────────────────────────────────────────────────────

describe("makeDraggable", () => {
  it("calls onStart on left pointerdown", () => {
    const div = el();
    let started = false;
    const cleanup = makeDraggable(div, { onStart: () => { started = true; } });
    ptr(div, "pointerdown", { button: 0 });
    expect(started).toBe(true);
    cleanup();
  });

  it("ignores non-left-button events", () => {
    const div = el();
    let started = false;
    const cleanup = makeDraggable(div, { onStart: () => { started = true; } });
    ptr(div, "pointerdown", { button: 2 });
    expect(started).toBe(false);
    cleanup();
  });

  it("calls onMove with accumulated delta", () => {
    const div = el();
    let delta: Transform | null = null;
    const cleanup = makeDraggable(div, { onMove: d => { delta = d; } });
    ptr(div, "pointerdown", { button: 0, clientX: 10, clientY: 10 });
    ptr(document, "pointermove", { clientX: 30, clientY: 25 });
    expect(delta).toEqual({ x: 20, y: 15 });
    ptr(document, "pointerup", { clientX: 30, clientY: 25 });
    cleanup();
  });

  it("calls onEnd with final delta", () => {
    const div = el();
    let endDelta: Transform | null = null;
    const cleanup = makeDraggable(div, { onEnd: d => { endDelta = d; } });
    ptr(div, "pointerdown", { button: 0, clientX: 0, clientY: 0 });
    ptr(document, "pointerup", { clientX: 5, clientY: 10 });
    expect(endDelta).toEqual({ x: 5, y: 10 });
    cleanup();
  });

  it("no-ops when disabled", () => {
    const div = el();
    let started = false;
    const cleanup = makeDraggable(div, { onStart: () => { started = true; }, disabled: true });
    ptr(div, "pointerdown", { button: 0 });
    expect(started).toBe(false);
    cleanup();
  });

  it("stops firing after cleanup", () => {
    const div = el();
    let count = 0;
    const cleanup = makeDraggable(div, { onStart: () => count++ });
    cleanup();
    ptr(div, "pointerdown", { button: 0 });
    expect(count).toBe(0);
  });

  it("can be used outside a Solid owner", () => {
    expect(() => {
      const cleanup = makeDraggable(el());
      cleanup();
    }).not.toThrow();
  });
});

// ── makeDroppable ─────────────────────────────────────────────────────────────

describe("makeDroppable", () => {
  it("calls onEnter on pointerenter", () => {
    const div = el();
    let entered = false;
    const cleanup = makeDroppable(div, { onEnter: () => { entered = true; } });
    ptr(div, "pointerenter");
    expect(entered).toBe(true);
    cleanup();
  });

  it("calls onLeave on pointerleave", () => {
    const div = el();
    let left = false;
    const cleanup = makeDroppable(div, { onLeave: () => { left = true; } });
    ptr(div, "pointerleave");
    expect(left).toBe(true);
    cleanup();
  });

  it("calls onDrop on pointerup", () => {
    const div = el();
    let dropped = false;
    const cleanup = makeDroppable(div, { onDrop: () => { dropped = true; } });
    ptr(div, "pointerup");
    expect(dropped).toBe(true);
    cleanup();
  });

  it("no-ops when disabled", () => {
    const div = el();
    let entered = false;
    const cleanup = makeDroppable(div, { onEnter: () => { entered = true; }, disabled: true });
    ptr(div, "pointerenter");
    expect(entered).toBe(false);
    cleanup();
  });

  it("stops firing after cleanup", () => {
    const div = el();
    let count = 0;
    const cleanup = makeDroppable(div, { onEnter: () => count++ });
    cleanup();
    ptr(div, "pointerenter");
    expect(count).toBe(0);
  });
});

// ── makeNativeDroppable ───────────────────────────────────────────────────────

describe("makeNativeDroppable", () => {
  it("calls onEnter on first dragenter", () => {
    const div = el();
    let entered = false;
    const cleanup = makeNativeDroppable(div, { onEnter: () => { entered = true; } });
    drag(div, "dragenter");
    expect(entered).toBe(true);
    cleanup();
  });

  it("calls onLeave only when depth reaches zero", () => {
    const div = el();
    let leaveCount = 0;
    const cleanup = makeNativeDroppable(div, { onLeave: () => leaveCount++ });
    drag(div, "dragenter"); // depth = 1
    drag(div, "dragenter"); // depth = 2 (child)
    drag(div, "dragleave"); // depth = 1 — no leave yet
    expect(leaveCount).toBe(0);
    drag(div, "dragleave"); // depth = 0 — fires
    expect(leaveCount).toBe(1);
    cleanup();
  });

  it("calls onDrop and resets depth", () => {
    const div = el();
    let dropped = false;
    const cleanup = makeNativeDroppable(div, { onDrop: () => { dropped = true; } });
    drag(div, "dragenter");
    drag(div, "drop");
    expect(dropped).toBe(true);
    cleanup();
  });

  it("calls preventDefault on dragover", () => {
    const div = el();
    const cleanup = makeNativeDroppable(div);
    let prevented = false;
    div.addEventListener("dragover", e => { if (e.defaultPrevented) prevented = true; });
    drag(div, "dragover");
    expect(prevented).toBe(true);
    cleanup();
  });

  it("suppresses onEnter when accept returns false", () => {
    const div = el();
    let entered = false;
    const cleanup = makeNativeDroppable(div, {
      accept: () => false,
      onEnter: () => { entered = true; },
    });
    drag(div, "dragenter");
    expect(entered).toBe(false);
    cleanup();
  });

  it("no-ops when disabled", () => {
    const div = el();
    let entered = false;
    const cleanup = makeNativeDroppable(div, { onEnter: () => { entered = true; }, disabled: true });
    drag(div, "dragenter");
    expect(entered).toBe(false);
    cleanup();
  });
});

// ── createDraggable ───────────────────────────────────────────────────────────

describe("createDraggable (standalone — no context)", () => {
  it("isDragging starts false and transform starts null", () => {
    createRoot(dispose => {
      const d = createDraggable("x");
      expect(d.isDragging()).toBe(false);
      expect(d.transform()).toBeNull();
      expect(d.id).toBe("x");
      dispose();
    });
  });

  it("applies static style and class via ref", () => {
    createRoot(dispose => {
      const div = el();
      const d = createDraggable("x", undefined, {
        style: { userSelect: "none" },
        class: "draggable my-item",
      });
      d.ref(div);
      expect(div.style.userSelect).toBe("none");
      expect(div.classList.contains("draggable")).toBe(true);
      expect(div.classList.contains("my-item")).toBe(true);
      dispose();
    });
  });

  it("becomes isDragging true on pointerdown and resets on pointerup", () => {
    createRoot(dispose => {
      const div = el();
      const d = createDraggable("x");
      d.ref(div);
      flush();
      ptr(div, "pointerdown", { button: 0, clientX: 0, clientY: 0 });
      flush();
      expect(d.isDragging()).toBe(true);
      ptr(document, "pointerup", {});
      flush();
      expect(d.isDragging()).toBe(false);
      dispose();
    });
  });

  it("tracks transform during drag", () => {
    createRoot(dispose => {
      const div = el();
      const d = createDraggable("x");
      d.ref(div);
      flush();
      ptr(div, "pointerdown", { button: 0, clientX: 10, clientY: 10 });
      flush();
      ptr(document, "pointermove", { clientX: 25, clientY: 40 });
      flush();
      expect(d.transform()).toEqual({ x: 15, y: 30 });
      ptr(document, "pointerup", {});
      flush();
      expect(d.transform()).toBeNull();
      dispose();
    });
  });

  it("applies draggingStyle and draggingClass while dragging", () => {
    createRoot(dispose => {
      const div = el();
      const d = createDraggable("x", undefined, {
        draggingStyle: { opacity: "0.5" },
        draggingClass: "is-dragging",
      });
      d.ref(div);
      flush();
      ptr(div, "pointerdown", { button: 0 });
      flush();
      expect(div.style.opacity).toBe("0.5");
      expect(div.classList.contains("is-dragging")).toBe(true);
      ptr(document, "pointerup", {});
      flush();
      expect(div.style.opacity).toBe("");
      expect(div.classList.contains("is-dragging")).toBe(false);
      dispose();
    });
  });

  it("ignores non-left-button events", () => {
    createRoot(dispose => {
      const div = el();
      const d = createDraggable("x");
      d.ref(div);
      flush();
      ptr(div, "pointerdown", { button: 2 });
      flush();
      expect(d.isDragging()).toBe(false);
      dispose();
    });
  });
});

// ── createDroppable ───────────────────────────────────────────────────────────

describe("createDroppable (standalone — no context)", () => {
  it("isOver starts false and active starts null", () => {
    createRoot(dispose => {
      const drop = createDroppable("zone");
      expect(drop.isOver()).toBe(false);
      expect(drop.active()).toBeNull();
      expect(drop.id).toBe("zone");
      dispose();
    });
  });

  it("applies static style and class via ref", () => {
    createRoot(dispose => {
      const div = el();
      const drop = createDroppable("zone", undefined, {
        style: { border: "2px dashed transparent" },
        class: "dropzone",
      });
      drop.ref(div);
      expect(div.style.border).toBe("2px dashed transparent");
      expect(div.classList.contains("dropzone")).toBe(true);
      dispose();
    });
  });
});

// ── createDragContext ─────────────────────────────────────────────────────────

describe("createDragContext", () => {
  it("active, over, and transform start null/null/null", () => {
    createRoot(dispose => {
      const ctx = createDragContext();
      expect(ctx.active()).toBeNull();
      expect(ctx.over()).toBeNull();
      expect(ctx.transform()).toBeNull();
      dispose();
    });
  });

  it("coordinates draggable and droppable", () => {
    const dragEl = el();
    const dropEl = el();
    mockRect(dragEl, { left: 0, top: 0, right: 50, bottom: 50 });
    mockRect(dropEl, { left: 200, top: 0, right: 300, bottom: 100 });

    let ctx!: ReturnType<typeof createDragContext>;
    let drag!: DraggableReturn;
    let drop!: DroppableReturn;

    const container = el();
    const dispose = render(
      () => {
        ctx = createDragContext();
        return (ctx.Provider as (p: { children: unknown }) => unknown)({
          get children() {
            drag = createDraggable("a", "data-a");
            drop = createDroppable("b", "data-b");
            drag.ref(dragEl);
            drop.ref(dropEl);
            return null;
          },
        });
      },
      container,
    );
    flush();

    ptr(dragEl, "pointerdown", { button: 0, clientX: 25, clientY: 25 });
    flush();
    expect(ctx.active()?.id).toBe("a");
    expect(drag.isDragging()).toBe(true);

    ptr(document, "pointermove", { clientX: 250, clientY: 50 });
    flush();
    expect(ctx.over()?.id).toBe("b");
    expect(drop.isOver()).toBe(true);
    expect(drop.active()?.id).toBe("a");

    ptr(document, "pointerup", { clientX: 250, clientY: 50 });
    flush();
    expect(ctx.active()).toBeNull();
    expect(ctx.over()).toBeNull();
    expect(drop.isOver()).toBe(false);

    dispose();
  });

  it("fires lifecycle callbacks in order", () => {
    const events: string[] = [];
    let drag!: DraggableReturn;
    const dragEl = el();

    const container = el();
    const dispose = render(
      () => {
        const ctx = createDragContext({
          onDragStart: () => events.push("start"),
          onDragMove: () => events.push("move"),
          onDragEnd: () => events.push("end"),
        });
        return (ctx.Provider as (p: { children: unknown }) => unknown)({
          get children() {
            drag = createDraggable("x");
            drag.ref(dragEl);
            return null;
          },
        });
      },
      container,
    );
    flush();

    ptr(dragEl, "pointerdown", { button: 0 });
    ptr(document, "pointermove", { clientX: 5, clientY: 5 });
    ptr(document, "pointerup", {});

    expect(events).toEqual(["start", "move", "end"]);
    dispose();
  });

  it("fires onDragCancel on Escape", () => {
    let cancelled = false;
    let drag!: DraggableReturn;
    const dragEl = el();

    const container = el();
    const dispose = render(
      () => {
        const ctx = createDragContext({ onDragCancel: () => { cancelled = true; } });
        return (ctx.Provider as (p: { children: unknown }) => unknown)({
          get children() {
            drag = createDraggable("x");
            drag.ref(dragEl);
            return null;
          },
        });
      },
      container,
    );
    flush();

    ptr(dragEl, "pointerdown", { button: 0 });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(cancelled).toBe(true);
    dispose();
  });

  it("excludes self from collision when using createSortable", () => {
    const div = el();
    mockRect(div, { left: 0, top: 0, right: 100, bottom: 100 });

    let s!: ReturnType<typeof createSortable>;
    const container = el();
    const dispose = render(
      () => {
        const ctx = createDragContext();
        return (ctx.Provider as (p: { children: unknown }) => unknown)({
          get children() {
            s = createSortable("s1");
            s.ref(div);
            return null;
          },
        });
      },
      container,
    );
    flush();

    ptr(div, "pointerdown", { button: 0, clientX: 50, clientY: 50 });
    flush();
    ptr(document, "pointermove", { clientX: 50, clientY: 50 });
    flush();
    expect(s.isOver()).toBe(false);

    ptr(document, "pointerup", {});
    dispose();
  });
});

// ── createNativeDroppable ─────────────────────────────────────────────────────

describe("createNativeDroppable", () => {
  it("isOver starts false", () => {
    createRoot(dispose => {
      const drop = createNativeDroppable();
      expect(drop.isOver()).toBe(false);
      dispose();
    });
  });

  it("isOver becomes true on dragenter and false on dragleave", () => {
    createRoot(dispose => {
      const div = el();
      const drop = createNativeDroppable();
      drop.ref(div);

      drag(div, "dragenter");
      flush();
      expect(drop.isOver()).toBe(true);

      drag(div, "dragleave");
      flush();
      expect(drop.isOver()).toBe(false);

      dispose();
    });
  });

  it("handles child element depth correctly", () => {
    createRoot(dispose => {
      const div = el();
      const drop = createNativeDroppable();
      drop.ref(div);

      drag(div, "dragenter"); // depth = 1
      drag(div, "dragenter"); // depth = 2
      flush();
      expect(drop.isOver()).toBe(true);

      drag(div, "dragleave"); // depth = 1
      flush();
      expect(drop.isOver()).toBe(true);

      drag(div, "dragleave"); // depth = 0
      flush();
      expect(drop.isOver()).toBe(false);

      dispose();
    });
  });

  it("isOver resets to false on drop", () => {
    createRoot(dispose => {
      const div = el();
      const drop = createNativeDroppable();
      drop.ref(div);

      drag(div, "dragenter");
      flush();
      expect(drop.isOver()).toBe(true);
      drag(div, "drop");
      flush();
      expect(drop.isOver()).toBe(false);

      dispose();
    });
  });

  it("calls onDrop callback", () => {
    createRoot(dispose => {
      const div = el();
      let dropped = false;
      const drop = createNativeDroppable({ onDrop: () => { dropped = true; } });
      drop.ref(div);
      drag(div, "drop");
      expect(dropped).toBe(true);
      dispose();
    });
  });
});

// ── createSortable ────────────────────────────────────────────────────────────

describe("createSortable", () => {
  it("exposes all expected fields", () => {
    createRoot(dispose => {
      const s = createSortable("s1");
      expect(typeof s.isDragging).toBe("function");
      expect(typeof s.isOver).toBe("function");
      expect(typeof s.isActiveDropzone).toBe("function");
      expect(typeof s.transform).toBe("function");
      expect(typeof s.active).toBe("function");
      expect(s.id).toBe("s1");
      dispose();
    });
  });

  it("isDragging and isActiveDropzone start false", () => {
    createRoot(dispose => {
      const s = createSortable("s1");
      expect(s.isDragging()).toBe(false);
      expect(s.isActiveDropzone()).toBe(false);
      dispose();
    });
  });
});

// ── Collision strategies ──────────────────────────────────────────────────────

function makeRect(left: number, top: number, right: number, bottom: number): DOMRect {
  return {
    left, top, right, bottom,
    width: right - left, height: bottom - top,
    x: left, y: top, toJSON: () => ({}),
  } as DOMRect;
}

const draggableRect = { id: "drag", rect: makeRect(0, 0, 50, 50) };

describe("closestCenter", () => {
  it("returns id of droppable whose center is nearest the pointer", () => {
    const droppables = [
      { id: "a", rect: makeRect(100, 0, 200, 100) }, // center (150, 50)
      { id: "b", rect: makeRect(300, 0, 400, 100) }, // center (350, 50)
    ];
    expect(closestCenter(draggableRect, droppables, { x: 160, y: 50 })).toBe("a");
    expect(closestCenter(draggableRect, droppables, { x: 340, y: 50 })).toBe("b");
  });

  it("returns null for empty droppables", () => {
    expect(closestCenter(draggableRect, [], { x: 0, y: 0 })).toBeNull();
  });
});

describe("closestCorners", () => {
  it("returns id of droppable with nearest corner", () => {
    const droppables = [
      { id: "a", rect: makeRect(100, 0, 200, 100) },
      { id: "b", rect: makeRect(300, 0, 400, 100) },
    ];
    expect(closestCorners(draggableRect, droppables, { x: 95, y: 5 })).toBe("a");
    expect(closestCorners(draggableRect, droppables, { x: 305, y: 5 })).toBe("b");
  });
});

describe("rectIntersection", () => {
  it("returns id of droppable with largest overlap area", () => {
    const drag = { id: "drag", rect: makeRect(50, 0, 150, 100) };
    const droppables = [
      { id: "a", rect: makeRect(100, 0, 200, 100) }, // overlap 50×100 = 5000
      { id: "b", rect: makeRect(120, 0, 200, 100) }, // overlap 30×100 = 3000
    ];
    expect(rectIntersection(drag, droppables, { x: 0, y: 0 })).toBe("a");
  });

  it("returns null when no overlap", () => {
    const droppables = [{ id: "a", rect: makeRect(200, 0, 300, 100) }];
    expect(rectIntersection(draggableRect, droppables, { x: 0, y: 0 })).toBeNull();
  });
});

describe("pointerWithin", () => {
  it("returns id of droppable containing the pointer", () => {
    const droppables = [
      { id: "a", rect: makeRect(0, 0, 100, 100) },
      { id: "b", rect: makeRect(200, 0, 300, 100) },
    ];
    expect(pointerWithin(draggableRect, droppables, { x: 50, y: 50 })).toBe("a");
    expect(pointerWithin(draggableRect, droppables, { x: 250, y: 50 })).toBe("b");
    expect(pointerWithin(draggableRect, droppables, { x: 150, y: 50 })).toBeNull();
  });

  it("prefers topmost (last in array) when overlapping", () => {
    const droppables = [
      { id: "a", rect: makeRect(0, 0, 100, 100) },
      { id: "b", rect: makeRect(0, 0, 100, 100) },
    ];
    expect(pointerWithin(draggableRect, droppables, { x: 50, y: 50 })).toBe("b");
  });

  it("returns null when pointer is outside all droppables", () => {
    const droppables = [{ id: "a", rect: makeRect(200, 0, 300, 100) }];
    expect(pointerWithin(draggableRect, droppables, { x: 0, y: 0 })).toBeNull();
  });
});
