import {
  createSignal,
  onCleanup,
  createEffect,
  untrack,
  type Accessor,
  type SignalOptions,
} from "solid-js";
/**
 * Primitives to manage timeout and interval.
 *
 * @module
 */
import { isServer } from "@solidjs/web";

/** A delay in milliseconds, or an {@link Accessor} of one, `false` to disable the timer. */
export type TimeoutSource = number | Accessor<number | false>;

/**
 * Create a timer ({@link setTimeout} or {@link setInterval}) and return a function to clear it.
 * Does not integrate with the reactive lifecycle — the caller is responsible for cleanup.
 *
 * @param fn Function to be called every {@link delay}.
 * @param delay Number representing the time between executions of {@link fn} in ms.
 * @param timer The timer to create: {@link setTimeout} or {@link setInterval}.
 * @returns Function to clear the timer.
 */
export const makeTimer = (
  fn: VoidFunction,
  delay: number,
  timer: typeof setTimeout | typeof setInterval,
): VoidFunction => {
  if (isServer) {
    return () => void 0;
  }
  const id = timer(fn, delay);
  return () => clearInterval(id);
};

/**
 * Create a timer ({@link setTimeout} or {@link setInterval})
 * with an optionally reactive delay.
 * If it changes, the elapsed fraction of the previous delay
 * will be counted as elapsed for the first new delay as well.
 *
 * @param fn Function to be called every {@link delay}.
 * @param delay Number or {@link Accessor} containing a number representing
 * the time between executions of {@link fn} in ms, or false to disable the timer.
 * @param timer The timer to create: {@link setTimeout} or {@link setInterval}.
 */
export const createTimer = (
  fn: VoidFunction,
  delay: TimeoutSource,
  timer: typeof setTimeout | typeof setInterval,
): void => {
  if (isServer) {
    return void 0;
  }
  if (typeof delay === "number") {
    onCleanup(makeTimer(fn, delay, timer));
    return;
  }

  let done = false;
  let prevTime = performance.now();
  let fractionDone = 0;
  let shouldHandleFraction = false;

  const callHandler = () => {
    untrack(fn);
    prevTime = performance.now();
    done = timer === setTimeout;
  };

  createEffect(
    () => delay(),
    (currDelay: number | false, prevDelay?: number | false) => {
      if (done) return;

      if (currDelay === false) {
        if (typeof prevDelay === "number") {
          fractionDone += (performance.now() - prevTime) / prevDelay;
        }
        return;
      }

      if (prevDelay === false) prevTime = performance.now();

      if (shouldHandleFraction) {
        if (typeof prevDelay === "number") {
          fractionDone += (performance.now() - prevTime) / prevDelay;
        }
        prevTime = performance.now();
        if (fractionDone >= 1) {
          fractionDone = 0;
          callHandler();
        } else if (fractionDone > 0) {
          const reconcileDelay = (1 - fractionDone) * currDelay;
          fractionDone = 0;
          let mainId: ReturnType<typeof timer> | undefined;
          const reconcileId = setTimeout(() => {
            shouldHandleFraction = false;
            callHandler();
            if (!done) {
              mainId = timer(callHandler, currDelay);
            }
          }, reconcileDelay);
          return () => {
            clearTimeout(reconcileId);
            if (mainId !== undefined) clearInterval(mainId);
          };
        }
      }

      fractionDone = 0;
      shouldHandleFraction = true;
      if (done) return () => {};
      const id = timer(callHandler, currDelay);
      return () => clearInterval(id);
    },
  );
};

/**
 * Like an interval from {@link createTimer}
 * except the timeout only updates between executions.
 *
 * @param handler Function to be called every {@link timeout}
 * @param timeout Number or Function returning a number representing the time
 * between executions of {@link handler} in ms, or false to disable looping.
 */
export const createTimeoutLoop = (handler: VoidFunction, timeout: TimeoutSource): void => {
  if (isServer) {
    return void 0;
  }
  if (typeof timeout === "number") {
    onCleanup(makeTimer(handler, timeout, setInterval));
    return;
  }
  const [currentTimeout, setCurrentTimeout] = createSignal(untrack(timeout));
  createEffect(
    () => {
      const t = timeout();
      const curr = currentTimeout();
      return curr === false ? t : curr;
    },
    (currTimeout: number | false) => {
      if (currTimeout === false) return () => {};
      const id = setInterval(() => {
        handler();
        setCurrentTimeout(timeout());
      }, currTimeout);
      return () => clearInterval(id);
    },
  );
};

/**
 * Polls a function periodically. Returns an {@link Accessor} containing the latest polled value.
 *
 * @param fn Function to be executed immediately, then every {@link timeout}.
 * @param timeout Number or {@link Accessor} containing a number representing
 * the time between executions of {@link fn} in ms, or false to disable polling.
 * @param value Initial value passed to {@link fn}. Defaults to undefined.
 * @param options Signal options for createSignal.
 * @returns An {@link Accessor} containing the latest polled value.
 * @example
 * const date = createPolled(() => new Date(), 1000);
 * date() // T: Date
 * // with reactive delay
 * const [delay, setDelay] = createSignal(1000);
 * createPolled(() => new Date(), delay);
 */
export function createPolled<T extends P, P = T>(
  fn: (prev: P | Exclude<undefined, P>) => T,
  timeout: TimeoutSource,
  value?: undefined,
  options?: SignalOptions<T>,
): Accessor<T>;
/** {@link createPolled} overload with an explicit initial `value` of a distinct type `I`. */
export function createPolled<T extends P, I = T, P = T>(
  fn: (prev: P | I) => T,
  timeout: TimeoutSource,
  value: I,
  options?: SignalOptions<T>,
): Accessor<T>;
/**
 * Implementation signature for the {@link createPolled} overloads above.
 * @internal
 */
export function createPolled<T>(
  fn: (prev: T | undefined) => T,
  timeout: TimeoutSource,
  value?: T,
  options?: SignalOptions<T>,
): Accessor<T> {
  if (isServer) {
    const v = fn(value);
    return () => v;
  }
  // A derived signal tracking `tick` (the timer) and fn's own reactive deps. It is returned
  // directly: mirroring it into a second signal from an effect would deliver every value one
  // flush late. Reading it after the owner is disposed returns the last value (the timer is
  // cleaned up with the owner, so nothing can invalidate it again).
  const [tick, setTick] = createSignal(0);
  const [polled] = createSignal<T>((prev: T | undefined) => {
    tick();
    return fn(prev !== undefined ? (prev as T) : value);
  }, options);
  createTimer(() => setTick(t => t + 1), timeout, setInterval);
  return polled;
}

/**
 * Creates a counter which increments periodically.
 *
 * @param timeout Number or {@link Accessor} containing a number representing
 * the time between increments in ms, or false to disable the counter.
 * @returns An {@link Accessor} containing the current count.
 */
export const createIntervalCounter = (
  timeout: TimeoutSource,
  options?: SignalOptions<number>,
): Accessor<number> => {
  if (isServer) {
    return () => 0;
  }
  return createPolled(prev => prev + 1, timeout, -1, options);
};
