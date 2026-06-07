# Drag & Drop Primitive — Design Document

## Overview

A minimal, composable drag-and-drop primitive for Solid 2.0. Inspired by
dnd-kit's architecture but redesigned for Solid's reactive model: no global
singleton, ref-factory API, context-isolated state, and SSR-safe stubs
throughout.

---

## Goals

- **Tight surface area** — expose only what can't be trivially composed by
  the user
- **No opinion on transforms** — report delta/position as signals; the user
  applies CSS
- **No global state** — each `createDragContext` scope is fully isolated
- **Sensor-agnostic at the core** — pointer sensor built-in, pattern open for
  keyboard / touch extensions
- **SSR-safe** — every reactive primitive returns a noop stub on the server
- **Solid 2.0 idiomatic** — ref factories (not `use:` directives), split
  `createEffect`, `ownedWrite`, no `batch`

---

## Primitive Set

### Level 1 — Raw DOM (`make*`)

Non-reactive. No Solid owner required. Return a cleanup function.

```ts
makeDraggable(
  el: HTMLElement,
  options: MakeDraggableOptions
): VoidFunction

makeDroppable(
  el: HTMLElement,
  options: MakeDroppableOptions
): VoidFunction
```

`makeDraggable` attaches `pointerdown` / `pointermove` / `pointerup` listeners
to `el`. It emits `onStart`, `onMove`, and `onEnd` callbacks with a `DragEvent`
payload carrying `{ id, data, delta: {x, y}, position: {x, y} }`.

`makeDroppable` monitors pointer position against the element's bounding rect.
It emits `onEnter`, `onLeave`, and `onDrop` callbacks. An optional `accept`
predicate filters which draggables are considered.

These two primitives are intentionally decoupled — `makeDroppable` does not
depend on `makeDraggable`.

### Level 2 — Reactive (`create*`)

Reactive wrappers that integrate with Solid's ownership model. All signals use
`INTERNAL_OPTIONS` (`ownedWrite: true`) where written from event callbacks.

```ts
createDraggable<T = unknown>(
  id: string | number,
  data?: T,
  options?: CreateDraggableOptions
): DraggableReturn<T>
```

Returns:
| Property | Type | Description |
|---|---|---|
| `ref` | `(el: HTMLElement) => void` | Attach to JSX via `ref={draggable.ref}` |
| `isDragging` | `Accessor<boolean>` | True while the item is being dragged |
| `transform` | `Accessor<Transform \| null>` | Current `{x, y}` delta during drag |
| `id` | `string \| number` | Stable identifier |

**Style options** — applied directly to the element so the user doesn't
repeat reactive style bindings in JSX:

```ts
type CreateDraggableOptions = {
  disabled?: boolean | Accessor<boolean>
  /** Styles applied to the element as soon as ref is attached. */
  style?: Partial<CSSStyleDeclaration>
  /** Styles merged in while isDragging is true, removed when false. */
  draggingStyle?: Partial<CSSStyleDeclaration>
  /** Class names added to the element as soon as ref is attached. */
  class?: string
  /** Class names toggled on while isDragging is true, removed when false. */
  draggingClass?: string
}
```

Usage:
```tsx
const drag = createDraggable("item-1", myData, {
  style: { userSelect: "none" },
  draggingStyle: { opacity: "0.5" },
  class: "draggable",
  draggingClass: "dragging ring-2 ring-indigo-500",
})
<div ref={drag.ref}>drag me</div>
```

`style` and `class` are applied once in the `ref` callback. `draggingStyle`
and `draggingClass` are toggled via a split `createEffect` tracking
`isDragging()`. Style properties are set/deleted individually; class names
are added/removed via `el.classList` so other classes are not clobbered.
Both `class` and `draggingClass` accept a space-separated string of tokens.

```ts
createDroppable<T = unknown>(
  id: string | number,
  data?: T,
  options?: CreateDroppableOptions
): DroppableReturn<T>
```

