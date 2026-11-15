import { describe, test, expect, vi, beforeEach, afterAll, beforeAll } from "vitest";
import { createRoot, createSignal, flush } from "solid-js";
import {
  autofocus,
  createAutofocus,
  createFocusTrap,
  createFocusRestore,
  createFocusGroup,
} from "../src/index.js";

let focused: HTMLElement | null = null;

const original_focus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function (this: HTMLElement) {
  focused = this;
};

beforeAll(() => {
  vi.useFakeTimers();
  // afterPaint uses double rAF; stub it as setTimeout so vi.runAllTimers() drives it.
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) =>
    setTimeout(() => fn(performance.now()), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});

beforeEach(() => {
  vi.clearAllTimers();
  focused = null;
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  HTMLElement.prototype.focus = original_focus;
});

/** Run all pending effects then drain all timers (including nested rAFs). */
const settle = () => {
  flush();
  vi.runAllTimers();
};

describe("autofocus", () => {
  test("focuses the element with autofocus attribute", () => {
    const el = document.createElement("button");
    el.setAttribute("autofocus", "");

    const dispose = createRoot(dispose => {
      const ref = autofocus();
      ref(el);
      return dispose;
    });

    settle();
    expect(focused).toBe(el);
    dispose();
  });

  test("doesn't focus when autofocus attribute is absent", () => {
    const el = document.createElement("button");

    const dispose = createRoot(dispose => {
      const ref = autofocus();
      ref(el);
      return dispose;
    });

    settle();
    expect(focused).toBe(null);
    dispose();
  });
});

describe("createAutofocus", () => {
  const el = document.createElement("button"),
    el2 = document.createElement("button");

  test("focuses the element", () => {
    const dispose = createRoot(dispose => {
      createAutofocus(() => el);
      return dispose;
    });

    settle();
    expect(focused).toBe(el);
    dispose();
  });

  test("works with signal — focuses when signal is set", () => {
    const [ref, setRef] = createSignal<HTMLButtonElement>();

    const dispose = createRoot(dispose => {
      createAutofocus(ref);
      return dispose;
    });

    settle();
    expect(focused).toBe(null);

    setRef(el);
    settle();
    expect(focused).toBe(el);

    setRef(el2);
    settle();
    expect(focused).toBe(el2);

    dispose();

    setRef(el);
    vi.runAllTimers();
    expect(focused).toBe(el2); // no focus after dispose
  });
});

/** Build a container with `n` focusable buttons and return them. */
function makeContainer(n: number): { container: HTMLElement; buttons: HTMLButtonElement[] } {
  const container = document.createElement("div");
  const buttons: HTMLButtonElement[] = [];
  for (let i = 0; i < n; i++) {
    const btn = document.createElement("button");
    btn.textContent = `btn${i}`;
    container.appendChild(btn);
    buttons.push(btn);
  }
  return { container, buttons };
}

function tabKey(shiftKey = false) {
  return new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, cancelable: true });
}

