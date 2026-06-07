import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { createRoot, flush } from "solid-js";
import { createFilePicker, createDropzone, dropzone, createFileUploader, fileSender, fileUploader } from "../src/index.js";
import { transformFiles } from "../src/helpers.js";
import type { UploadFile } from "../src/types.js";

// ── jsdom polyfills ───────────────────────────────────────────────────────────

beforeAll(() => {
  // jsdom does not implement createObjectURL
  vi.stubGlobal("URL", { createObjectURL: (f: File) => `blob:${f.name}` });
});

// Creates a minimal FileList-alike without DataTransfer (not in jsdom)
function makeFileList(...files: File[]): FileList {
  const fl: Record<string, unknown> = {};
  files.forEach((f, i) => (fl[i] = f));
  fl.length = files.length;
  return fl as unknown as FileList;
}

function makeFile(name = "test.png", size = 64, type = "image/png"): File {
  return new File(["x".repeat(size)], name, { type });
}

// Dispatch a change event with the given files on an input element
function dispatchChange(input: HTMLInputElement, files: FileList) {
  Object.defineProperty(input, "files", { value: files, configurable: true });
  const event = new Event("change");
  Object.defineProperty(event, "currentTarget", { value: input, configurable: true });
  input.dispatchEvent(event);
}

// ── transformFiles ────────────────────────────────────────────────────────────

describe("transformFiles", () => {
  it("returns empty array for null input", () => {
    expect(transformFiles(null)).toEqual([]);
  });

  it("converts a FileList to UploadFile array", () => {
    const file = makeFile("hello.png", 512);
    const result = transformFiles(makeFileList(file));
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("hello.png");
    expect(result[0]!.size).toBe(512);
    expect(result[0]!.file).toBe(file);
    expect(typeof result[0]!.source).toBe("string");
  });

  it("converts multiple files", () => {
    const result = transformFiles(makeFileList(makeFile("a.png"), makeFile("b.jpg")));
    expect(result).toHaveLength(2);
    expect(result.map(f => f.name)).toEqual(["a.png", "b.jpg"]);
  });
});

// ── createFilePicker ────────────────────────────────────────────────────────

describe("createFilePicker", () => {
  it("initialises with empty file list, no error, and isLoading=false", () => {
    const { files, error, isLoading, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));
    expect(files()).toEqual([]);
    expect(error()).toBeNull();
    expect(isLoading()).toBe(false);
    dispose();
  });

  it("initialises with empty file list (multiple mode)", () => {
    const { files, dispose } = createRoot(dispose => ({
      ...createFilePicker({ multiple: true }),
      dispose,
    }));
    expect(files()).toEqual([]);
    dispose();
  });

  it("removeFile is a no-op on an empty list", () => {
    const { files, removeFile, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));
    removeFile("nonexistent.png");
    expect(files()).toEqual([]);
    dispose();
  });

  it("clearFiles empties the list", () => {
    const { files, clearFiles, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));
    clearFiles();
    expect(files()).toEqual([]);
    dispose();
  });

  it("selectFiles triggers a file input click", () => {
    const { selectFiles, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));

    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "input") vi.spyOn(el as HTMLInputElement, "click").mockImplementation(clickSpy);
      return el;
    });

    selectFiles(() => {});
    expect(clickSpy).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
    dispose();
  });

  it("error() is null when callback succeeds", async () => {
    const { error, selectFiles, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));

    const origCreate = document.createElement.bind(document);
    let createdInput: HTMLInputElement | undefined;
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "input") {
        createdInput = el as HTMLInputElement;
        vi.spyOn(createdInput, "click").mockImplementation(() => {
          dispatchChange(createdInput!, makeFileList(makeFile()));
        });
      }
      return el;
    });

    selectFiles(async () => {
      /* success */
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(error()).toBeNull();
    vi.restoreAllMocks();
    dispose();
  });

  it("isLoading is true while callback is pending, false after it resolves", async () => {
    let resolve!: () => void;
    const blocker = new Promise<void>(r => {
      resolve = r;
    });

    const { isLoading, selectFiles, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));

    const origCreate = document.createElement.bind(document);
    let createdInput: HTMLInputElement | undefined;
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "input") {
        createdInput = el as HTMLInputElement;
        vi.spyOn(createdInput, "click").mockImplementation(() => {
          dispatchChange(createdInput!, makeFileList(makeFile()));
        });
      }
      return el;
    });

    selectFiles(() => blocker);
    await Promise.resolve(); // flush setIsLoading(true) from onChange sync section

    expect(isLoading()).toBe(true);

    resolve();
    await blocker;
    await Promise.resolve(); // flush setIsLoading(false) from finally

    expect(isLoading()).toBe(false);
    vi.restoreAllMocks();
    dispose();
  });

  it("isLoading is false after callback throws", async () => {
    const { isLoading, selectFiles, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));

    const origCreate = document.createElement.bind(document);
    let createdInput: HTMLInputElement | undefined;
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "input") {
        createdInput = el as HTMLInputElement;
        vi.spyOn(createdInput, "click").mockImplementation(() => {
          dispatchChange(createdInput!, makeFileList(makeFile()));
        });
      }
      return el;
    });

    selectFiles(async () => {
      throw new Error("oops");
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(isLoading()).toBe(false);
    vi.restoreAllMocks();
    dispose();
  });

  it("error() captures a thrown callback error", async () => {
    const boom = new Error("upload failed");
    const { error, selectFiles, dispose } = createRoot(dispose => ({
      ...createFilePicker(),
      dispose,
    }));

    const origCreate = document.createElement.bind(document);
    let createdInput: HTMLInputElement | undefined;
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "input") {
        createdInput = el as HTMLInputElement;
        vi.spyOn(createdInput, "click").mockImplementation(() => {
          dispatchChange(createdInput!, makeFileList(makeFile()));
        });
      }
      return el;
    });

    selectFiles(async () => {
      throw boom;
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(error()).toBe(boom);
    vi.restoreAllMocks();
    dispose();
  });
});

