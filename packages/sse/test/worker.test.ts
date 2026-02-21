import "./setup";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "solid-js";
import { createSSE, SSEReadyState } from "../src/sse.js";
import { makeSSEWorker, type SSEWorkerMessage, type SSEWorkerTarget } from "../src/worker.js";

// ─── MockWorkerTarget ─────────────────────────────────────────────────────────

/**
 * Minimal stub for a Worker / SharedWorker.port.
 * Records outgoing `postMessage` calls so tests can assert on them,
 * and exposes `respond()` to push messages back from the "worker".
 */
class MockWorkerTarget extends EventTarget implements SSEWorkerTarget {
  readonly sent: SSEWorkerMessage[] = [];

  postMessage(data: SSEWorkerMessage): void {
    this.sent.push(data);
  }

  /** Simulate the Worker sending a message to the main thread. */
  respond(data: SSEWorkerMessage): void {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

// ─── makeSSEWorker unit tests ─────────────────────────────────────────────────

describe("makeSSEWorker", () => {
  it("returns a SSESourceFn (callable function)", () => {
    const target = new MockWorkerTarget();
    const factory = makeSSEWorker(target);
    expect(typeof factory).toBe("function");
  });

  it("sends a connect message when the factory is called", () => {
    const target = new MockWorkerTarget();
    makeSSEWorker(target)("https://example.com/events", {});
    expect(target.sent).toHaveLength(1);
    expect(target.sent[0]).toMatchObject({ type: "connect", url: "https://example.com/events" });
  });

  it("includes withCredentials in the connect message", () => {
    const target = new MockWorkerTarget();
    makeSSEWorker(target)("https://example.com/events", { withCredentials: true });
    expect(target.sent[0]).toMatchObject({ withCredentials: true });
  });

  it("includes event names (not handlers) in the connect message", () => {
    const target = new MockWorkerTarget();
    makeSSEWorker(target)("https://example.com/events", {
      events: { update: vi.fn(), tick: vi.fn() },
    });
    const msg = target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>;
    expect(msg.events).toContain("update");
    expect(msg.events).toContain("tick");
  });

  it("WorkerEventSource starts in CONNECTING state", () => {
    const target = new MockWorkerTarget();
    const [source] = makeSSEWorker(target)("https://example.com/events", {});
    expect(source.readyState).toBe(SSEReadyState.CONNECTING);
  });

  it("transitions to OPEN and fires open event on 'open' worker message", () => {
    const target = new MockWorkerTarget();
    const [source] = makeSSEWorker(target)("https://example.com/events", {});
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;

    const onOpen = vi.fn();
    source.addEventListener("open", onOpen);
    target.respond({ type: "open", id });

    expect(source.readyState).toBe(SSEReadyState.OPEN);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("fires the onOpen option callback", () => {
    const target = new MockWorkerTarget();
    const onOpen = vi.fn();
    const [source] = makeSSEWorker(target)("https://example.com/events", { onOpen });
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
    target.respond({ type: "open", id });
    expect(onOpen).toHaveBeenCalledOnce();
    source.close();
  });

  it("dispatches a 'message' event with the correct data", () => {
    const target = new MockWorkerTarget();
    const [source] = makeSSEWorker(target)("https://example.com/events", {});
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;

    target.respond({ type: "open", id });
    const onMessage = vi.fn();
    source.addEventListener("message", onMessage);
    target.respond({ type: "message", id, data: "hello", eventType: "message" });

    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ data: "hello" }));
    source.close();
  });

  it("fires the onMessage option callback", () => {
    const target = new MockWorkerTarget();
    const onMessage = vi.fn();
    const [source] = makeSSEWorker(target)("https://example.com/events", { onMessage });
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
    target.respond({ type: "open", id });
    target.respond({ type: "message", id, data: "ping", eventType: "message" });
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ data: "ping" }));
    source.close();
  });

  it("dispatches custom named events", () => {
    const target = new MockWorkerTarget();
    const onUpdate = vi.fn();
    const [source] = makeSSEWorker(target)("https://example.com/events", {
      events: { update: onUpdate },
    });
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;

    target.respond({ type: "open", id });
    target.respond({ type: "message", id, data: "payload", eventType: "update" });

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: "payload" }));
    source.close();
  });

  it("updates readyState and dispatches error event on 'error' worker message", () => {
    const target = new MockWorkerTarget();
    const [source] = makeSSEWorker(target)("https://example.com/events", {});
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;

    const onError = vi.fn();
    source.addEventListener("error", onError);
    target.respond({ type: "error", id, readyState: SSEReadyState.CLOSED });

    expect(source.readyState).toBe(SSEReadyState.CLOSED);
    expect(onError).toHaveBeenCalledOnce();
  });

  it("fires the onError option callback", () => {
    const target = new MockWorkerTarget();
    const onError = vi.fn();
    const [source] = makeSSEWorker(target)("https://example.com/events", { onError });
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
    target.respond({ type: "error", id, readyState: SSEReadyState.CLOSED });
    expect(onError).toHaveBeenCalledOnce();
    source.close();
  });

  it("close() sends a disconnect message to the worker", () => {
    const target = new MockWorkerTarget();
    const [source] = makeSSEWorker(target)("https://example.com/events", {});
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;

    source.close();

    expect(target.sent).toHaveLength(2);
    expect(target.sent[1]).toMatchObject({ type: "disconnect", id });
    expect(source.readyState).toBe(SSEReadyState.CLOSED);
  });

  it("cleanup() closes the source and sends disconnect", () => {
    const target = new MockWorkerTarget();
    const [source, cleanup] = makeSSEWorker(target)("https://example.com/events", {});
    const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;

    cleanup();

    expect(target.sent[1]).toMatchObject({ type: "disconnect", id });
    expect(source.readyState).toBe(SSEReadyState.CLOSED);
  });

  it("ignores messages intended for other connection IDs", () => {
    const target = new MockWorkerTarget();
    const [source] = makeSSEWorker(target)("https://example.com/events", {});
    const onOpen = vi.fn();
    source.addEventListener("open", onOpen);

    target.respond({ type: "open", id: "some-other-id" });

    expect(onOpen).not.toHaveBeenCalled();
    expect(source.readyState).toBe(SSEReadyState.CONNECTING);
    source.close();
  });

  it("two concurrent WorkerEventSources on the same target are independent", () => {
    const target = new MockWorkerTarget();
    const [sourceA] = makeSSEWorker(target)("https://example.com/a", {});
    const [sourceB] = makeSSEWorker(target)("https://example.com/b", {});

    const idA = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
    const idB = (target.sent[1] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
    expect(idA).not.toBe(idB);

    target.respond({ type: "open", id: idA });
    expect(sourceA.readyState).toBe(SSEReadyState.OPEN);
    expect(sourceB.readyState).toBe(SSEReadyState.CONNECTING); // unaffected

    sourceA.close();
    sourceB.close();
  });
});