describe("createFocusTrap", () => {
  test("focuses the first focusable element on activation", () => {
    const { container, buttons } = makeContainer(3);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container });
      return dispose;
    });

    settle();
    expect(focused).toBe(buttons[0]);
    dispose();
  });

  test("Tab on last element wraps to first", () => {
    const { container, buttons } = makeContainer(3);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container });
      return dispose;
    });

    settle();
    buttons[2]!.dispatchEvent(tabKey(false));
    expect(focused).toBe(buttons[0]);
    dispose();
  });

  test("Shift+Tab on first element wraps to last", () => {
    const { container, buttons } = makeContainer(3);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container });
      return dispose;
    });

    settle();
    buttons[0]!.dispatchEvent(tabKey(true));
    expect(focused).toBe(buttons[2]);
    dispose();
  });

  test("blocks Tab when there are no focusable elements", () => {
    const container = document.createElement("div"); // no children

    let tabPrevented = false;
    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container });
      return dispose;
    });

    flush(); // run effects so preventTab listener is added

    const event = tabKey();
    Object.defineProperty(event, "defaultPrevented", { get: () => tabPrevented });
    const originalPreventDefault = event.preventDefault.bind(event);
    event.preventDefault = () => {
      tabPrevented = true;
      originalPreventDefault();
    };

    document.dispatchEvent(event);
    expect(tabPrevented).toBe(true);
    dispose();
  });

  test("does not activate when enabled is false", () => {
    const { container } = makeContainer(2);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, enabled: false });
      return dispose;
    });

    settle();
    expect(focused).toBe(null);
    dispose();
  });

  test("activates and deactivates reactively via enabled signal", () => {
    const { container, buttons } = makeContainer(2);
    const [enabled, setEnabled] = createSignal(false);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, enabled });
      return dispose;
    });

    settle();
    expect(focused).toBe(null); // not yet enabled

    setEnabled(true);
    settle();
    expect(focused).toBe(buttons[0]); // initial focus

    dispose();
  });

  test("restores focus to the previously focused element on deactivation", () => {
    const { container, buttons } = makeContainer(2);
    const trigger = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);

    // Pretend `trigger` is the element that was focused before the trap.
    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, enabled });
      return dispose;
    });

    settle();
    expect(focused).toBe(buttons[0]); // initial focus inside trap

    // Restore the real activeElement descriptor before deactivating
    Object.defineProperty(document, "activeElement", origActiveElement);

    setEnabled(false);
    settle();
    expect(focused).toBe(trigger); // focus restored
    dispose();
  });

  test("uses initialFocusElement when provided", () => {
    const { container, buttons } = makeContainer(3);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, initialFocusElement: buttons[2] });
      return dispose;
    });

    settle();
    expect(focused).toBe(buttons[2]);
    dispose();
  });

  test("uses finalFocusElement when provided on deactivation", () => {
    const { container } = makeContainer(2);
    const customFinal = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, enabled, finalFocusElement: customFinal });
      return dispose;
    });

    settle();

    setEnabled(false);
    settle();
    expect(focused).toBe(customFinal);
    dispose();
  });

  test("onInitialFocus callback is called when trap activates", () => {
    const { container } = makeContainer(1);
    const onInitialFocus = vi.fn();

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, onInitialFocus });
      return dispose;
    });

    settle();
    expect(onInitialFocus).toHaveBeenCalledOnce();
    dispose();
  });

  test("onInitialFocus preventDefault suppresses initial focus", () => {
    const { container } = makeContainer(1);

    const dispose = createRoot(dispose => {
      createFocusTrap({
        element: container,
        onInitialFocus: e => e.preventDefault(),
      });
      return dispose;
    });

    settle();
    expect(focused).toBe(null);
    dispose();
  });

  test("onFinalFocus callback is called on deactivation", () => {
    const { container } = makeContainer(1);
    const [enabled, setEnabled] = createSignal(true);
    const onFinalFocus = vi.fn();

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, enabled, onFinalFocus });
      return dispose;
    });

    settle();
    setEnabled(false);
    settle();
    expect(onFinalFocus).toHaveBeenCalledOnce();
    dispose();
  });

  test("onFinalFocus preventDefault suppresses focus restore", () => {
    const { container } = makeContainer(1);
    const trigger = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusTrap({
        element: container,
        enabled,
        onFinalFocus: e => e.preventDefault(),
      });
      return dispose;
    });

    settle();
    Object.defineProperty(document, "activeElement", origActiveElement);

    focused = null;
    setEnabled(false);
    settle();
    expect(focused).toBe(null); // prevented
    dispose();
  });

  test("does not restore focus when restoreFocus is false", () => {
    const { container } = makeContainer(1);
    const [enabled, setEnabled] = createSignal(true);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container, enabled, restoreFocus: false });
      return dispose;
    });

    settle();
    focused = null;
    setEnabled(false);
    settle();
    expect(focused).toBe(null);
    dispose();
  });

  test("respects tabIndex ordering for focusable elements", () => {
    const container = document.createElement("div");
    const a = document.createElement("button"); // tabIndex 0
    const b = document.createElement("button");
    b.tabIndex = 2;
    const c = document.createElement("button");
    c.tabIndex = 1;
    // DOM order: a(0), b(2), c(1)  →  sorted: a(0), c(1), b(2)
    container.append(a, b, c);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: container });
      return dispose;
    });

    settle();
    expect(focused).toBe(a); // first by tabIndex order

    // Tab on last (b, tabIndex=2) wraps to first (a, tabIndex=0)
    b.dispatchEvent(tabKey(false));
    expect(focused).toBe(a);

    // Shift+Tab on first (a) wraps to last (b)
    a.dispatchEvent(tabKey(true));
    expect(focused).toBe(b);

    dispose();
  });

  test("element as reactive signal — activates when signal becomes non-null", () => {
    const { container, buttons } = makeContainer(2);
    const [el, setEl] = createSignal<HTMLElement | null>(null);

    const dispose = createRoot(dispose => {
      createFocusTrap({ element: el });
      return dispose;
    });

    settle();
    expect(focused).toBe(null);

    setEl(container);
    settle();
    expect(focused).toBe(buttons[0]);
    dispose();
  });
});

