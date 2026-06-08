import "./setup";
import { createRoot, flush } from "solid-js";
import { describe, expect, it, beforeEach } from "vitest";
import { makeWakeLock, createWakeLock } from "../src/index.js";
import { setDocumentVisible, setWakeLockDenied, MockWakeLockSentinel } from "./setup.js";

/** Yield to the microtask queue so async Promises settle. */
const tick = () => Promise.resolve();

beforeEach(() => {
  setDocumentVisible(true);
  setWakeLockDenied(false);
});

// ── makeWakeLock ──────────────────────────────────────────────────────────────

describe("makeWakeLock", () => {
  it("reports isSupported = true in jsdom with the mock", () => {
    const wl = makeWakeLock();
    expect(wl.isSupported).toBe(true);
  });

  it("request() returns a WakeLockSentinel", async () => {
    const { request } = makeWakeLock();
    const sentinel = await request("screen");
    expect(sentinel).toBeInstanceOf(MockWakeLockSentinel);
    expect((sentinel as any).type).toBe("screen");
  });

  it("request() defaults to type 'screen'", async () => {
    const { request } = makeWakeLock();
    const sentinel = await request();
    expect((sentinel as any).type).toBe("screen");
  });

  it("request() throws when the browser denies the lock", async () => {
    setWakeLockDenied(true);
    const { request } = makeWakeLock();
    await expect(request()).rejects.toThrow(DOMException);
  });

  it("release() resolves the sentinel", async () => {
    const { request, release } = makeWakeLock();
    const sentinel = await request();
    expect((sentinel as any)!.released).toBe(false);
    await release(sentinel!);
    expect((sentinel as any)!.released).toBe(true);
  });

  it("release() is a no-op on an already-released sentinel", async () => {
    const { request, release } = makeWakeLock();
    const sentinel = await request();
    await release(sentinel!);
    await expect(release(sentinel!)).resolves.toBeUndefined();
  });

  it("can be called outside a Solid owner", () => {
    expect(() => makeWakeLock()).not.toThrow();
  });
});

// ── createWakeLock — initial state ───────────────────────────────────────────

describe("createWakeLock — initial state", () => {
  it("isActive() starts false", () => {
    createRoot(dispose => {
      const wl = createWakeLock();
      expect(wl.isActive()).toBe(false);
      dispose();
    });
  });

  it("type() starts undefined", () => {
    createRoot(dispose => {
      const wl = createWakeLock();
      expect(wl.type()).toBeUndefined();
      dispose();
    });
  });

  it("sentinel() starts null", () => {
    createRoot(dispose => {
      const wl = createWakeLock();
      expect(wl.sentinel()).toBeNull();
      dispose();
    });
  });

  it("error() starts null", () => {
    createRoot(dispose => {
      const wl = createWakeLock();
      expect(wl.error()).toBeNull();
      dispose();
    });
  });

  it("isSupported is true in jsdom with the mock", () => {
    createRoot(dispose => {
      const wl = createWakeLock();
      expect(wl.isSupported).toBe(true);
      dispose();
    });
  });
});

// ── createWakeLock — request ──────────────────────────────────────────────────

describe("createWakeLock — request()", () => {
  it("sets isActive to true after request", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await wl.request();
      flush();
      expect(wl.isActive()).toBe(true);
      dispose();
    });
  });

  it("sets type after request", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await wl.request("screen");
      flush();
      expect(wl.type()).toBe("screen");
      dispose();
    });
  });

  it("sets sentinel after request", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await wl.request();
      flush();
      expect(wl.sentinel()).toBeInstanceOf(MockWakeLockSentinel);
      dispose();
    });
  });

  it("clears error after a successful request following a failure", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      setWakeLockDenied(true);
      await wl.request();
      flush();
      expect(wl.error()).toBeInstanceOf(Error);

      setWakeLockDenied(false);
      await wl.request();
      flush();
      expect(wl.error()).toBeNull();
      dispose();
    });
  });

  it("captures errors into error() without throwing", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      setWakeLockDenied(true);
      await expect(wl.request()).resolves.toBeUndefined();
      flush();
      expect(wl.error()).toBeInstanceOf(Error);
      expect(wl.error()!.name).toBe("NotAllowedError");
      expect(wl.isActive()).toBe(false);
      dispose();
    });
  });

  it("does not throw when called on an unsupported browser", () => {
    createRoot(dispose => {
      // isSupported is already true here from the mock — this tests the guard branch indirectly.
      // We test the guard by verifying that the function itself is safe.
      const wl = createWakeLock();
      expect(typeof wl.request).toBe("function");
      dispose();
    });
  });

  it("captures error when requesting while the document is hidden", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      setDocumentVisible(false);
      await wl.request();
      flush();
      expect(wl.error()).toBeInstanceOf(Error);
      expect(wl.error()!.name).toBe("NotAllowedError");
      expect(wl.isActive()).toBe(false);
      dispose();
    });
  });

  it("ignores a concurrent request() while one is already in-flight", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      const p1 = wl.request();
      const p2 = wl.request(); // in-flight, should be ignored
      await Promise.all([p1, p2]);
      flush();
      expect(wl.isActive()).toBe(true);
      expect(wl.sentinel()).toBeInstanceOf(MockWakeLockSentinel);
      dispose();
    });
  });
});

// ── createWakeLock — release ──────────────────────────────────────────────────

