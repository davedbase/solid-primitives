import { describe, expect, it } from "vitest";
import { makeWakeLock, createWakeLock } from "../src/index.js";

describe("SSR — makeWakeLock", () => {
  it("returns isSupported: false on server", () => {
    const wl = makeWakeLock();
    expect(wl.isSupported).toBe(false);
  });

  it("request() resolves to null on server", async () => {
    const { request } = makeWakeLock();
    await expect(request()).resolves.toBeNull();
  });

  it("release() resolves without throwing on server", async () => {
    const { release } = makeWakeLock();
    const stub = {} as WakeLockSentinel;
    await expect(release(stub)).resolves.toBeUndefined();
  });
});

describe("SSR — createWakeLock", () => {
  it("returns isSupported: false on server", () => {
    const wl = createWakeLock();
    expect(wl.isSupported).toBe(false);
  });

  it("isActive() returns false on server", () => {
    const wl = createWakeLock();
    expect(wl.isActive()).toBe(false);
  });

  it("type() returns undefined on server", () => {
    const wl = createWakeLock();
    expect(wl.type()).toBeUndefined();
  });

  it("sentinel() returns null on server", () => {
    const wl = createWakeLock();
    expect(wl.sentinel()).toBeNull();
  });

  it("error() returns null on server", () => {
    const wl = createWakeLock();
    expect(wl.error()).toBeNull();
  });

  it("request() resolves without throwing on server", async () => {
    const wl = createWakeLock();
    await expect(wl.request()).resolves.toBeUndefined();
  });

  it("release() resolves without throwing on server", async () => {
    const wl = createWakeLock();
    await expect(wl.release()).resolves.toBeUndefined();
  });
});
