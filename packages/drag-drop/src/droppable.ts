import { createEffect, createMemo, createSignal, flush } from "solid-js";
import { isServer } from "@solidjs/web";
import { access, INTERNAL_OPTIONS, noop } from "@solid-primitives/utils";
import { useDragContext } from "./context.js";
import { applyClass, applyStyle, removeClass, removeStyle } from "./dom.js";
import type {
  CreateDroppableOptions,
  CreateNativeDroppableOptions,
  DragItem,
  DroppableReturn,
  MakeDroppableOptions,
  MakeNativeDroppableOptions,
  NativeDroppableReturn,
} from "./types.js";

/**
 * Attaches pointer-based drop-zone behaviour to an existing element.
 * Non-reactive — no Solid owner required. Returns a cleanup function.
 *
 * Note: coordination with `makeDraggable` requires that the dragging element
 * has `pointer-events: none` applied during the drag, otherwise
 * `pointerenter`/`pointerleave` will not reach this element.
 *
 * @example
 * ```ts
 * const cleanup = makeDroppable(el, {
 *   onEnter: () => el.classList.add("over"),
 *   onLeave: () => el.classList.remove("over"),
 *   onDrop: () => acceptDrop(),
 * });
 * ```
 */
export function makeDroppable(el: HTMLElement, options: MakeDroppableOptions = {}): VoidFunction {
  if (isServer) return noop;

  const onPointerEnter = (event: PointerEvent) => {
    if (options.disabled) return;
    options.onEnter?.(event);
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (options.disabled) return;
    options.onLeave?.(event);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (options.disabled) return;
    options.onDrop?.(event);
  };

  el.addEventListener("pointerenter", onPointerEnter);
  el.addEventListener("pointerleave", onPointerLeave);
  el.addEventListener("pointerup", onPointerUp);

  return () => {
    el.removeEventListener("pointerenter", onPointerEnter);
    el.removeEventListener("pointerleave", onPointerLeave);
    el.removeEventListener("pointerup", onPointerUp);
  };
}

/**
 * Reactive droppable primitive. Attach to a JSX element via `ref={drop.ref}`.
 *
 * Requires a `createDragContext` Provider ancestor to coordinate with draggables.
 * Without a Provider, `isOver` and `active` remain at their initial values.
 *
 * @example
 * ```tsx
 * const drop = createDroppable("zone-1", myData, {
 *   class: "border-2 border-dashed border-transparent",
 *   overClass: "border-indigo-500 bg-indigo-50",
 * });
 * <div ref={drop.ref}>{drop.isOver() ? "release to drop" : "drop here"}</div>
 * ```
 */
export function createDroppable<T = unknown>(
  id: string | number,
  data?: T,
  options: CreateDroppableOptions = {},
): DroppableReturn<T> {
  if (isServer) {
    return { ref: noop, isOver: () => false, active: () => null, id };
  }

  const ctx = useDragContext();
  const [elSignal, setElSignal] = createSignal<HTMLElement | undefined>(undefined, INTERNAL_OPTIONS);

  const isOver: () => boolean = ctx
    ? createMemo(() => ctx.over()?.id === id)
    : () => false;

  const active: () => DragItem | null = ctx
    ? createMemo((): DragItem | null => (isOver() ? ctx.active() : null))
    : () => null;

  // Single effect tracks both element and disabled — avoids stale element reads.
  if (ctx) {
    createEffect(
      () => ({ el: elSignal(), disabled: access(options.disabled) }),
      ({ el, disabled }) => {
        if (!el || disabled) {
          ctx._unregisterDroppable(id);
          return;
        }
        ctx._registerDroppable(id, el, data, options.accept);
        return () => ctx._unregisterDroppable(id);
      },
    );
  }

  // Reactive overStyle / overClass
  createEffect(
    () => ({ over: isOver(), el: elSignal() }),
    ({ over, el }) => {
      if (!el) return;
      if (over) {
        applyStyle(el, options.overStyle);
        applyClass(el, options.overClass);
      } else {
        removeStyle(el, options.overStyle);
        removeClass(el, options.overClass);
      }
    },
  );

  const ref = (el: HTMLElement) => {
    setElSignal(() => el);
    applyStyle(el, options.style);
    applyClass(el, options.class);
    flush();
  };

  return { ref, isOver, active, id };
}

