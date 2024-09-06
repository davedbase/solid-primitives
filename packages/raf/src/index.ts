import { MaybeAccessor, noop } from "@solid-primitives/utils";
import { createSignal, createMemo, Accessor, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";

/**
 * A primitive creating reactive `window.requestAnimationFrame`, that is automatically disposed onCleanup.
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/raf#createRAF
 * @param callback The callback to run each frame
 * @returns Returns a signal if currently running as well as start and stop methods
 * ```ts
 * [running: Accessor<boolean>, start: VoidFunction, stop: VoidFunction]
 * ```
 *
 * @example
 * const [running, start, stop] = createRAF((timestamp) => {
 *    el.style.transform = "translateX(...)"
 * });
 */
function createRAF(
  callback: FrameRequestCallback,
): [running: Accessor<boolean>, start: VoidFunction, stop: VoidFunction] {
  if (isServer) {
    return [() => false, noop, noop];
  }
  const [running, setRunning] = createSignal(false);
  let requestID = 0;

  const loop: FrameRequestCallback = timeStamp => {
    requestID = requestAnimationFrame(loop);
    callback(timeStamp);
  };
  const start = () => {
    if (running()) return;
    setRunning(true);
    requestID = requestAnimationFrame(loop);
  };
  const stop = () => {
    setRunning(false);
    cancelAnimationFrame(requestID);
  };

  onCleanup(stop);
  return [running, start, stop];
}

/**
 * A primitive for wrapping `window.requestAnimationFrame` callback function to limit the execution of the callback to specified number of FPS.
 *
 * Keep in mind that limiting FPS is achieved by not executing a callback if the frames are above defined limit. This can lead to not consistant frame duration.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/raf#targetFPS
 * @param callback The callback to run each *allowed* frame
 * @param fps The target FPS limit
 * @returns Wrapped RAF callback
 *
 * @example
 * const [running, start, stop] = createRAF(
 *   targetFPS(() => {...}, 60)
 * );
 */
function targetFPS(
  callback: FrameRequestCallback,
  fps: MaybeAccessor<number>,
): FrameRequestCallback {
  if (isServer) {
    return callback;
  }
  const interval =
    typeof fps === "function"
      ? createMemo(() => Math.floor(1000 / fps()))
      : (() => {
          const newInterval = Math.floor(1000 / fps);
          return () => newInterval;
        })();

  let elapsed = 0;
  let lastRun = 0;
  let missedBy = 0;

  return timeStamp => {
    elapsed = timeStamp - lastRun;
    if (Math.ceil(elapsed + missedBy) >= interval()) {
      lastRun = timeStamp;
      missedBy = Math.max(elapsed - interval(), 0);
      callback(timeStamp);
    }
  };
}

export type MsCounter = (() => number) & {
  reset: () => void;
  running: () => boolean;
  start: () => void;
  stop: () => void;
};

/**
 * A primitive that creates a signal counting up milliseconds with a given frame rate to base your animations on.
 *
 * @param fps the frame rate, either as Accessor or number
 * @param limit an optional limit, either as Accessor or number, after which the counter is reset
 *
 * @returns an Accessor returning the current number of milliseconds and the following methods:
 * - `reset()`: manually resetting the counter
 * - `running()`: returns if the counter is currently setRunning
 * - `start()`: restarts the counter if stopped
 * - `stop()`: stops the counter if running
 *
 * ```ts
 * const ms = createMs(60);
 * createEffect(() => ms() > 500000 ? ms.stop());
 * return <rect x="0" y="0" height="10" width={Math.min(100, ms() / 5000)} />
 * ```
 */
function createMs(fps: MaybeAccessor<number>, limit?: MaybeAccessor<number>): MsCounter {
  const [ms, setMs] = createSignal(0);
  let initialTs = 0;
  const reset = () => {
    initialTs = 0;
  };
  const [running, start, stop] = createRAF(
    targetFPS(ts => {
      initialTs ||= ts;
      const ms = ts - initialTs;
      setMs(ts - initialTs);
      if (ms === (typeof limit === "function" ? limit() : limit)) reset();
    }, fps),
  );
  start();
  onCleanup(stop);
  return Object.assign(ms, { reset, running, start, stop });
}

export { createMs, createRAF, createRAF as default, targetFPS };
