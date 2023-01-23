import { createEffect, createRoot, getOwner, onCleanup, runWithOwner } from "solid-js";
import type { Owner } from "solid-js/types/reactive/signal";
import { AnyFunction, asArray, access } from "@solid-primitives/utils";

/**
 * Creates a reactive **sub root**, that will be automatically disposed when it's owner does.
 *
 * @param fn a function in which the reactive state is scoped
 * @param owners reactive root dependency list – cleanup of any of them will trigger sub-root disposal. (Defaults to `getOwner()`)
 * @returns return values of {@link fn}
 *
 * @example
 * const owner = getOwner()
 * const [dispose, memo] = createSubRoot(dispose => {
 *    const memo = createMemo(() => {...})
 *    onCleanup(() => {...}) // <- will cleanup when branch/owner disposes
 *    return [dispose, memo]
 * }, owner, owner2);
 */
export function createSubRoot<T>(fn: (dispose: VoidFunction) => T, ...owners: (Owner | null)[]): T {
  if (owners.length === 0) owners = [getOwner()];
  return createRoot(dispose => {
    asArray(access(owners)).forEach(
      owner => owner && runWithOwner(owner, onCleanup.bind(void 0, dispose))
    );
    return fn(dispose);
  }, owners[0] || undefined);
}

/** @deprecated Renamed to `createSubRoot` */
export const createBranch = createSubRoot;

/**
 * A wrapper for creating callbacks with `runWithOwner`.
 * It gives you the option to use reactive primitives after root setup and outside of effects.
 *
 * @param callback function that will be ran with owner once called
 * @param owner a root that will trigger the cleanup (Defaults to `getOwner()`)
 * @returns the {@link callback} function
 *
 * @example
 * const handleClick = createCallback(() => {
 *    createEffect(() => {})
 * })
 */
export const createCallback = <T extends AnyFunction>(
  callback: T,
  owner: Owner | null = getOwner()
): T => (owner ? (((...args) => runWithOwner(owner, () => callback(...args))) as T) : callback);

/**
 * Executes {@link fn} in a {@link createSubRoot} *(auto-disposing root)*, and returns a dispose function, to dispose computations used inside before automatic cleanup.
 *
 * @param fn a function in which the reactive state is scoped
 * @returns root dispose function
 *
 * @example
 * ```ts
 * const dispose = createDisposable(dispose => {
 *    createEffect(() => {...})
 * });
 * // dispose later (if not, will dispose automatically)
 * dispose()
 * ```
 */
export function createDisposable(
  fn: (dispose: VoidFunction) => void,
  ...owners: (Owner | null)[]
): VoidFunction {
  return createSubRoot(dispose => {
    fn(dispose);
    return dispose;
  }, ...owners);
}

/**
 * Creates a reactive root that is shared across every instance it was used in. Shared root gets created when the returned function gets first called, and disposed when last reactive context listening to it gets disposed. Only to be recreated again when a new listener appears.
 * @param factory function where you initialize your reactive primitives
 * @returns function, registering reactive owner as one of the listeners, returns the value {@link factory} returned.
 * @see https://github.com/davedbase/solid-primitives/tree/main/packages/rootless#createSharedRoot
 * @example
 * const useState = createSharedScope(() => {
 *    return createMemo(() => {...})
 * });
 *
 * // later in a component:
 * const state = useState();
 * state()
 *
 * // in another component
 * // previously created primitive would get reused
 * const state = useState();
 * ...
 */
export function createSharedRoot<T>(factory: (dispose: VoidFunction) => T): () => T {
  let listeners = 0;
  let value: T | undefined;
  let dispose: VoidFunction | undefined;

  return () => {
    if (!dispose) {
      createRoot(_dispose => {
        value = factory(_dispose);
        dispose = _dispose;
      });
    }

    listeners++;
    getOwner() &&
      onCleanup(() => {
        listeners--;
        queueMicrotask(() => {
          if (listeners || !dispose) return;
          dispose();
          dispose = undefined;
          value = undefined;
        });
      });

    return value!;
  };
}

/**
 * Creates an effect that will not create a root/owner itself, but instead runs with the root/owner it is encompassed by.
 * @param callback function similar to `createEffect`'s callback-function.
 * @returns void.
 * @see https://github.com/davedbase/solid-primitives/tree/main/packages/rootless#createRootlessEffect
 * @example
 * createRoot(() => {
 *  const owner = getOwner();
 *  createRootlesEffect(() => {
 *    const effectOwner = getOwner();
 *    effectOwner === owner // true
 *  })
 *  createEffect(() => {
 *    const effectOwner = getOwner();
 *    effectOwner === owner // false
 *  })
 * })
 */

export function createRootlessEffect(callback: (prev: unknown) => void) {
  const owner = getOwner();
  createEffect(prev => (owner ? runWithOwner(owner, () => callback(prev)) : callback(prev)));
}
