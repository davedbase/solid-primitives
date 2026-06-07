import { createContext, createSignal, onCleanup, useContext, untrack, type Element } from "solid-js";
import { isServer } from "@solidjs/web";
import { INTERNAL_OPTIONS } from "@solid-primitives/utils";
import { pointerWithin } from "./collision.js";
import type { DragContextOptions, DragContextReturn, DragItem, DroppableItem, Point, Transform } from "./types.js";

type DroppableEntry = {
  element: HTMLElement;
  data: unknown;
  accept?: (draggable: DragItem) => boolean;
};

export type DragContextValue = {
  active: () => DragItem | null;
  over: () => DroppableItem | null;
  transform: () => Transform | null;
  _registerDraggable: (id: string | number, element: HTMLElement, data: unknown) => void;
  _unregisterDraggable: (id: string | number) => void;
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

  const draggables = new Map<string | number, { element: HTMLElement; data: unknown }>();
  const droppables = new Map<string | number, DroppableEntry>();

  const [active, setActive] = createSignal<DragItem | null>(null, INTERNAL_OPTIONS);
  const [over, setOver] = createSignal<DroppableItem | null>(null, INTERNAL_OPTIONS);
  const [transform, setTransform] = createSignal<Transform | null>(null, INTERNAL_OPTIONS);

  // Local reference for event handlers — avoids depending on signal flush timing
  let currentDrag: DragItem | null = null;
  let startX = 0;
  let startY = 0;

  const collide = options.collisionDetection ?? pointerWithin;

  const resolveOver = (activeItem: DragItem, pointer: Point): DroppableItem | null => {
    const draggableRect = { id: activeItem.id, rect: activeItem.element.getBoundingClientRect() };
    const droppableRects = [...droppables.entries()]
      .filter(([id]) => id !== activeItem.id)
      .map(([id, entry]) => ({ id, rect: entry.element.getBoundingClientRect() }));

    const winnerId = collide(draggableRect, droppableRects, pointer);
    if (winnerId === null) return null;

    const winner = droppables.get(winnerId);
    if (!winner) return null;
    if (winner.accept && !winner.accept(activeItem)) return null;

    return { id: winnerId, data: winner.data, element: winner.element };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!currentDrag) return;

    const t: Transform = { x: event.clientX - startX, y: event.clientY - startY };
    setTransform(t);

    const winner = resolveOver(currentDrag, { x: event.clientX, y: event.clientY });
    setOver(winner);

    options.onDragMove?.(currentDrag, t);
  };

  const onPointerUp = (_event: PointerEvent) => {
    if (!currentDrag) return;

    const overItem = untrack(over);
    removeDocListeners();
    const item = currentDrag;
    currentDrag = null;
    options.onDragEnd?.(item, overItem);

    setActive(null);
    setOver(null);
    setTransform(null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (!currentDrag) return;

    removeDocListeners();
    const item = currentDrag;
    currentDrag = null;
    options.onDragCancel?.(item);

    setActive(null);
    setOver(null);
    setTransform(null);
  };

  function removeDocListeners() {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("keydown", onKeyDown);
  }

  const _startDrag = (
    id: string | number,
    element: HTMLElement,
    data: unknown,
    event: PointerEvent,
  ) => {
    startX = event.clientX;
    startY = event.clientY;

    const item: DragItem = { id, data, element };
    currentDrag = item;
    setActive(item);
    setTransform({ x: 0, y: 0 });

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("keydown", onKeyDown);

    options.onDragStart?.(item);
  };

  onCleanup(removeDocListeners);

  const contextValue: DragContextValue = {
    active,
    over,
    transform,
    _registerDraggable: (id, element, data) => draggables.set(id, { element, data }),
    _unregisterDraggable: id => draggables.delete(id),
    _registerDroppable: (id, element, data, accept) => droppables.set(id, { element, data, accept }),
    _unregisterDroppable: id => droppables.delete(id),
    _startDrag,
  };

  const Provider = (props: { children: Element }): Element => (
    <DragCtx value={contextValue}>{props.children}</DragCtx>
  );

  return { Provider, active, over, transform };
}
