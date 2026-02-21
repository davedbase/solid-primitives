/**
 * Worker script that manages EventSource connections on behalf of the main thread.
 * Bundle and load this file as a Worker:
 *
 * ```ts
 * // Dedicated Worker:
 * const worker = new Worker(new URL("@solid-primitives/sse/worker-handler", import.meta.url));
 *
 * // SharedWorker (one process shared across tabs):
 * const sw = new SharedWorker(new URL("@solid-primitives/sse/worker-handler", import.meta.url));
 * sw.port.start();
 * ```
 *
 * This file has no Solid reactive code — it is safe to run in any Worker context.
 */
import { makeSSE, SSEReadyState } from "./sse.js";
import type { SSEWorkerMessage } from "./worker.js";

const connections = new Map<string, VoidFunction>();

/**
 * Handle a single incoming message and send responses back via `postBack`.
 * Keeping responses tied to the originating channel makes SharedWorker work
 * correctly (each tab has its own MessagePort).
 */
function handleMessage(data: SSEWorkerMessage, postBack: (msg: SSEWorkerMessage) => void): void {
  if (data.type === "connect") {
    const { id, url, withCredentials, events } = data;

    const [, cleanup] = makeSSE(url, {
      withCredentials,
      onOpen: () => postBack({ type: "open", id }),
      onMessage: ev =>
        postBack({ type: "message", id, data: ev.data as string, eventType: "message" }),
      onError: ev =>
        postBack({
          type: "error",
          id,
          readyState: (ev.target as EventSource).readyState as SSEReadyState,
        }),
      events: Object.fromEntries(
        (events ?? []).map(name => [
          name,
          (ev: MessageEvent) =>
            postBack({ type: "message", id, data: ev.data as string, eventType: name }),
        ]),
      ),
    });

    connections.set(id, cleanup);
  }

  if (data.type === "disconnect") {
    connections.get(data.id)?.();
    connections.delete(data.id);
  }
}

// ── Dedicated Worker ──────────────────────────────────────────────────────────
// `DedicatedWorkerGlobalScope.postMessage` takes one argument, but the DOM lib
// types `self` as `Window` (which requires `targetOrigin`). Cast to the minimal
// structural interface we actually need — the project's tsconfig does not include
// the WebWorker lib, so we cannot reference DedicatedWorkerGlobalScope by name.
type DedicatedPost = { postMessage(data: SSEWorkerMessage): void };
self.addEventListener("message", (e: MessageEvent<SSEWorkerMessage>) => {
  handleMessage(e.data, msg => (self as unknown as DedicatedPost).postMessage(msg));
});

// ── SharedWorker — each connecting tab gets its own MessagePort ───────────────
self.addEventListener("connect", (e: Event) => {
  const port = (e as MessageEvent).ports?.[0];
  if (!port) return;
  port.addEventListener("message", (ev: MessageEvent<SSEWorkerMessage>) => {
    handleMessage(ev.data, msg => port.postMessage(msg));
  });
  port.start();
});
