import { accessWith, isObject, type SetterParam } from "@solid-primitives/utils";
import {
  type Accessor,
  createMemo,
  createSignal,
  type ComputeFunction,
  getObserver,
  type NoInfer,
  onSettled,
  sharedConfig,
  type Signal,
  type SignalOptions,
  untrack,
} from "solid-js";
import { isServer } from "@solidjs/web";

type Defined<T> = T extends undefined ? never : T;
export type MemoOptions<T> = Defined<Parameters<typeof createMemo<T>>[1]>;

export type StaticStoreSetter<T extends object> = {
  (setter: (prev: T) => Partial<T>): T;
  (state: Partial<T>): T;
  <K extends keyof T>(key: K, state: SetterParam<T[K]>): T;
};

/**
 * A shallowly wrapped reactive store object. It behaves similarly to the createStore, but with limited features to keep it simple. Designed to be used for reactive objects with static keys, but dynamic values, like reactive Event State, location, etc.
 * @param init initial value of the store
 * @returns tuple with the store object and a setter function
 * ```ts
 * [access: T, write: StaticStoreSetter<T>]
 * ```
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store#createStaticStore
 * @example
 * ```ts
 * const [size, setSize] = createStaticStore({ width: 0, height: 0 });
 *
 * el.addEventListener("resize", () => {
 *  setSize({ width: el.offsetWidth, height: el.offsetHeight });
 * });
 *
 * createEffect(() => {
 *   console.log(size.width, size.height);
 * })
 * ```
 */
export function createStaticStore<T extends Record<string, Exclude<unknown, Function>>>(
  init: T,
): [access: T, write: StaticStoreSetter<T>] {
  const copy = { ...init },
    store = { ...init },
    cache: Partial<Record<PropertyKey, Signal<T[keyof T]>>> = {};

  const getValue = (key: keyof T): T[keyof T] => {
    let signal = cache[key];
    if (!signal) {
      if (!getObserver()) return copy[key];
      cache[key] = signal = createSignal(copy[key] as Exclude<T[keyof T], Function>, { ownedWrite: true } as SignalOptions<T[keyof T]>);
      delete copy[key];
    }
    return signal[0]();
  };

  for (const key in init) {
    Object.defineProperty(store, key, { get: () => getValue(key), enumerable: true });
  }

  const setValue = (key: keyof T, value: SetterParam<any>): void => {
    const signal = cache[key];
    if (signal) return signal[1](value);
    if (key in copy) copy[key] = accessWith(value, copy[key]);
  };

  return [
    store,
    (a: ((prev: T) => Partial<T>) | Partial<T> | keyof T, b?: SetterParam<any>) => {
      if (isObject(a)) {
        const entries = untrack(
          () => Object.entries(accessWith(a, store) as Partial<T>) as [any, any][],
        );
        for (const [key, value] of entries) setValue(key, () => value);
      } else setValue(a, b);
      return store;
    },
  ];
}

/**
 * A hydratable version of the {@link createStaticStore}. It will use the {@link serverValue} on the server and the {@link update} function on the client. If initialized during hydration it will use {@link serverValue} as the initial value and update it once hydration is complete.
 *
 * @param serverValue initial value of the state on the server
 * @param update called once on the client or on hydration to initialize the value
 * @returns tuple with the store object and a setter function
 * ```ts
 * [access: T, write: StaticStoreSetter<T>]
 * ```
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store#createHydratableStaticStore
 */
export function createHydratableStaticStore<T extends Record<string, Exclude<unknown, Function>>>(
  serverValue: T,
  update: () => T,
): ReturnType<typeof createStaticStore<T>> {
  if (isServer) return createStaticStore(serverValue);

  if (sharedConfig.hydrating) {
    const [state, setState] = createStaticStore(serverValue);
    onSettled(() => { setState(update()); });
    return [state, setState];
  }

  return createStaticStore(update());
}

/**
 * A derived version of the {@link createStaticStore}. It will use the update function to derive the value of the store. It will only update when the dependencies of the update function change.
 * @param fn a reactive function to derive the value of the store
 * @returns a shallow, reactive, static store object
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store#createDerivedStaticStore
 * @example
 * ```ts
 * const [size, setSize] = createSignal({ width: 0, height: 0 });
 *
 * el.addEventListener("resize", () => {
 *  setSize({ width: el.offsetWidth, height: el.offsetHeight });
 * });
 *
 * const store = createDerivedStaticStore(size);
 *
 * createEffect(() => {
 *   console.log(store.width, store.height);
 * })
 * ```
 */
export function createDerivedStaticStore<Next extends Prev & object, Prev = Next>(
  fn: ComputeFunction<undefined | NoInfer<Prev>, Next>,
): Next {
  const fnMemo = createMemo(fn as ComputeFunction<undefined | NoInfer<Next>, Next>),
    store = { ...untrack(fnMemo) };

  // Eagerly create per-key memos so their child IDs are allocated at initialization
  // time on both server and client. The previous lazy approach created memos on first
  // reactive access — which happened inside _$className render-effect computes on the
  // client but not on the server (SSR doesn't run render-effect computes with a live
  // observer), shifting every subsequent hydration key by +1 per lazily-created memo.
  for (const key in store) {
    const k = key as keyof Next;
    const keyMemo = createMemo(() => fnMemo()[k]);
    Object.defineProperty(store, k, {
      get: () => keyMemo(),
      enumerable: true,
    });
  }

  return store;
}
