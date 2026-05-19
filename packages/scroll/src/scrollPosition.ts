import { type Accessor, createEffect, createRenderEffect, createSignal, onSettled, sharedConfig } from "solid-js";
import { isServer } from "@solidjs/web";
import { createHydratableSingletonRoot } from "@solid-primitives/rootless";
import { createDerivedStaticStore } from "@solid-primitives/static-store";

export function getScrollParent(node: Element | undefined): Element {
  if (isServer) {
    return {} as Element;
  }
  while (node && !isScrollable(node)) {
    node = node.parentElement ?? undefined;
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
    return FALLBACK_SCROLL_POSITION;
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
  // Reactive primitives must be created on both server and client to keep Solid 2.0
  // hydration child IDs consistent — all component scopes are transparent and share
  // the root counter. DOM operations are guarded inside the apply phases.
  if (!isServer) {
    target = target || window;
  }

  const isFn = typeof target === "function";
  const isHydrating = sharedConfig.hydrating;

  const getPos = (): Position =>
    isServer
      ? { ...FALLBACK_SCROLL_POSITION }
      : getScrollPosition(
          isFn ? (target as Accessor<Element | Window | undefined>)() : (target as Element | Window),
        );

  // Plain integer counter — avoids Solid 2.0 createSignal(fn) derived-signal semantics.
  // ownedWrite allows writes from DOM event handlers inside reactive scopes.
  let tick = 1;
  const [version, setVersion] = createSignal(0, { ownedWrite: true });
  const trigger = () => void setVersion(tick++);

  const pos = createDerivedStaticStore<Position>(() => {
    const v = version();
    return isHydrating && v === 0 ? { ...FALLBACK_SCROLL_POSITION } : getPos();
  });

  // Refs aren't populated until mount; also refreshes position post-hydration.
  if (!isServer && (isHydrating || isFn)) onSettled(trigger);

  // Use createEffect/createRenderEffect directly instead of createEventListener so
  // an effect node is always created (consuming a child ID) on both server and client.
  // createEventListener returns early on server, which would cause a child ID mismatch.
  if (isFn) {
    const fnTarget = target as Accessor<Element | Window | undefined>;
    createEffect(
      () => fnTarget(),
      el => {
        if (isServer || !el) return;
        el.addEventListener("scroll", trigger, { passive: true });
        return () => el.removeEventListener("scroll", trigger);
      },
    );
  } else {
    const elTarget = target as Element | Window | undefined;
    createRenderEffect(
      () => elTarget,
      el => {
        if (isServer || !el) return;
        el.addEventListener("scroll", trigger, { passive: true });
        return () => el.removeEventListener("scroll", trigger);
      },
    );
  }

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
