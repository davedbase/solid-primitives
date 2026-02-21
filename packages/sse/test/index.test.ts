import "./setup";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, createSignal } from "solid-js";
import { makeSSE, createSSE, SSEReadyState } from "../src/index.js";
import { MockEventSource } from "./setup.js";

beforeAll(() => vi.useFakeTimers());
beforeEach(() => {
  vi.clearAllTimers();
  SSEInstances.length = 0;
});
afterAll(() => vi.useRealTimers());

// ── makeSSE ───────────────────────────────────────────────────────────────────

describe("makeSSE", () => {
  it("creates an EventSource in CONNECTING state", () => {
    const [source, cleanup] = makeSSE("https://example.com/events");
    expect(source).toBeInstanceOf(EventSource);
    expect(source.readyState).toBe(SSEReadyState.CONNECTING);
    cleanup();
  });

  it("returns a cleanup that closes the connection", () => {
    const [source, cleanup] = makeSSE("https://example.com/events");
    cleanup();
    expect(source.readyState).toBe(SSEReadyState.CLOSED);
  });

  it("fires onOpen when connection opens", () => {
    const onOpen = vi.fn();
    const [, cleanup] = makeSSE("https://example.com/events", { onOpen });
    vi.advanceTimersByTime(20);
    expect(onOpen).toHaveBeenCalledOnce();
    cleanup();
  });

  it("fires onMessage for unnamed message events", () => {
    const onMessage = vi.fn();
    const [source, cleanup] = makeSSE("https://example.com/events", { onMessage });
    vi.advanceTimersByTime(20);
    (source as unknown as MockEventSource).simulateMessage("hello");
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ data: "hello" }));
    cleanup();
  });

  it("fires onError on error events", () => {
    const onError = vi.fn();
    const [source, cleanup] = makeSSE("https://example.com/events", { onError });
    (source as unknown as MockEventSource).simulateError();
    expect(onError).toHaveBeenCalledOnce();
    cleanup();
  });

  it("fires named custom event handlers", () => {
    const onUpdate = vi.fn();
    const [source, cleanup] = makeSSE("https://example.com/events", {
      events: { update: onUpdate },
    });
    vi.advanceTimersByTime(20);
    (source as unknown as MockEventSource).simulateMessage("payload", "update");
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: "payload" }));
    cleanup();
  });

  it("cleanup does not throw before connection opens", () => {
    const [, cleanup] = makeSSE("https://example.com/events");
    expect(() => cleanup()).not.toThrow();
  });
});

// ── createSSE ─────────────────────────────────────────────────────────────────

