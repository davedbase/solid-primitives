import { createMemo, createSignal, For } from "solid-js";
import preview from "../../../.storybook/preview.js";
import readme from "../README.md?raw";
import {
  BoolRow,
  Button,
  ButtonRow,
  Card,
  Container,
  StatRow,
} from "../../../.storybook/ui/index.js";
import {
  createDraggable,
  createDroppable,
  createDragContext,
  createNativeDroppable,
  createSortable,
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
} from "@solid-primitives/drag-drop";
import type { CollisionDetector } from "@solid-primitives/drag-drop";

const meta = preview.meta({
  title: "Interaction/Drag",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: readme,
      },
    },
  },
});

export default meta;

// ── Story 1: createDraggable standalone ───────────────────────────────────────

export const StandaloneDrag = meta.story({
  name: "createDraggable — floating card",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        story:
          "`createDraggable` tracks pointer position and exposes `isDragging` and `transform`. Apply the transform in JSX to move the element. `draggingStyle` and `draggingClass` are applied automatically by the primitive while dragging — no manual effect needed.",
      },
    },
  },
  render: () => {
    const drag = createDraggable("card", undefined, {
      draggingStyle: {
        boxShadow: "0 20px 48px rgba(0,0,0,.18)",
        opacity: "0.92",
      },
    });

    return (
      <div style={{ "font-family": "system-ui", padding: "2rem" }}>
        <div
          style={{
            height: "260px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            background: "#f8fafc",
            "border-radius": "12px",
            border: "1px dashed #cbd5e1",
            position: "relative",
            overflow: "visible",
          }}
        >
          <div
            ref={drag.ref}
            style={{
              position: "relative",
              "z-index": drag.isDragging() ? 10 : 1,
              transform: drag.transform()
                ? `translate(${drag.transform()!.x}px, ${drag.transform()!.y}px)`
                : undefined,
              transition: drag.isDragging() ? "none" : "transform 0.2s cubic-bezier(.34,1.56,.64,1)",
              background: drag.isDragging() ? "#4f46e5" : "#6366f1",
              color: "white",
              padding: "0.875rem 1.5rem",
              "border-radius": "10px",
              "font-weight": "600",
              "font-size": "0.95rem",
              cursor: drag.isDragging() ? "grabbing" : "grab",
              "touch-action": "none",
              "user-select": "none",
            }}
          >
            {drag.isDragging() ? "Dragging…" : "Drag me"}
          </div>
        </div>

        <Card>
          <BoolRow label="isDragging" value={drag.isDragging()} />
          <StatRow label="transform.x" value={drag.transform()?.x ?? 0} />
          <StatRow label="transform.y" value={drag.transform()?.y ?? 0} />
        </Card>

        <p style={{ "font-size": "0.8rem", color: "#64748b", margin: 0 }}>
          The card springs back when released. <code>draggingStyle</code> adds the shadow
          automatically — the primitive applies and removes it without any manual effect.
        </p>
      </div>
    );
  },
});

// ── Story 2: createDragContext ────────────────────────────────────────────────

type Strategy = { label: string; fn: CollisionDetector };
const STRATEGIES: Strategy[] = [
  { label: "pointerWithin", fn: pointerWithin },
  { label: "closestCenter", fn: closestCenter },
  { label: "closestCorners", fn: closestCorners },
  { label: "rectIntersection", fn: rectIntersection },
];

const ZONES = [
  { id: "red", label: "Red zone", bg: "#fee2e2", active: "#ef4444" },
  { id: "green", label: "Green zone", bg: "#dcfce7", active: "#22c55e" },
  { id: "blue", label: "Blue zone", bg: "#dbeafe", active: "#3b82f6" },
];