Returns:
| Property | Type | Description |
|---|---|---|
| `ref` | `(el: HTMLElement) => void` | Attach to JSX via `ref={droppable.ref}` |
| `isOver` | `Accessor<boolean>` | True when active draggable hovers this zone |
| `active` | `Accessor<DragItem<unknown> \| null>` | The currently hovering draggable's data |
| `id` | `string \| number` | Stable identifier |

**Style and class options:**

```ts
type CreateDroppableOptions = {
  disabled?: boolean | Accessor<boolean>
  accept?: (draggable: DragItem) => boolean
  /** Styles applied to the element as soon as ref is attached. */
  style?: Partial<CSSStyleDeclaration>
  /** Styles merged in while isOver is true, removed when false. */
  overStyle?: Partial<CSSStyleDeclaration>
  /** Class names added to the element as soon as ref is attached. */
  class?: string
  /** Class names toggled on while isOver is true, removed when false. */
  overClass?: string
}
```

Usage:
```tsx
const drop = createDroppable("zone-1", undefined, {
  class: "dropzone",
  overClass: "dropzone--active ring-2 ring-indigo-500",
})
<div ref={drop.ref}>drop here</div>
```

These primitives read drag state from the nearest `DragContext` via
`useContext`. They register themselves on mount and deregister on cleanup.

### Level 3 — Context

```ts
createDragContext(options?: DragContextOptions): DragContextReturn
```

Returns a `{ Provider, useDragContext }` pair. `Provider` is a Solid component;
`useDragContext` returns the shared drag store from any child scope.

The context store tracks:
- `active: DragItem | null` — the currently dragged item
- `over: DroppableItem | null` — the droppable currently under the pointer
- `transform: Transform | null` — running delta `{x, y}`

Events surfaced on the context:
- `onDragStart(item)` — fired when drag begins
- `onDragMove(item, transform)` — fired on every pointer move
- `onDragEnd(item, over)` — fired on pointer up
- `onDragCancel(item)` — fired on Escape or pointer cancel

### Level 4 — Sortable (composition)

```ts
createSortable<T = unknown>(
  id: string | number,
  data?: T
): SortableReturn<T>
```

A convenience primitive that combines `createDraggable` + `createDroppable` on
the same element. Used for building sortable lists.

Returns all fields of both + `isActiveDropzone: Accessor<boolean>` (true when
this element is the active drop target in a sort operation).

---

## Collision Detection

Pluggable strategy functions — pure, no Solid dependencies:

```ts
type CollisionDetector = (
  draggable: DragRect,
  droppables: DroppableRect[],
  pointerPosition: Point
) => string | number | null   // ID of best match, or null
```

Built-in strategies:

| Name | Strategy |
|---|---|
| `closestCenter` | Minimizes distance from pointer to droppable center |
| `closestCorners` | Minimizes distance to nearest droppable corner |
| `rectIntersection` | Returns droppable with largest overlap area |
| `pointerWithin` | Returns the topmost droppable containing the pointer |

`DragContextOptions.collisionDetection` defaults to `pointerWithin`.

---

## Types

