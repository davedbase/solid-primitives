/*
 * Portions of this file are based on code from kobalte.
 * MIT Licensed, Copyright (c) 2022 Kobalte contributors.
 *
 * Credits to the Kobalte team:
 * https://github.com/kobaltedev/kobalte/blob/main/packages/core/src/primitives/create-interact-outside/create-interact-outside.ts
 * https://github.com/kobaltedev/kobalte/blob/main/packages/core/src/primitives/create-hide-outside/create-hide-outside.ts
 *
 * Which itself is based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/81b25f4b40c54f72aeb106ca0e64e1e09655153e/packages/react/dismissable-layer/src/DismissableLayer.tsx
 *
 * And from zag.
 * MIT Licensed, Copyright (c) 2021 Chakra UI.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/zag/blob/d1dbf9e240803c9e3ed81ebef363739be4273de0/packages/utilities/interact-outside/src/index.ts
 *
 */

import { type Accessor, createEffect, onCleanup } from "solid-js";
import { type MaybeAccessor, access, globalRegistry, isServer, noop } from "@solid-primitives/utils";

// ---- ariaHideOutside / createHideOutside ----

/**
 * Options for {@link createHideOutside}.
 */
export interface CreateHideOutsideOptions {
  /** The elements that should remain visible. */
  targets: MaybeAccessor<Array<Element>>;
  /** Nothing will be hidden above this element. Defaults to `document.body`. */
  root?: MaybeAccessor<HTMLElement | undefined>;
  /** Whether the hide-outside behavior is disabled. */
  disabled?: MaybeAccessor<boolean | undefined>;
  /**
   * A CSS selector string for elements that should always stay visible regardless of
   * target containment (e.g. top-layer elements, live announcers). Optional.
   */
  alwaysVisibleSelector?: string;
  /**
   * Also set the `inert` attribute on hidden elements, in addition to `aria-hidden`.
   * `aria-hidden` alone only affects the accessibility tree — the background stays focusable
   * and clickable; `inert` additionally removes it from focus order, tab order, and pointer/
   * text-selection interaction. *Default = `false`* (matches prior behavior).
   */
  inert?: MaybeAccessor<boolean>;
}

// Keeps a ref count of all hidden/inerted elements so nested usages don't fight, and tracks
// the stack of active observers. Uses globalRegistry (Symbol.for(...) on globalThis, not
// module-scope bindings) so this stays correct even if the app's dependency graph ends up with
// more than one copy of this package installed — module-scope state would otherwise be split
// across copies (e.g. one copy's cleanup revealing content another copy still needs hidden).
type HideOutsideRegistry = {
  refCountMap: WeakMap<Element, number>;
  inertRefCountMap: WeakMap<Element, number>;
  observerStack: Array<{ observe(): void; disconnect(): void }>;
};

const getHideOutsideRegistry = (): HideOutsideRegistry =>
  globalRegistry<HideOutsideRegistry>("@solid-primitives/interaction:hide-outside", () => ({
    refCountMap: new WeakMap(),
    inertRefCountMap: new WeakMap(),
    observerStack: [],
  }));

/**
 * Applies `apply` to `node` the first time it's touched (or observes that a pre-existing native
 * state already covers it, in which case `node` is left alone entirely and untracked). Ref-counts
 * nested calls; returns whether `node` is now managed by us (`false` means "not ours — untouched").
 */
function refCountedApply(
  map: WeakMap<Element, number>,
  tracked: Set<Element>,
  node: Element,
  alreadySet: boolean,
  apply: () => void,
): boolean {
  const count = map.get(node) ?? 0;
  if (alreadySet && count === 0) return false;
  if (count === 0) apply();
  map.set(node, count + 1);
  tracked.add(node);
  return true;
}