export const DragAndDrop = meta.story({
  name: "createDragContext — drag and drop",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        story:
          "`createDragContext` coordinates a tree of draggables and droppables via a shared Provider. Collision detection resolves which droppable is active — swap strategies with the buttons below to see how each behaves.",
      },
    },
  },
  render: () => {
    const [strategyIdx, setStrategyIdx] = createSignal(0);
    const [lastDrop, setLastDrop] = createSignal<string | null>(null);

    const ctx = createDragContext({
      collisionDetection: (...args) => STRATEGIES[strategyIdx()]!.fn(...args),
      onDragEnd: (item, over) =>
        setLastDrop(over ? `"${item.id}" → "${over.id}"` : `"${item.id}" → (none)`),
    });

    // createDraggable and createDroppable must be called inside ctx.Provider's
    // children so useDragContext() finds the provider in the reactive owner chain.
    function DemoContent() {
      const drag = createDraggable("chip", undefined, {
        draggingStyle: { boxShadow: "0 12px 32px rgba(0,0,0,.15)", opacity: "0.9" },
      });

      return (
        <>
          {/* Drop zones */}
          <div style={{ display: "flex", gap: "0.75rem", "margin-bottom": "1.25rem" }}>
            <For each={ZONES}>
              {zone => {
                const drop = createDroppable(zone.id);
                return (
                  <div
                    ref={drop.ref}
                    style={{
                      flex: "1",
                      height: "100px",
                      "border-radius": "10px",
                      background: drop.isOver() ? zone.active : zone.bg,
                      border: `2px solid ${drop.isOver() ? zone.active : "transparent"}`,
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "font-size": "0.8rem",
                      "font-weight": "500",
                      color: drop.isOver() ? "white" : "#64748b",
                      transition: "background 0.15s, border-color 0.15s, color 0.15s",
                      "user-select": "none",
                    }}
                  >
                    {zone.label}
                  </div>
                );
              }}
            </For>
          </div>

          {/* Draggable chip */}
          <div style={{ display: "flex", "justify-content": "center", "margin-bottom": "1.25rem" }}>
            <div
              ref={drag.ref}
              style={{
                position: "relative",
                "z-index": drag.isDragging() ? 10 : 1,
                transform: drag.transform()
                  ? `translate(${drag.transform()!.x}px, ${drag.transform()!.y}px)`
                  : undefined,
                transition: drag.isDragging()
                  ? "none"
                  : "transform 0.2s cubic-bezier(.34,1.56,.64,1)",
                background: "#6366f1",
                color: "white",
                padding: "0.625rem 1.25rem",
                "border-radius": "999px",
                "font-weight": "600",
                "font-size": "0.9rem",
                cursor: drag.isDragging() ? "grabbing" : "grab",
                "touch-action": "none",
                "user-select": "none",
              }}
            >
              chip
            </div>
          </div>
        </>
      );
    }

    return (
      <ctx.Provider>
        <div style={{ "font-family": "system-ui", padding: "1.5rem", width: "420px" }}>
          <DemoContent />

          {/* Collision strategy selector */}
          <ButtonRow>
            <For each={STRATEGIES}>
              {(s, i) => (
                <Button
                  variant={strategyIdx() === i() ? "primary" : "outline"}
                  onClick={() => setStrategyIdx(i())}
                  style={{ flex: 1, "font-size": "0.72rem", padding: "0.35rem 0.4rem" }}
                >
                  {s.label}
                </Button>
              )}
            </For>
          </ButtonRow>

          <Card>
            <StatRow label="active" value={ctx.active()?.id ?? "—"} />
            <StatRow label="over" value={ctx.over()?.id ?? "—"} />
            <StatRow label="transform.x" value={ctx.transform()?.x ?? 0} />
            <StatRow label="transform.y" value={ctx.transform()?.y ?? 0} />
            <StatRow label="last drop" value={lastDrop() ?? "—"} />
          </Card>
        </div>
      </ctx.Provider>
    );
  },
});

// ── Story 3: createSortable ───────────────────────────────────────────────────

type SortItem = { id: string; label: string; color: string };

const INITIAL_ITEMS: SortItem[] = [
  { id: "a", label: "Apple", color: "#fee2e2" },
  { id: "b", label: "Banana", color: "#fef9c3" },
  { id: "c", label: "Cherry", color: "#fce7f3" },
  { id: "d", label: "Date", color: "#f3e8ff" },
  { id: "e", label: "Elderberry", color: "#dbeafe" },
];

// Item height (padding × 2 + line-height) + gap — used to compute neighbour shifts.
// Must match the item's rendered size: 0.625rem×2 padding + ~1.4 line-height at 0.9rem ≈ 44px, gap 0.4rem ≈ 6px.
const SORTABLE_STRIDE = 50;