```ts
type Transform = { x: number; y: number }
type Point = { x: number; y: number }
type DragRect = { id: string | number; rect: DOMRect }
type DroppableRect = { id: string | number; rect: DOMRect }

type DragItem<T = unknown> = {
  id: string | number
  data: T
  element: HTMLElement
}

type DroppableItem<T = unknown> = {
  id: string | number
  data: T
  element: HTMLElement
}

type MakeDraggableOptions<T = unknown> = {
  data?: T
  onStart?: (item: DragItem<T>, event: PointerEvent) => void
  onMove?: (item: DragItem<T>, transform: Transform, event: PointerEvent) => void
  onEnd?: (item: DragItem<T>, transform: Transform, event: PointerEvent) => void
  disabled?: boolean
}

type MakeDroppableOptions<T = unknown> = {
  data?: T
  accept?: (draggable: DragItem) => boolean
  onEnter?: (draggable: DragItem, event: PointerEvent) => void
  onLeave?: (draggable: DragItem, event: PointerEvent) => void
  onDrop?: (draggable: DragItem, event: PointerEvent) => void
  disabled?: boolean
}

type CreateDraggableOptions = {
  disabled?: boolean | Accessor<boolean>
  style?: Partial<CSSStyleDeclaration>
  draggingStyle?: Partial<CSSStyleDeclaration>
  class?: string
  draggingClass?: string
}

type CreateDroppableOptions = {
  disabled?: boolean | Accessor<boolean>
  accept?: (draggable: DragItem) => boolean
  style?: Partial<CSSStyleDeclaration>
  overStyle?: Partial<CSSStyleDeclaration>
  class?: string
  overClass?: string
}

type DragContextOptions = {
  collisionDetection?: CollisionDetector
  onDragStart?: (item: DragItem) => void
  onDragMove?: (item: DragItem, transform: Transform) => void
  onDragEnd?: (item: DragItem, over: DroppableItem | null) => void
  onDragCancel?: (item: DragItem) => void
}
```

---

## File Structure

```
packages/drag/
├── src/
│   ├── index.ts          # re-exports
│   ├── types.ts          # all shared types
│   ├── context.ts        # DragContext, createDragContext
│   ├── draggable.ts      # makeDraggable, createDraggable
│   ├── droppable.ts      # makeDroppable, createDroppable, makeNativeDroppable, createNativeDroppable
│   ├── sortable.ts       # createSortable
│   └── collision.ts      # closestCenter, closestCorners, rectIntersection, pointerWithin
├── test/
│   ├── index.test.ts     # browser tests (jsdom + vitest)
│   └── server.test.ts    # SSR safety tests
├── dev/
│   └── index.tsx         # interactive demo component
├── stories/
│   └── index.stories.tsx # Storybook stories
├── CHANGELOG.md
├── DESIGN.md
├── LICENSE
├── README.md
├── package.json
└── tsconfig.json
```

---

## Solid 2.0 Compliance Notes

### Directives → Ref Factories
`use:draggable` does not exist — all attachment is via `ref`:
```tsx
const drag = createDraggable("item-1", myData)
<div ref={drag.ref} style={{ opacity: drag.isDragging() ? 0.5 : 1 }}>
```

### Signal Writes
All signals updated from DOM event callbacks are created with `INTERNAL_OPTIONS`
(`{ ownedWrite: true }`). This satisfies Solid 2.0's restriction on writing
to signals inside owned scopes.

### Effects
All effects use the split compute/apply form:
```ts
createEffect(
  () => disabled(),           // compute — reactive reads only
  (isDisabled) => {           // apply — DOM side effects
    el.setAttribute("aria-disabled", String(isDisabled))
  }
)
```

### `isServer`
Imported from `@solidjs/web`. Every `make*` and `create*` primitive short-
circuits with a noop/stub return when `isServer === true`.

### No `batch`, No `createComputed`
- Signal writes from event handlers are inherently async-batched
- No `createComputed` — derivations use `createMemo`

### Context Registration
Draggables and droppables call `useContext(DragContext)` at creation time.
If no provider is present they operate in standalone mode (useful for simple
single-target use cases without a context).

---

## Context Coordination Flow

```
pointerdown on draggable element
  → makeDraggable emits onStart
  → createDraggable writes isDragging = true (INTERNAL_OPTIONS)
  → context.active = DragItem

pointermove anywhere on document
  → context.transform updates (delta from start)
  → collision detection runs against registered droppables
  → context.over = winner | null
  → matching createDroppable writes isOver = true

pointerup anywhere on document
  → context fires onDragEnd(active, over)
  → createDraggable writes isDragging = false, transform = null
  → createDroppable writes isOver = false
  → context.active = null, context.over = null
```

---

## Test Plan

### Browser Tests (`index.test.ts`)

**`makeDraggable`:**
- calls onStart with correct id/data on pointerdown
- calls onMove with accumulated delta on pointermove
- calls onEnd on pointerup, resets state
- no-ops when disabled

