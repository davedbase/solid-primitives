import { createSignal, onCleanup, type Accessor } from "solid-js";
import { isServer } from "@solidjs/web";
import { INTERNAL_OPTIONS, noop } from "@solid-primitives/utils";

export type MakeWakeLockReturn = {
  /** Whether the Screen Wake Lock API is available in this browser. */
  isSupported: boolean;
  /**
   * Request a wake lock of the given type.
   *
   * Throws a `DOMException` if the document is hidden or the request is denied.
   * Returns `null` when the API is not supported.
   */
  request: (type?: WakeLockType) => Promise<WakeLockSentinel | null>;
  /** Release a held sentinel. No-op if the sentinel has already been released. */
  release: (sentinel: WakeLockSentinel) => Promise<void>;
};

export type CreateWakeLockOptions = {
  /**
   * Re-request the lock automatically when the tab becomes visible again after
   * being hidden. The browser releases all wake locks on tab hide.
   * @default true
   */
  autoReacquire?: boolean;
};

export type WakeLockReturn = {
  /** Whether the Screen Wake Lock API is available in this browser. Static — does not change. */
  isSupported: boolean;
  /** Whether a wake lock is currently held. */
  isActive: Accessor<boolean>;
  /** The type of the currently active lock, or `undefined` when none is held. */
  type: Accessor<WakeLockType | undefined>;
  /** The underlying `WakeLockSentinel`, or `null` when no lock is held. */
  sentinel: Accessor<WakeLockSentinel | null>;
  /**
   * The last error produced by a failed `request()` call, or `null` when the
   * most recent request succeeded or no request has been made.
   */
  error: Accessor<Error | null>;
  /**
   * Request a wake lock of the given type. Errors are captured into the `error`
   * accessor rather than thrown.
   */
  request: (type?: WakeLockType) => Promise<void>;
  /** Release the currently held wake lock. No-op when no lock is held. */
  release: () => Promise<void>;
};

/**
 * Non-reactive low-level wrapper for the Screen Wake Lock API.
 *
 * No Solid owner required — the caller manages sentinel lifecycle manually.
 *
 * @example
 * ```ts
 * const { isSupported, request, release } = makeWakeLock();
 * if (isSupported) {
 *   const sentinel = await request("screen");
 *   // ... later
 *   if (sentinel) await release(sentinel);
 * }
 * ```
 */
export function makeWakeLock(): MakeWakeLockReturn {
  if (isServer) {
    return {
      isSupported: false,
      request: async () => null,
      release: async () => undefined,
    };
  }

  const isSupported = "wakeLock" in navigator;

  const request = async (type: WakeLockType = "screen"): Promise<WakeLockSentinel | null> => {
    if (!isSupported) return null;
    return navigator.wakeLock.request(type);
  };

  const release = async (sentinel: WakeLockSentinel): Promise<void> => {
    if (!sentinel.released) await sentinel.release();
  };

  return { isSupported, request, release };
}

/**
 * Reactive primitive for the Screen Wake Lock API.
 *
 * Manages the `WakeLockSentinel` internally, exposes reactive state signals,
 * and optionally re-acquires the lock when the tab regains visibility.
 * Releases the lock automatically when the Solid owner disposes.
 *
 * @param options.autoReacquire Re-request on tab-visible after system release. Default: `true`.
 *
 * @example
 * ```ts
 * const wl = createWakeLock();
 *
 * // Request the lock (e.g., when a video starts playing)
 * await wl.request("screen");
 *
 * // Observe state reactively
 * createEffect(() => console.log("lock active:", wl.isActive()));
 *
 * // Release explicitly (e.g., when the video pauses)
 * await wl.release();
 * ```
 */
export function createWakeLock(options: CreateWakeLockOptions = {}): WakeLockReturn {
  const { autoReacquire = true } = options;

  if (isServer) {
    return {
      isSupported: false,
      isActive: () => false,
      type: () => undefined,
      sentinel: () => null,
      error: () => null,
      request: async () => undefined,
      release: async () => undefined,
    };
  }

  const isSupported = "wakeLock" in navigator;

  const [sentinel, setSentinel] = createSignal<WakeLockSentinel | null>(null, INTERNAL_OPTIONS);
  const [isActive, setIsActive] = createSignal(false, INTERNAL_OPTIONS);
  const [type, setType] = createSignal<WakeLockType | undefined>(undefined, INTERNAL_OPTIONS);
  const [error, setError] = createSignal<Error | null>(null, INTERNAL_OPTIONS);

  let lastRequestedType: WakeLockType = "screen";
  let userReleased = false;
  let wasRequested = false;

  const handleSentinelRelease = () => {
    setSentinel(null);
    setIsActive(false);
    setType(undefined);
  };

  const request = async (lockType: WakeLockType = "screen"): Promise<void> => {
    if (!isSupported) return;
    try {
      userReleased = false;
      wasRequested = true;
      lastRequestedType = lockType;
      setError(null);

      // Remove listener from any previous sentinel before replacing it.
      const prev = sentinel();
      if (prev) prev.removeEventListener("release", handleSentinelRelease);

      const lock = await navigator.wakeLock.request(lockType);

      setSentinel(lock);
      setIsActive(true);
      setType(lockType);
      // once: true auto-removes the listener after the first fire.
      lock.addEventListener("release", handleSentinelRelease, { once: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        const msg =
          err != null && typeof (err as any).message === "string"
            ? (err as any).message
            : String(err);
        const e = new Error(msg);
        if (err != null && typeof (err as any).name === "string") e.name = (err as any).name;
        setError(e);
      }
    }
  };

  const release = async (): Promise<void> => {
    userReleased = true;
    const lock = sentinel();
    if (lock && !lock.released) {
      await lock.release();
      // handleSentinelRelease fires via the sentinel's "release" event.
    }
  };

  if (autoReacquire) {
    const onVisibilityChange = async () => {
      if (document.visibilityState === "visible" && wasRequested && !userReleased && !isActive()) {
        await request(lastRequestedType);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    onCleanup(() => document.removeEventListener("visibilitychange", onVisibilityChange));
  }

  onCleanup(() => {
    const lock = sentinel();
    if (lock && !lock.released) {
      lock.removeEventListener("release", handleSentinelRelease);
      lock.release().catch(noop);
    }
  });

  return { isSupported, isActive, type, sentinel, error, request, release };
}