describe("createFocusRestore", () => {
  test("does not move focus on activation", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    focused = null; // reset after the manual .focus() above

    const dispose = createRoot(dispose => {
      createFocusRestore({ enabled: true });
      return dispose;
    });

    settle();
    expect(focused).toBe(null); // createFocusRestore never focuses anything itself
    dispose();
    trigger.remove();
  });

  test("restores focus to the previously focused element on deactivation", () => {
    const trigger = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusRestore({ enabled });
      return dispose;
    });

    settle();
    Object.defineProperty(document, "activeElement", origActiveElement);

    setEnabled(false);
    settle();
    expect(focused).toBe(trigger);
    dispose();
  });

  test("a reactivation before a pending restore fires does not corrupt that restore's target", () => {
    // Regression test: the restore target used to be read lazily from a shared outer variable
    // inside the afterPaint-deferred callback. If something reactivated focus-restore (capturing
    // a *new* "currently focused" element) before the still-pending restore from the *previous*
    // deactivation had a chance to fire, that pending restore would incorrectly pick up the new
    // value instead of the one that was current when it was scheduled.
    const trigger1 = document.createElement("button");
    const trigger2 = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", { get: () => trigger1, configurable: true });

    const dispose = createRoot(dispose => {
      createFocusRestore({ enabled });
      return dispose;
    });

    settle(); // originalFocusedElement captured as trigger1

    setEnabled(false); // schedules a restore that should target trigger1
    flush(); // runs the deactivation synchronously — the afterPaint restore is now pending, not yet fired

    // Before that pending restore fires, something reactivates focus-restore against a
    // different currently-focused element, and stays enabled (no second deactivation, so no
    // second restore gets queued — isolates exactly the race being tested).
    Object.defineProperty(document, "activeElement", { get: () => trigger2, configurable: true });
    setEnabled(true);
    flush();

    Object.defineProperty(document, "activeElement", origActiveElement);

    vi.runAllTimers(); // drains the still-pending first restore
    expect(focused).toBe(trigger1); // not trigger2
    dispose();
  });

  test("restores focus on dispose even without enabled changing first", () => {
    const trigger = document.createElement("button");

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusRestore();
      return dispose;
    });

    settle();
    Object.defineProperty(document, "activeElement", origActiveElement);

    dispose();
    settle();
    expect(focused).toBe(trigger);
  });

  test("uses finalFocusElement when provided", () => {
    const trigger = document.createElement("button");
    const customFinal = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusRestore({ enabled, finalFocusElement: customFinal });
      return dispose;
    });

    settle();
    Object.defineProperty(document, "activeElement", origActiveElement);

    setEnabled(false);
    settle();
    expect(focused).toBe(customFinal);
    dispose();
  });

  test("onFinalFocus callback is called on deactivation", () => {
    const trigger = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);
    const onFinalFocus = vi.fn();

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusRestore({ enabled, onFinalFocus });
      return dispose;
    });

    settle();
    Object.defineProperty(document, "activeElement", origActiveElement);

    setEnabled(false);
    settle();
    expect(onFinalFocus).toHaveBeenCalledOnce();
    dispose();
  });

  test("onFinalFocus preventDefault suppresses focus restore", () => {
    const trigger = document.createElement("button");
    const [enabled, setEnabled] = createSignal(true);

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusRestore({ enabled, onFinalFocus: e => e.preventDefault() });
      return dispose;
    });

    settle();
    Object.defineProperty(document, "activeElement", origActiveElement);

    focused = null;
    setEnabled(false);
    settle();
    expect(focused).toBe(null); // prevented
    dispose();
  });

  test("does not restore focus when enabled is false throughout", () => {
    const trigger = document.createElement("button");

    const origActiveElement = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement")!;
    Object.defineProperty(document, "activeElement", {
      get: () => trigger,
      configurable: true,
    });

    const dispose = createRoot(dispose => {
      createFocusRestore({ enabled: false });
      return dispose;
    });

    settle();
    Object.defineProperty(document, "activeElement", origActiveElement);

    dispose();
    settle();
    expect(focused).toBe(null);
  });
});

