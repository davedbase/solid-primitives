<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Upload" alt="Solid Primitives Upload">
</p>

# @solid-primitives/upload

[![size](https://img.shields.io/badge/size-1.03_kB-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/upload)
[![size](https://img.shields.io/npm/v/@solid-primitives/upload?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/upload)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for file picking, drag-and-drop zones, and XHR uploads with progress tracking.

- [`createFilePicker`](#createfilepicker) — opens the OS file-picker and exposes selected files reactively
- [`createFileUploader`](#createfileuploader) — uploads files with reactive progress, status, and error; transport is passed in explicitly
- [`fileSender`](#filesender) — XHR transport factory for `createFileUploader` (tree-shakeable)
- [`fileUploader`](#fileuploader) — ref callback factory for `<input type="file">` elements
- [`createDropzone`](#createdropzone) — reactive drag-and-drop zone with full drag-event callbacks
- [`dropzone`](#dropzone) — ref callback factory variant of `createDropzone`

## Installation

```bash
npm install @solid-primitives/upload
# or
yarn add @solid-primitives/upload
# or
pnpm add @solid-primitives/upload
```

## `createFilePicker`

Opens the OS file-picker dialog when called and exposes the selected files, loading state, and any callback error as reactive signals.

```ts
import { createFilePicker } from "@solid-primitives/upload";

// Single file
const { files, isLoading, error, selectFiles } = createFilePicker();

// Multiple files with MIME filter
const { files, isLoading, error, selectFiles } = createFilePicker({
  multiple: true,
  accept: "image/*",
});

// Open the picker and do something with the selection
selectFiles(async files => {
  await uploadToServer(files);
});
```

**Returned object:**

| Name          | Type                                | Description                                                      |
| ------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `files`       | `Accessor<UploadFile[]>`            | Reactive list of selected files; updated on every selection      |
| `error`       | `Accessor<unknown>`                 | Error thrown by the last `selectFiles` callback; `null` if none  |
| `isLoading`   | `Accessor<boolean>`                 | `true` while the `selectFiles` callback is pending               |
| `selectFiles` | `(callback?: UserCallback) => void` | Opens the file-picker and runs the optional callback on change   |
| `removeFile`  | `(fileName: string) => void`        | Removes a single file from the list by name                      |
| `clearFiles`  | `() => void`                        | Clears all selected files                                        |

> **Note:** `removeFile` matches by file name. If the list contains duplicate file names, only the first match is removed.

**Options:**

| Option     | Type      | Default | Description                                                                                               |
| ---------- | --------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `accept`   | `string`  | `""`    | Comma-separated list of accepted file types (passed to `<input accept>`). E.g. `"image/*"`, `".pdf,.doc"` |
| `multiple` | `boolean` | `false` | Allow selecting more than one file at once                                                                |

**Usage example — combined picker + uploader:**

```tsx
import { createFilePicker, createFileUploader, fileSender } from "@solid-primitives/upload";

const { selectFiles } = createFilePicker({ multiple: true, accept: "image/*" });
const { upload, files, progress, status } = createFileUploader(fileSender("/api/upload"));

<button onClick={() => selectFiles(fs => upload(fs))} disabled={status() === "uploading"}>
  Select & upload
</button>

<Show when={status() === "uploading"}>
  <progress value={progress().percentage} max={100} />
  <span>{progress().percentage}%</span>
</Show>

<For each={files}>{f =>
  <div>
    {f.file.name}
    <Show when={f.status === "error"}>
      <span> — failed: {String(f.error)}</span>
    </Show>
  </div>
}</For>
```

## `createFileUploader`

Uploads files with reactive per-file and aggregate progress, status, and error tracking. Each file in a batch gets its own parallel request. The transport is passed in explicitly — use the bundled `fileSender` factory for XHR, or supply your own. Keeping them separate lets bundlers tree-shake `fileSender` when it is not needed.

```ts
import { createFileUploader, fileSender } from "@solid-primitives/upload";

const { upload, files, progress, status, abort } = createFileUploader(fileSender("/api/upload"));

// upload() dispatches one request per file (in parallel); resolves when all settle
const results = await upload(myFiles);
```

**Returned object:**

| Name       | Type                                         | Description                                                       |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `upload`   | `(files: UploadFile[]) => Promise<unknown[]>` | Send files in parallel; resolves when all settle                  |
| `files`    | `readonly FileUploadEntry[]`                 | Store array — per-file progress, status, error, and response      |
| `progress` | `Accessor<UploadProgress>`                   | Aggregate `{ loaded, total, percentage }` across all files        |
| `status`   | `Accessor<UploadStatus>`                     | Aggregate status: `uploading > error > aborted > success > idle`  |
| `abort`      | `() => void`                                 | Cancel all in-flight uploads                                      |
| `removeFile` | `(fileName: string) => void`                 | Remove one entry by name; aborts all in-flight uploads            |
| `clearFiles` | `() => void`                                 | Remove all entries; aborts all in-flight uploads                  |

> **Note:** `removeFile` matches by `file.name`. If a batch contains duplicate file names, only the first match is removed. Avoid batching files with duplicate names when using `removeFile`.

Each entry in `files` has the shape:

```ts
type FileUploadEntry = {
  file: UploadFile;
  progress: UploadProgress; // { loaded, total, percentage }
  status: UploadStatus;     // "idle" | "uploading" | "success" | "error" | "aborted"
  error: unknown;           // error from a failed upload; null otherwise
  response: unknown;        // parsed server response on success; null otherwise
};
```

Read `files[i]` directly in JSX for fine-grained per-file reactivity — only the row that changed re-renders:

```tsx
<For each={files}>{f =>
  <div>
    {f.file.name} — {f.progress.percentage}%
    <Show when={f.status === "error"}>
      <span>Error: {String(f.error)}</span>
    </Show>
  </div>
}</For>
```

**Calling `upload` again while one is in-flight cancels the previous upload** and resets all per-file state. Use `abort()` to cancel without starting a new one.

## `fileSender`

Factory that creates a `SendFunction` backed by XHR. Imported separately so it can be tree-shaken when unused.

```ts
import { fileSender } from "@solid-primitives/upload";

// Basic
createFileUploader(fileSender("/api/upload"));

// With options
createFileUploader(fileSender("/api/upload", { fieldName: "attachment", headers: { "X-Auth": token } }));
```

**Options:**

| Option      | Type                     | Default  | Description                                                                           |
| ----------- | ------------------------ | -------- | ------------------------------------------------------------------------------------- |
| `fieldName` | `string`                 | `"file"` | FormData field name used for each file                                                |
| `headers`   | `Record<string, string>` | `{}`     | Additional request headers (do not set `Content-Type`; the browser sets it for FormData) |

**Custom `SendFunction`:**

Provide your own transport — fetch, WebSocket, a test double, etc. The function is called once per file and receives the file, a progress callback, and an `AbortSignal`. It must return a `Promise` resolving with the server response or rejecting on failure. Reject with `new DOMException("...", "AbortError")` when the signal fires so that file's `status` transitions to `"aborted"`.

```ts
const { upload, progress, status } = createFileUploader(async (file, onProgress, signal) => {
  const body = new FormData();
  body.append("file", file.file, file.name);
  const res = await fetch("/api/upload", { method: "POST", body, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
});
```

## `fileUploader`

A ref callback factory for wiring an existing `<input type="file">` element into your own reactive state. Use this when you want full control over the input element's markup (e.g. for custom styling).

```tsx
import { fileUploader } from "@solid-primitives/upload";
import { createSignal } from "solid-js";
import type { UploadFile } from "@solid-primitives/upload";

const [files, setFiles] = createSignal<UploadFile[]>([]);
const [uploadError, setUploadError] = createSignal<unknown>(null);

<input
  type="file"
  multiple
  accept="image/*"
  ref={fileUploader({
    userCallback: async fs => {
      await uploadToServer(fs);
    },
    setFiles,
    onError: err => setUploadError(err),
  })}
/>;
```

If `onError` is omitted, a rejection from `userCallback` propagates as an unhandled promise rejection.

**Options:**

| Option         | Type                       | Description                                               |
| -------------- | -------------------------- | --------------------------------------------------------- |
| `userCallback` | `UserCallback`             | Called with the parsed files on every `change` event      |
| `setFiles`     | `Setter<UploadFile[]>`     | Receives the parsed `UploadFile[]` on every change        |
| `onError`      | `(error: unknown) => void` | Called when `userCallback` throws; defaults to rethrowing |

## `createDropzone`

A reactive drag-and-drop zone. Attach it to any element via the `ref` callback and respond to drag lifecycle events. Implemented on top of `createNativeDroppable` from `@solid-primitives/drag-drop` — the depth-counter logic, `isOver` tracking, and element cleanup are all handled by the underlying primitive.

```tsx
import { createDropzone, createFileUploader, fileSender } from "@solid-primitives/upload";

const { upload, progress, status } = createFileUploader(fileSender("/api/upload"));
const { ref, files, isDragging, error } = createDropzone({
  onDrop: files => upload(files),
});

<div
  ref={ref}
  style={{
    background: isDragging() ? "lightblue" : "lightgray",
    padding: "2rem",
    border: "2px dashed #999",
  }}
>
  <Show when={status() === "uploading"} fallback="Drop files here">
    Uploading… {progress().percentage}%
  </Show>
  <Show when={error()}>
    <p>Error: {String(error())}</p>
  </Show>
  <For each={files()}>{file => <p>{file.name}</p>}</For>
</div>
```

**Returned object:**

| Name         | Type                         | Description                                                      |
| ------------ | ---------------------------- | ---------------------------------------------------------------- |
| `ref`        | `(el: T) => void`            | Ref callback — pass to the `ref` prop of the drop target element |
| `files`      | `Accessor<UploadFile[]>`     | Reactive list of the most recently dropped files                 |
| `error`      | `Accessor<unknown>`          | Error thrown by the last `onDrop` callback; `null` if none       |
| `isLoading`  | `Accessor<boolean>`          | `true` while the `onDrop` callback is pending                    |
| `isDragging` | `Accessor<boolean>`          | `true` while a drag is active over the element                   |
| `removeFile` | `(fileName: string) => void` | Removes a single file from the list by name                      |
| `clearFiles` | `() => void`                 | Clears all dropped files                                         |

> **Note:** `removeFile` matches by file name. If the list contains duplicate file names, only the first match is removed.

**Options (all optional):**

| Callback      | Fires when…                                              |
| ------------- | -------------------------------------------------------- |
| `onDrop`      | Files are dropped; `isLoading` is `true` while it awaits |
| `onDragEnter` | A dragged item enters the element                        |
| `onDragLeave` | A dragged item leaves the element                        |
| `onDragOver`  | An item is dragged continuously over the element         |

All callbacks have signature `(files: UploadFile[]) => void | Promise<void>`. `isLoading` tracks only the `onDrop` callback — drag-movement callbacks are fire-and-forget.

## `dropzone`

A ref callback factory variant of `createDropzone`. Returns a single value that is both the ref callback and the reactive state object — use it directly as a `ref` while reading `.files`, `.isDragging`, etc. from the same reference. Mirrors the `fileUploader` pattern.

```tsx
import { dropzone, createFileUploader, fileSender } from "@solid-primitives/upload";

const { upload, progress, status } = createFileUploader(fileSender("/api/upload"));
const dz = dropzone({ onDrop: files => upload(files) });

<div
  ref={dz}
  style={{
    background: dz.isDragging() ? "lightblue" : "lightgray",
    padding: "2rem",
    border: "2px dashed #999",
  }}
>
  <Show when={status() === "uploading"} fallback="Drop files here">
    Uploading… {progress().percentage}%
  </Show>
  <For each={dz.files()}>{file => <p>{file.name}</p>}</For>
</div>
```

The returned value is a function (the ref callback) with all `createDropzone` state properties attached directly to it — `files`, `error`, `isLoading`, `isDragging`, `removeFile`, and `clearFiles`. Accepts the same `DropzoneOptions` as `createDropzone`.

## Types

```ts
type UploadFile = {
  source: string; // blob URL from URL.createObjectURL
  name: string;
  size: number;
  file: File;
};

type UploadStatus = "idle" | "uploading" | "success" | "error" | "aborted";

type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number; // 0–100
};

type SendFunction = (
  file: UploadFile,
  onProgress: (progress: UploadProgress) => void,
  signal: AbortSignal,
) => Promise<unknown>;

type FileUploadEntry = {
  file: UploadFile;
  progress: UploadProgress;
  status: UploadStatus;
  error: unknown;
  response: unknown;
};

type UserCallback = (files: UploadFile[]) => void | Promise<void>;

type FilePickerOptions = {
  accept?: string;
  multiple?: boolean;
};

type FileSenderOptions = {
  fieldName?: string;
  headers?: Record<string, string>;
};

type FileUploaderDirective = {
  userCallback: UserCallback;
  setFiles: Setter<UploadFile[]>;
  onError?: (error: unknown) => void;
};
```

## SSR

All primitives are SSR-safe. On the server they return no-op stubs so components render without errors.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