// ── createDropzone ────────────────────────────────────────────────────────────

describe("createDropzone", () => {
  it("initialises with empty files, no error, isLoading=false, and isDragging=false", () => {
    const { files, error, isLoading, isDragging, dispose } = createRoot(dispose => ({
      ...createDropzone(),
      dispose,
    }));
    expect(files()).toEqual([]);
    expect(error()).toBeNull();
    expect(isLoading()).toBe(false);
    expect(isDragging()).toBe(false);
    dispose();
  });

  it("exposes ref, removeFile, clearFiles", () => {
    const { ref, removeFile, clearFiles, dispose } = createRoot(dispose => ({
      ...createDropzone(),
      dispose,
    }));
    expect(typeof ref).toBe("function");
    expect(typeof removeFile).toBe("function");
    expect(typeof clearFiles).toBe("function");
    dispose();
  });

  it("clearFiles empties the list", () => {
    const { files, clearFiles, dispose } = createRoot(dispose => ({
      ...createDropzone(),
      dispose,
    }));
    clearFiles();
    expect(files()).toEqual([]);
    dispose();
  });

  it("accepts DropzoneOptions callbacks without throwing", () => {
    expect(() => {
      const dispose = createRoot(dispose => {
        createDropzone({
          onDrop: vi.fn(),
          onDragEnter: vi.fn(),
          onDragLeave: vi.fn(),
          onDragOver: vi.fn(),
        });
        return dispose;
      });
      dispose();
    }).not.toThrow();
  });

  it("isLoading is true while onDrop callback is pending, false after it resolves", async () => {
    let resolve!: () => void;
    const blocker = new Promise<void>(r => { resolve = r; });

    let getIsLoading!: () => boolean;
    const { ref, dispose } = createRoot(dispose => {
      const dz = createDropzone({ onDrop: () => blocker });
      getIsLoading = dz.isLoading;
      return { ...dz, dispose };
    });

    const div = document.createElement("div");
    ref(div);

    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { files: makeFileList(makeFile()) },
      configurable: true,
    });
    div.dispatchEvent(dropEvent);
    await Promise.resolve();

    expect(getIsLoading()).toBe(true);

    resolve();
    await blocker;
    await Promise.resolve();

    expect(getIsLoading()).toBe(false);
    dispose();
  });

  it("isLoading is false after onDrop throws", async () => {
    const { isLoading, ref, dispose } = createRoot(dispose => ({
      ...createDropzone({ onDrop: async () => { throw new Error("oops"); } }),
      dispose,
    }));

    const div = document.createElement("div");
    ref(div);

    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { files: makeFileList(makeFile()) },
      configurable: true,
    });
    div.dispatchEvent(dropEvent);
    await Promise.resolve();
    await Promise.resolve();

    expect(isLoading()).toBe(false);
    dispose();
  });

  it("re-assigning ref detaches listeners from the previous element", () => {
    const { ref, isDragging, dispose } = createRoot(dispose => ({
      ...createDropzone(),
      dispose,
    }));

    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    const removeSpy = vi.spyOn(el1, "removeEventListener");

    ref(el1);
    el1.dispatchEvent(new Event("dragenter"));
    flush();
    expect(isDragging()).toBe(true);
    el1.dispatchEvent(new Event("dragleave"));
    flush();
    expect(isDragging()).toBe(false);

    ref(el2);
    expect(removeSpy).toHaveBeenCalled();

    el1.dispatchEvent(new Event("dragenter"));
    flush();
    expect(isDragging()).toBe(false);

    el2.dispatchEvent(new Event("dragenter"));
    flush();
    expect(isDragging()).toBe(true);

    dispose();
  });

  it("error() captures a thrown onDrop callback", async () => {
    const boom = new Error("drop failed");
    const { error, ref, dispose } = createRoot(dispose => ({
      ...createDropzone({ onDrop: async () => { throw boom; } }),
      dispose,
    }));

    const div = document.createElement("div");
    ref(div);

    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { files: makeFileList(makeFile()) },
      configurable: true,
    });
    div.dispatchEvent(dropEvent);

    await Promise.resolve();
    await Promise.resolve();

    expect(error()).toBe(boom);
    dispose();
  });
});

