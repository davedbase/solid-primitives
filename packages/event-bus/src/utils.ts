import { type AnyFunction } from "@solid-primitives/utils";
import { createEffect, createSignal, getOwner, runWithOwner } from "solid-js";
import type { Listen, Listener, Emit } from "./eventBus.ts";

/**
 * Turns a stream-like listen function, into a promise resolving when the first event is captured.
 * @param subscribe listen function from any EventBus/Emitter
 * @returns a promise resulting in the captured event value
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-bus#toPromise
 *
 * @example
 * const emitter = createEventBus<string>();
 * const event = await toPromise(emitter.listen);
 */
export function toPromise<T>(subscribe: Listen<T>): Promise<T> {
  return new Promise<T>(resolve => once(subscribe, resolve));
}

/**
 * Listen to any EventBus/Emitter, but the listener will automatically unsubscribe on the first captured event. So the callback will run only **once**.
 *
 * @param subscribe Emitter's `listen` function
 * @param listener callback called when an event is emitted
 *
 * @returns unsubscribe function
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-bus#once
 *
 * @example
 * const { listen, emit } = createEventBus<string>();
 * const unsub = once(listen, event => console.log(event));
 *
 * emit("foo") // will log "foo" and unsub
 *
 * emit("bar") // won't log
 */
export function once<T>(subscribe: Listen<T>, listener: Listener<T>): VoidFunction {
  const unsub = subscribe(payload => {
    unsub();
    listener(payload);
  });
  return unsub;
}

/**
 * Wraps `emit` calls inside a `createEffect`. It causes that listeners execute having an reactive owner available. It allows for usage of effects, memos and other primitives inside listeners, without having to create a synthetic root.
 *
 * @param emit the emit function of any emitter/event-bus
 * @returns modified emit function
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-bus#toEffect
 *
 * @example
 * const { listen, emit } = createEventBus();
 * const emitInEffect = toEffect(emit);
 * listen(() => console.log(getOwner()))
 *
 * // ...sometime later (after root initiation):
 * emit() // listener will log `null`
 * emitInEffect() // listener will log an owner object
 */
export function toEffect<T>(emit: Emit<T>): Emit<T> {
  const owner = getOwner();
  let queue: T[] = [];
  const [version, setVersion] = createSignal(0);
  createEffect(
    () => version(),
    () => {
      if (!queue.length) return;
      const batch = queue;
      queue = [];
      runWithOwner(owner, () => batch.forEach(emit as Emit<any>));
    },
  );
  return (payload?: any) => {
    // write the signal first: if it throws (e.g. called from an owned scope), nothing is left queued
    setVersion(v => v + 1);
    queue.push(payload);
  };
}

/**
 * In Solid 2.0 all signal writes are automatically batched via microtask. This function
 * is kept for backwards compatibility but is now a no-op — it simply returns the bus unchanged.
 *
 * @deprecated No-op in Solid 2.0 — batching is automatic. Remove the wrapper.
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-bus#batchEmits
 */
export function batchEmits<T extends { emit: AnyFunction }>(bus: T): T {
  return bus;
}
