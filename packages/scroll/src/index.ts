import { createEventListener } from "@solid-primitives/event-listener";
import { createHydratableSingletonRoot } from "@solid-primitives/rootless";
import { createDerivedStaticStore } from "@solid-primitives/static-store";
import { Accessor, createSignal, onMount, sharedConfig } from "solid-js";
import { isServer } from "solid-js/web";

export function getScrollParent(node: Element | null): Element {
  if (isServer) {
    return {} as Element;
  }
  while (node && !isScrollable(node)) {
    node = node.parentElement;
  }

  return node || document.scrollingElement || document.documentElement;
}

export function isScrollable(node: Element): boolean {
  if (isServer) {
    return false;
  }
  const style = window.getComputedStyle(node);
  return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);
}

export type Position = {
  x: number;
  y: number;
};

const FALLBACK_SCROLL_POSITION = { x: 0, y: 0 } as const satisfies Position;

/**
 * Get an `{ x: number, y: number }` object of element/window scroll position.
 */
export function getScrollPosition(target: Element | Window | undefined): Position {
  if (isServer || !target) {
    return { ...FALLBACK_SCROLL_POSITION };
  }
  if (target instanceof Window)
    return {
      x: target.scrollX,
      y: target.scrollY,
    };
  return {
    x: target.scrollLeft,
    y: target.scrollTop,
  };
}

/**
 * Reactive primitive providing a store-like object with current scroll position of specified target.
 * @param target element/window to listen to scroll events. can be a reactive singal.
 * @returns a store-like reactive object `{ x: number, y: number }` of current scroll position of {@link target}
 * @example
 * // target will be window by default
 * const windowScroll = createScrollPosition();
 *
 * createEffect(() => {
 *   // returned object is a reactive store-like structure
 *   windowScroll.x; // => number
 *   windowScroll.y; // => number
 * });
 */
export function createScrollPosition(
  target?: Accessor<Element | Window | undefined> | Element | Window,
): Readonly<Position> {
  if (isServer) {
    return FALLBACK_SCROLL_POSITION;
  }

  target = target || window;

  const isFn = typeof target === "function",
    isHydrating = sharedConfig.context,
    getTargetPos = isFn
      ? () => getScrollPosition((target as Extract<typeof target, Function>)())
      : () => getScrollPosition(target as Element | Window),
    // changing the calc signal will trigger the derived store to update
    [calc, setCalc] = createSignal(isHydrating ? () => FALLBACK_SCROLL_POSITION : getTargetPos, {
      equals: false,
    }),
    trigger = () => setCalc(() => getTargetPos),
    pos = createDerivedStaticStore(() => calc()());

  // update the position on mount if we are hydrating (initial pos is null)
  // or if target is a function (which means it could be a ref that will be populated onMount)
  if (isHydrating || isFn) onMount(trigger);

  createEventListener(target, "scroll", trigger, { passive: true });

  return pos;
}

/**
 * Returns a reactive object with current window scroll position.
 *
 * This is a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) primitive.
 *
 * @example
 * const scroll = useWindowScrollPosition();
 * createEffect(() => {
 *   console.log(scroll.x, scroll.y)
 * })
 */
export const useWindowScrollPosition = /*#__PURE__*/ createHydratableSingletonRoot(() =>
  createScrollPosition(isServer ? () => undefined : window),
);

export type ScrollToOptions = {
  left?: number;
  top?: number;
  behavior?: ScrollBehavior;
};

/**
 * Returns a function to scrolling the specified target element or window.
 *
 * @param target - element/window to scroll. Can be a reactive signal.
 * @returns a function that takes scroll options or x and y coordinates to scroll the target.
 *
 * @example
 * // Using with default window target
 * const scrollTo = createScrollTo();
 * scrollTo({ top: 100, behavior: 'smooth' });
 *
 * // Using with a specific element
 * const [element, setElement] = createSignal(document.getElementById('myElement'));
 * const elementScrollTo = createScrollTo(element);
 * elementScrollTo({ left: 50, behavior: 'smooth' });
 *
 * // Using with x and y coordinates
 * scrollTo(100, 200);
 */
export function createScrollTo(
  target: Accessor<Element | Window | undefined> | Element | Window = window,
) {
  return (options: ScrollToOptions | number, y?: number) => {
    const currentTarget = typeof target === "function" ? target() : target;

    if (!currentTarget || isServer) return;

    if (typeof options === "number") {
      options = {
        left: options,
        top: y,
      };
    }

    const { left, top, behavior = "auto" } = options;

    if (currentTarget instanceof Window) {
      currentTarget.scrollTo({ left, top, behavior });
    } else {
      currentTarget.scrollTo({ left, top, behavior });
    }
  };
}
