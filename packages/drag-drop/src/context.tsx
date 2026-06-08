import { createContext, createSignal, onCleanup, useContext, untrack, type Element } from "solid-js";
import { isServer } from "@solidjs/web";
import { INTERNAL_OPTIONS } from "@solid-primitives/utils";
import { pointerWithin } from "./collision.js";
import type {
  DragContextOptions,
  DragContextReturn,
  DragItem,
  DragRect,
  DroppableItem,
  DroppableRect,
  Transform,
} from "./types.js";

type DroppableEntry = {
  element: HTMLElement;
  data: unknown;
  accept?: (draggable: DragItem) => boolean;
};

export type DragContextValue = {
  active: () => DragItem | null;
  over: () => DroppableItem | null;
  transform: () => Transform | null;
  _registerDroppable: (
    id: string | number,
    element: HTMLElement,
    data: unknown,
    accept?: (draggable: DragItem) => boolean,
  ) => void;
  _unregisterDroppable: (id: string | number) => void;
  _startDrag: (id: string | number, element: HTMLElement, data: unknown, event: PointerEvent) => void;
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

  let currentDrag: DragItem | null = null;
  let startX = 0;
  let startY = 0;

  // Droppable rects snapshotted at drag start — avoids getBoundingClientRect on every pointermove.
  // Re-snapshotted on scroll or when droppables are added/removed during a drag.
  const cachedRects: DroppableRect[] = [];
  let dragStartLeft = 0, dragStartTop = 0, dragStartWidth = 0, dragStartHeight = 0;

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

  const processMove = () => {
    rafPending = false;
    if (!currentDrag) return;

    const tx = pendingX - startX;
    const ty = pendingY - startY;
    setTransform({ x: tx, y: ty });

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
      } as unknown as DOMRect,
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
    if (rafPending) { cancelAnimationFrame(rafId); rafPending = false; }
  };

  const onPointerUp = (_event: PointerEvent) => {
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

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !currentDrag) return;
    cancelPendingMove();

    const item = currentDrag;
    currentDrag = null;
    cleanupDrag();
    options.onDragCancel?.(item);

    setActive(null);
    setOver(null);
    setTransform(null);
  };

  const onScroll = () => {
    if (currentDrag) snapshotRects(currentDrag.id);
  };

  function cleanupDrag() {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("scroll", onScroll, { capture: true });
  }

  const _startDrag = (
    id: string | number,
    element: HTMLElement,
    data: unknown,
    event: PointerEvent,
  ) => {
    startX = event.clientX;
    startY = event.clientY;
    pendingX = startX;
    pendingY = startY;

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
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });

    options.onDragStart?.(item);
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
  };

  const Provider = (props: { children: Element }): Element => (
    <DragCtx value={contextValue}>{props.children}</DragCtx>
  );

  return { Provider, active, over, transform };
}