/** Reverts `unapply` once the last ref-counted hold on `node` in `map` is released. */
function refCountedRelease(map: WeakMap<Element, number>, node: Element, unapply: () => void): void {
  const count = map.get(node);
  if (count == null) return;
  if (count === 1) {
    unapply();
    map.delete(node);
  } else {
    map.set(node, count - 1);
  }
}

/**
 * Hides all elements in the DOM outside the given `targets` from screen readers by setting
 * `aria-hidden="true"` on them, and returns a cleanup function that reverts every change.
 *
 * A `MutationObserver` watches for newly inserted nodes and hides them automatically.
 * Calls are ref-counted, so nested invocations cooperate correctly — tearing down an inner
 * call never reveals content that an outer call is still hiding.
 *
 * This is a non-reactive, imperative primitive. For a reactive version that integrates with
 * Solid's ownership model use {@link createHideOutside}.
 *
 * @param targets - Elements that should remain visible (along with their ancestors and descendants).
 * @param root - Root element to walk. Defaults to `document.body`.
 * @param alwaysVisibleSelector - Optional CSS selector for elements that must never be hidden
 *   (e.g. `"[aria-live]"` for live-region announcers or top-layer elements).
 * @param inert - Also set the `inert` attribute on hidden elements. *Default = `false`*.
 * @returns A cleanup function that removes all `aria-hidden`/`inert` changes added by this call.
 *
 * @example
 * ```ts
 * const cleanup = ariaHideOutside([dialogEl]);
 *
 * // When the dialog closes:
 * cleanup();
 * ```
 *
 * @example
 * ```ts
 * // Exempt live-region announcers from being hidden:
 * const cleanup = ariaHideOutside([dialogEl], document.body, "[aria-live]");
 * ```
 */
export function ariaHideOutside(
  targets: Element[],
  root: Element = document.body,
  alwaysVisibleSelector?: string,
  inert = false,
): () => void {
  const { refCountMap, inertRefCountMap, observerStack } = getHideOutsideRegistry();
  const visibleNodes = new Set<Element>(targets);
  const hiddenNodes = new Set<Element>();
  const inertedNodes = new Set<Element>();

  const walk = (root: Element) => {
    if (alwaysVisibleSelector) {
      Array.from(root.querySelectorAll(alwaysVisibleSelector)).forEach(el => visibleNodes.add(el));
    }

    const acceptNode = (node: Element) => {
      if (
        visibleNodes.has(node) ||
        (node.parentElement &&
          hiddenNodes.has(node.parentElement) &&
          node.parentElement.getAttribute("role") !== "row")
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      for (const target of visibleNodes) {
        if (node.contains(target)) return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    };

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, { acceptNode });
    const acceptRoot = acceptNode(root);
    if (acceptRoot === NodeFilter.FILTER_ACCEPT) hide(root);
    if (acceptRoot !== NodeFilter.FILTER_REJECT) {
      let node = walker.nextNode() as Element | null;
      while (node != null) {
        hide(node);
        node = walker.nextNode() as Element | null;
      }
    }
  };

  // `inert` is only ever applied to nodes hide() actually manages (returns `true`) — a node
  // left alone because it already carries an author-set aria-hidden must be left alone for
  // `inert` too, for the same "not ours to manage" reason.
  const hide = (node: Element) => {
    const managed = refCountedApply(
      refCountMap,
      hiddenNodes,
      node,
      node.getAttribute("aria-hidden") === "true",
      () => node.setAttribute("aria-hidden", "true"),
    );
    if (managed && inert && node instanceof HTMLElement) {
      refCountedApply(inertRefCountMap, inertedNodes, node, node.inert, () => {
        node.inert = true;
      });
    }
  };

  observerStack[observerStack.length - 1]?.disconnect();

  walk(root);

  const observer = new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type !== "childList" || change.addedNodes.length === 0) continue;
      if (![...visibleNodes, ...hiddenNodes].some(node => node.contains(change.target))) {
        Array.from(change.removedNodes).forEach(node => {
          if (node instanceof Element) {
            visibleNodes.delete(node);
            hiddenNodes.delete(node);
          }
        });
        Array.from(change.addedNodes).forEach(node => {
          if (node instanceof Element) walk(node);
        });
      }
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  const wrapper = {
    observe() { observer.observe(root, { childList: true, subtree: true }); },
    disconnect() { observer.disconnect(); },
  };
  observerStack.push(wrapper);

  return () => {
    observer.disconnect();
    hiddenNodes.forEach(node => refCountedRelease(refCountMap, node, () => node.removeAttribute("aria-hidden")));
    inertedNodes.forEach(node =>
      refCountedRelease(inertRefCountMap, node, () => {
        (node as HTMLElement).inert = false;
      }),
    );
    if (wrapper === observerStack[observerStack.length - 1]) {
      observerStack.pop();
      observerStack[observerStack.length - 1]?.observe();
    } else {
      observerStack.splice(observerStack.indexOf(wrapper), 1);
    }
  };
}