// ── dropzone ref callback factory ────────────────────────────────────────────

describe("dropzone", () => {
  it("returns a callable ref with state properties attached", () => {
    const { dz, dispose } = createRoot(dispose => ({
      dz: dropzone(),
      dispose,
    }));
    expect(typeof dz).toBe("function");
    expect(typeof dz.files).toBe("function");
    expect(typeof dz.isDragging).toBe("function");
    expect(typeof dz.isLoading).toBe("function");
    expect(typeof dz.error).toBe("function");
    expect(typeof dz.removeFile).toBe("function");
    expect(typeof dz.clearFiles).toBe("function");
    dispose();
  });

  it("initial state matches createDropzone defaults", () => {
    const { dz, dispose } = createRoot(dispose => ({
      dz: dropzone(),
      dispose,
    }));
    expect(dz.files()).toEqual([]);
    expect(dz.error()).toBeNull();
    expect(dz.isLoading()).toBe(false);
    expect(dz.isDragging()).toBe(false);
    dispose();
  });

  it("works as a ref — drag events update isDragging", () => {
    const { dz, dispose } = createRoot(dispose => ({
      dz: dropzone(),
      dispose,
    }));
    const el = document.createElement("div");
    dz(el);

    el.dispatchEvent(new Event("dragenter"));
    flush();
    expect(dz.isDragging()).toBe(true);

    el.dispatchEvent(new Event("dragleave"));
    flush();
    expect(dz.isDragging()).toBe(false);

    dispose();
  });
});

// ── fileUploader ref callback ─────────────────────────────────────────────────

describe("fileUploader", () => {
  it("returns a function (ref callback)", () => {
    const { ref, dispose } = createRoot(dispose => ({
      ref: fileUploader({ userCallback: vi.fn(), setFiles: vi.fn() }),
      dispose,
    }));
    expect(typeof ref).toBe("function");
    dispose();
  });

  it("attaches a change listener to the element", () => {
    const input = document.createElement("input");
    input.type = "file";
    const addSpy = vi.spyOn(input, "addEventListener");

    const dispose = createRoot(dispose => {
      const ref = fileUploader({ userCallback: vi.fn(), setFiles: vi.fn() });
      ref(input);
      return dispose;
    });

    expect(addSpy).toHaveBeenCalledWith("change", expect.any(Function));
    dispose();
  });

  it("calls setFiles and userCallback on change event", async () => {
    const input = document.createElement("input");
    input.type = "file";
    const setFiles = vi.fn();
    const userCallback = vi.fn();

    const dispose = createRoot(dispose => {
      const ref = fileUploader({ userCallback, setFiles });
      ref(input);
      return dispose;
    });

    dispatchChange(input, makeFileList(makeFile("upload.png")));
    await Promise.resolve();

    expect(setFiles).toHaveBeenCalledOnce();
    const uploaded: UploadFile[] = setFiles.mock.calls[0]![0];
    expect(uploaded).toHaveLength(1);
    expect(uploaded[0]!.name).toBe("upload.png");
    expect(userCallback).toHaveBeenCalledOnce();
    dispose();
  });

  it("calls onError when userCallback throws", async () => {
    const boom = new Error("cb failed");
    const input = document.createElement("input");
    input.type = "file";
    const onError = vi.fn();

    const dispose = createRoot(dispose => {
      const ref = fileUploader({
        userCallback: async () => {
          throw boom;
        },
        setFiles: vi.fn(),
        onError,
      });
      ref(input);
      return dispose;
    });

    dispatchChange(input, makeFileList(makeFile()));
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith(boom);
    dispose();
  });
});

