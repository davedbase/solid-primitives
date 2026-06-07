<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=drag" alt="Solid Primitives drag">
</p>

# @solid-primitives/drag

[![turborepo](https://img.shields.io/badge/built%20with-turborepo-cc00ff.svg?style=for-the-badge&logo=turborepo)](https://turborepo.org/)
[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/drag?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/drag)
[![version](https://img.shields.io/npm/v/@solid-primitives/drag?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/drag)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Composable, tree-shakeable drag-and-drop primitives for Solid 2.0.

Two separate drag systems are provided:

- **Pointer-event DnD** (`makeDraggable`, `makeDroppable`, `createDraggable`, `createDroppable`, `createSortable`, `createDragContext`) — for UI elements moved by the user.
- **Native HTML5 DnD** (`makeNativeDroppable`, `createNativeDroppable`) — for OS file drops and `draggable="true"` elements; designed to compose with `@solid-primitives/upload`'s `createDropzone`.

## Installation

```bash
npm install @solid-primitives/drag
# or
pnpm add @solid-primitives/drag
```

## Primitives

### `makeDraggable`

Non-reactive base. Attaches pointer listeners to an element. No Solid owner required.

```ts
const cleanup = makeDraggable(el, {
  onStart: e => console.log("start", e.clientX),
  onMove: delta => (el.style.transform = `translate(${delta.x}px,${delta.y}px)`),
  onEnd: () => (el.style.transform = ""),
});
// later
cleanup();
```

### `makeDroppable`

Non-reactive base. Marks an element as a drop target for pointer-event drags.

```ts
const cleanup = makeDroppable(el, {
  onEnter: () => el.classList.add("over"),
  onLeave: () => el.classList.remove("over"),
  onDrop: () => acceptDrop(),
});
```

### `makeNativeDroppable`

Non-reactive base for OS/browser native drag events (e.g. file drops). Handles the `dragenter`/`dragleave` depth problem with child elements automatically.

```ts
const cleanup = makeNativeDroppable(el, {
  accept: e => e.dataTransfer?.types.includes("Files") ?? false,
  onEnter: () => el.classList.add("over"),
  onDrop: e => handleFiles(e.dataTransfer!.files),
});
```

### `createDraggable`

Reactive draggable. Attach via `ref`. Works standalone or inside a `createDragContext` provider.

```tsx
const drag = createDraggable("card-1", myData, {
  class: "cursor-grab",
  draggingClass: "opacity-50 cursor-grabbing",
  draggingStyle: { boxShadow: "0 8px 24px rgba(0,0,0,.2)" },
});

<div ref={drag.ref}>
  {drag.isDragging() ? "dragging…" : drag.transform()?.x}
</div>
```

| Option | Type | Description |
|---|---|---|
| `style` | `Partial<CSSStyleDeclaration>` | Applied to the element on `ref` |
| `class` | `string` | Added to the element on `ref` |
| `draggingStyle` | `Partial<CSSStyleDeclaration>` | Applied while dragging, removed on drop |
| `draggingClass` | `string` | Added while dragging, removed on drop |
| `disabled` | `boolean \| Accessor<boolean>` | Prevents drag when true |

| Return | Description |
|---|---|
| `ref` | Attach to element's `ref` prop |
| `isDragging` | Accessor — true while a drag is active |
| `transform` | Accessor — `{ x, y }` delta from drag start, or `null` |
| `id` | The id passed to the primitive |

### `createDroppable`

Reactive drop target. Requires a `createDragContext` ancestor to coordinate collision detection.

```tsx
const drop = createDroppable("zone-1", zoneData, {
  class: "border-2 border-dashed border-transparent",
  overClass: "border-indigo-500 bg-indigo-50",
});

<div ref={drop.ref}>
  {drop.isOver() ? `release to drop ${drop.active()?.id}` : "drop here"}
</div>
```

### `createNativeDroppable`

Reactive native drop zone. Tracks `isOver` state via HTML5 drag events.

```tsx
const drop = createNativeDroppable({
  accept: e => e.dataTransfer?.types.includes("Files") ?? false,
  onDrop: e => handleFiles(e.dataTransfer!.files),
});

<div ref={drop.ref} class={drop.isOver() ? "ring-2 ring-indigo-500" : ""}>
  Drop files here
</div>
```

### `createDragContext`

Coordinates draggables and droppables. Provide it as a context via `ctx.Provider`.

```tsx
const ctx = createDragContext({
  collisionDetection: closestCenter,
  onDragStart: item => console.log("started", item.id),
  onDragEnd: (item, over) => console.log("dropped", item.id, "on", over?.id),
  onDragCancel: item => console.log("cancelled", item.id),
});

<ctx.Provider>
  <DraggableItem />
  <DropZone />
</ctx.Provider>
```

| Return | Description |
|---|---|
| `Provider` | Wrap your DnD tree in this component |
| `active` | Accessor — the currently dragged `DragItem`, or `null` |
| `over` | Accessor — the current `DroppableItem` under the draggable, or `null` |
| `transform` | Accessor — `{ x, y }` delta from drag start, or `null` |

### `createSortable`

Combines `createDraggable` and `createDroppable` on the same element. When another item is dragged over it, `isActiveDropzone()` is true. The active draggable is never its own drop target.

```tsx
<For each={items()}>
  {item => {
    const s = createSortable(item.id, item);
    return (
      <div ref={s.ref} class={s.isActiveDropzone() ? "ring-2 ring-blue-500" : ""}>
        {item.label}
      </div>
    );
  }}
</For>
```

## Collision detection strategies

All four are exported as pure functions — pass any of them as `collisionDetection` to `createDragContext`.

| Strategy | Description |
|---|---|
| `closestCenter` | Nearest droppable by center-to-center distance |
| `closestCorners` | Nearest droppable by minimum corner distance |
| `rectIntersection` | Droppable with largest overlap area |
| `pointerWithin` | Topmost droppable containing the pointer (default) |

```ts
import { createDragContext, closestCenter } from "@solid-primitives/drag";

const ctx = createDragContext({ collisionDetection: closestCenter });
```

You can also write a custom detector:

```ts
import type { CollisionDetector } from "@solid-primitives/drag";

const myDetector: CollisionDetector = (draggable, droppables, pointer) => {
  // Return the id of the winning droppable, or null
  return droppables[0]?.id ?? null;
};
```

## Integration with `@solid-primitives/upload`

`createNativeDroppable` is designed to serve as the drop-zone backend for the upload package's `createDropzone`. Pass the `ref` and `isOver` signal to the upload primitive for a seamless file-upload DnD experience.

```tsx
const drop = createNativeDroppable({
  accept: e => e.dataTransfer?.types.includes("Files") ?? false,
});

// Pass to createDropzone from @solid-primitives/upload
const dropzone = createDropzone(drop);
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