/**
 * Reactively hides all elements outside `options.targets` from screen readers using
 * `aria-hidden`. Re-runs whenever `targets`, `root`, or `disabled` changes, and cleans up
 * automatically when the reactive owner is disposed.
 *
 * For a non-reactive, imperative version use {@link ariaHideOutside}.
 *
 * @param options - Configuration. See {@link CreateHideOutsideOptions}.
 *
 * @example
 * ```tsx
 * function Dialog(props: { open: boolean }) {
 *   const [ref, setRef] = createSignal<HTMLDivElement>();
 *
 *   createHideOutside({
 *     targets: () => (ref() ? [ref()!] : []),
 *     disabled: () => !props.open,
 *   });
 *
 *   return (
 *     <Show when={props.open}>
 *       <div ref={setRef} role="dialog" aria-modal="true">
 *         Dialog content
 *       </div>
 *     </Show>
 *   );
 * }
 * ```
 */
export function createHideOutside(options: CreateHideOutsideOptions): void {
  createEffect(
    () => ({
      disabled: !!access(options.disabled),
      targets: access(options.targets),
      root: access(options.root),
      inert: !!access(options.inert),
    }),
    ({ disabled, targets, root, inert }) => {
      if (disabled) return;
      return ariaHideOutside(targets, root, options.alwaysVisibleSelector, inert);
    },
  );
}

// Realm-independent type checks. `instanceof Element` / `instanceof ShadowRoot` compare against this
// module's window, so they are always false for nodes created in another realm (e.g. an iframe's
// document), which would silently disable outside detection there.

const isElement = (node: unknown): node is Element =>
  !!node && (node as Node).nodeType === Node.ELEMENT_NODE;

/** The host of `node`'s shadow root, or `null` when `node` is not in a shadow tree. */
function getShadowHost(node: Node): Element | null {
  const root = node.getRootNode();
  // A ShadowRoot is the only DocumentFragment with a `host`.
  return root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && isElement((root as ShadowRoot).host)
    ? (root as ShadowRoot).host
    : null;
}

/** Where an event originated, captured while the event is still dispatching. */
type EventOrigin = {
  /** The element the interaction actually happened on — inside any shadow trees it crossed. */
  target: Element;
  /** `composedPath()` at capture time; includes slot ancestry that a tree walk can't see. */
  path: readonly EventTarget[];
};

/**
 * Snapshot of where an event originated.
 *
 * `event.target` is retargeted at every shadow boundary the event crosses, so a listener on the
 * document reports the outermost shadow *host* rather than the element that was interacted with.
 * `composedPath()[0]` is that element; for an event that crosses no boundary the two are identical.
 *
 * Must be called synchronously during dispatch: `composedPath()` returns `[]` once dispatch ends,
 * after which only the retargeted `event.target` remains.
 */
function getEventOrigin(event: Event): EventOrigin | null {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  const target = path[0] ?? event.target;

  return isElement(target) ? { target, path } : null;
}