describe("createFocusGroup", () => {
  test("focusFirst focuses and returns the first focusable element", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(() => container);
      expect(group.focusFirst()).toBe(buttons[0]);
      expect(focused).toBe(buttons[0]);
      dispose();
    });
  });

  test("focusLast focuses and returns the last focusable element", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(() => container);
      expect(group.focusLast()).toBe(buttons[2]);
      expect(focused).toBe(buttons[2]);
      dispose();
    });
  });

  test("focusNext moves to the next element from `from`", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(() => container);
      expect(group.focusNext({ from: buttons[0] })).toBe(buttons[1]);
      expect(focused).toBe(buttons[1]);
      dispose();
    });
  });

  test("focusNext defaults to the currently focused element", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const origActiveElement = Object.getOwnPropertyDescriptor(
        Document.prototype,
        "activeElement",
      )!;
      Object.defineProperty(document, "activeElement", {
        get: () => buttons[0],
        configurable: true,
      });

      const group = createFocusGroup(() => container);
      expect(group.focusNext()).toBe(buttons[1]);

      Object.defineProperty(document, "activeElement", origActiveElement);
      dispose();
    });
  });

  test("focusPrevious moves to the previous element from `from`", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(() => container);
      expect(group.focusPrevious({ from: buttons[2] })).toBe(buttons[1]);
      expect(focused).toBe(buttons[1]);
      dispose();
    });
  });

  test("focusNext wraps from the last element when wrap is true", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(() => container);
      expect(group.focusNext({ from: buttons[2], wrap: true })).toBe(buttons[0]);
      expect(focused).toBe(buttons[0]);
      dispose();
    });
  });

  test("focusPrevious wraps from the first element when wrap is true", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(() => container);
      expect(group.focusPrevious({ from: buttons[0], wrap: true })).toBe(buttons[2]);
      expect(focused).toBe(buttons[2]);
      dispose();
    });
  });

  test("does not wrap when wrap is false", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(() => container);
      expect(group.focusNext({ from: buttons[2], wrap: false })).toBe(undefined);
      expect(focused).toBe(null);
      dispose();
    });
  });

  test("respects defaultOptions", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const group = createFocusGroup(
        () => container,
        () => ({ wrap: true }),
      );
      expect(group.focusNext({ from: buttons[2] })).toBe(buttons[0]);
      dispose();
    });
  });

  test("tabbable option only includes tabbable elements", () => {
    createRoot(dispose => {
      const container = document.createElement("div");
      const a = document.createElement("button");
      const b = document.createElement("button");
      b.tabIndex = -1; // focusable but not tabbable
      container.append(a, b);

      const group = createFocusGroup(() => container);
      expect(group.focusNext({ from: a, tabbable: true })).toBe(undefined); // b excluded
      expect(group.focusNext({ from: a, tabbable: false })).toBe(b); // all focusable
      dispose();
    });
  });

  test("accept option filters elements", () => {
    createRoot(dispose => {
      const container = document.createElement("div");
      const a = document.createElement("button");
      a.id = "keep";
      const b = document.createElement("button");
      b.id = "skip";
      container.append(a, b);

      const group = createFocusGroup(() => container);
      expect(group.focusNext({ from: a, accept: el => el.id !== "skip" })).toBe(undefined);
      expect(group.focusFirst({ accept: el => el.id !== "skip" })).toBe(a);
      dispose();
    });
  });

  test("returns undefined when root is not set", () => {
    createRoot(dispose => {
      const group = createFocusGroup(() => undefined);
      expect(group.focusFirst()).toBe(undefined);
      expect(group.focusNext()).toBe(undefined);
      expect(group.focusPrevious()).toBe(undefined);
      expect(group.focusLast()).toBe(undefined);
      dispose();
    });
  });
});

