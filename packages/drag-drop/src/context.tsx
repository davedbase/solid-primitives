import {
  createContext,
  createProjection,
  createSignal,
  onCleanup,
  useContext,
  untrack,
  type Element,
} from "solid-js";
import { isServer } from "@solidjs/web";
import { INTERNAL_OPTIONS } from "@solid-primitives/utils";
import { pointerWithin } from "./collision.ts";
import type {
  AcceptPredicate,
  DragContextOptions,
  DragContextReturn,
  DragItem,
  DragRect,
  DroppableItem,
  DroppableRect,
  Transform,
} from "./types.ts";

const DEFAULT_KEYBOARD_STEP = 25;
const DEFAULT_AUTO_SCROLL_THRESHOLD = 60;
const DEFAULT_AUTO_SCROLL_SPEED = 15;

type DroppableEntry = {
  element: HTMLElement;
  data: unknown;
  accept?: AcceptPredicate;
};

export type DragContextValue = {
  active: () => DragItem | null;
  over: () => DroppableItem | null;
  transform: () => Transform | null;
  _registerDroppable: (
    id: string | number,
    element: HTMLElement,
    data: unknown,
    accept?: AcceptPredicate,
  ) => void;
  _unregisterDroppable: (id: string | number) => void;
  _startDrag: (
    id: string | number,
    element: HTMLElement,
    data: unknown,
    event: PointerEvent,
  ) => void;
  /** Starts a drag from a keyboard activation — anchors the synthetic pointer to the element's center. */
  _startKeyboardDrag: (id: string | number, element: HTMLElement, data: unknown) => void;
  /** Nudges the active keyboard-driven drag by a delta in viewport pixels. No-op if nothing is dragging. */
  _moveBy: (dx: number, dy: number) => void;
  /** Drops the active drag (equivalent to releasing the pointer). No-op if nothing is dragging. */
  _endDrag: () => void;
  /**
   * `true` iff `id` is the currently active draggable. Backed by `createProjection`, so checking
   * this for every draggable in a large list only invalidates the (at most two) ids that actually
   * changed, instead of every instance re-comparing against `active()?.id` on each drag start/end.
   */
  _isActive: (id: string | number) => boolean;
  /** Same fine-grained lookup as `_isActive`, for the currently hovered droppable. */
  _isOver: (id: string | number) => boolean;
};

const DragCtx = createContext<DragContextValue>();

export function useDragContext(): DragContextValue | undefined {
  try {
    return useContext(DragCtx);
  } catch {
    return undefined;
  }
}