/**
 * `Node.prototype.contains`, but able to see through shadow boundaries.
 *
 * `contains` only walks the node tree it is called on, so it answers `false` for a `child` inside a
 * shadow root — including `document.contains(elementInAShadowRoot)`. When this walk reaches the top
 * of a shadow tree it continues from that tree's host. Slot assignment is not followed; callers that
 * need flattened-tree containment should also consult the event's composed path.
 */
function containsComposed(parent: Node, child: Node | null): boolean {
  let node: Node | null = child;

  while (node) {
    if (parent === node || parent.contains(node)) return true;

    node = getShadowHost(node);
  }

  return false;
}

/**
 * `target` as seen from `observer`'s node tree — the DOM's own retargeting algorithm.
 *
 * Climbs out of every shadow tree that does not also enclose `observer`, so encapsulated internals of
 * a foreign component are reported as that component's host. For an `observer` in the document this
 * is exactly the `event.target` a document listener sees; for an `observer` inside a shadow root,
 * siblings in that same root are reported as themselves rather than as the outer host.
 */
function retarget(target: Element, observer: Node): Element {
  let node = target;

  for (;;) {
    const host = getShadowHost(node);
    if (!host || containsComposed(node.getRootNode(), observer)) return node;
    node = host;
  }
}

/** Detail payload carried by every outside-interaction `CustomEvent`. */
export type EventDetails<T> = {
  /** The original DOM event that triggered the outside interaction. */
  originalEvent: T;
  /** `true` when the interaction was a right-click or Ctrl+click on macOS. */
  isContextMenu: boolean;
};

/** `CustomEvent` fired when a `pointerdown` occurs outside the watched element. */
export type PointerDownOutsideEvent = CustomEvent<EventDetails<PointerEvent>>;

/** `CustomEvent` fired when focus moves outside the watched element. */
export type FocusOutsideEvent = CustomEvent<EventDetails<FocusEvent>>;

/** Union of all outside-interaction event types. */
export type InteractOutsideEvent = PointerDownOutsideEvent | FocusOutsideEvent;

/**
 * Options shared by {@link createInteractOutside} and {@link makeInteractOutside}
 * (the latter omits `disabled` via {@link MakeInteractOutsideOptions}).
 */
export interface CreateInteractOutsideOptions {
  /** Whether the interact outside events should be listened or not. */
  disabled?: MaybeAccessor<boolean | undefined>;

  /**
   * When user interacts with the argument element outside the ref,
   * return `true` if the interaction should not trigger the "interact outside" handlers.
   */
  shouldExcludeElement?: (element: Element) => boolean;

  /**
   * Event handler called when a `pointerdown` event happens outside the ref.
   * Can be prevented.
   */
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;

  /**
   * Event handler called when the focus moves outside the ref.
   * Can be prevented.
   */
  onFocusOutside?: (event: FocusOutsideEvent) => void;

  /**
   * Event handler called when an interaction happens outside the ref.
   * Specifically, when a `pointerdown` event happens outside or focus moves outside of it.
   * Can be prevented.
   */
  onInteractOutside?: (event: InteractOutsideEvent) => void;
}

/** {@link CreateInteractOutsideOptions} without `disabled` — for use with {@link makeInteractOutside} and {@link interactOutside}. */
export type MakeInteractOutsideOptions = Omit<CreateInteractOutsideOptions, "disabled">;

const POINTER_DOWN_OUTSIDE_EVENT = "interactOutside.pointerDownOutside";
const FOCUS_OUTSIDE_EVENT = "interactOutside.focusOutside";

function composeHandlers(handlers: (((e: any) => void) | undefined)[]): EventListener {
  return (e: Event) => {
    for (const handler of handlers) {
      if (e.defaultPrevented) break;
      handler?.(e);
    }
  };
}

const isMacPlatform = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  if (uaData?.platform) return /mac/i.test(uaData.platform);
  return /mac/i.test(navigator.userAgent);
};