describe("createSSE", () => {
  it("starts in CONNECTING state", () =>
    createRoot(dispose => {
      const { readyState } = createSSE("https://example.com/events");
      expect(readyState()).toBe(SSEReadyState.CONNECTING);
      dispose();
    }));

  it("transitions to OPEN when connection opens", () =>
    createRoot(dispose => {
      const { readyState } = createSSE("https://example.com/events");
      vi.advanceTimersByTime(20);
      expect(readyState()).toBe(SSEReadyState.OPEN);
      dispose();
    }));

  it("provides latest message via data signal", () =>
    createRoot(dispose => {
      const { data, source } = createSSE("https://example.com/events");
      expect(data()).toBeUndefined();
      vi.advanceTimersByTime(20);
      (source() as unknown as MockEventSource).simulateMessage("hello");
      expect(data()).toBe("hello");
      dispose();
    }));

  it("applies transform to incoming data", () =>
    createRoot(dispose => {
      const { data, source } = createSSE<{ value: number }>("https://example.com/events", {
        transform: JSON.parse,
      });
      vi.advanceTimersByTime(20);
      (source() as unknown as MockEventSource).simulateMessage(JSON.stringify({ value: 42 }));
      expect(data()).toEqual({ value: 42 });
      dispose();
    }));

  it("returns initialValue before any message arrives", () =>
    createRoot(dispose => {
      const { data } = createSSE("https://example.com/events", {
        initialValue: "loading",
      });
      expect(data()).toBe("loading");
      dispose();
    }));

  it("clears error signal on successful open", () =>
    createRoot(dispose => {
      const { error, source } = createSSE("https://example.com/events", {
        reconnect: { retries: 1, delay: 50 },
      });
      vi.advanceTimersByTime(20);
      (source() as unknown as MockEventSource).simulateError();
      expect(error()).toBeTruthy();
      // reconnect fires after delay; new source opens
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(20); // new source opens
      expect(error()).toBeUndefined();
      dispose();
    }));

  it("transitions to CLOSED and sets error on terminal error", () =>
    createRoot(dispose => {
      const { error, readyState, source } = createSSE("https://example.com/events", {
        reconnect: false,
      });
      vi.advanceTimersByTime(20);
      (source() as unknown as MockEventSource).simulateError();
      expect(readyState()).toBe(SSEReadyState.CLOSED);
      expect(error()).toBeTruthy();
      dispose();
    }));

  it("does not app-reconnect on transient errors (browser handles those)", () =>
    createRoot(dispose => {
      const initialCount = SSEInstances.length;
      const { source } = createSSE("https://example.com/events", {
        reconnect: { retries: 5, delay: 50 },
      });
      vi.advanceTimersByTime(20);
      (source() as unknown as MockEventSource).simulateTransientError();
      vi.advanceTimersByTime(300);
      // readyState stayed CONNECTING → no new EventSource was created
      expect(SSEInstances.length).toBe(initialCount + 1);
      dispose();
    }));

  it("auto-reconnects on terminal error when reconnect option is set", () =>
    createRoot(dispose => {
      const { source } = createSSE("https://example.com/events", {
        reconnect: { retries: 1, delay: 100 },
      });
      vi.advanceTimersByTime(20);
      const first = source();
      (first as unknown as MockEventSource).simulateError();
      expect(source()).toBe(first); // no change yet
      vi.advanceTimersByTime(150);
      expect(source()).not.toBe(first); // new connection opened
      dispose();
    }));

  it("respects retry limit", () =>
    createRoot(dispose => {
      const { source } = createSSE("https://example.com/events", {
        reconnect: { retries: 1, delay: 50 },
      });
      vi.advanceTimersByTime(20);
      const first = source();
      (first as unknown as MockEventSource).simulateError();
      vi.advanceTimersByTime(100); // first retry
      const second = source();
      expect(second).not.toBe(first);
      vi.advanceTimersByTime(20); // second opens
      (second as unknown as MockEventSource).simulateError();
      vi.advanceTimersByTime(200); // no more retries
      expect(source()).toBe(second); // still the same source
      dispose();
    }));

  it("close() transitions to CLOSED and stops reconnects", () =>
    createRoot(dispose => {
      const { readyState, close } = createSSE("https://example.com/events");
      vi.advanceTimersByTime(20);
      expect(readyState()).toBe(SSEReadyState.OPEN);
      close();
      expect(readyState()).toBe(SSEReadyState.CLOSED);
      dispose();
    }));

  it("reconnect() opens a fresh connection", () =>
    createRoot(dispose => {
      const { source, reconnect } = createSSE("https://example.com/events");
      vi.advanceTimersByTime(20);
      const first = source();
      reconnect();
      expect(source()).not.toBe(first);
      expect(first?.readyState).toBe(SSEReadyState.CLOSED); // old one closed
      dispose();
    }));

  it("reconnects when the URL signal changes", () =>
    createRoot(dispose => {
      const [url, setUrl] = createSignal("https://example.com/v1/events");
      const { source } = createSSE(url);
      vi.advanceTimersByTime(20);
      const first = source();
      setUrl("https://example.com/v2/events");
      expect(source()).not.toBe(first);
      expect(first?.readyState).toBe(SSEReadyState.CLOSED);
      dispose();
    }));

  it("closes connection on owner disposal", () =>
    new Promise<void>(resolve =>
      createRoot(dispose => {
        const { source } = createSSE("https://example.com/events");
        vi.advanceTimersByTime(20);
        const es = source();
        vi.spyOn(es as unknown as MockEventSource, "close").mockImplementation(() => resolve());
        dispose();
      }),
    ));
});