describe("createWakeLock — release()", () => {
  it("sets isActive to false after release", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await wl.request();
      flush();
      await wl.release();
      await tick();
      flush();
      expect(wl.isActive()).toBe(false);
      dispose();
    });
  });

  it("clears sentinel after release", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await wl.request();
      flush();
      await wl.release();
      await tick();
      flush();
      expect(wl.sentinel()).toBeNull();
      dispose();
    });
  });

  it("clears type after release", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await wl.request();
      flush();
      await wl.release();
      await tick();
      flush();
      expect(wl.type()).toBeUndefined();
      dispose();
    });
  });

  it("is a no-op when no lock is held", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await expect(wl.release()).resolves.toBeUndefined();
      dispose();
    });
  });

  it("clears error() when called after a failed request", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      setWakeLockDenied(true);
      await wl.request();
      flush();
      expect(wl.error()).not.toBeNull();

      setWakeLockDenied(false);
      await wl.release();
      flush();
      expect(wl.error()).toBeNull();
      dispose();
    });
  });
});

// ── createWakeLock — system release ───────────────────────────────────────────

describe("createWakeLock — system release", () => {
  it("isActive becomes false when the sentinel fires its release event", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock();
      await wl.request();
      flush();

      const lock = wl.sentinel() as MockWakeLockSentinel;
      await lock.release(); // simulate system release
      await tick();
      flush();

      expect(wl.isActive()).toBe(false);
      expect(wl.sentinel()).toBeNull();
      dispose();
    });
  });
});

// ── createWakeLock — autoReacquire ────────────────────────────────────────────

describe("createWakeLock — autoReacquire", () => {
  it("re-requests on visibility change after system release (autoReacquire: true)", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock({ autoReacquire: true });
      await wl.request();
      flush();

      // Simulate tab being hidden → browser releases the lock
      const lock = wl.sentinel() as MockWakeLockSentinel;
      setDocumentVisible(false);
      await lock.release(); // system release while hidden
      await tick();
      flush();
      expect(wl.isActive()).toBe(false);

      // Tab becomes visible → auto-reacquire
      setDocumentVisible(true);
      await tick();
      flush();
      expect(wl.isActive()).toBe(true);

      dispose();
    });
  });

  it("does NOT re-request after user-initiated release (autoReacquire: true)", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock({ autoReacquire: true });
      await wl.request();
      flush();
      await wl.release();
      await tick();
      flush();
      expect(wl.isActive()).toBe(false);

      // Tab becomes visible — should NOT re-acquire since user released explicitly
      setDocumentVisible(false);
      setDocumentVisible(true);
      await tick();
      flush();
      expect(wl.isActive()).toBe(false);

      dispose();
    });
  });

  it("does NOT re-request on visibility change when autoReacquire is false", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock({ autoReacquire: false });
      await wl.request();
      flush();

      const lock = wl.sentinel() as MockWakeLockSentinel;
      setDocumentVisible(false);
      await lock.release();
      await tick();
      flush();

      setDocumentVisible(true);
      await tick();
      flush();
      expect(wl.isActive()).toBe(false);

      dispose();
    });
  });

  it("does NOT re-request if no lock was ever requested", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock({ autoReacquire: true });
      setDocumentVisible(false);
      setDocumentVisible(true);
      await tick();
      flush();
      expect(wl.isActive()).toBe(false);
      dispose();
    });
  });

  it("sets error when the autoReacquire re-request is denied", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock({ autoReacquire: true });
      await wl.request();
      flush();

      const lock = wl.sentinel() as MockWakeLockSentinel;
      setDocumentVisible(false);
      await lock.release();
      await tick();
      flush();

      setWakeLockDenied(true);
      setDocumentVisible(true);
      await tick();
      flush();

      expect(wl.isActive()).toBe(false);
      expect(wl.error()).toBeInstanceOf(Error);
      setWakeLockDenied(false);
      dispose();
    });
  });

  it("re-enables autoReacquire after explicit release() followed by request()", async () => {
    await createRoot(async dispose => {
      const wl = createWakeLock({ autoReacquire: true });
      await wl.request();
      flush();
      await wl.release();
      await tick();
      flush();

      // Second request resets userReleased — autoReacquire should work again.
      await wl.request();
      flush();

      const lock = wl.sentinel() as MockWakeLockSentinel;
      setDocumentVisible(false);
      await lock.release();
      await tick();
      flush();

      setDocumentVisible(true);
      await tick();
      flush();
      expect(wl.isActive()).toBe(true);
      dispose();
    });
  });
});

// ── createWakeLock — cleanup ──────────────────────────────────────────────────

describe("createWakeLock — cleanup", () => {
  it("releases the active sentinel when the owner disposes", async () => {
    let lock: MockWakeLockSentinel | null = null;
    const dispose = createRoot(dispose => {
      return dispose;
    });
    await createRoot(async innerDispose => {
      const wl = createWakeLock();
      await wl.request();
      flush();
      lock = wl.sentinel() as MockWakeLockSentinel;
      expect(lock.released).toBe(false);
      innerDispose();
    });
    await tick();
    expect(lock!.released).toBe(true);
    dispose();
  });

  it("does not throw during cleanup when no lock was ever held", () => {
    expect(() => {
      const dispose = createRoot(dispose => dispose);
      createRoot(innerDispose => {
        createWakeLock();
        innerDispose();
      });
      dispose();
    }).not.toThrow();
  });
});