const isCtrlKey = (e: PointerEvent): boolean => e.ctrlKey || (isMacPlatform() && e.metaKey);

/**
 * Attaches outside-interaction listeners to `el` immediately and returns a cleanup function.
 * No Solid reactivity — use when you already have a stable element reference.
 *
 * @param el - The element to watch.
 * @param options - Event handlers and `shouldExcludeElement`.
 * @returns A cleanup function that removes all attached listeners.
 *
 * @example
 * ```ts
 * const cleanup = makeInteractOutside(el, {
 *   onInteractOutside: () => close(),
 * });
 * // later:
 * cleanup();
 * ```
 */
export function makeInteractOutside<T extends Element>(
  el: T,
  options: MakeInteractOutsideOptions,
): () => void {
  if (isServer) return noop;

  let clickHandler: () => void = noop;

  // el.ownerDocument may be an about:blank document at ref-apply time if the element was
  // created by a renderer whose `document` global resolved before the real document was ready
  // (e.g. Vite pre-bundled deps in Storybook iframes). Reading el.ownerDocument inside the
  // setTimeout ensures we get the document after the element has been adopted into the real DOM.
  let ownerDoc: Document = el.ownerDocument;

  /**
   * The element to report an outside interaction on, or `null` when the interaction is not outside
   * (or `shouldExcludeElement` exempts it).
   */
  const getOutsideTarget = (origin: EventOrigin | null): Element | null => {
    // `el` can be removed from the document by its owner (e.g. a `<Show>`
    // unmounting a dismissable layer) before this instance's reactive owner
    // gets around to calling the cleanup this function returns (listener
    // removal is tied to `onCleanup`, which can lag a tick behind the DOM
    // change that triggered it). Once `el` is disconnected there's nothing
    // left to protect, and `el.contains(target)` would incorrectly read as
    // "not contained" for every target — including ones legitimately inside
    // a *new* instance that opened in that same window — misreporting them
    // as outside interactions on this now-orphaned instance.
    if (!el.isConnected || !origin) return null;
    // Resolved through `composedPath()`, not `e.target`: these listeners are on the document, so an
    // interaction inside a shadow tree reports that tree's host instead. `el` rendered inside a
    // shadow root would see every one of its own clicks as the host — an ancestor, not a descendant
    // — and read them as outside interactions, dismissing itself on pointerdown.
    const { target, path } = origin;
    if (!containsComposed(ownerDoc, target)) return null;
    // The composed path also covers content slotted into `el`, which a tree walk can't reach.
    if (path.includes(el) || containsComposed(el, target)) return null;
    // Report the target as `el`'s own tree sees it. A sibling in `el`'s shadow root is itself, but a
    // click inside a *foreign* web component (e.g. a trigger with its own shadow root) stays its
    // host — the same element consumers received before shadow-aware resolution, so checks such as
    // `trigger.contains(element)` in `shouldExcludeElement` keep matching.
    const reported = retarget(target, el);
    return options.shouldExcludeElement?.(reported) ? null : reported;
  };

  const onPointerDown = (e: PointerEvent) => {
    // Resolved now, not in `handler`: for touch, `handler` runs on the following `click`, by which
    // time this event has finished dispatching and `composedPath()` is empty.
    const origin = getEventOrigin(e);

    const handler = () => {
      const target = getOutsideTarget(origin);
      if (!target) return;

      target.addEventListener(
        POINTER_DOWN_OUTSIDE_EVENT,
        composeHandlers([options.onPointerDownOutside, options.onInteractOutside]),
        { once: true },
      );
      target.dispatchEvent(
        new CustomEvent(POINTER_DOWN_OUTSIDE_EVENT, {
          bubbles: false,
          cancelable: true,
          detail: {
            originalEvent: e,
            isContextMenu: e.button === 2 || (isCtrlKey(e) && e.button === 0),
          } as EventDetails<PointerEvent>,
        }),
      );
    };

    if (e.pointerType === "touch") {
      ownerDoc.removeEventListener("click", clickHandler);
      clickHandler = handler;
      ownerDoc.addEventListener("click", clickHandler, { once: true });
    } else {
      handler();
    }
  };

  const onFocusIn = (e: FocusEvent) => {
    const target = getOutsideTarget(getEventOrigin(e));
    if (!target) return;

    target.addEventListener(
      FOCUS_OUTSIDE_EVENT,
      composeHandlers([options.onFocusOutside, options.onInteractOutside]),
      { once: true },
    );
    target.dispatchEvent(
      new CustomEvent(FOCUS_OUTSIDE_EVENT, {
        bubbles: false,
        cancelable: true,
        detail: {
          originalEvent: e,
          isContextMenu: false,
        } as EventDetails<FocusEvent>,
      }),
    );
  };

  // Delay listener registration to:
  // 1. Avoid triggering on the event that caused this mount.
  // 2. Re-read el.ownerDocument after the element has been adopted into the real DOM
  //    (it may have been created in an about:blank context by a pre-bundled renderer).
  const pointerDownTimeoutId = window.setTimeout(() => {
    ownerDoc = el.ownerDocument;
    ownerDoc.addEventListener("pointerdown", onPointerDown, true);
    ownerDoc.addEventListener("focusin", onFocusIn, true);
  }, 0);

  return () => {
    window.clearTimeout(pointerDownTimeoutId);
    ownerDoc.removeEventListener("click", clickHandler);
    ownerDoc.removeEventListener("pointerdown", onPointerDown, true);
    ownerDoc.removeEventListener("focusin", onFocusIn, true);
  };
}