// ─── createSSE + makeSSEWorker integration ────────────────────────────────────

describe("createSSE with worker source", () => {
  beforeAll(() => vi.useFakeTimers());
  beforeEach(() => vi.clearAllTimers());
  afterAll(() => vi.useRealTimers());

  it("starts in CONNECTING state", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      const { readyState } = createSSE("https://example.com/events", {
        source: makeSSEWorker(target),
      });
      expect(readyState()).toBe(SSEReadyState.CONNECTING);
      dispose();
    }));

  it("transitions to OPEN when the worker sends 'open'", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      const { readyState } = createSSE("https://example.com/events", {
        source: makeSSEWorker(target),
      });
      const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
      target.respond({ type: "open", id });
      expect(readyState()).toBe(SSEReadyState.OPEN);
      dispose();
    }));

  it("updates data signal on message", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      const { data } = createSSE("https://example.com/events", {
        source: makeSSEWorker(target),
      });
      const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
      target.respond({ type: "open", id });
      target.respond({ type: "message", id, data: "world", eventType: "message" });
      expect(data()).toBe("world");
      dispose();
    }));

  it("applies transform to data from worker messages", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      const { data } = createSSE<{ n: number }>("https://example.com/events", {
        source: makeSSEWorker(target),
        transform: JSON.parse,
      });
      const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
      target.respond({ type: "open", id });
      target.respond({ type: "message", id, data: JSON.stringify({ n: 7 }), eventType: "message" });
      expect(data()).toEqual({ n: 7 });
      dispose();
    }));

  it("sends disconnect when the owner is disposed", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      createSSE("https://example.com/events", { source: makeSSEWorker(target) });
      dispose();
      expect(target.sent.some(m => m.type === "disconnect")).toBe(true);
    }));

  it("forwards custom event names to the connect message", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      createSSE("https://example.com/events", {
        source: makeSSEWorker(target),
        events: { update: vi.fn(), tick: vi.fn() },
      });
      const msg = target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>;
      expect(msg.events).toContain("update");
      expect(msg.events).toContain("tick");
      dispose();
    }));

  it("app-level reconnect creates a new WorkerEventSource after terminal error", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      createSSE("https://example.com/events", {
        source: makeSSEWorker(target),
        reconnect: { retries: 1, delay: 100 },
      });
      const id1 = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
      target.respond({ type: "open", id: id1 });
      target.respond({ type: "error", id: id1, readyState: SSEReadyState.CLOSED });

      // Before the reconnect timer fires, only 1 connect
      expect(target.sent.filter(m => m.type === "connect")).toHaveLength(1);

      vi.advanceTimersByTime(150);

      // After the delay, a new connect should have been sent
      expect(target.sent.filter(m => m.type === "connect")).toHaveLength(2);
      dispose();
    }));

  it("close() sends disconnect and transitions to CLOSED", () =>
    createRoot(dispose => {
      const target = new MockWorkerTarget();
      const { readyState, close } = createSSE("https://example.com/events", {
        source: makeSSEWorker(target),
      });
      const id = (target.sent[0] as Extract<SSEWorkerMessage, { type: "connect" }>).id;
      target.respond({ type: "open", id });
      expect(readyState()).toBe(SSEReadyState.OPEN);
      close();
      expect(readyState()).toBe(SSEReadyState.CLOSED);
      expect(target.sent.some(m => m.type === "disconnect")).toBe(true);
      dispose();
    }));
});