/**
 * Attaches native HTML5 drag-event listeners to an existing element.
 * Designed for OS file drops and `draggable="true"` element drops.
 * Non-reactive — no Solid owner required. Returns a cleanup function.
 *
 * Handles the dragenter/dragleave child-element depth problem internally
 * so `onEnter` / `onLeave` fire exactly once per zone entry/exit.
 *
 * @example
 * ```ts
 * const cleanup = makeNativeDroppable(el, {
 *   accept: e => e.dataTransfer?.types.includes("Files") ?? false,
 *   onEnter: () => el.classList.add("over"),
 *   onLeave: () => el.classList.remove("over"),
 *   onDrop: e => handleFiles(e.dataTransfer!.files),
 * });
 * ```
 */
export function makeNativeDroppable(
  el: HTMLElement,
  options: MakeNativeDroppableOptions = {},
): VoidFunction {
  if (isServer) return noop;

  // Depth counter handles dragenter/dragleave from child elements
  let depth = 0;

  const onDragEnter = (event: DragEvent) => {
    if (options.disabled) return;
    if (options.accept && !options.accept(event)) {
      event.dataTransfer && (event.dataTransfer.dropEffect = "none");
      return;
    }
    depth++;
    if (depth === 1) options.onEnter?.(event);
  };

  const onDragLeave = (event: DragEvent) => {
    if (options.disabled) return;
    depth--;
    if (depth === 0) options.onLeave?.(event);
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (options.disabled) return;
    if (options.accept && !options.accept(event)) {
      event.dataTransfer && (event.dataTransfer.dropEffect = "none");
      return;
    }
    options.onOver?.(event);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    depth = 0;
    if (options.disabled) return;
    options.onDrop?.(event);
  };

  el.addEventListener("dragenter", onDragEnter);
  el.addEventListener("dragleave", onDragLeave);
  el.addEventListener("dragover", onDragOver);
  el.addEventListener("drop", onDrop);

  return () => {
    el.removeEventListener("dragenter", onDragEnter);
    el.removeEventListener("dragleave", onDragLeave);
    el.removeEventListener("dragover", onDragOver);
    el.removeEventListener("drop", onDrop);
  };
}

/**
 * Reactive native drop-zone primitive. Attach to a JSX element via `ref={drop.ref}`.
 * Use this as the foundation for file-upload drop zones (see `createDropzone` in
 * the upload package) or any element that accepts OS / browser-native drag payloads.
 *
 * @example
 * ```tsx
 * const drop = createNativeDroppable({
 *   accept: e => e.dataTransfer?.types.includes("Files") ?? false,
 *   onDrop: e => handleFiles(e.dataTransfer!.files),
 * });
 * <div ref={drop.ref} class={drop.isOver() ? "ring-2 ring-indigo-500" : ""}>
 *   Drop files here
 * </div>
 * ```
 */
export function createNativeDroppable(
  options: CreateNativeDroppableOptions = {},
): NativeDroppableReturn {
  if (isServer) {
    return { ref: noop, isOver: () => false };
  }

  const [elSignal, setElSignal] = createSignal<HTMLElement | undefined>(undefined, INTERNAL_OPTIONS);
  const [isOver, setIsOver] = createSignal(false, INTERNAL_OPTIONS);

  createEffect(
    () => elSignal(),
    el => {
      if (!el) return;

      let depth = 0;

      const onDragEnter = (event: DragEvent) => {
        if (access(options.disabled)) return;
        if (options.accept && !options.accept(event)) {
          event.dataTransfer && (event.dataTransfer.dropEffect = "none");
          return;
        }
        depth++;
        if (depth === 1) setIsOver(true);
        options.onEnter?.(event);
      };

      const onDragLeave = (event: DragEvent) => {
        if (access(options.disabled)) return;
        depth--;
        if (depth === 0) {
          setIsOver(false);
          options.onLeave?.(event);
        }
      };

      const onDragOver = (event: DragEvent) => {
        event.preventDefault();
        if (access(options.disabled)) return;
        if (options.accept && !options.accept(event)) {
          event.dataTransfer && (event.dataTransfer.dropEffect = "none");
          return;
        }
        options.onOver?.(event);
      };

      const onDrop = (event: DragEvent) => {
        event.preventDefault();
        depth = 0;
        setIsOver(false);
        if (access(options.disabled)) return;
        options.onDrop?.(event);
      };

      el.addEventListener("dragenter", onDragEnter);
      el.addEventListener("dragleave", onDragLeave);
      el.addEventListener("dragover", onDragOver);
      el.addEventListener("drop", onDrop);

      return () => {
        el.removeEventListener("dragenter", onDragEnter);
        el.removeEventListener("dragleave", onDragLeave);
        el.removeEventListener("dragover", onDragOver);
        el.removeEventListener("drop", onDrop);
      };
    },
  );

  const ref = (el: HTMLElement) => {
    setElSignal(() => el);
    flush();
  };

  return { ref, isOver };
}
