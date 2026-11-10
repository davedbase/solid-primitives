import { renderHydrationRoundTrip } from "../../../scripts/test-utils/hydration-harness.ts";
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { createRoot, createSignal, flush } from "solid-js";
import {
  createInteractOutside,
  type CreateInteractOutsideProps,
} from "../src/index.js";

beforeAll(() => {
  if (!("PointerEvent" in window)) {
    class MockPointerEvent extends MouseEvent {
      readonly pointerId: number;
      readonly pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? "mouse";
      }
    }
    (global as unknown as Record<string, unknown>)["PointerEvent"] = MockPointerEvent;
  }
});

type ElementKind = "div" | "svg";

function createElement(kind: ElementKind, testId: string): Element {
  if (kind === "svg") {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("data-testid", testId);
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "img");
    return el;
  }
  const el = document.createElement("div");
  el.setAttribute("data-testid", testId);
  el.tabIndex = 0;
  return el;
}

function setupTest(
  insideKind: ElementKind,
  outsideKind: ElementKind,
  extraProps: Partial<CreateInteractOutsideProps> = {},
) {
  const onFocusOutside = vi.fn();
  const onPointerDownOutside = vi.fn();
  const onInteractOutside = vi.fn();

  const container = document.createElement("div");
  const inside = createElement(insideKind, "inside");
  const outside = createElement(outsideKind, "outside");
  container.appendChild(inside);
  container.appendChild(outside);
  document.body.appendChild(container);

  const dispose = createRoot(d => {
    createInteractOutside(
      { onFocusOutside, onPointerDownOutside, onInteractOutside, ...extraProps },
      () => inside,
    );
    return d;
  });

  flush();
  vi.runAllTimers(); // advance setTimeout for pointerdown listener registration

  return {
    mocks: { onFocusOutside, onPointerDownOutside, onInteractOutside },
    inside,
    outside,
    cleanup: () => {
      dispose();
      document.body.removeChild(container);
    },
  };
}

const testConfigurations: { name: string; inside: ElementKind; outside: ElementKind }[] = [
  { name: "HTML ref with HTML outside", inside: "div", outside: "div" },
  { name: "SVG ref with HTML outside", inside: "svg", outside: "div" },
  { name: "HTML ref with SVG outside", inside: "div", outside: "svg" },
  { name: "SVG ref with SVG outside", inside: "svg", outside: "svg" },
];

