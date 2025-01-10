import { describe, it, expect, afterAll } from "vitest";
import { createRoot } from "solid-js";
import { createPointers } from "../src/index.js";

class PointerEvent extends Event {
  constructor(type: string, init: PointerEventInit) {
    super(type, init);
    Object.assign(this, init)
  }
}

global.PointerEvent = PointerEvent as any;

describe("createPointers", () => {
  const move_event_mouse = new PointerEvent("pointermove", { pointerId: 1, pointerType: "mouse" });
  const down_event_mouse = new PointerEvent("pointerdown", { pointerId: 1, pointerType: "mouse" });
  const up_event_mouse = new PointerEvent("pointerup", { pointerId: 1, pointerType: "mouse" });
  const leave_event_mouse = new PointerEvent("pointerleave", { pointerId: 1, pointerType: "mouse" });
  const cancel_event_mouse = new PointerEvent("pointercancel", { pointerId: 1, pointerType: "mouse" });

  const move_event_touch = new PointerEvent("pointermove", { pointerId: 2, pointerType: "touch" });
  const down_event_touch = new PointerEvent("pointerdown", { pointerId: 2, pointerType: "touch" });
  const up_event_touch = new PointerEvent("pointerup", { pointerId: 2, pointerType: "touch" });
  const cancel_event_touch = new PointerEvent("pointercancel", { pointerId: 2, pointerType: "touch" });

  const ref = document.createElement("div");

  document.body.appendChild(ref)
  afterAll(() => {
    document.body.removeChild(ref);
  });

  it("listens to mouse events", () => {
    const [pointers, dispose] = createRoot(dispose => [createPointers(ref), dispose]);
    expect(pointers()).toEqual([]);

    ref.dispatchEvent(down_event_mouse);
    expect(pointers()).toEqual([down_event_mouse]);

    ref.dispatchEvent(move_event_mouse);
    expect(pointers()).toEqual([move_event_mouse]);

    ref.dispatchEvent(up_event_mouse);
    expect(pointers()).toEqual([up_event_mouse]);

    ref.dispatchEvent(leave_event_mouse);
    expect(pointers()).toEqual([]);

    ref.dispatchEvent(down_event_mouse);
    expect(pointers()).toEqual([down_event_mouse]);

    ref.dispatchEvent(cancel_event_mouse);
    expect(pointers()).toEqual([]);

    dispose();

    ref.dispatchEvent(down_event_mouse);
    expect(pointers()).toEqual([]);
  });

  it("listens to touch events", () => {
    const [pointers, dispose] = createRoot(dispose => [createPointers(ref), dispose]);
    expect(pointers()).toEqual([]);

    ref.dispatchEvent(down_event_touch);
    expect(pointers()).toEqual([down_event_touch]);

    ref.dispatchEvent(move_event_touch);
    expect(pointers()).toEqual([move_event_touch]);

    ref.dispatchEvent(up_event_touch);
    expect(pointers()).toEqual([]);

    ref.dispatchEvent(down_event_touch);
    expect(pointers()).toEqual([down_event_touch]);

    ref.dispatchEvent(cancel_event_touch);
    expect(pointers()).toEqual([]);

    dispose();

    ref.dispatchEvent(down_event_touch);
    expect(pointers()).toEqual([]);
  })

  it("keeps track of multiple pointers", () => {
    const [pointers, dispose] = createRoot(dispose => [createPointers(ref), dispose]);
    expect(pointers()).toEqual([]);

    ref.dispatchEvent(down_event_mouse);
    expect(pointers()).toEqual([down_event_mouse]);

    ref.dispatchEvent(down_event_touch);
    expect(pointers()).toEqual([down_event_mouse, down_event_touch]);

    ref.dispatchEvent(move_event_mouse);
    expect(pointers()).toEqual([move_event_mouse, down_event_touch]);

    ref.dispatchEvent(move_event_touch);
    expect(pointers()).toEqual([move_event_mouse, move_event_touch]);

    ref.dispatchEvent(up_event_mouse);
    expect(pointers()).toEqual([up_event_mouse, move_event_touch]);

    ref.dispatchEvent(up_event_touch);
    expect(pointers()).toEqual([up_event_mouse]);

    ref.dispatchEvent(leave_event_mouse);
    expect(pointers()).toEqual([]);

    dispose();

    ref.dispatchEvent(down_event_mouse);
    ref.dispatchEvent(down_event_touch);
    expect(pointers()).toEqual([]);
  });
});
