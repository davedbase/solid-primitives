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
    const id = Math.random().toString(36).slice(2, 11);
    let readyState: SSEReadyStateValue = SSEReadyState.CONNECTING;

    // SSESourceHandle requires EventTarget & { readyState, close }.
    // We keep EventTarget so callers can use addEventListener directly on the source.
    const source = new EventTarget() as EventTarget & {
      readyState: SSEReadyStateValue;
      close(): void;
    };

    Object.defineProperty(source, "readyState", { get: () => readyState });

    const listener = (e: MessageEvent<SSEWorkerMessage>) => {
      const msg = e.data;
      if (msg.id !== id) return;

      if (msg.type === "open") {
        readyState = SSEReadyState.OPEN;
        const ev = new Event("open");
        source.dispatchEvent(ev);
        options.onOpen?.(ev);
      } else if (msg.type === "message") {
        const ev = new MessageEvent(msg.eventType, { data: msg.data });
        source.dispatchEvent(ev);
        if (msg.eventType === "message") {
          options.onMessage?.(ev);
        } else {
          options.events?.[msg.eventType]?.(ev);
        }
      } else if (msg.type === "error") {
        readyState = msg.readyState;
        const ev = new Event("error");
        source.dispatchEvent(ev);
        options.onError?.(ev);
      }
    };

    source.close = () => {
      readyState = SSEReadyState.CLOSED;
      target.postMessage({ type: "disconnect", id });
      target.removeEventListener("message", listener);
    };

    target.addEventListener("message", listener);

    target.postMessage({
      type: "connect",
      id,
      url,
      withCredentials: options.withCredentials,
      events: options.events ? Object.keys(options.events) : undefined,
    });

    return [source, () => source.close()];
  };
}
