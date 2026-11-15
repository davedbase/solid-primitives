<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Drag%20%26%20Drop" alt="Solid Primitives Drag & Drop">
</p>

# @solid-primitives/drag-drop

[![size](https://img.shields.io/badge/size-3.97_kB-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/drag-drop)
[![version](https://img.shields.io/npm/v/@solid-primitives/drag-drop?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/drag-drop)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Composable, tree-shakeable drag-and-drop primitives.

`createDraggable` is keyboard-accessible out of the box — `Space`/`Enter` picks up the drag, arrow keys nudge it, `Space`/`Enter` drops it, and `Escape` cancels, mirroring the pointer sensor's lifecycle.

Two separate drag systems are provided:

- **[Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)** (`makeDraggable`, `makeDroppable`, `createDraggable`, `createDroppable`, `createSortable`, `createDragContext`) — for UI elements moved by the user. The primitives track `pointerdown`/`pointermove`/`pointerup` on the dragged element and document, computing position/collision manually; nothing here uses the browser's native drag-and-drop.
- **[Native HTML5 Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)** (`makeNativeDroppable`, `createNativeDroppable`) — for OS file drops and `draggable="true"` elements; used internally by `@solid-primitives/upload`'s `createDropzone`.

## Installation

```bash
npm install @solid-primitives/drag-drop
# or
pnpm add @solid-primitives/drag-drop
```

## Primitives

### `makeDraggable`

Non-reactive base. Attaches pointer listeners to an element. No Solid owner required.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, onSettled } from "solid-js";
import { makeDraggable } from "@solid-primitives/drag-drop";

function Demo() {
  let box!: HTMLDivElement;
  const [last, setLast] = createSignal("drag the box");
  onSettled(() =>
    makeDraggable(box, {
      onMove: d => (box.style.transform = `translate(${d.x}px, ${d.y}px)`),
      onEnd: d => {
        box.style.transform = "";
        setLast(`released at dx ${d.x}, dy ${d.y}`);
      },
    }),
  );
  return (
    <>
      <div
        ref={box}
        style={{ width: "80px", padding: "16px", background: "plum", "touch-action": "none" }}
      >
        drag me
      </div>
      <p>{last()}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

> **Note:** When pairing with `makeDroppable`, apply `pointer-events: none` to the dragged element during the drag so that `pointerenter`/`pointerleave` can reach the underlying drop targets. The context-based `createDroppable` uses rect collision and is not affected.

```ts
const cleanup = makeDraggable(el, {
  onStart: e => {
    el.style.pointerEvents = "none"; // required for makeDroppable coordination
    console.log("start", e.clientX);
  },
  onMove: delta => (el.style.transform = `translate(${delta.x}px,${delta.y}px)`),
  onEnd: () => {
    el.style.pointerEvents = "";
    el.style.transform = "";
  },
});
// later
cleanup();
```

### `makeDroppable`

Non-reactive base. Marks an element as a drop target for pointer-event drags.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, onSettled } from "solid-js";
import { makeDraggable, makeDroppable } from "@solid-primitives/drag-drop";

function Demo() {
  let box!: HTMLDivElement;
  let zone!: HTMLDivElement;
  let dragging = false;
  const [status, setStatus] = createSignal("idle");
  onSettled(() => {
    const stopDrag = makeDraggable(box, {
      onStart: () => {
        dragging = true;
        box.style.pointerEvents = "none";
      },
      onMove: d => (box.style.transform = `translate(${d.x}px, ${d.y}px)`),
      onEnd: () => {
        dragging = false;
        box.style.pointerEvents = "";
        box.style.transform = "";
      },
    });
    const stopDrop = makeDroppable(zone, {
      onEnter: () => dragging && setStatus("over"),
      onLeave: () => setStatus("idle"),
      onDrop: () => dragging && setStatus("dropped!"),
    });
    return () => (stopDrag(), stopDrop());
  });
  return (
    <>
      <div
        ref={box}
        style={{ width: "60px", padding: "12px", background: "plum", "touch-action": "none" }}
      >
        drag
      </div>
      <div ref={zone} style={{ "margin-top": "40px", padding: "30px", border: "2px dashed" }}>
        drop zone: {status()}
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

> **Note:** Requires `pointer-events: none` on the dragged element during the drag — otherwise the dragged element intercepts `pointerenter`/`pointerleave` before they reach this element.

```ts
const cleanup = makeDroppable(el, {
  onEnter: () => el.classList.add("over"),
  onLeave: () => el.classList.remove("over"),
  onDrop: () => acceptDrop(),
});
```

### `makeNativeDroppable`

Non-reactive base for OS/browser native drag events (e.g. file drops). Handles the `dragenter`/`dragleave` depth problem with child elements automatically.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, onSettled } from "solid-js";
import { makeNativeDroppable } from "@solid-primitives/drag-drop";

function Demo() {
  let zone!: HTMLDivElement;
  const [status, setStatus] = createSignal("drop a file or the text below");
  onSettled(() =>
    makeNativeDroppable(zone, {
      onEnter: () => setStatus("release to drop"),
      onLeave: () => setStatus("left the zone"),
      onDrop: e => {
        const files = Array.from(e.dataTransfer?.files ?? [], f => f.name);
        setStatus(`dropped: ${files.join(", ") || e.dataTransfer?.getData("text/plain")}`);
      },
    }),
  );
  return (
    <>
      <span draggable="true" onDragStart={e => e.dataTransfer?.setData("text/plain", "hello")}>
        drag this text
      </span>
      <div ref={zone} style={{ "margin-top": "12px", padding: "30px", border: "2px dashed" }}>
        {status()}
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
const cleanup = makeNativeDroppable(el, {
  accept: e => e.dataTransfer?.types.includes("Files") ?? false,
  onEnter: () => el.classList.add("over"),
  onDrop: e => handleFiles(e.dataTransfer!.files),
});
```

### `createDraggable`

Reactive draggable. Attach via `ref`. Works standalone or inside a `createDragContext` provider.

```tsx repl
import { render } from "@solidjs/web";
import { createDraggable } from "@solid-primitives/drag-drop";

function Demo() {
  const drag = createDraggable("card", undefined, { draggingStyle: { opacity: "0.6" } });
  const t = () => drag.transform() ?? { x: 0, y: 0 };
  return (
    <div
      ref={drag.ref}
      style={{
        width: "140px",
        padding: "16px",
        background: "plum",
        "touch-action": "none",
        transform: `translate(${t().x}px, ${t().y}px)`,
      }}
    >
      {drag.isDragging() ? `x ${t().x}, y ${t().y}` : "drag me (or Space + arrows)"}
    </div>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

Uses `setPointerCapture` internally so the drag is never stuck if the pointer leaves the viewport. If the page scrolls mid-drag, `transform` is corrected for the scroll delta so the element stays glued to the pointer instead of drifting.

**Keyboard support:** `ref` sets `tabindex="0"`, `role="button"`, and `aria-roledescription="draggable"` on the element unless you've already set them yourself. With the element focused: `Space`/`Enter` picks up the drag, arrow keys nudge it by `keyboardStep` pixels (default 25), `Space`/`Enter` drops it, and `Escape` cancels.

```tsx
const drag = createDraggable("card-1", myData, {
  class: "cursor-grab",
  draggingClass: "opacity-50 cursor-grabbing",
  draggingStyle: { boxShadow: "0 8px 24px rgba(0,0,0,.2)" },
});

<div ref={drag.ref}>{drag.isDragging() ? "dragging…" : drag.transform()?.x}</div>;
```

| Option          | Type                           | Description                                                                   |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| `style`         | `Partial<CSSStyleDeclaration>` | Applied to the element on `ref`                                               |
| `class`         | `string`                       | Added to the element on `ref`                                                 |
| `draggingStyle` | `Partial<CSSStyleDeclaration>` | Applied while dragging, removed on drop                                       |
| `draggingClass` | `string`                       | Added while dragging, removed on drop                                         |
| `disabled`      | `boolean \| Accessor<boolean>` | Prevents drag when true                                                       |
| `keyboardStep`  | `number`                       | Pixels moved per arrow-key press while picked up via keyboard. Defaults to 25 |

| Return       | Description                                            |
| ------------ | ------------------------------------------------------ |
| `ref`        | Attach to element's `ref` prop                         |
| `isDragging` | Accessor — true while a drag is active                 |
| `transform`  | Accessor — `{ x, y }` delta from drag start, or `null` |
| `id`         | The id passed to the primitive                         |

### `createDroppable`

Reactive drop target. Requires a `createDragContext` ancestor to coordinate collision detection — using it without one leaves `isOver`/`active` permanently `false`/`null` and logs a dev-mode warning, since it usually means a missing `<Provider>`.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createDragContext, createDraggable, createDroppable } from "@solid-primitives/drag-drop";

function Content() {
  const [accepting, setAccepting] = createSignal(true);
  const drag = createDraggable("chip");
  const drop = createDroppable("zone", undefined, { accept: () => accepting() });
  const t = () => drag.transform() ?? { x: 0, y: 0 };
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={accepting()}
          onChange={e => setAccepting(e.target.checked)}
        />
        accept drops
      </label>
      <div ref={drop.ref} style={{ margin: "12px 0 40px", padding: "30px", border: "2px dashed" }}>
        {drop.isOver() ? `release to drop ${drop.active()?.id}` : "drop here"}
      </div>
      <div
        ref={drag.ref}
        style={{
          width: "60px",
          padding: "12px",
          background: "plum",
          "touch-action": "none",
          transform: `translate(${t().x}px, ${t().y}px)`,
        }}
      >
        chip
      </div>
    </>
  );
}

function Demo() {
  const ctx = createDragContext();
  return (
    <ctx.Provider>
      <Content />
    </ctx.Provider>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
const drop = createDroppable("zone-1", zoneData, {
  class: "border-2 border-dashed border-transparent",
  overClass: "border-indigo-500 bg-indigo-50",
});

<div ref={drop.ref}>{drop.isOver() ? `release to drop ${drop.active()?.id}` : "drop here"}</div>;
```

`accept` is called fresh on every collision check (not memoized), so reading a signal inside it gives you reactive accept logic for free:

```tsx
const [locked, setLocked] = createSignal(false);
const drop = createDroppable("zone-1", zoneData, {
  accept: draggable => !locked() && draggable.data.type === "file",
});
```

### `createNativeDroppable`

Reactive native drop zone. Tracks `isOver` state via HTML5 drag events.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createNativeDroppable } from "@solid-primitives/drag-drop";

function Demo() {
  const [files, setFiles] = createSignal<string[]>([]);
  const drop = createNativeDroppable({
    accept: e => e.dataTransfer?.types.includes("Files") ?? false,
    onDrop: e => setFiles(Array.from(e.dataTransfer?.files ?? [], f => f.name)),
  });
  return (
    <>
      <div
        ref={drop.ref}
        style={{ padding: "40px", border: "2px dashed", background: drop.isOver() ? "#eef" : "" }}
      >
        {drop.isOver() ? "release to drop" : "drag files here"}
      </div>
      <p>dropped: {files().join(", ") || "none"}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
const drop = createNativeDroppable({
  accept: e => e.dataTransfer?.types.includes("Files") ?? false,
  onDrop: e => handleFiles(e.dataTransfer!.files),
});

<div ref={drop.ref} class={drop.isOver() ? "ring-2 ring-indigo-500" : ""}>
  Drop files here
</div>;
```

### `createDragContext`

Coordinates draggables and droppables. Provide it as a context via `ctx.Provider`.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createDragContext, createDraggable, createDroppable } from "@solid-primitives/drag-drop";

function Zone(props: { id: string }) {
  const drop = createDroppable(props.id);
  return (
    <div
      ref={drop.ref}
      style={{ padding: "24px", border: "2px dashed", background: drop.isOver() ? "#dfd" : "" }}
    >
      {props.id}
    </div>
  );
}

function Chip() {
  const drag = createDraggable("chip");
  const t = () => drag.transform() ?? { x: 0, y: 0 };
  return (
    <div
      ref={drag.ref}
      style={{
        width: "60px",
        padding: "12px",
        background: "plum",
        "touch-action": "none",
        transform: `translate(${t().x}px, ${t().y}px)`,
      }}
    >
      chip
    </div>
  );
}

function Demo() {
  const [log, setLog] = createSignal("drag the chip onto a zone");
  const ctx = createDragContext({
    onDragEnd: (item, over) => setLog(`dropped ${item.id} on ${over?.id ?? "nothing"}`),
    onDragCancel: item => setLog(`cancelled ${item.id}`),
  });
  return (
    <ctx.Provider>
      <div style={{ display: "flex", gap: "16px", "margin-bottom": "40px" }}>
        <Zone id="left" />
        <Zone id="right" />
      </div>
      <Chip />
      <p>
        active: {ctx.active()?.id ?? "-"} / over: {ctx.over()?.id ?? "-"}
      </p>
      <p>{log()}</p>
    </ctx.Provider>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

Droppable rects are snapshotted once at drag start — `getBoundingClientRect` is never called during `pointermove`. Collision checks run at display rate (rAF-throttled) and only write reactive state when the hovered zone actually changes. `createDraggable`'s `isDragging` and `createDroppable`'s `isOver` are backed by `createProjection`, so in a list of many draggables/droppables, a drag start/end or hover change only notifies the specific items whose state actually flipped — not every item in the list.

```tsx
const ctx = createDragContext({
  collisionDetection: closestCenter,
  onDragStart: item => console.log("started", item.id),
  onDragEnd: (item, over) => console.log("dropped", item.id, "on", over?.id),
  onDragCancel: item => console.log("cancelled", item.id),
  autoScroll: true, // or { threshold: 80, speed: 20 }
  keyboardStep: 25,
});

<ctx.Provider>
  <DraggableItem />
  <DropZone />
</ctx.Provider>;
```

| Option                                                      | Type                                | Description                                                                                                                |
| ----------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `collisionDetection`                                        | `CollisionDetector`                 | Defaults to `pointerWithin`                                                                                                |
| `onDragStart` / `onDragMove` / `onDragEnd` / `onDragCancel` | callbacks                           | Drag lifecycle hooks                                                                                                       |
| `keyboardStep`                                              | `number`                            | Pixels moved per arrow-key press while picked up via keyboard. Defaults to 25                                              |
| `autoScroll`                                                | `boolean \| { threshold?, speed? }` | Scrolls the window when the pointer nears a viewport edge during a drag. Off by default; ignored for keyboard-driven drags |

| Return      | Description                                                           |
| ----------- | --------------------------------------------------------------------- |
| `Provider`  | Wrap your drag-and-drop tree in this component                        |
| `active`    | Accessor — the currently dragged `DragItem`, or `null`                |
| `over`      | Accessor — the current `DroppableItem` under the draggable, or `null` |
| `transform` | Accessor — `{ x, y }` delta from drag start, or `null`                |

> **Note:** `autoScroll` only scrolls the window — it doesn't track scrolling of an arbitrary nested overflow container.

### `createSortable`

Combines `createDraggable` and `createDroppable` on the same element. When another item is dragged over it, `isActiveDropzone()` is true. The active draggable is never its own drop target.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { arrayMove, createDragContext, createSortable } from "@solid-primitives/drag-drop";

function Demo() {
  const [items, setItems] = createSignal(["Apple", "Banana", "Cherry", "Date"]);
  const ctx = createDragContext({
    onDragEnd: (dragged, over) => {
      if (!over) return;
      setItems(list =>
        arrayMove(list, list.indexOf(dragged.id as string), list.indexOf(over.id as string)),
      );
    },
  });
  return (
    <ctx.Provider>
      <For each={items()}>
        {item => {
          const s = createSortable(item);
          const t = () => s.transform() ?? { x: 0, y: 0 };
          return (
            <div
              ref={s.ref}
              style={{
                padding: "8px",
                "touch-action": "none",
                border: s.isActiveDropzone() ? "2px dashed blue" : "2px solid transparent",
                transform: `translate(${t().x}px, ${t().y}px)`,
              }}
            >
              {item}
            </div>
          );
        }}
      </For>
    </ctx.Provider>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

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

Pair it with `arrayMove` in `onDragEnd` to reorder the backing array — see [`arrayMove`](#arraymove) below.

## Collision detection strategies

All four are exported as pure functions — pass any of them as `collisionDetection` to `createDragContext`.

| Strategy           | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `closestCenter`    | Nearest droppable by center-to-center distance          |
| `closestCorners`   | Nearest droppable by minimum corner-to-pointer distance |
| `rectIntersection` | Droppable with largest overlap area                     |
| `pointerWithin`    | Topmost droppable containing the pointer (default)      |

```ts
import { createDragContext, closestCenter } from "@solid-primitives/drag-drop";

const ctx = createDragContext({ collisionDetection: closestCenter });
```

You can also write a custom detector:

```ts
import type { CollisionDetector } from "@solid-primitives/drag-drop";

const myDetector: CollisionDetector = (draggable, droppables, pointer) => {
  // Return the id of the winning droppable, or null
  return droppables[0]?.id ?? null;
};
```

### `closestCenter`

Picks the droppable whose center is nearest to the pointer — always returns a winner while any droppable exists.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { closestCenter, type DroppableRect } from "@solid-primitives/drag-drop";

// 100x100 boxes: A spans x 0-100, B 150-250, C 300-400
const box = (id: string, left: number): DroppableRect => ({
  id,
  rect: { left, top: 0, x: left, y: 0, width: 100, height: 100, right: left + 100, bottom: 100 },
});
const zones = [box("A", 0), box("B", 150), box("C", 300)];

function Demo() {
  const [x, setX] = createSignal(50);
  // the dragged box is 100x100 and centered on the pointer
  const winner = () => closestCenter(box("drag", x() - 50), zones, { x: x(), y: 50 });
  return (
    <>
      <input
        type="range"
        min="-150"
        max="550"
        value={x()}
        onInput={e => setX(e.target.valueAsNumber)}
      />
      <p>
        pointer x = {x()} → closestCenter picks: {winner() ?? "none"}
      </p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### `closestCorners`

Picks the droppable with the corner nearest to the pointer.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { closestCenter, closestCorners, type DroppableRect } from "@solid-primitives/drag-drop";

// a wide box A spans x 0-300, a narrow box B spans x 350-400
const box = (id: string, left: number, width: number): DroppableRect => ({
  id,
  rect: { left, top: 0, x: left, y: 0, width, height: 100, right: left + width, bottom: 100 },
});
const zones = [box("A", 0, 300), box("B", 350, 50)];

function Demo() {
  const [x, setX] = createSignal(320);
  const pointer = () => ({ x: x(), y: 50 });
  const drag = () => box("drag", x() - 25, 50);
  return (
    <>
      <input
        type="range"
        min="0"
        max="450"
        value={x()}
        onInput={e => setX(e.target.valueAsNumber)}
      />
      <p>pointer x = {x()}</p>
      <p>closestCorners picks: {closestCorners(drag(), zones, pointer()) ?? "none"}</p>
      <p>closestCenter picks: {closestCenter(drag(), zones, pointer()) ?? "none"}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### `rectIntersection`

Picks the droppable with the largest overlap with the dragged element's rect; `null` when nothing overlaps.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { rectIntersection, type DroppableRect } from "@solid-primitives/drag-drop";

// 100x100 boxes: A spans x 0-100, B 150-250, C 300-400
const box = (id: string, left: number): DroppableRect => ({
  id,
  rect: { left, top: 0, x: left, y: 0, width: 100, height: 100, right: left + 100, bottom: 100 },
});
const zones = [box("A", 0), box("B", 150), box("C", 300)];

function Demo() {
  const [x, setX] = createSignal(50);
  // the dragged box is 100x100 and centered on the pointer
  const winner = () => rectIntersection(box("drag", x() - 50), zones, { x: x(), y: 50 });
  return (
    <>
      <input
        type="range"
        min="-150"
        max="550"
        value={x()}
        onInput={e => setX(e.target.valueAsNumber)}
      />
      <p>
        pointer x = {x()} → rectIntersection picks: {winner() ?? "none"}
      </p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### `pointerWithin`

Picks the topmost droppable whose rect contains the pointer; `null` in the gaps. This is the default.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { pointerWithin, type DroppableRect } from "@solid-primitives/drag-drop";

// 100x100 boxes: A spans x 0-100, B 150-250, C 300-400
const box = (id: string, left: number): DroppableRect => ({
  id,
  rect: { left, top: 0, x: left, y: 0, width: 100, height: 100, right: left + 100, bottom: 100 },
});
const zones = [box("A", 0), box("B", 150), box("C", 300)];

function Demo() {
  const [x, setX] = createSignal(50);
  // the dragged box is 100x100 and centered on the pointer
  const winner = () => pointerWithin(box("drag", x() - 50), zones, { x: x(), y: 50 });
  return (
    <>
      <input
        type="range"
        min="-150"
        max="550"
        value={x()}
        onInput={e => setX(e.target.valueAsNumber)}
      />
      <p>
        pointer x = {x()} → pointerWithin picks: {winner() ?? "none"}
      </p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

## `arrayMove`

Reorders an array by moving the item at `from` to `to`, returning a new array. Pairs naturally with `createDragContext`'s `onDragEnd` for reordering a `createSortable` list — see the [`createSortable`](#createsortable) example above for the full picture.

```ts
import { arrayMove } from "@solid-primitives/drag-drop";

const ctx = createDragContext({
  onDragEnd: (dragged, over) => {
    if (!over) return;
    setItems(items =>
      arrayMove(
        items,
        items.findIndex(i => i.id === dragged.id),
        items.findIndex(i => i.id === over.id),
      ),
    );
  },
});
```

Out-of-range or equal indices return an unmodified copy of the array.

## Integration with `@solid-primitives/upload`

`@solid-primitives/upload`'s `createDropzone` uses `createNativeDroppable` from this package under the hood. No manual wiring is needed — just use `createDropzone` from the upload package directly:

```tsx
import { createDropzone } from "@solid-primitives/upload";

const { ref, files, isDragging } = createDropzone({
  onDrop: async files => await upload(files),
});

<div ref={ref} class={isDragging() ? "ring-2" : ""}>
  Drop files here
</div>;
```

If you need lower-level control (custom accept filter, access to the raw `DragEvent`, etc.), use `createNativeDroppable` directly:

```tsx
import { createNativeDroppable } from "@solid-primitives/drag-drop";

const drop = createNativeDroppable({
  accept: e => e.dataTransfer?.types.includes("Files") ?? false,
  onDrop: e => processFiles(e.dataTransfer!.files),
});
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