/**
 * Ref factory for `makeInteractOutside`. Call it in a component body and pass the
 * result directly to a JSX `ref` prop. Cleanup is registered via `onCleanup` in the
 * component's reactive scope so listeners are removed automatically when the component disposes.
 *
 * @param options - Event handlers and `shouldExcludeElement`.
 * @returns A ref callback `(el: Element) => void` suitable for use as a JSX `ref`.
 *
 * @example
 * ```tsx
 * function Popover() {
 *   const [open, setOpen] = createSignal(false);
 *   return (
 *     <Show when={open()}>
 *       <div ref={interactOutside({ onInteractOutside: () => setOpen(false) })}>
 *         Popover content
 *       </div>
 *     </Show>
 *   );
 * }
 * ```
 */
export function interactOutside(options: MakeInteractOutsideOptions): (el: Element) => void {
  let cleanup: (() => void) | undefined;
  onCleanup(() => cleanup?.());
  return el => {
    cleanup = makeInteractOutside(el, options);
  };
}

/**
 * Listens for pointer and focus events that originate outside a referenced element.
 * Reactively re-attaches whenever `ref` or `options.disabled` changes.
 * Cleans up automatically with the reactive owner.
 *
 * @param options - Configuration, event handlers, and optional `disabled` accessor.
 * @param ref - Accessor returning the element to watch.
 *
 * @example
 * ```tsx
 * function Popover() {
 *   const [ref, setRef] = createSignal<HTMLDivElement>();
 *   const [open, setOpen] = createSignal(true);
 *
 *   createInteractOutside(
 *     { onInteractOutside: () => setOpen(false) },
 *     ref,
 *   );
 *
 *   return <Show when={open()}><div ref={setRef}>Popover content</div></Show>;
 * }
 * ```
 */
export function createInteractOutside<T extends Element>(
  options: CreateInteractOutsideOptions,
  ref: Accessor<T | undefined>,
): void {
  if (isServer) return;

  createEffect(
    () => ({ disabled: access(options.disabled), el: ref() }),
    ({ disabled, el }: { disabled: boolean | undefined; el: T | undefined }) => {
      if (disabled || !el) return;
      return makeInteractOutside(el, options);
    },
    { transparent: true },
  );
}