// ── createFileUploader ──────────────────────────────────────────────────────────

// Builds a minimal UploadFile without needing a real picker
function makeUploadFile(name = "test.png"): UploadFile {
  const file = makeFile(name);
  return { source: `blob:${name}`, name, size: file.size, file };
}

// Custom send helper: called once per file; tracks all concurrent calls for multi-file tests.
function makeBlockingSend() {
  type ProgressCb = (p: { loaded: number; total: number; percentage: number }) => void;
  type Call = { file: UploadFile; resolve: (v: unknown) => void; reject: (e: unknown) => void; onProgress: ProgressCb };
  const calls: Call[] = [];

  const send = vi.fn((file: UploadFile, onProgress: ProgressCb, signal: AbortSignal) =>
    new Promise<unknown>((res, rej) => {
      calls.push({ file, resolve: res, reject: rej, onProgress });
      signal.addEventListener("abort", () => rej(new DOMException("Upload aborted", "AbortError")));
    }),
  );

  const emitProgressCall = (i: number, loaded: number, total: number) =>
    calls[i]!.onProgress({ loaded, total, percentage: Math.round((loaded / total) * 100) });

  return {
    send,
    resolve: (val: unknown = "ok") => calls[0]!.resolve(val),
    reject: (err: unknown) => calls[0]!.reject(err),
    emitProgress: (loaded: number, total: number) => emitProgressCall(0, loaded, total),
    resolveCall: (i: number, val: unknown = "ok") => calls[i]!.resolve(val),
    rejectCall: (i: number, err: unknown) => calls[i]!.reject(err),
    emitProgressCall,
    callCount: () => calls.length,
  };
}

