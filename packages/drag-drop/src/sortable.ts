import { isServer } from "@solidjs/web";
import { noop } from "@solid-primitives/utils";
import { createDraggable } from "./draggable.js";
import { createDroppable } from "./droppable.js";
import type { SortableReturn } from "./types.js";

/**
 * Combines `createDraggable` and `createDroppable` on the same element.
 * The element can both be dragged and serve as a drop target for other items.
 *
 * When inside a `createDragContext`, a sortable never registers as its own
 * drop target — the context filters out the active draggable from collision
 * detection, so `isOver` is always false while this item is being dragged.
 *
 * @example
 * ```tsx
 * const [items, setItems] = createSignal(["A", "B", "C"]);
 *
 * <For each={items()}>
 *   {(item) => {
 *     const sortable = createSortable(item);
 *     return (
 *       <div ref={sortable.ref} class={sortable.isActiveDropzone() ? "ring-2" : ""}>
 *         {item}
 *       </div>
 *     );
 *   }}
 * </For>
 * ```
 */
export function createSortable<T = unknown>(
  id: string | number,
  data?: T,
): SortableReturn<T> {
  if (isServer) {
    return {
      ref: noop,
      isDragging: () => false,
      transform: () => null,
      isOver: () => false,
      active: () => null,
      isActiveDropzone: () => false,
      id,
    };
  }

  const draggable = createDraggable(id, data);
  const droppable = createDroppable(id, data);

  const ref = (el: HTMLElement) => {
    draggable.ref(el);
    droppable.ref(el);
  };

  return {
    ref,
    isDragging: draggable.isDragging,
    transform: draggable.transform,
    isOver: droppable.isOver,
    active: droppable.active,
    isActiveDropzone: droppable.isOver,
    id,
  };
}
