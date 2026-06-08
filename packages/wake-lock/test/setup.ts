class MockWakeLockSentinel extends EventTarget {
  released = false;
  type: WakeLockType;

  constructor(type: WakeLockType) {
    super();
    this.type = type;
  }

  async release(): Promise<undefined> {
    if (!this.released) {
      this.released = true;
      this.dispatchEvent(new Event("release"));
    }
    return undefined;
  }
}

class MockWakeLock {
  private _denied = false;

  setDenied(denied: boolean): void {
    this._denied = denied;
  }

  async request(type: WakeLockType = "screen"): Promise<WakeLockSentinel> {
    if (this._denied) {
      throw new DOMException("Wake lock request denied", "NotAllowedError");
    }
    if (document.visibilityState === "hidden") {
      throw new DOMException("Document is not visible", "NotAllowedError");
    }
    return new MockWakeLockSentinel(type) as unknown as WakeLockSentinel;
  }
}

export const mockWakeLock = new MockWakeLock();

Object.defineProperty(navigator, "wakeLock", {
  configurable: true,
  value: mockWakeLock,
});

/**
 * Simulate a document visibility change.
 * Updates `document.visibilityState` and dispatches `visibilitychange`.
 */
export function setDocumentVisible(visible: boolean): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visible ? "visible" : "hidden",
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

/** Toggle whether all `navigator.wakeLock.request()` calls are rejected. */
export function setWakeLockDenied(denied: boolean): void {
  mockWakeLock.setDenied(denied);
}

export { MockWakeLockSentinel };