describe("createFileUploader", () => {
  it("starts with idle status, zero progress, and empty files array", () => {
    const { status, progress, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(makeBlockingSend().send),
      dispose,
    }));
    expect(status()).toBe("idle");
    expect(progress()).toEqual({ loaded: 0, total: 0, percentage: 0 });
    expect(files.length).toBe(0);
    dispose();
  });

  it("status: idle → uploading → success", async () => {
    const { send, resolve } = makeBlockingSend();
    const { upload, status, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    expect(status()).toBe("idle");

    const uploadPromise = upload([makeUploadFile()]).catch(() => {});
    await Promise.resolve();
    flush();
    expect(status()).toBe("uploading");

    resolve("response-data");
    await uploadPromise;
    flush();
    expect(status()).toBe("success");
    dispose();
  });

  it("per-file response is set after a successful upload", async () => {
    const { send, resolve } = makeBlockingSend();
    const { upload, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]);
    resolve({ id: 42 });
    await uploadPromise;
    flush();
    expect(files[0]!.response).toEqual({ id: 42 });
    expect(files[0]!.status).toBe("success");
    dispose();
  });

  it("aggregate progress updates across all files during transfer", async () => {
    const { send, resolve, emitProgress } = makeBlockingSend();
    const { upload, progress, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]);

    emitProgress(512, 1024);
    flush();
    expect(progress()).toEqual({ loaded: 512, total: 1024, percentage: 50 });

    emitProgress(1024, 1024);
    flush();
    expect(progress()).toEqual({ loaded: 1024, total: 1024, percentage: 100 });

    resolve();
    await uploadPromise;
    dispose();
  });

  it("per-file error is set and aggregate status → error when send rejects", async () => {
    const boom = new Error("network failure");
    const { send, reject } = makeBlockingSend();
    const { upload, status, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]).catch(() => {});
    reject(boom);
    await uploadPromise;
    flush();

    expect(status()).toBe("error");
    expect(files[0]!.status).toBe("error");
    expect((files[0]!.error as Error).message).toBe(boom.message);
    dispose();
  });

  it("status → aborted when abort() is called", async () => {
    const { send } = makeBlockingSend();
    const { upload, abort, status, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]).catch(() => {});
    await Promise.resolve();
    abort();
    await uploadPromise;
    flush();

    expect(status()).toBe("aborted");
    expect(files[0]!.status).toBe("aborted");
    expect(files[0]!.error).toBeNull();
    dispose();
  });

  it("progress resets to zero when a new upload starts", async () => {
    const blocker1 = makeBlockingSend();
    const blocker2 = makeBlockingSend();
    const sendFn = vi.fn()
      .mockImplementationOnce(blocker1.send)
      .mockImplementationOnce(blocker2.send);

    const { upload, progress, dispose } = createRoot(dispose => ({
      ...createFileUploader(sendFn),
      dispose,
    }));

    const first = upload([makeUploadFile()]).catch(() => {});
    blocker1.emitProgress(1024, 1024);
    flush();
    expect(progress().percentage).toBe(100);

    // Start second upload — aborts first and resets progress
    upload([makeUploadFile()]).catch(() => {});
    await first;
    flush();
    expect(progress()).toEqual({ loaded: 0, total: 0, percentage: 0 });

    dispose();
  });

  it("dispatches a separate send call per file", async () => {
    const { send, resolveCall } = makeBlockingSend();
    const { upload, status, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile("a.png"), makeUploadFile("b.png")]);
    await Promise.resolve();

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]![0]).toMatchObject({ name: "a.png" });
    expect(send.mock.calls[1]![0]).toMatchObject({ name: "b.png" });
    expect(files.length).toBe(2);

    resolveCall(0, "res-a");
    resolveCall(1, "res-b");
    await uploadPromise;
    flush();

    expect(status()).toBe("success");
    expect(files[0]!.response).toBe("res-a");
    expect(files[1]!.response).toBe("res-b");
    dispose();
  });

  it("partial failure: one file errors while the other succeeds", async () => {
    const { send, resolveCall, rejectCall } = makeBlockingSend();
    const { upload, status, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const boom = new Error("file b failed");
    const uploadPromise = upload([makeUploadFile("a.png"), makeUploadFile("b.png")]);
    await Promise.resolve();

    resolveCall(0, "ok-a");
    rejectCall(1, boom);
    await uploadPromise;
    flush();

    expect(status()).toBe("error");
    expect(files[0]!.status).toBe("success");
    expect(files[0]!.response).toBe("ok-a");
    expect(files[1]!.status).toBe("error");
    expect((files[1]!.error as Error).message).toBe(boom.message);
    dispose();
  });

  it("per-file progress tracked independently for multiple files", async () => {
    const { send, resolveCall, emitProgressCall } = makeBlockingSend();
    const { upload, progress, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile("a.png"), makeUploadFile("b.png")]);
    await Promise.resolve();

    emitProgressCall(0, 256, 1024); // file a: 25%
    emitProgressCall(1, 512, 1024); // file b: 50%
    flush();

    expect(files[0]!.progress.percentage).toBe(25);
    expect(files[1]!.progress.percentage).toBe(50);
    // aggregate: (256+512) / (1024+1024) = 768/2048 = 37.5 → 38%
    expect(progress().percentage).toBe(38);

    resolveCall(0);
    resolveCall(1);
    await uploadPromise;
    dispose();
  });

  it("clearFiles empties the files list and aborts in-flight uploads", async () => {
    const { send } = makeBlockingSend();
    const { upload, files, status, clearFiles, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile("a.png"), makeUploadFile("b.png")]).catch(() => {});
    await Promise.resolve();
    flush();
    expect(files.length).toBe(2);

    clearFiles();
    await uploadPromise;
    flush();
    expect(files.length).toBe(0);
    expect(status()).toBe("idle");
    dispose();
  });

  it("removeFile removes a single entry and aborts in-flight uploads", async () => {
    const { send } = makeBlockingSend();
    const { upload, files, removeFile, dispose } = createRoot(dispose => ({
      ...createFileUploader(send),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile("a.png"), makeUploadFile("b.png")]).catch(() => {});
    await Promise.resolve();
    flush();
    expect(files.length).toBe(2);

    removeFile("a.png");
    await uploadPromise;
    flush();
    expect(files.length).toBe(1);
    expect(files[0]!.file.name).toBe("b.png");
    dispose();
  });

  it("clearFiles on an already-empty list is a no-op", () => {
    const { status, clearFiles, dispose } = createRoot(dispose => ({
      ...createFileUploader(makeBlockingSend().send),
      dispose,
    }));
    clearFiles();
    expect(status()).toBe("idle");
    dispose();
  });
});

// ── createFileUploader — XHR path ───────────────────────────────────────────────

