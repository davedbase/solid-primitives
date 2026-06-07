import { type Accessor, type Setter } from "solid-js";

/**
 * @property `source` - DOMString containing a URL representing the object given in the parameter
 */
export type UploadFile = {
  source: string;
  name: string;
  size: number;
  file: File;
};

/**
 * @property `accept` - Comma-separated list of one or more file types, or unique file type specifiers
 * @link `accept` - https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
 */
export type FilePickerOptions = {
  accept?: string;
  multiple?: boolean;
};

export type UserCallback = (files: UploadFile[]) => void | Promise<void>;

export interface FilePicker {
  files: Accessor<UploadFile[]>;
  error: Accessor<unknown>;
  isLoading: Accessor<boolean>;
  selectFiles: (callback?: (files: UploadFile[]) => void | Promise<void>) => void;
  removeFile: (fileName: string) => void;
  clearFiles: () => void;
}

export type FileUploaderDirective = {
  userCallback: (files: UploadFile[]) => void | Promise<void>;
  setFiles: Setter<UploadFile[]>;
  onError?: (error: unknown) => void;
};

export interface Dropzone<T extends HTMLElement = HTMLElement> {
  ref: (el: T) => void;
  files: Accessor<UploadFile[]>;
  error: Accessor<unknown>;
  isLoading: Accessor<boolean>;
  isDragging: Accessor<boolean>;
  removeFile: (fileName: string) => void;
  clearFiles: () => void;
}

export interface DropzoneOptions {
  onDrop?: UserCallback;
  onDragEnter?: UserCallback;
  onDragLeave?: UserCallback;
  onDragOver?: UserCallback;
}

export type UploadStatus = "idle" | "uploading" | "success" | "error" | "aborted";

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

/**
 * Transport function called once per file. Receives the file, a progress callback, and an AbortSignal.
 * Must return a Promise that resolves with the server response or rejects on failure.
 * Reject with a DOMException("...", "AbortError") when the signal fires so status transitions to "aborted".
 */
export type SendFunction = (
  file: UploadFile,
  onProgress: (progress: UploadProgress) => void,
  signal: AbortSignal,
) => Promise<unknown>;

/** Reactive state for a single file within a `createFileUpload` batch. */
export type FileUploadEntry = {
  file: UploadFile;
  progress: UploadProgress;
  status: UploadStatus;
  error: unknown;
  response: unknown;
};

export interface FileUploader {
  /** Send files. Each file gets its own request. Resolves when all files settle. */
  upload: (files: UploadFile[]) => Promise<unknown[]>;
  /** Store array — access entries directly in JSX for fine-grained reactivity. */
  files: readonly FileUploadEntry[];
  /** Aggregate progress across all files. */
  progress: Accessor<UploadProgress>;
  /** Aggregate status: uploading > error > aborted > success > idle. */
  status: Accessor<UploadStatus>;
  /** Cancel all in-flight uploads. */
  abort: () => void;
  /** Remove a single file entry by name; aborts all in-flight uploads. */
  removeFile: (fileName: string) => void;
  /** Remove all file entries and abort all in-flight uploads. */
  clearFiles: () => void;
}