describe("createFocusGroup keyboard navigation", () => {
  const key = (key: string, opts: KeyboardEventInit = {}) =>
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...opts });

  /** Flush pending effects so `createFocusGroup` has attached its keydown listener, then dispatch `event` on `target`. */
  const press = (container: HTMLElement, target: Element, event: KeyboardEvent) => {
    flush();
    target.dispatchEvent(event);
    return event;
  };

  test("ArrowDown moves focus to the next element (vertical by default)", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(() => container);
      press(container, buttons[0]!, key("ArrowDown"));
      expect(focused).toBe(buttons[1]);
      dispose();
    });
  });

  test("ArrowUp moves focus to the previous element", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(() => container);
      press(container, buttons[2]!, key("ArrowUp"));
      expect(focused).toBe(buttons[1]);
      dispose();
    });
  });

  test("ArrowDown does not wrap by default", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(() => container);
      press(container, buttons[2]!, key("ArrowDown"));
      expect(focused).toBe(null);
      dispose();
    });
  });

  test("ArrowDown wraps when wrap is true", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(
        () => container,
        () => ({ wrap: true }),
      );
      press(container, buttons[2]!, key("ArrowDown"));
      expect(focused).toBe(buttons[0]);
      dispose();
    });
  });

  test("ArrowUp wraps when wrap is true", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(
        () => container,
        () => ({ wrap: true }),
      );
      press(container, buttons[0]!, key("ArrowUp"));
      expect(focused).toBe(buttons[2]);
      dispose();
    });
  });

  test("horizontal orientation uses left/right arrows", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(
        () => container,
        () => ({ orientation: "horizontal" }),
      );
      press(container, buttons[0]!, key("ArrowRight"));
      expect(focused).toBe(buttons[1]);
      press(container, buttons[1]!, key("ArrowLeft"));
      expect(focused).toBe(buttons[0]);
      dispose();
    });
  });

  test("horizontal RTL flips the arrow keys", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(
        () => container,
        () => ({ orientation: "horizontal", textDirection: "rtl" }),
      );
      press(container, buttons[0]!, key("ArrowLeft"));
      expect(focused).toBe(buttons[1]);
      press(container, buttons[1]!, key("ArrowRight"));
      expect(focused).toBe(buttons[0]);
      dispose();
    });
  });

  test("Home and End move to the first and last element", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(() => container);
      press(container, buttons[0]!, key("Home"));
      expect(focused).toBe(buttons[0]);
      press(container, buttons[1]!, key("End"));
      expect(focused).toBe(buttons[2]);
      dispose();
    });
  });

  test("handles accessor options", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(
        () => container,
        () => ({ orientation: () => "horizontal" }),
      );
      press(container, buttons[0]!, key("ArrowRight"));
      expect(focused).toBe(buttons[1]);
      dispose();
    });
  });

  test("Tab moves to the next element when focus is inside the group", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const origActiveElement = Object.getOwnPropertyDescriptor(
        Document.prototype,
        "activeElement",
      )!;
      Object.defineProperty(document, "activeElement", {
        get: () => buttons[0],
        configurable: true,
      });

      createFocusGroup(() => container);
      const event = key("Tab");
      const prevent = vi.spyOn(event, "preventDefault");
      press(container, buttons[0]!, event);

      expect(focused).toBe(buttons[1]);
      expect(prevent).toHaveBeenCalled();
      Object.defineProperty(document, "activeElement", origActiveElement);
      dispose();
    });
  });

  test("Shift+Tab moves to the previous element", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      const origActiveElement = Object.getOwnPropertyDescriptor(
        Document.prototype,
        "activeElement",
      )!;
      Object.defineProperty(document, "activeElement", {
        get: () => buttons[2],
        configurable: true,
      });

      createFocusGroup(() => container);
      press(container, buttons[2]!, key("Tab", { shiftKey: true }));
      expect(focused).toBe(buttons[1]);
      Object.defineProperty(document, "activeElement", origActiveElement);
      dispose();
    });
  });

  test("Tab does not move focus when focus is outside the group", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(() => container);
      press(container, buttons[0]!, key("Tab"));
      expect(focused).toBe(null);
      dispose();
    });
  });

  test("arrow keys call preventDefault", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(() => container);
      const event = key("ArrowDown");
      const prevent = vi.spyOn(event, "preventDefault");
      press(container, buttons[0]!, event);
      expect(prevent).toHaveBeenCalled();
      dispose();
    });
  });

  test("does not attach a listener when root is not set", () => {
    createRoot(dispose => {
      createFocusGroup(() => undefined);
      const event = key("ArrowDown");
      const prevent = vi.spyOn(event, "preventDefault");
      flush();
      document.body.dispatchEvent(event);
      expect(prevent).not.toHaveBeenCalled();
      expect(focused).toBe(null);
      dispose();
    });
  });

  test("keyboardNavigation: false disables key handling", () => {
    createRoot(dispose => {
      const { container, buttons } = makeContainer(3);
      createFocusGroup(
        () => container,
        () => ({ keyboardNavigation: false }),
      );
      const event = key("ArrowDown");
      const prevent = vi.spyOn(event, "preventDefault");
      press(container, buttons[0]!, event);
      expect(focused).toBe(null);
      expect(prevent).not.toHaveBeenCalled();
      dispose();
    });
  });

  test("keyboardNavigation can be toggled reactively", () => {
    const { container, buttons } = makeContainer(3);
    const [enabled, setEnabled] = createSignal(true);
    let dispose!: () => void;
    createRoot(d => {
      dispose = d;
      createFocusGroup(
        () => container,
        () => ({ keyboardNavigation: enabled() }),
      );
      press(container, buttons[0]!, key("ArrowDown"));
      expect(focused).toBe(buttons[1]);
    });

    setEnabled(false);
    focused = null;
    press(container, buttons[0]!, key("ArrowDown"));
    expect(focused).toBe(null);

    setEnabled(true);
    press(container, buttons[0]!, key("ArrowDown"));
    expect(focused).toBe(buttons[1]);
    dispose();
  });

  test("keydown listener follows the ref and is removed from the previous ref", () => {
    const { container, buttons } = makeContainer(3);
    const otherContainer = document.createElement("div");
    const otherButtons = [document.createElement("button"), document.createElement("button")];
    otherButtons.forEach(btn => otherContainer.appendChild(btn));

    const [ref, setRef] = createSignal<HTMLElement | undefined>(container);
    let dispose!: () => void;
    createRoot(d => {
      dispose = d;
      createFocusGroup(ref);
      press(container, buttons[0]!, key("ArrowDown"));
      expect(focused).toBe(buttons[1]);
    });

    setRef(otherContainer);
    focused = null;
    press(container, buttons[0]!, key("ArrowDown"));
    expect(focused).toBe(null); // listener removed from the old container

    press(otherContainer, otherButtons[0]!, key("ArrowDown"));
    expect(focused).toBe(otherButtons[1]); // listener attached to the new ref
    dispose();
  });
});
