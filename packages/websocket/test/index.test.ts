import "./setup";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createEffect, createRoot, flush, resolve } from "solid-js";
import {
  createWS,
  createWSState,
  createWSMessage,
  createReconnectingWS,
  makeReconnectingWS,
  makeHeartbeatWS,
  makeWS,
  wsMessageIterable,
  createWSData,
  createWSStore,
} from "../src/index.js";

beforeAll(() => {
  vi.useFakeTimers();
});

beforeEach(() => {
  vi.clearAllTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

describe("makeWS", () => {
  it("creates a web socket and opens it", () => {
    const ws = makeWS("ws://localhost:5000");
    expect(ws).toBeInstanceOf(WebSocket);
    expect(ws.readyState).toBe(0);
    vi.advanceTimersToNextTimer();
    expect(ws.readyState).toBe(1);
    ws.close();
  });
  it("does not throw when attempting to send while not yet open", () => {
    const ws = makeWS("ws://localhost:5000");
    expect(ws.readyState).toBe(0);
    expect(() => ws.send("it works")).not.toThrow();
    expect(WSMessages.get(ws)!).toHaveLength(0);
    vi.advanceTimersByTime(100);
    expect(WSMessages.get(ws)).toEqual(["it works"]);
    ws.close();
  });
});

describe("createWS", () => {
  it("closes the web socket on disposal", () =>
    new Promise<void>(resolve => {
      createRoot(dispose => {
        const ws = createWS("ws://localhost:5000");
        vi.spyOn(ws, "close").mockImplementation(() => resolve());
        dispose();
      });
    }));
});

describe("createWSState", () => {
  it("reacts to all changes of readyState", () =>
    new Promise<void>(resolve => {
      createRoot(dispose => {
        const ws = createWS("ws://localhost:5000");
        const state = createWSState(ws);
        expect(state()).toEqual(ws.CONNECTING);
        vi.advanceTimersByTime(20);
        flush();
        expect(state()).toEqual(ws.OPEN);
        vi.advanceTimersByTime(100);
        ws.close();
        flush();
        expect(state()).toEqual(ws.CLOSING);
        vi.advanceTimersByTime(80);
        flush();
        expect(state()).toEqual(ws.CLOSED);
        dispose();
        resolve();
      });
    }));
});

describe("createWSMessage", () => {
  it("is undefined before any messages arrive", () =>
    createRoot(dispose => {
      const ws = createWS("ws://localhost:5000");
      const message = createWSMessage<string>(ws);
      expect(message()).toBeUndefined();
      dispose();
    }));

  it("reflects the latest received message", () =>
    createRoot(dispose => {
      const ws = createWS("ws://localhost:5000");
      const message = createWSMessage<string>(ws);
      vi.advanceTimersByTime(20); // wait for open
      ws.dispatchEvent(new MessageEvent("message", { data: "hello" }));
      flush();
      expect(message()).toBe("hello");
      ws.dispatchEvent(new MessageEvent("message", { data: "world" }));
      flush();
      expect(message()).toBe("world");
      dispose();
    }));

  it("removes the event listener on disposal", () =>
    createRoot(dispose => {
      const ws = makeWS("ws://localhost:5000");
      const spy = vi.spyOn(ws, "removeEventListener");
      createWSMessage(ws);
      dispose();
      expect(spy).toHaveBeenCalledWith("message", expect.any(Function));
      ws.close();
    }));
});

describe("makeReconnectingWS", () => {
  it("reconnects after being closed by external circumstances", () => {
    const ws = makeReconnectingWS("ws://localhost:5000", undefined, { delay: 100 });
    expect(ws.readyState).toBe(0);
    vi.advanceTimersByTime(10);
    ws.dispatchEvent(new Event("close"));
    expect(ws.readyState).toBe(3);
    vi.advanceTimersByTime(500);
    expect(ws.readyState).toBe(1);
  });
  it("does not reconnect if manually closed", () => {
    const ws = makeReconnectingWS("ws://localhost:5000", undefined, { delay: 100 });
    ws.close();
    vi.advanceTimersByTime(500);
    expect(ws.readyState).toBe(3);
  });
  it("does not schedule a duplicate reconnect when reconnecting while open", () => {
    const OrigWS = (globalThis as any).WebSocket;
    let socketsCreated = 0;
    (globalThis as any).WebSocket = class extends OrigWS {
      constructor(...args: any[]) {
        super(...args);
        socketsCreated++;
      }
    };
    try {
      const ws = makeReconnectingWS("ws://localhost:5000", undefined, { delay: 100 });
      vi.advanceTimersByTime(10); // ws1 opens
      ws.reconnect(); // closes ws1, immediately creates ws2
      // 50ms: ws1 fires close event — without the fix the orphaned listener
      // would schedule getWS() again, creating ws3 after another 100ms
      vi.advanceTimersByTime(160);
      ws.close();
    } finally {
      (globalThis as any).WebSocket = OrigWS;
    }
    expect(socketsCreated).toBe(2);
  });
});

describe("createReconnectingWS", () => {
  it("closes the web socket on disposal", () =>
    new Promise<void>(resolve => {
      createRoot(dispose => {
        const ws = createReconnectingWS("ws://localhost:5000", undefined, { delay: 100 });
        vi.spyOn(ws, "close").mockImplementation(() => resolve());
        dispose();
      });
    }));
});

describe("makeHeartbeatWS", () => {
  it("sends a heartbeat", () => {
    const previousSockets = [...WSMessages.keys()];
    const ws = makeHeartbeatWS(
      makeReconnectingWS("ws://localhost:5000", undefined, { delay: 100 }),
    );
    const wsRef = [...WSMessages.keys()].find(socket => !previousSockets.includes(socket));
    vi.advanceTimersByTime(2500);
    expect(WSMessages.get(wsRef!)).toEqual(["ping"]);
    expect(ws.readyState).toBe(1);
  });
  it("reconnects after the pong is missing", () => {
    const previousSockets = [...WSMessages.keys()];
    const ws = makeHeartbeatWS(
      makeReconnectingWS("ws://localhost:5000", undefined, { delay: 100 }),
    );
    const wsRef = [...WSMessages.keys()].find(socket => !previousSockets.includes(socket));
    wsRef && previousSockets.push(wsRef);
    vi.advanceTimersByTime(6000);
    const wsRef2 = [...WSMessages.keys()].find(socket => !previousSockets.includes(socket));
    expect(wsRef2).not.toBeUndefined();
    expect(ws.readyState).toBe(1);
  });
});

describe("wsMessageIterable", () => {
  it("yields messages in arrival order", async () => {
    const ws = makeWS("ws://localhost:5000");
    vi.advanceTimersByTime(20);
    const iter = wsMessageIterable<string>(ws)[Symbol.asyncIterator]();
    ws.dispatchEvent(new MessageEvent("message", { data: "first" }));
    ws.dispatchEvent(new MessageEvent("message", { data: "second" }));
    expect((await iter.next()).value).toBe("first");
    expect((await iter.next()).value).toBe("second");
    await iter.return?.();
    ws.close();
  });

  it("resolves a pending next() when a message arrives after the await", async () => {
    const ws = makeWS("ws://localhost:5000");
    vi.advanceTimersByTime(20);
    const iter = wsMessageIterable<string>(ws)[Symbol.asyncIterator]();
    const pending = iter.next();
    ws.dispatchEvent(new MessageEvent("message", { data: "late" }));
    const result = await pending;
    expect(result.value).toBe("late");
    expect(result.done).toBe(false);
    await iter.return?.();
    ws.close();
  });

  it("removes the event listener when the iterator is returned", async () => {
    const ws = makeWS("ws://localhost:5000");
    const spy = vi.spyOn(ws, "removeEventListener");
    const iter = wsMessageIterable<string>(ws)[Symbol.asyncIterator]();
    await iter.return?.();
    expect(spy).toHaveBeenCalledWith("message", expect.any(Function));
    ws.close();
  });
});

describe("createWSData", () => {
  it("suspends until the first message arrives", async () => {
    await createRoot(async dispose => {
      const ws = makeWS("ws://localhost:5000");
      vi.advanceTimersByTime(20);
      const data = createWSData<string>(ws);
      ws.dispatchEvent(new MessageEvent("message", { data: "hello" }));
      await resolve(() => data());
      expect(data()).toBe("hello");
      dispose();
    });
  });

  it("applies transform when provided", async () => {
    await createRoot(async dispose => {
      const ws = makeWS("ws://localhost:5000");
      vi.advanceTimersByTime(20);
      const data = createWSData<string, number>(ws, { transform: s => parseInt(s, 10) });
      ws.dispatchEvent(new MessageEvent("message", { data: "42" }));
      await resolve(() => data());
      expect(data()).toBe(42);
      dispose();
    });
  });

  it("updates on each subsequent message", async () => {
    const received: string[] = [];
    await new Promise<void>(done => {
      createRoot(dispose => {
        const ws = makeWS("ws://localhost:5000");
        vi.advanceTimersByTime(20);
        const data = createWSData<string>(ws);
        // Collect values via effect; resolve after two distinct messages arrive
        createEffect(data, val => {
          if (val !== undefined && !received.includes(val)) {
            received.push(val);
            if (received.length === 2) {
              dispose();
              done();
            }
          }
        });
        // Send first message, then second after a microtask so the generator
        // has time to loop back into its await before the second arrives
        ws.dispatchEvent(new MessageEvent("message", { data: "first" }));
        Promise.resolve().then(() => {
          ws.dispatchEvent(new MessageEvent("message", { data: "second" }));
        });
      });
    });
    expect(received).toEqual(["first", "second"]);
  });
});

describe("createWSStore", () => {
  it("applies patch on each incoming message", () =>
    createRoot(dispose => {
      const ws = makeWS("ws://localhost:5000");
      vi.advanceTimersByTime(20);
      const [state] = createWSStore<{ name: string }>(ws, {
        initial: { name: "init" },
        patch(draft, msg) {
          draft.name = msg as string;
        },
      });
      expect(state.name).toBe("init");
      ws.dispatchEvent(new MessageEvent("message", { data: "first" }));
      flush();
      expect(state.name).toBe("first");
      ws.dispatchEvent(new MessageEvent("message", { data: "second" }));
      flush();
      expect(state.name).toBe("second");
      dispose();
    }));

  it("removes the event listener on disposal", () =>
    createRoot(dispose => {
      const ws = makeWS("ws://localhost:5000");
      const spy = vi.spyOn(ws, "removeEventListener");
      createWSStore<Record<string, unknown>>(ws, {
        initial: {},
        patch() {},
      });
      dispose();
      expect(spy).toHaveBeenCalledWith("message", expect.any(Function));
      ws.close();
    }));
});
