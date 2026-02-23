import { SSEReadyState, type SSEReadyStateValue, type SSEOptions, type SSESourceFn } from "./sse.js";

// ─── Protocol types ───────────────────────────────────────────────────────────

/**
 * Discriminated union of all messages exchanged between the main thread
 * and the Worker. Main → Worker: `connect` | `disconnect`.
 * Worker → Main: `open` | `message` | `error`.
 */
export type SSEWorkerMessage =
  | { type: "connect"; id: string; url: string; withCredentials?: boolean; events?: string[] }
  | { type: "disconnect"; id: string }
  | { type: "open"; id: string }
  | { type: "message"; id: string; data: string; eventType: string }
  | { type: "error"; id: string; readyState: SSEReadyStateValue };

/** A `Worker` or a `SharedWorker.port` — anything with `postMessage` and `addEventListener`. */
export type SSEWorkerTarget = {
  postMessage(data: SSEWorkerMessage): void;
  addEventListener(type: "message", listener: (e: MessageEvent<SSEWorkerMessage>) => void): void;
  removeEventListener(type: "message", listener: (e: MessageEvent<SSEWorkerMessage>) => void): void;
};

// ─── WorkerEventSource ────────────────────────────────────────────────────────

/**
 * An `EventTarget` facade that tunnels SSE events through a Worker.
 * Not exported — consumers use `makeSSEWorker` to obtain instances.
 */
class WorkerEventSource extends EventTarget {
  private _readyState: SSEReadyStateValue = SSEReadyState.CONNECTING;

  get readyState(): SSEReadyStateValue {
    return this._readyState;
  }

  private readonly _id: string;
  private readonly _target: SSEWorkerTarget;
  private readonly _listener: (e: MessageEvent<SSEWorkerMessage>) => void;

  constructor(target: SSEWorkerTarget, url: string, options: SSEOptions) {
    super();

    this._id = Math.random().toString(36).slice(2, 11);
    this._target = target;

    this._listener = (e: MessageEvent<SSEWorkerMessage>) => {
      const msg = e.data;
      if (msg.id !== this._id) return;

      if (msg.type === "open") {
        this._readyState = SSEReadyState.OPEN;
        this.dispatchEvent(new Event("open"));
      } else if (msg.type === "message") {
        this.dispatchEvent(new MessageEvent(msg.eventType, { data: msg.data }));
      } else if (msg.type === "error") {
        this._readyState = msg.readyState;
        this.dispatchEvent(new Event("error"));
      }
    };

    target.addEventListener("message", this._listener);

    target.postMessage({
      type: "connect",
      id: this._id,
      url,
      withCredentials: options.withCredentials,
      events: options.events ? Object.keys(options.events) : undefined,
    });
  }

  close() {
    this._readyState = SSEReadyState.CLOSED;
    this._target.postMessage({ type: "disconnect", id: this._id });
    this._target.removeEventListener("message", this._listener);
  }
}

// ─── makeSSEWorker ────────────────────────────────────────────────────────────

/**
 * Returns a `SSESourceFn` that tunnels EventSource connections through a Worker.
 * Pass the returned factory as the `source` option to `createSSE`:
 *
 * ```ts
 * const worker = new Worker(new URL("@solid-primitives/sse/worker-handler", import.meta.url));
 * const { data } = createSSE(url, { source: makeSSEWorker(worker) });
 * ```
 *
 * Works with `SharedWorker.port` for a single connection shared across tabs:
 *
 * ```ts
 * const sw = new SharedWorker(new URL("@solid-primitives/sse/worker-handler", import.meta.url));
 * sw.port.start();
 * const { data } = createSSE(url, { source: makeSSEWorker(sw.port) });
 * ```
 *
 * @param target A `Worker` or `SharedWorker.port`
 */
export function makeSSEWorker(target: SSEWorkerTarget): SSESourceFn {
  return (url: string, options: SSEOptions) => {
    const source = new WorkerEventSource(target, url, options);

    if (options.onOpen) source.addEventListener("open", options.onOpen);
    if (options.onMessage) source.addEventListener("message", options.onMessage as EventListener);
    if (options.onError) source.addEventListener("error", options.onError);
    if (options.events) {
      for (const [name, handler] of Object.entries(options.events))
        source.addEventListener(name, handler as EventListener);
    }

    const cleanup = () => {
      source.close();
      if (options.onOpen) source.removeEventListener("open", options.onOpen);
      if (options.onMessage)
        source.removeEventListener("message", options.onMessage as EventListener);
      if (options.onError) source.removeEventListener("error", options.onError);
      if (options.events) {
        for (const [name, handler] of Object.entries(options.events))
          source.removeEventListener(name, handler as EventListener);
      }
    };

    return [source, cleanup];
  };
}
