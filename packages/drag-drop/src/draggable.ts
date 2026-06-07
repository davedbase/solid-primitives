import { createEffect, createMemo, createSignal, flush } from "solid-js";
import { isServer } from "@solidjs/web";
import { access, INTERNAL_OPTIONS, noop } from "@solid-primitives/utils";
import { useDragContext } from "./context.js";
import { applyClass, applyStyle, removeClass, removeStyle } from "./dom.js";
import type { CreateDraggableOptions, DraggableReturn, MakeDraggableOptions, Transform } from "./types.js";

/**
 * Attaches pointer-based drag behaviour to an existing element.
 * Non-reactive — no Solid owner required. Returns a cleanup function.
 *
 * @example
 * ```ts
 * const cleanup = makeDraggable(el, {
 *   onStart: e => console.log("start", e.clientX),
 *   onMove: delta => el.style.transform = `translate(${delta.x}px,${delta.y}px)`,
 *   onEnd: () => el.style.transform = "",
 * });
 * ```
 */
export function makeDraggable<T = unknown>(
  el: HTMLElement,
  options: MakeDraggableOptions<T> = {},
): VoidFunction {
  if (isServer) return noop;

  let startX = 0;
  let startY = 0;

  const onPointerMove = (event: PointerEvent) => {
    const delta: Transform = { x: event.clientX - startX, y: event.clientY - startY };
    options.onMove?.(delta, event);
  };

  const onPointerUp = (event: PointerEvent) => {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    const delta: Transform = { x: event.clientX - startX, y: event.clientY - startY };
    options.onEnd?.(delta, event);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (options.disabled) return;
    if (event.button !== 0) return;
    event.preventDefault();
    startX = event.clientX;
    startY = event.clientY;
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    options.onStart?.(event);
  };

  el.addEventListener("pointerdown", onPointerDown);

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };
}

/**
 * Reactive draggable primitive. Attach to a JSX element via `ref={drag.ref}`.
 *
 * When used inside a `createDragContext` Provider, drag state is coordinated
 * with registered droppables. Without a Provider, `isDragging` and `transform`
 * still work in standalone mode.
 *
 * @example
 * ```tsx
 * const drag = createDraggable("card-1", { title: "My card" }, {
 *   class: "cursor-grab",
 *   draggingClass: "opacity-50 cursor-grabbing",
 * });
 * <div ref={drag.ref}>{drag.isDragging() ? "dragging…" : "drag me"}</div>
 * ```
 */
export function createDraggable<T = unknown>(
  id: string | number,
  data?: T,
  options: CreateDraggableOptions = {},
): DraggableReturn<T> {
  if (isServer) {
    return { ref: noop, isDragging: () => false, transform: () => null, id };
  }

  const ctx = useDragContext();
  const [elSignal, setElSignal] = createSignal<HTMLElement | undefined>(undefined, INTERNAL_OPTIONS);

  let isDragging: () => boolean;
  let currentTransform: () => Transform | null;

  if (ctx) {
    isDragging = createMemo(() => ctx.active()?.id === id);
    currentTransform = createMemo(() => (isDragging() ? ctx.transform() : null));
  } else {
    const [_isDragging, setIsDragging] = createSignal(false, INTERNAL_OPTIONS);
    const [_transform, setTransform] = createSignal<Transform | null>(null, INTERNAL_OPTIONS);
    isDragging = _isDragging;
    currentTransform = _transform;

    let startX = 0;
    let startY = 0;

    const onPointerMove = (event: PointerEvent) => {
      setTransform({ x: event.clientX - startX, y: event.clientY - startY });
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);
      setTransform(null);
    };

    createEffect(
      () => elSignal(),
      el => {
        if (!el) return;
        const onPointerDown = (event: PointerEvent) => {
          if (access(options.disabled)) return;
          if (event.button !== 0) return;
          event.preventDefault();
          startX = event.clientX;
          startY = event.clientY;
          setIsDragging(true);
          setTransform({ x: 0, y: 0 });
          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
        };
        el.addEventListener("pointerdown", onPointerDown);
        return () => {
          el.removeEventListener("pointerdown", onPointerDown);
          document.removeEventListener("pointermove", onPointerMove);
          document.removeEventListener("pointerup", onPointerUp);
        };
      },
    );
  }

  // Context mode: attach pointerdown + register
  if (ctx) {
    createEffect(
      () => elSignal(),
      el => {
        if (!el) return;
        ctx._registerDraggable(id, el, data as unknown);
        const onPointerDown = (event: PointerEvent) => {
          if (access(options.disabled)) return;
          if (event.button !== 0) return;
          event.preventDefault();
          ctx._startDrag(id, el, data as unknown, event);
        };
        el.addEventListener("pointerdown", onPointerDown);
        return () => {
          el.removeEventListener("pointerdown", onPointerDown);
          ctx._unregisterDraggable(id);
        };
      },
    );
  }

  // Reactive draggingStyle / draggingClass
  createEffect(
    () => ({ dragging: isDragging(), el: elSignal() }),
    ({ dragging, el }) => {
      if (!el) return;
      if (dragging) {
        applyStyle(el, options.draggingStyle);
        applyClass(el, options.draggingClass);
      } else {
        removeStyle(el, options.draggingStyle);
        removeClass(el, options.draggingClass);
      }
    },
  );

  const ref = (el: HTMLElement) => {
    setElSignal(() => el);
    applyStyle(el, options.style);
    applyClass(el, options.class);
    flush();
  };

  return { ref, isDragging, transform: currentTransform, id };
}