function makeMockXhr() {
  const uploadListeners: Record<string, (e: ProgressEvent) => void> = {};
  const xhrListeners: Record<string, (e: Event) => void> = {};

  const xhr = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    abort: vi.fn(() => xhrListeners["abort"]?.(new Event("abort"))),
    status: 200,
    statusText: "OK",
    responseText: '{"ok":true}',
    upload: {
      addEventListener: vi.fn((type: string, fn: (e: ProgressEvent) => void) => {
        uploadListeners[type] = fn;
      }),
    },
    addEventListener: vi.fn((type: string, fn: (e: Event) => void) => {
      xhrListeners[type] = fn;
    }),
  };

  return {
    xhr,
    triggerProgress: (loaded: number, total: number) =>
      uploadListeners["progress"]?.({ lengthComputable: true, loaded, total } as ProgressEvent),
    triggerLoad: () => xhrListeners["load"]?.(new Event("load")),
    triggerError: () => xhrListeners["error"]?.(new Event("error")),
    triggerAbort: () => xhrListeners["abort"]?.(new Event("abort")),
  };
}

describe("createFileUploader — XHR", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens a POST to the provided URL and sends FormData", async () => {
    const { xhr, triggerLoad } = makeMockXhr();
    vi.stubGlobal("XMLHttpRequest", vi.fn(() => xhr));

    const { upload, dispose } = createRoot(dispose => ({
      ...createFileUploader(fileSender("/api/upload")),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]);
    expect(xhr.open).toHaveBeenCalledWith("POST", "/api/upload");
    expect(xhr.send).toHaveBeenCalledWith(expect.any(FormData));
    triggerLoad();
    await uploadPromise;
    dispose();
  });

  it("resolves with parsed JSON on 200 load", async () => {
    const mock = makeMockXhr();
    vi.stubGlobal("XMLHttpRequest", vi.fn(() => mock.xhr));

    const { upload, status, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(fileSender("/api/upload")),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]);
    mock.triggerLoad();
    await uploadPromise;
    flush();

    expect(status()).toBe("success");
    expect(files[0]!.response).toEqual({ ok: true });
    dispose();
  });

  it("rejects with an HTTP error for non-2xx responses", async () => {
    const mock = makeMockXhr();
    mock.xhr.status = 413;
    mock.xhr.statusText = "Payload Too Large";
    vi.stubGlobal("XMLHttpRequest", vi.fn(() => mock.xhr));

    const { upload, status, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(fileSender("/api/upload")),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]).catch(() => {});
    mock.triggerLoad();
    await uploadPromise;
    flush();

    expect(status()).toBe("error");
    expect((files[0]!.error as Error).message).toMatch("HTTP 413");
    dispose();
  });

  it("sets network error status when XHR fires error", async () => {
    const mock = makeMockXhr();
    vi.stubGlobal("XMLHttpRequest", vi.fn(() => mock.xhr));

    const { upload, status, files, dispose } = createRoot(dispose => ({
      ...createFileUploader(fileSender("/api/upload")),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]).catch(() => {});
    mock.triggerError();
    await uploadPromise;
    flush();

    expect(status()).toBe("error");
    expect((files[0]!.error as Error).message).toMatch("Network error");
    dispose();
  });

  it("forwards progress events to the progress signal", async () => {
    const mock = makeMockXhr();
    vi.stubGlobal("XMLHttpRequest", vi.fn(() => mock.xhr));

    const { upload, progress, dispose } = createRoot(dispose => ({
      ...createFileUploader(fileSender("/api/upload")),
      dispose,
    }));

    upload([makeUploadFile()]).catch(() => {});

    mock.triggerProgress(256, 1024);
    flush();
    expect(progress()).toEqual({ loaded: 256, total: 1024, percentage: 25 });

    mock.triggerLoad();
    dispose();
  });

  it("sets custom headers on the XHR request", async () => {
    const { xhr, triggerLoad } = makeMockXhr();
    vi.stubGlobal("XMLHttpRequest", vi.fn(() => xhr));

    const { upload, dispose } = createRoot(dispose => ({
      ...createFileUploader(fileSender("/api/upload", { headers: { "X-Auth": "token123" } })),
      dispose,
    }));

    const uploadPromise = upload([makeUploadFile()]);
    expect(xhr.setRequestHeader).toHaveBeenCalledWith("X-Auth", "token123");
    triggerLoad();
    await uploadPromise;
    dispose();
  });
});