export function createDragContext(options: DragContextOptions = {}): DragContextReturn {
  if (isServer) {
    const Provider = (props: { children: Element }): Element => props.children;
    return { Provider, active: () => null, over: () => null, transform: () => null };
  }

  const droppables = new Map<string | number, DroppableEntry>();

  const [active, setActive] = createSignal<DragItem | null>(null, INTERNAL_OPTIONS);
  const [over, setOver] = createSignal<DroppableItem | null>(null, INTERNAL_OPTIONS);
  const [transform, setTransform] = createSignal<Transform | null>(null, INTERNAL_OPTIONS);

  // Fine-grained "is this id the one" lookups. A plain `active()?.id === id` memo per draggable
  // would mark every instance in a list as stale on each drag start/end; these projections only
  // notify the (at most two) ids whose membership actually flipped.
  let prevActiveId: string | number | undefined;
  const isActiveId = createProjection<Record<string | number, boolean>>(s => {
    const id = active()?.id;
    if (id != null) s[id] = true;
    if (prevActiveId != null && prevActiveId !== id) delete s[prevActiveId];
    prevActiveId = id;
  }, {});

  let prevOverId: string | number | undefined;
  const isOverId = createProjection<Record<string | number, boolean>>(s => {
    const id = over()?.id;
    if (id != null) s[id] = true;
    if (prevOverId != null && prevOverId !== id) delete s[prevOverId];
    prevOverId = id;
  }, {});

  let currentDrag: DragItem | null = null;
  let startX = 0;
  let startY = 0;
  let dragStartScrollX = 0;
  let dragStartScrollY = 0;

  // Droppable rects snapshotted at drag start — avoids getBoundingClientRect on every pointermove.
  // Re-snapshotted on scroll or when droppables are added/removed during a drag.
  const cachedRects: DroppableRect[] = [];
  let dragStartLeft = 0,
    dragStartTop = 0,
    dragStartWidth = 0,
    dragStartHeight = 0;

  const snapshotRects = (activeId: string | number) => {
    cachedRects.length = 0;
    for (const [id, entry] of droppables) {
      if (id !== activeId) {
        cachedRects.push({ id, rect: entry.element.getBoundingClientRect() });
      }
    }
  };

  const collide = options.collisionDetection ?? pointerWithin;

  // RAF throttle — buffer latest pointer position, flush to signals at display rate.
  // `rafPending` guards deduplication so synchronous rAF shims (used in tests) work correctly.
  let rafPending = false;
  let rafId = -1;
  let pendingX = 0;
  let pendingY = 0;

  // Auto-scrolls the window when the pointer sits near a viewport edge. Only called from the
  // pointer-driven path — keyboard nudges move a synthetic point that isn't meant to trigger it.
  const maybeAutoScroll = () => {
    const cfg = options.autoScroll;
    if (!cfg) return;
    const threshold =
      (typeof cfg === "object" ? cfg.threshold : undefined) ?? DEFAULT_AUTO_SCROLL_THRESHOLD;
    const speed = (typeof cfg === "object" ? cfg.speed : undefined) ?? DEFAULT_AUTO_SCROLL_SPEED;

    let dx = 0;
    let dy = 0;
    if (pendingX < threshold) dx = -speed;
    else if (pendingX > window.innerWidth - threshold) dx = speed;
    if (pendingY < threshold) dy = -speed;
    else if (pendingY > window.innerHeight - threshold) dy = speed;

    if (dx !== 0 || dy !== 0) window.scrollBy(dx, dy);
  };

  // Recomputes transform + collision state from the current pending pointer position.
  // Shared by the rAF-throttled pointer path and the immediate keyboard-nudge path.
  const applyMove = () => {
    if (!currentDrag) return;

    const tx = pendingX - startX;
    const ty = pendingY - startY;

    // The reported transform is what the consumer applies as a CSS translate. It needs the
    // scroll delta added on top of the raw pointer delta — otherwise the element (which scrolls
    // with the page like any other in-flow content) visually drifts away from the pointer if the
    // page scrolls mid-drag. The collision rect below intentionally uses the raw (uncompensated)
    // tx/ty: once the transform above is scroll-corrected, `dragStartLeft + tx` is exactly where
    // the element will end up on screen.
    const scrollDX = window.scrollX - dragStartScrollX;
    const scrollDY = window.scrollY - dragStartScrollY;
    setTransform({ x: tx + scrollDX, y: ty + scrollDY });

    // Compute draggable rect from initial snapshot + current delta — zero layout reflows during move.
    const draggableRect: DragRect = {
      id: currentDrag.id,
      rect: {
        left: dragStartLeft + tx,
        right: dragStartLeft + dragStartWidth + tx,
        top: dragStartTop + ty,
        bottom: dragStartTop + dragStartHeight + ty,
        width: dragStartWidth,
        height: dragStartHeight,
        x: dragStartLeft + tx,
        y: dragStartTop + ty,
      },
    };

    const winnerId = collide(draggableRect, cachedRects, { x: pendingX, y: pendingY });

    let winner: DroppableItem | null = null;
    if (winnerId !== null) {
      const entry = droppables.get(winnerId);
      if (entry && !(entry.accept && !entry.accept(currentDrag))) {
        winner = { id: winnerId, data: entry.data, element: entry.element };
      }
    }

    // Only write the signal when the hovered zone actually changes.
    if (winner?.id !== untrack(over)?.id) setOver(winner);

    options.onDragMove?.(currentDrag, { x: tx, y: ty });
  };

  const processMove = () => {
    rafPending = false;
    applyMove();
    maybeAutoScroll();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!currentDrag) return;
    pendingX = event.clientX;
    pendingY = event.clientY;
    if (!rafPending) {
      rafPending = true;
      rafId = requestAnimationFrame(() => {
        rafPending = false;
        processMove();
      });
    }
  };

  const cancelPendingMove = () => {
    if (rafPending) {
      cancelAnimationFrame(rafId);
      rafPending = false;
    }
  };

  const finishDrag = () => {
    if (!currentDrag) return;
    cancelPendingMove();

    const overItem = untrack(over);
    const item = currentDrag;
    currentDrag = null;
    cleanupDrag();
    options.onDragEnd?.(item, overItem);

    setActive(null);
    setOver(null);
    setTransform(null);
  };

  const onPointerUp = (_event: PointerEvent) => finishDrag();

  // Shared by Escape (explicit user cancel) and pointercancel (OS/browser-interrupted
  // drag, e.g. a touch gesture cancelled by the system) — both end the drag without a
  // drop, so both go through onDragCancel rather than onDragEnd.
  const cancelDrag = () => {
    if (!currentDrag) return;
    cancelPendingMove();

    const item = currentDrag;
    currentDrag = null;
    cleanupDrag();
    options.onDragCancel?.(item);

    setActive(null);
    setOver(null);
    setTransform(null);
  };

  const onPointerCancel = (_event: PointerEvent) => cancelDrag();

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") cancelDrag();
  };

  const onScroll = () => {
    if (currentDrag) snapshotRects(currentDrag.id);
  };

  function cleanupDrag() {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerCancel);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("scroll", onScroll, { capture: true });
  }

  const beginDrag = (
    id: string | number,
    element: HTMLElement,
    data: unknown,
    clientX: number,
    clientY: number,
  ) => {
    startX = clientX;
    startY = clientY;
    pendingX = clientX;
    pendingY = clientY;
    dragStartScrollX = window.scrollX;
    dragStartScrollY = window.scrollY;

    // Snapshot layout once — all pointermove collision checks use this cache.
    const r = element.getBoundingClientRect();
    dragStartLeft = r.left;
    dragStartTop = r.top;
    dragStartWidth = r.width;
    dragStartHeight = r.height;
    snapshotRects(id);

    const item: DragItem = { id, data, element };
    currentDrag = item;
    setActive(item);
    setTransform({ x: 0, y: 0 });

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });

    options.onDragStart?.(item);
  };

  const _startDrag = (
    id: string | number,
    element: HTMLElement,
    data: unknown,
    event: PointerEvent,
  ) => {
    beginDrag(id, element, data, event.clientX, event.clientY);
  };

  const _startKeyboardDrag = (id: string | number, element: HTMLElement, data: unknown) => {
    const r = element.getBoundingClientRect();
    beginDrag(id, element, data, r.left + r.width / 2, r.top + r.height / 2);
  };

  const _moveBy = (dx: number, dy: number) => {
    if (!currentDrag) return;
    pendingX += dx;
    pendingY += dy;
    applyMove();
  };

  onCleanup(cleanupDrag);

  const contextValue: DragContextValue = {
    active,
    over,
    transform,
    _registerDroppable: (id, element, data, accept) => {
      droppables.set(id, { element, data, accept });
      if (currentDrag) snapshotRects(currentDrag.id);
    },
    _unregisterDroppable: id => {
      droppables.delete(id);
      if (currentDrag) snapshotRects(currentDrag.id);
    },
    _startDrag,
    _startKeyboardDrag,
    _moveBy,
    _endDrag: finishDrag,
    _isActive: id => !!isActiveId[id],
    _isOver: id => !!isOverId[id],
  };

  const Provider = (props: { children: Element }): Element => (
    <DragCtx value={contextValue}>{props.children}</DragCtx>
  );

  return { Provider, active, over, transform };
}

export { DEFAULT_KEYBOARD_STEP };
