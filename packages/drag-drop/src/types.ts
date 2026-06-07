import type { Accessor, Element } from "solid-js";

export type Transform = { x: number; y: number };
export type Point = { x: number; y: number };

export type DragItem<T = unknown> = {
  id: string | number;
  data: T;
  element: HTMLElement;
};

export type DroppableItem<T = unknown> = {
  id: string | number;
  data: T;
  element: HTMLElement;
};

export type DragRect = { id: string | number; rect: DOMRect };
export type DroppableRect = { id: string | number; rect: DOMRect };

export type CollisionDetector = (
  draggable: DragRect,
  droppables: DroppableRect[],
  pointer: Point,
) => string | number | null;

export type MakeDraggableOptions<T = unknown> = {
  data?: T;
  onStart?: (event: PointerEvent) => void;
  onMove?: (delta: Transform, event: PointerEvent) => void;
  onEnd?: (delta: Transform, event: PointerEvent) => void;
  disabled?: boolean;
};

export type MakeDroppableOptions = {
  onEnter?: (event: PointerEvent) => void;
  onLeave?: (event: PointerEvent) => void;
  onDrop?: (event: PointerEvent) => void;
  disabled?: boolean;
};

export type MakeNativeDroppableOptions = {
  onEnter?: (event: DragEvent) => void;
  onLeave?: (event: DragEvent) => void;
  onOver?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
  /** Return false to reject; checked on dragenter and dragover. */
  accept?: (event: DragEvent) => boolean;
  disabled?: boolean;
};

export type CreateDraggableOptions = {
  disabled?: boolean | Accessor<boolean>;
  style?: Partial<CSSStyleDeclaration>;
  draggingStyle?: Partial<CSSStyleDeclaration>;
  class?: string;
  draggingClass?: string;
};

export type CreateDroppableOptions = {
  disabled?: boolean | Accessor<boolean>;
  accept?: (draggable: DragItem) => boolean;
  style?: Partial<CSSStyleDeclaration>;
  overStyle?: Partial<CSSStyleDeclaration>;
  class?: string;
  overClass?: string;
};

export type CreateNativeDroppableOptions = MakeNativeDroppableOptions & {
  disabled?: boolean | Accessor<boolean>;
};

export type DraggableReturn<_T = unknown> = {
  ref: (el: HTMLElement) => void;
  isDragging: Accessor<boolean>;
  transform: Accessor<Transform | null>;
  id: string | number;
};

export type DroppableReturn<_T = unknown> = {
  ref: (el: HTMLElement) => void;
  isOver: Accessor<boolean>;
  active: Accessor<DragItem | null>;
  id: string | number;
};

export type NativeDroppableReturn = {
  ref: (el: HTMLElement) => void;
  isOver: Accessor<boolean>;
};

export type SortableReturn<_T = unknown> = {
  ref: (el: HTMLElement) => void;
  isDragging: Accessor<boolean>;
  transform: Accessor<Transform | null>;
  isOver: Accessor<boolean>;
  active: Accessor<DragItem | null>;
  isActiveDropzone: Accessor<boolean>;
  id: string | number;
};

export type DragContextOptions = {
  collisionDetection?: CollisionDetector;
  onDragStart?: (item: DragItem) => void;
  onDragMove?: (item: DragItem, transform: Transform) => void;
  onDragEnd?: (item: DragItem, over: DroppableItem | null) => void;
  onDragCancel?: (item: DragItem) => void;
};

export type DragContextReturn = {
  Provider: (props: { children: Element }) => Element;
  active: Accessor<DragItem | null>;
  over: Accessor<DroppableItem | null>;
  transform: Accessor<Transform | null>;
};