**`makeDroppable`:**
- calls onEnter when pointer moves into bounding rect
- calls onLeave when pointer exits
- calls onDrop on pointerup inside rect
- accept predicate filters droppables

**`createDraggable`:**
- ref attaches to element on mount
- isDragging() false initially, true during drag, false after
- transform() null initially, {x,y} during drag, null after
- `style` properties applied to element immediately on ref attachment
- `draggingStyle` properties applied when isDragging becomes true, removed when false
- does not clobber unrelated inline styles when removing draggingStyle
- `class` tokens added to element immediately on ref attachment
- `draggingClass` tokens added via classList when isDragging becomes true, removed when false
- does not clobber unrelated classes when removing draggingClass tokens
- cleans up event listeners on dispose

**`createDroppable`:**
- isOver() false initially, true when active drag enters
- active() null initially, carries DragItem during hover
- `style` properties applied to element immediately on ref attachment
- `overStyle` properties applied when isOver becomes true, removed when false
- does not clobber unrelated inline styles when removing overStyle
- `class` tokens added to element immediately on ref attachment
- `overClass` tokens added via classList when isOver becomes true, removed when false
- does not clobber unrelated classes when removing overClass tokens
- cleans up on dispose

**`createDragContext`:**
- active() and over() track current drag state
- onDragStart/onDragEnd callbacks fire in order
- collision detection resolves correct droppable

**`createSortable`:**
- acts as both draggable and droppable on same element
- isActiveDropzone distinguishes self vs other

**Collision strategies:**
- closestCenter returns correct winner
- rectIntersection returns correct winner
- pointerWithin returns topmost containing element

### SSR Tests (`server.test.ts`)
- make* functions return [stub, noop] on server
- create* functions return accessor stubs (no DOM access)
- No errors thrown during server render

---

## Package Metadata

```json
{
  "primitive": {
    "name": "drag",
    "stage": 0,
    "list": [
      "makeDraggable",
      "makeDroppable",
      "makeNativeDroppable",
      "createDraggable",
      "createDroppable",
      "createNativeDroppable",
      "createSortable",
      "createDragContext",
      "closestCenter",
      "closestCorners",
      "rectIntersection",
      "pointerWithin"
    ],
    "category": "Interaction"
  }
}
```

---

## Integration with `createDropzone` (upload package)

### Why a Second Drop-Zone Variant Is Needed

The `createDropzone` primitive in `packages/upload` handles **OS file drops** —
the user drags a file from Finder or Explorer and releases it onto a browser
element. The browser delivers this via native HTML5 `DragEvent`s on the target
element, carrying `event.dataTransfer.files`. This mechanism is completely
distinct from pointer-event-based UI DnD:

| | Pointer-based DnD (this package's default) | Native HTML5 DnD |
|---|---|---|
| Events | `pointerdown` / `pointermove` / `pointerup` | `dragenter` / `dragover` / `dragleave` / `drop` |
| Source | `makeDraggable` / `createDraggable` | OS file manager or `draggable="true"` elements |
| Position tracking | Manual (delta from start point) | Browser-managed ghost image |
| Data transfer | Arbitrary JS value attached to `DragItem` | `event.dataTransfer` (files, MIME types, text) |
| Touch support | Yes (pointer events cover touch) | Inconsistent on mobile |
| Custom drag image | Via CSS transforms on source element | Via `dataTransfer.setDragImage` |

`createDropzone` currently calls `createEventListenerMap` directly for native
drag events. The plan is for it to use `makeNativeDroppable` /
`createNativeDroppable` from this package instead.

### New Primitives: `makeNativeDroppable` / `createNativeDroppable`

Added to `src/droppable.ts` alongside the pointer-based variants.

#### `makeNativeDroppable`

```ts
makeNativeDroppable(
  el: HTMLElement,
  options: MakeNativeDroppableOptions
): VoidFunction
```

Listens to `dragenter`, `dragleave`, `dragover`, and `drop` on `el`. Calls
`event.preventDefault()` automatically on `dragover` and `drop` (required to
allow drops). Returns a cleanup function that removes all listeners.

```ts
type MakeNativeDroppableOptions = {
  /** Called when a dragged item enters the element bounds. */
  onEnter?: (event: DragEvent) => void
  /** Called when the dragged item leaves the element bounds. */
  onLeave?: (event: DragEvent) => void
  /** Called on each dragover tick. preventDefault is called before this. */
  onOver?: (event: DragEvent) => void
  /** Called when the item is released over the element. */
  onDrop?: (event: DragEvent) => void
  /**
   * Return false to reject the drop. Useful for filtering by
   * event.dataTransfer.types (e.g. only accept "Files").
   * Defaults to () => true.
   */
  accept?: (event: DragEvent) => boolean
  disabled?: boolean
}
```

The `accept` predicate runs before `onEnter` and on every `dragover`. When it
returns `false`, `dropEffect` is set to `"none"` and `onEnter` / `onOver` are
not called.

#### `createNativeDroppable`

```ts
createNativeDroppable(
  options?: CreateNativeDroppableOptions
): NativeDroppableReturn
```

Reactive wrapper. Attaches via a `ref` factory and exposes an `isOver` signal
that is true while a dragged item hovers the element.

```ts
type CreateNativeDroppableOptions = MakeNativeDroppableOptions & {
  /** Reactive disabled flag. */
  disabled?: boolean | Accessor<boolean>
}

type NativeDroppableReturn = {
  /** Attach to a JSX element: ref={droppable.ref} */
  ref: (el: HTMLElement) => void
  /** True while a dragged item is over this element. */
  isOver: Accessor<boolean>
}
```

Signals use `INTERNAL_OPTIONS` (`ownedWrite: true`) — they are written from
`dragenter` / `dragleave` / `drop` callbacks outside any owned scope.

### How `createDropzone` (upload) Uses This

`createDropzone` becomes a thin layer on top of `createNativeDroppable`. It
delegates all DOM event wiring to the primitive and adds file extraction and
async callback orchestration on top.

**Dependency**: `packages/upload/package.json` gains:
```json
{
  "dependencies": {
    "@solid-primitives/drag": "workspace:^"
  }
}
```

**Refactored `createDropzone.ts`** (showing the structural change):

```ts
// Before — manages raw DOM events directly
import { createEventListenerMap } from "@solid-primitives/event-listener"

const [refTarget, setRefTarget] = createSignal<T | undefined>(undefined)
createEventListenerMap(refTarget as () => T, {
  dragenter: onDragEnter,
  dragleave: onDragLeave,
  dragover: onDragOver,
  drag: onDrag,
  dragstart: onDragStart,
  dragend: onDragEnd,
  drop: onDrop,
})
const ref = (el: T) => { setRefTarget(() => el); flush() }
```

```ts
// After — delegates drop-zone wiring to createNativeDroppable
import { createNativeDroppable } from "@solid-primitives/drag"

const droppable = createNativeDroppable({
  onEnter: event => {
    void runCallback(options?.onDragEnter, transformFiles(event.dataTransfer?.files ?? null))
  },
  onLeave: event => {
    void runCallback(options?.onDragLeave, transformFiles(event.dataTransfer?.files ?? null))
  },
  onOver: event => {
    void runCallback(options?.onDragOver, transformFiles(event.dataTransfer?.files ?? null))
  },
  onDrop: event => {
    const parsedFiles = transformFiles(event.dataTransfer?.files ?? null)
    setFiles(parsedFiles)
    setError(null)
    setIsLoading(true)
    void (async () => {
      try { await options?.onDrop?.(parsedFiles) }
      catch (err) { setError(err) }
      finally { setIsLoading(false) }
    })()
  },
  accept: event => event.dataTransfer?.types.includes("Files") ?? true,
})

// droppable.isOver replaces the internal [isDragging, setIsDragging] signal
// droppable.ref replaces the manual ref + setRefTarget pattern
return {
  ref: droppable.ref,
  isDragging: droppable.isOver,   // isOver from native droppable = isDragging in dropzone API
  files, error, isLoading,
  removeFile, clearFiles,
}
```

Note: The upload package's `isDragging` and the drag package's `isOver` are
semantically the same concept — "a dragged item is currently over this element".
The naming difference is intentional: `isOver` is the canonical name in the
drag primitive (consistent with `createDroppable`); `isDragging` is preserved
in `createDropzone` for API backwards-compatibility.

### What `onDrag`, `onDragStart`, `onDragEnd` Become

The current `createDropzone` exposes five extra event hooks (`onDrag`,
`onDragStart`, `onDragEnd`) that fire on the *dropzone element itself*, not on
a dragged source item. After the refactor:

- `onDragStart` / `onDragEnd` / `onDrag` fire on the element when the element
  or one of its descendants initiates a drag. These are not relevant to file
  drop flows but are preserved for API compatibility. `makeNativeDroppable`
  does **not** handle them — `createDropzone` keeps its own `dragstart`,
  `dragend`, `drag` listeners via `createEventListenerMap` for these three.
- `onDragEnter` / `onDragLeave` / `onDragOver` / `onDrop` are delegated to
  `createNativeDroppable` entirely.

### Type Additions to `src/types.ts`

```ts
type MakeNativeDroppableOptions = {
  onEnter?: (event: DragEvent) => void
  onLeave?: (event: DragEvent) => void
  onOver?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  accept?: (event: DragEvent) => boolean
  disabled?: boolean
}

type CreateNativeDroppableOptions = MakeNativeDroppableOptions & {
  disabled?: boolean | Accessor<boolean>
}

type NativeDroppableReturn = {
  ref: (el: HTMLElement) => void
  isOver: Accessor<boolean>
}
```

### Updated Package Metadata

```json
{
  "primitive": {
    "name": "drag",
    "stage": 0,
    "list": [
      "makeDraggable",
      "makeDroppable",
      "makeNativeDroppable",
      "createDraggable",
      "createDroppable",
      "createNativeDroppable",
      "createSortable",
      "createDragContext",
      "closestCenter",
      "closestCorners",
      "rectIntersection",
      "pointerWithin"
    ],
    "category": "Interaction"
  }
}
```

### Test Additions for Native Variants

**Browser tests (`index.test.ts`):**

`makeNativeDroppable`:
- fires `onEnter` and sets `isOver` true on `dragenter`
- fires `onLeave` and sets `isOver` false on `dragleave`
- calls `preventDefault` on `dragover`
- fires `onDrop` and sets `isOver` false on `drop`
- `accept` returning false suppresses `onEnter` / `onOver` and sets `dropEffect = "none"`
- disabled flag suppresses all callbacks

`createNativeDroppable`:
- `isOver()` starts false, becomes true on `dragenter`, false on `dragleave`
- reactive `disabled` accessor stops callbacks while true
- cleans up all listeners on scope dispose

**Integration test** (lives in `packages/upload/test/`):
- `createDropzone` using `createNativeDroppable` produces same `isDragging`
  transitions as the current implementation
- `files()` signal is populated after a synthetic drop event carrying a
  `FileList`

---

## Open Questions / Future Work

1. **Keyboard sensor** — full keyboard navigation (Tab, Space, Arrow keys) is
   a non-trivial scope extension. Design leaves room via the sensor pattern but
   does not implement it in v0.
2. **Drag overlay** — rendering a portal overlay during drag requires a
   separate component. Punted to a follow-up primitive or userland composition.
3. **Auto-scroll** — scrolling containers when dragging near edges. Punted.
4. **Touch** — `pointer` events cover touch natively on modern browsers; no
   separate touch sensor needed.
5. **Accessibility** — ARIA live regions and `aria-grabbed` are documented in
   README as a user responsibility with guidance on how to wire them.