describe("createInteractOutside", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe.each(testConfigurations)("$name", ({ inside: insideKind, outside: outsideKind }) => {
    describe("Focus Events", () => {
      it("triggers onFocusOutside and onInteractOutside when focusing outside", () => {
        const { mocks, outside, cleanup } = setupTest(insideKind, outsideKind);
        outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        expect(mocks.onFocusOutside).toHaveBeenCalledTimes(1);
        expect(mocks.onPointerDownOutside).not.toHaveBeenCalled();
        expect(mocks.onInteractOutside).toHaveBeenCalledTimes(1);
        cleanup();
      });

      it("does not trigger when focusing inside", () => {
        const { mocks, inside, cleanup } = setupTest(insideKind, outsideKind);
        inside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        expect(mocks.onFocusOutside).not.toHaveBeenCalled();
        expect(mocks.onPointerDownOutside).not.toHaveBeenCalled();
        expect(mocks.onInteractOutside).not.toHaveBeenCalled();
        cleanup();
      });

      it("passes the original FocusEvent in event detail", () => {
        const { mocks, outside, cleanup } = setupTest(insideKind, outsideKind);
        const focusEvent = new FocusEvent("focusin", { bubbles: true });
        outside.dispatchEvent(focusEvent);
        const receivedEvent = mocks.onFocusOutside.mock.calls[0]![0];
        expect(receivedEvent.detail.originalEvent).toBe(focusEvent);
        expect(receivedEvent.detail.isContextMenu).toBe(false);
        cleanup();
      });

      it("stops calling onInteractOutside when onFocusOutside calls preventDefault", () => {
        const { mocks, outside, cleanup } = setupTest(insideKind, outsideKind, {
          onFocusOutside: e => e.preventDefault(),
        });
        outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        expect(mocks.onInteractOutside).not.toHaveBeenCalled();
        cleanup();
      });
    });

    describe("Pointer Events", () => {
      it("triggers onPointerDownOutside and onInteractOutside when clicking outside", () => {
        const { mocks, outside, cleanup } = setupTest(insideKind, outsideKind);
        outside.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }),
        );
        expect(mocks.onFocusOutside).not.toHaveBeenCalled();
        expect(mocks.onPointerDownOutside).toHaveBeenCalledTimes(1);
        expect(mocks.onInteractOutside).toHaveBeenCalledTimes(1);
        cleanup();
      });

      it("does not trigger when clicking inside", () => {
        const { mocks, inside, cleanup } = setupTest(insideKind, outsideKind);
        inside.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }),
        );
        expect(mocks.onFocusOutside).not.toHaveBeenCalled();
        expect(mocks.onPointerDownOutside).not.toHaveBeenCalled();
        expect(mocks.onInteractOutside).not.toHaveBeenCalled();
        cleanup();
      });

      it("passes the original PointerEvent in event detail", () => {
        const { mocks, outside, cleanup } = setupTest(insideKind, outsideKind);
        const pointerEvent = new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
        });
        outside.dispatchEvent(pointerEvent);
        const receivedEvent = mocks.onPointerDownOutside.mock.calls[0]![0];
        expect(receivedEvent.detail.originalEvent).toBe(pointerEvent);
        cleanup();
      });

      it("stops calling onInteractOutside when onPointerDownOutside calls preventDefault", () => {
        const { mocks, outside, cleanup } = setupTest(insideKind, outsideKind, {
          onPointerDownOutside: e => e.preventDefault(),
        });
        outside.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }),
        );
        expect(mocks.onInteractOutside).not.toHaveBeenCalled();
        cleanup();
      });
    });
  });

  describe("Configuration", () => {
    it("does not trigger when disabled is true", () => {
      const { mocks, outside, cleanup } = setupTest("div", "div", { disabled: true });
      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(mocks.onFocusOutside).not.toHaveBeenCalled();
      expect(mocks.onPointerDownOutside).not.toHaveBeenCalled();
      expect(mocks.onInteractOutside).not.toHaveBeenCalled();
      cleanup();
    });

    it("does not trigger when disabled accessor returns true", () => {
      const { mocks, outside, cleanup } = setupTest("div", "div", { disabled: () => true });
      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(mocks.onFocusOutside).not.toHaveBeenCalled();
      cleanup();
    });

    it("does not trigger when shouldExcludeElement returns true for the target", () => {
      let excluded: Element | null = null;
      const { mocks, outside, cleanup } = setupTest("div", "div", {
        shouldExcludeElement: el => el === excluded,
      });
      excluded = outside;
      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(mocks.onInteractOutside).not.toHaveBeenCalled();
      cleanup();
    });

    it("triggers when shouldExcludeElement returns false", () => {
      const shouldExcludeElement = vi.fn(() => false);
      const { mocks, outside, cleanup } = setupTest("div", "div", { shouldExcludeElement });
      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(shouldExcludeElement).toHaveBeenCalledWith(outside);
      expect(mocks.onInteractOutside).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it("re-enables listeners when disabled changes from true to false", () => {
      // Must use a Solid signal so the effect reacts to the change.
      const [disabled, setIsDisabled] = createSignal(true);
      const { mocks, outside, cleanup } = setupTest("div", "div", { disabled });

      // Disabled — should not trigger
      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(mocks.onFocusOutside).not.toHaveBeenCalled();

      // Enable and flush to re-register listeners
      setIsDisabled(false);
      flush();
      vi.runAllTimers();

      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(mocks.onFocusOutside).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it("registers listeners when ref resolves from undefined to an element", () => {
      const onFocusOutside = vi.fn();
      const [ref, setRef] = createSignal<HTMLDivElement | undefined>(undefined);

      const container = document.createElement("div");
      const outside = document.createElement("div");
      container.appendChild(outside);
      document.body.appendChild(container);

      const dispose = createRoot(d => {
        createInteractOutside({ onFocusOutside }, ref);
        return d;
      });

      flush();
      vi.runAllTimers();

      // ref is still undefined — no listeners registered
      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(onFocusOutside).not.toHaveBeenCalled();

      // ref resolves — effect re-runs and registers listeners
      const inside = document.createElement("div");
      container.insertBefore(inside, outside);
      setRef(inside as HTMLDivElement);
      flush();
      vi.runAllTimers();

      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(onFocusOutside).toHaveBeenCalledTimes(1);

      dispose();
      document.body.removeChild(container);
    });

    it("cleans up listeners when reactive root is disposed", () => {
      const { mocks, outside, cleanup } = setupTest("div", "div");
      cleanup();
      outside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(mocks.onFocusOutside).not.toHaveBeenCalled();
    });

    it("does not fire for a still-mounted instance whose watched element was removed from the document before its reactive root disposed", () => {
      // Reproduces a real-world race: a dismissable layer's DOM subtree is
      // removed synchronously (e.g. by a Solid `<Show>`) when it closes, but
      // the reactive owner that will call `onCleanup` (removing this
      // instance's document-level listeners) can be scheduled to run a tick
      // later. A second layer opening in that window must not have its
      // legitimate "inside" interactions misread as "outside" by the first,
      // now-orphaned instance.
      const first = setupTest("div", "div");

      // Simulate the DOM removal that happens immediately on close, while
      // deliberately *not* calling `first.cleanup()` yet — this is the gap
      // between DOM removal and reactive disposal that the real bug lives in.
      first.inside.remove();

      const second = setupTest("div", "div");

      // An interaction with the second (live) instance's own content.
      second.inside.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

      // The second instance's own element is "inside" itself, so it must not
      // fire. The first (orphaned) instance's callbacks must not fire either
      // — its watched element is disconnected, so it has nothing left to
      // protect.
      expect(second.mocks.onFocusOutside).not.toHaveBeenCalled();
      expect(first.mocks.onFocusOutside).not.toHaveBeenCalled();

      first.cleanup();
      second.cleanup();
    });
  });

  describe("Shadow DOM", () => {
    // These listeners live on the document, so an event originating inside a shadow tree is
    // retargeted to that tree's host before it arrives. A watched element rendered inside a shadow
    // root would therefore see every one of its own interactions reported as the host — an
    // *ancestor* of it, not a descendant — so `el.contains(target)` read false and the element
    // treated its own content as outside. The visible symptom is a popover that dismisses when you
    // click inside it, and a trigger that closes and immediately reopens.
    function setupShadowTest(extraProps: Partial<CreateInteractOutsideProps> = {}) {
      const onFocusOutside = vi.fn();
      const onPointerDownOutside = vi.fn();
      const onInteractOutside = vi.fn();

      const host = document.createElement("div");
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: "open" });

      // A child of the watched element, not the element itself: only a descendant is deep enough
      // for retargeting to change the answer.
      const inside = createElement("div", "inside");
      const insideChild = createElement("div", "inside-child");
      inside.appendChild(insideChild);
      shadowRoot.appendChild(inside);

      // A sibling in the same shadow root — genuinely outside, and must stay that way.
      const outside = createElement("div", "outside");
      shadowRoot.appendChild(outside);

      const dispose = createRoot(d => {
        createInteractOutside(
          { onFocusOutside, onPointerDownOutside, onInteractOutside, ...extraProps },
          () => inside,
        );
        return d;
      });

      flush();
      vi.runAllTimers();

      return {
        mocks: { onFocusOutside, onPointerDownOutside, onInteractOutside },
        inside,
        insideChild,
        outside,
        cleanup: () => {
          dispose();
          host.remove();
        },
      };
    }

    it("does not trigger on pointerdown inside the watched element's own shadow content", () => {
      const { mocks, insideChild, cleanup } = setupShadowTest();

      insideChild.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" }),
      );

      expect(mocks.onPointerDownOutside).not.toHaveBeenCalled();
      expect(mocks.onInteractOutside).not.toHaveBeenCalled();
      cleanup();
    });

    it("does not trigger when focus moves into the watched element's own shadow content", () => {
      const { mocks, insideChild, cleanup } = setupShadowTest();

      insideChild.dispatchEvent(new FocusEvent("focusin", { bubbles: true, composed: true }));

      expect(mocks.onFocusOutside).not.toHaveBeenCalled();
      expect(mocks.onInteractOutside).not.toHaveBeenCalled();
      cleanup();
    });

    it("still triggers on pointerdown on a sibling in the same shadow root", () => {
      const { mocks, outside, cleanup } = setupShadowTest();

      outside.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" }),
      );

      expect(mocks.onPointerDownOutside).toHaveBeenCalledTimes(1);
      expect(mocks.onInteractOutside).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it("passes the retargeted element, not the shadow host, to shouldExcludeElement", () => {
      // The mechanism behind kobaltedev/kobalte#445: a consumer excludes its trigger via
      // `shouldExcludeElement`, but was handed the shadow host, which never matches the trigger —
      // so the layer dismissed on the very interaction that was meant to be exempt.
      const seen: Element[] = [];
      const { outside, cleanup } = setupShadowTest({
        shouldExcludeElement: el => {
          seen.push(el);
          return false;
        },
      });

      outside.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" }),
      );

      expect(seen).toContain(outside);
      expect(seen.some(el => el.shadowRoot != null)).toBe(false);
      cleanup();
    });

    // Touch defers the outside check to the following `click`, after the pointerdown has finished
    // dispatching — when `composedPath()` is already empty and only the retargeted host remains.
    const touchDown = (target: Element) => {
      target.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "touch" }),
      );
      target.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    };

    it("does not trigger on a touch inside the watched element's own shadow content", () => {
      const { mocks, insideChild, cleanup } = setupShadowTest();

      touchDown(insideChild);

      expect(mocks.onPointerDownOutside).not.toHaveBeenCalled();
      expect(mocks.onInteractOutside).not.toHaveBeenCalled();
      cleanup();
    });

    it("still triggers on a touch on a sibling in the same shadow root", () => {
      const seen: Element[] = [];
      // Read during dispatch: an event dispatched inside a shadow tree has its `target` cleared
      // once dispatch ends.
      const dispatchedOn: (EventTarget | null)[] = [];
      const { mocks, outside, cleanup } = setupShadowTest({
        shouldExcludeElement: el => {
          seen.push(el);
          return false;
        },
        onPointerDownOutside: e => dispatchedOn.push(e.target),
      });

      touchDown(outside);

      expect(seen).toHaveLength(1);
      expect(seen[0]).toBe(outside);
      expect(dispatchedOn).toHaveLength(1);
      expect(dispatchedOn[0]).toBe(outside);
      expect(mocks.onInteractOutside).toHaveBeenCalledTimes(1);
      cleanup();
    });

    /** Watches a light-DOM element; returns a foreign web component with an open shadow root. */
    function setupForeignComponentTest(extraProps: Partial<CreateInteractOutsideProps> = {}) {
      const onPointerDownOutside = vi.fn();

      const inside = createElement("div", "inside");
      const component = document.createElement("div");
      const componentInner = document.createElement("button");
      component.attachShadow({ mode: "open" }).appendChild(componentInner);
      document.body.append(inside, component);

      const dispose = createRoot(d => {
        createInteractOutside({ onPointerDownOutside, ...extraProps }, () => inside);
        return d;
      });

      flush();
      vi.runAllTimers();

      return {
        onPointerDownOutside,
        component,
        componentInner,
        cleanup: () => {
          dispose();
          inside.remove();
          component.remove();
        },
      };
    }

    it("reports an interaction inside a foreign component as that component's host", () => {
      // A watched element in the light DOM sees exactly what it saw before shadow-aware resolution:
      // the component's internals stay encapsulated behind its host.
      const seen: Element[] = [];
      const { onPointerDownOutside, component, componentInner, cleanup } =
        setupForeignComponentTest({
          shouldExcludeElement: el => {
            seen.push(el);
            return false;
          },
        });

      componentInner.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" }),
      );

      expect(seen).toHaveLength(1);
      expect(seen[0]).toBe(component);
      expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
      expect(onPointerDownOutside.mock.calls[0]![0].target).toBe(component);
      cleanup();
    });

    it("lets shouldExcludeElement exempt a web-component trigger via trigger.contains(el)", () => {
      // The README's own exclusion pattern. `contains` can't see into a shadow root, so it would
      // stop matching if the callback were handed the component's internal element.
      const triggerRef: { current?: Element } = {};
      const { onPointerDownOutside, component, componentInner, cleanup } =
        setupForeignComponentTest({
          shouldExcludeElement: el => !!triggerRef.current?.contains(el),
        });
      triggerRef.current = component;

      componentInner.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" }),
      );
      touchDown(componentInner);

      expect(onPointerDownOutside).not.toHaveBeenCalled();
      cleanup();
    });

    it("reports a nested component inside the watched element's shadow root as its host", () => {
      // Retargeting is relative to the watched element's tree: siblings in its shadow root are
      // themselves, but a component nested in that root is still encapsulated behind its host.
      const seen: Element[] = [];
      const host = document.createElement("div");
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: "open" });
      const inside = createElement("div", "inside");
      const nested = document.createElement("div");
      const nestedInner = document.createElement("button");
      nested.attachShadow({ mode: "open" }).appendChild(nestedInner);
      shadowRoot.append(inside, nested);

      const dispose = createRoot(d => {
        createInteractOutside(
          {
            shouldExcludeElement: el => {
              seen.push(el);
              return false;
            },
          },
          () => inside,
        );
        return d;
      });
      flush();
      vi.runAllTimers();

      nestedInner.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" }),
      );

      expect(seen).toHaveLength(1);
      expect(seen[0]).toBe(nested);
      dispose();
      host.remove();
    });

    it("does not trigger on content slotted into the watched element", () => {
      // Slotted nodes stay in the light tree, so no ancestor walk from them reaches the watched
      // element — but they render inside it, and the event's composed path says so.
      const onPointerDownOutside = vi.fn();
      const host = document.createElement("div");
      const slotted = document.createElement("p");
      host.appendChild(slotted);
      document.body.appendChild(host);
      const inside = createElement("div", "inside");
      inside.appendChild(document.createElement("slot"));
      host.attachShadow({ mode: "open" }).appendChild(inside);

      const dispose = createRoot(d => {
        createInteractOutside({ onPointerDownOutside }, () => inside);
        return d;
      });
      flush();
      vi.runAllTimers();

      slotted.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse" }),
      );
      touchDown(slotted);

      expect(onPointerDownOutside).not.toHaveBeenCalled();
      dispose();
      host.remove();
    });

    it("resolves targets for elements from another realm (iframe document)", () => {
      // Nodes created in an iframe have that window's `Element`/`ShadowRoot` constructors, so
      // `instanceof` against this module's globals is always false for them.
      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);
      const frameDoc = iframe.contentDocument!;
      const FrameMouseEvent = iframe.contentWindow!.MouseEvent;
      expect(frameDoc.createElement("div")).not.toBeInstanceOf(Element);

      const host = frameDoc.createElement("div");
      frameDoc.body.appendChild(host);
      const inside = frameDoc.createElement("div");
      const insideChild = frameDoc.createElement("button");
      inside.appendChild(insideChild);
      const sibling = frameDoc.createElement("div");
      host.attachShadow({ mode: "open" }).append(inside, sibling);
      const lightOutside = frameDoc.createElement("div");
      frameDoc.body.appendChild(lightOutside);

      const reported: (EventTarget | null)[] = [];
      const dispose = createRoot(d => {
        createInteractOutside({ onPointerDownOutside: e => reported.push(e.target) }, () => inside);
        return d;
      });
      flush();
      vi.runAllTimers();

      const down = (target: Element) =>
        target.dispatchEvent(new FrameMouseEvent("pointerdown", { bubbles: true, composed: true }));
      down(insideChild);
      down(sibling);
      down(lightOutside);

      expect(reported).toHaveLength(2);
      expect(reported[0]).toBe(sibling);
      expect(reported[1]).toBe(lightOutside);
      dispose();
      iframe.remove();
    });
  });
});

it("hydrates primitive output and its following sibling", async () => {
  const result = await renderHydrationRoundTrip(
    `
    import { createInteractOutside } from "@solid-primitives/interaction";
    function Child() { createInteractOutside({ disabled: true }, () => undefined); return <button ref={el => el.dataset.bound = "child"}>child</button>; }
    export default function App() { return <><Child /><span ref={el => el.dataset.bound = "sibling"}>sibling</span></>; }
  `,
    import.meta.dirname,
  );
  try {
    expect(result.consoleMessages).toEqual([]);
    expect(result.container.querySelector("button")).toBe(result.serverNodes[0]);
    expect(result.container.querySelector("span")).toBe(result.serverNodes[1]);
    expect((result.serverNodes[0] as HTMLElement).dataset.bound).toBe("child");
    expect((result.serverNodes[1] as HTMLElement).dataset.bound).toBe("sibling");
  } finally {
    result.cleanup();
  }
});
