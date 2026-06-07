---
"@solid-primitives/drag-drop": minor
---

New package: `@solid-primitives/drag-drop` — composable drag-and-drop primitives for Solid 2.0.

### Exports

**Pointer-event DnD** (UI element dragging):
- `makeDraggable` — non-reactive base, no Solid owner required
- `makeDroppable` — non-reactive drop target base
- `createDraggable` — reactive draggable with `isDragging`, `transform`, auto style/class
- `createDroppable` — reactive drop target with `isOver`, `active`, auto style/class
- `createSortable` — combines draggable + droppable on the same element
- `createDragContext` — coordinates a tree of draggables and droppables

**Native HTML5 DnD** (file drops, `draggable="true"` elements):
- `makeNativeDroppable` — non-reactive base with depth-counter fix for child elements
- `createNativeDroppable` — reactive native drop zone for OS file drops

**Collision detection strategies** (pure functions, pass to `createDragContext`):
- `closestCenter`, `closestCorners`, `rectIntersection`, `pointerWithin` (default)
