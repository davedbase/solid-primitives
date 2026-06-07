import { createSignal } from "solid-js";
import { isServer } from "@solidjs/web";
import { createNativeDroppable } from "@solid-primitives/drag-drop";
import { transformFiles } from "./helpers.js";
import type { UploadFile, Dropzone, DropzoneOptions } from "./types.js";

/**
 * Reactive drop zone for receiving files dragged from the OS or browser.
 * Composes `createNativeDroppable` from `@solid-primitives/drag-drop` for the
 * drag-state tracking and attaches file-specific state (`files`, `isLoading`,
 * `error`, `removeFile`, `clearFiles`) on top.
 *
 * @returns `ref` — attach to any element via `ref={ref}`
 * @returns `files` — dropped files as `UploadFile[]`
 * @returns `isDragging` — true while a drag is over the zone
 * @returns `isLoading` — true while the async `onDrop` callback is pending
 * @returns `error` — error thrown by the last `onDrop` callback
 * @returns `removeFile` — remove a single file by name
 * @returns `clearFiles` — clear all files
 *
 * @example
 * ```tsx
 * const { ref, files, isDragging } = createDropzone({
 *   onDrop: async files => { await upload(files); },
 * });
 * <div ref={ref} class={isDragging() ? "highlight" : ""}>Drop files here</div>
 * ```
 */
function createDropzone<T extends HTMLElement = HTMLElement>(
  options?: DropzoneOptions,
): Dropzone<T> {
  if (isServer) {
    return {
      ref: () => {},
      files: () => [],
      error: () => null,
      isLoading: () => false,
      isDragging: () => false,
      removeFile: () => {},
      clearFiles: () => {},
    };
  }

  const [files, setFiles] = createSignal<UploadFile[]>([]);
  const [error, setError] = createSignal<unknown>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  const drop = createNativeDroppable({
    onEnter: e =>
      options?.onDragEnter?.(transformFiles(e.dataTransfer?.files ?? null)),
    onLeave: e =>
      options?.onDragLeave?.(transformFiles(e.dataTransfer?.files ?? null)),
    onOver: e =>
      options?.onDragOver?.(transformFiles(e.dataTransfer?.files ?? null)),
    onDrop: e => {
      const parsedFiles = transformFiles(e.dataTransfer?.files ?? null);
      setFiles(parsedFiles);
      setError(null);
      setIsLoading(true);
      void (async () => {
        try {
          await options?.onDrop?.(parsedFiles);
        } catch (err) {
          setError(err);
        } finally {
          setIsLoading(false);
        }
      })();
    },
  });

  return {
    ref: drop.ref as (el: T) => void,
    files,
    error,
    isLoading,
    isDragging: drop.isOver,
    removeFile: (fileName: string) => setFiles(prev => prev.filter(f => f.name !== fileName)),
    clearFiles: () => setFiles([]),
  };
}

/**
 * Ref callback factory that merges the drop zone state into the ref function
 * itself. Use as both a `ref` and a reactive state object.
 *
 * @example
 * ```tsx
 * const dz = dropzone({ onDrop: handleFiles });
 * <div ref={dz} class={dz.isDragging() ? "dragging" : ""} />
 * ```
 */
function dropzone<T extends HTMLElement = HTMLElement>(options?: DropzoneOptions) {
  const { ref, ...state } = createDropzone<T>(options);
  return Object.assign(ref, state);
}

export { createDropzone, dropzone };