export const SortableList = meta.story({
  name: "createSortable — reorderable list",
  parameters: {
    docs: {
      description: {
        story:
          "`createSortable` composes `createDraggable` and `createDroppable` on the same element. While dragging, neighbouring items shift via `translateY` to show where the item will land. The actual reorder (and the snap-back) happens in `onDragEnd`.",
      },
    },
  },
  render: () => {
    const [items, setItems] = createSignal<SortItem[]>(INITIAL_ITEMS);

    const ctx = createDragContext({
      collisionDetection: closestCenter,
      onDragEnd: (dragged, over) => {
        if (!over) return;
        setItems(prev => {
          const from = prev.findIndex(i => i.id === dragged.id);
          const to = prev.findIndex(i => i.id === over.id);
          if (from < 0 || to < 0 || from === to) return prev;
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved!);
          return next;
        });
      },
    });

    return (
      <ctx.Provider>
        <div style={{ "font-family": "system-ui", padding: "1.5rem", width: "280px" }}>
          <p style={{ margin: "0 0 0.75rem", "font-size": "0.85rem", color: "#64748b" }}>
            Drag items to reorder
          </p>
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.4rem" }}>
            <For each={items()}>
              {(item, index) => {
                const s = createSortable(item.id, item);

                // Compute how much this item should shift while another item is dragged
                // over a new position. Items between the drag source and the hover target
                // shift by one stride to open a visual slot for the floating item.
                const shift = createMemo(() => {
                  if (s.isDragging()) return 0;
                  const active = ctx.active();
                  const over = ctx.over();
                  if (!active || !over) return 0;
                  const fromIdx = items().findIndex(i => i.id === active.id);
                  const toIdx = items().findIndex(i => i.id === over.id);
                  const myIdx = index();
                  if (fromIdx < toIdx && myIdx > fromIdx && myIdx <= toIdx) return -SORTABLE_STRIDE;
                  if (fromIdx > toIdx && myIdx >= toIdx && myIdx < fromIdx) return SORTABLE_STRIDE;
                  return 0;
                });

                return (
                  <div
                    ref={s.ref}
                    style={{
                      position: "relative",
                      "z-index": s.isDragging() ? 10 : 1,
                      transform: s.isDragging()
                        ? `translate(${s.transform()!.x}px, ${s.transform()!.y}px)`
                        : `translateY(${shift()}px)`,
                      transition: s.isDragging() ? "none" : "transform 0.2s ease",
                      background: item.color,
                      border: s.isActiveDropzone()
                        ? "2px dashed #6366f1"
                        : "2px solid transparent",
                      "border-radius": "8px",
                      padding: "0.625rem 0.875rem",
                      "font-weight": "500",
                      "font-size": "0.9rem",
                      color: "#1e293b",
                      cursor: s.isDragging() ? "grabbing" : "grab",
                      "touch-action": "none",
                      "user-select": "none",
                      opacity: s.isDragging() ? 0.75 : 1,
                      "box-shadow": s.isDragging()
                        ? "0 8px 24px rgba(0,0,0,.12)"
                        : "0 1px 3px rgba(0,0,0,.06)",
                    }}
                  >
                    ⠿ {item.label}
                  </div>
                );
              }}
            </For>
          </div>

          <ButtonRow>
            <Button
              variant="secondary"
              style={{ width: "100%", "margin-top": "0.5rem" }}
              onClick={() => setItems(INITIAL_ITEMS)}
            >
              Reset order
            </Button>
          </ButtonRow>
        </div>
      </ctx.Provider>
    );
  },
});

// ── Story 4: createNativeDroppable ────────────────────────────────────────────

export const NativeFileDrop = meta.story({
  name: "createNativeDroppable — file drop",
  parameters: {
    docs: {
      description: {
        story:
          "`createNativeDroppable` tracks OS-level drag events (files, links, text) via HTML5 `DragEvent`. It solves the `dragenter`/`dragleave` child-element depth problem internally, so `isOver` transitions cleanly regardless of nested elements. Use as the drop-zone backend for `@solid-primitives/upload`.",
      },
    },
  },
  render: () => {
    const [files, setFiles] = createSignal<string[]>([]);

    const drop = createNativeDroppable({
      accept: e => (e.dataTransfer?.types ?? []).includes("Files"),
      onDrop: e => {
        const names = Array.from(e.dataTransfer?.files ?? []).map(f => f.name);
        setFiles(prev => [...names, ...prev].slice(0, 8));
      },
    });

    return (
      <Container width={340}>
        <div
          ref={drop.ref}
          style={{
            height: "140px",
            "border-radius": "12px",
            border: `2px dashed ${drop.isOver() ? "#6366f1" : "#cbd5e1"}`,
            background: drop.isOver() ? "#eef2ff" : "#f8fafc",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            "justify-content": "center",
            gap: "0.4rem",
            transition: "border-color 0.15s, background 0.15s",
            "user-select": "none",
          }}
        >
          <span style={{ "font-size": "1.75rem" }}>{drop.isOver() ? "⬇️" : "📁"}</span>
          <span
            style={{
              "font-size": "0.85rem",
              "font-family": "system-ui",
              color: drop.isOver() ? "#4f46e5" : "#94a3b8",
              "font-weight": drop.isOver() ? "600" : "400",
            }}
          >
            {drop.isOver() ? "Release to drop" : "Drag files here"}
          </span>
        </div>

        <Card>
          <BoolRow label="isOver" value={drop.isOver()} />
        </Card>

        <div
          style={{
            "border-radius": "8px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            "font-family": "system-ui",
          }}
        >
          <div
            style={{
              padding: "0.5rem 0.75rem",
              background: "#f1f5f9",
              "font-size": "0.75rem",
              "font-weight": "600",
              color: "#64748b",
              "text-transform": "uppercase",
              "letter-spacing": "0.05em",
            }}
          >
            Dropped files
          </div>
          <div style={{ padding: "0.25rem 0", "min-height": "40px" }}>
            <For
              each={files()}
              fallback={
                <p style={{ margin: "0.5rem 0.75rem", "font-size": "0.85rem", color: "#94a3b8" }}>
                  None yet
                </p>
              }
            >
              {name => (
                <div
                  style={{
                    padding: "0.35rem 0.75rem",
                    "font-size": "0.85rem",
                    color: "#1e293b",
                    "border-bottom": "1px solid #f1f5f9",
                  }}
                >
                  {name}
                </div>
              )}
            </For>
          </div>
        </div>

        <ButtonRow>
          <Button variant="secondary" style={{ width: "100%" }} onClick={() => setFiles([])}>
            Clear
          </Button>
        </ButtonRow>
      </Container>
    );
  },
});
