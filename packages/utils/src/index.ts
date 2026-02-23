import {
  getOwner,
  onCleanup,
  createSignal,
  type Accessor,
  untrack,
  type AccessorArray,
  type EffectFunction,
  type NoInfer,
  type SignalOptions,
  sharedConfig,
  onMount,
  DEV,
  equalFn,
} from "solid-js";
import { isServer } from "solid-js/web";
import type {
  AnyClass,
  MaybeAccessor,
  MaybeAccessorValue,
  Noop,
  AnyObject,
  AnyFunction,
} from "./types.js";

export * from "./types.js";

//
// GENERAL HELPERS:
//

export { isServer };
export const isClient = !isServer;
export const isDev = isClient && !!DEV;
export const isProd = !isDev;

/** no operation */
export const noop = (() => void 0) as Noop;
export const trueFn: () => boolean = () => true;
export const falseFn: () => boolean = () => false;

/** @deprecated use {@link equalFn} from "solid-js" */
export const defaultEquals = equalFn;

export const EQUALS_FALSE_OPTIONS = { equals: false } as const satisfies SignalOptions<unknown>;
export const INTERNAL_OPTIONS = { internal: true } as const satisfies SignalOptions<unknown>;

/**
 * Check if the value is an instance of ___
 */
export const ofClass = (v: any, c: AnyClass): boolean =>
  v instanceof c || (v && v.constructor === c);

/** Check if value is typeof "object" or "function" */
export function isObject(value: any): value is AnyObject {
  return value !== null && (typeof value === "object" || typeof value === "function");
}

export const isNonNullable = <T>(i: T): i is NonNullable<T> => i != null;
export const filterNonNullable = <T extends readonly unknown[]>(arr: T): NonNullable<T[number]>[] =>
  arr.filter(isNonNullable);

export const compare = (a: any, b: any): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Check shallow array equality
 */
export const arrayEquals = (a: readonly unknown[], b: readonly unknown[]): boolean =>
  a === b || (a.length === b.length && a.every((e, i) => e === b[i]));

/**
 * Returns a function that will call all functions in the order they were chained with the same arguments.
 */
export function chain<Args extends [] | any[]>(callbacks: {
  [Symbol.iterator](): IterableIterator<((...args: Args) => any) | undefined>;
}): (...args: Args) => void {
  return (...args: Args) => {
    for (const callback of callbacks) callback && callback(...args);
  };
}

/**
 * Returns a function that will call all functions in the reversed order with the same arguments.
 */
export function reverseChain<Args extends [] | any[]>(
  callbacks: (((...args: Args) => any) | undefined)[],
): (...args: Args) => void {
  return (...args: Args) => {
    for (let i = callbacks.length - 1; i >= 0; i--) {
      const callback = callbacks[i];
      callback && callback(...args);
    }
  };
}

export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/**
 * Accesses the value of a MaybeAccessor
 * @example
 * ```ts
 * access("foo") // => "foo"
 * access(() => "foo") // => "foo"
 * ```
 */
export const access = <T extends MaybeAccessor<any>>(v: T): MaybeAccessorValue<T> =>
  typeof v === "function" && !v.length ? v() : (v as any);

export const asArray = <T>(value: T): (T extends any[] ? T[number] : NonNullable<T>)[] =>
  Array.isArray(value) ? (value as any) : value ? [value as any] : [];

/**
 * Access an array of MaybeAccessors
 * @example
 * const list = [1, 2, () => 3)] // T: MaybeAccessor<number>[]
 * const newList = accessArray(list) // T: number[]
 */
export const accessArray = <A extends MaybeAccessor<any>>(
  list: readonly A[],
): MaybeAccessorValue<A>[] => list.map(v => access(v));

/**
 * Run the function if the accessed value is not `undefined` nor `null`
 * @param value
 * @param fn
 */
export const withAccess = <T, A extends MaybeAccessor<T>, V = MaybeAccessorValue<A>>(
  value: A,
  fn: (value: NonNullable<V>) => void,
) => {
  const _value = access(value);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  typeof _value != null && fn(_value as NonNullable<V>);
};

export const asAccessor = <A extends MaybeAccessor<unknown>>(
  v: A,
): Accessor<MaybeAccessorValue<A>> => (typeof v === "function" ? (v as any) : () => v as any);

/** If value is a function – call it with a given arguments – otherwise get the value as is */
export function accessWith<T>(
  valueOrFn: T,
  ...args: T extends AnyFunction ? Parameters<T> : never
): T extends AnyFunction ? ReturnType<T> : T {
  return typeof valueOrFn === "function" ? valueOrFn(...args) : (valueOrFn as any);
}

/**
 * Solid's `on` helper, but always defers and returns a provided initial value when if does instead of `undefined`.
 *
 * @param deps
 * @param fn
 * @param initialValue
 */
export function defer<S, Next extends Prev, Prev = Next>(
  deps: AccessorArray<S> | Accessor<S>,
  fn: (input: S, prevInput: S, prev: undefined | NoInfer<Prev>) => Next,
  initialValue: Next,
): EffectFunction<undefined | NoInfer<Next>, NoInfer<Next>>;
export function defer<S, Next extends Prev, Prev = Next>(
  deps: AccessorArray<S> | Accessor<S>,
  fn: (input: S, prevInput: S, prev: undefined | NoInfer<Prev>) => Next,
  initialValue?: undefined,
): EffectFunction<undefined | NoInfer<Next>>;
export function defer<S, Next extends Prev, Prev = Next>(
  deps: AccessorArray<S> | Accessor<S>,
  fn: (input: S, prevInput: S, prev: undefined | NoInfer<Prev>) => Next,
  initialValue?: Next,
): EffectFunction<undefined | NoInfer<Next>> {
  const isArray = Array.isArray(deps);
  let prevInput: S;
  let shouldDefer = true;
  return prevValue => {
    let input: S;
    if (isArray) {
      input = Array(deps.length) as S;
      for (let i = 0; i < deps.length; i++) (input as any[])[i] = deps[i]();
    } else input = deps();
    if (shouldDefer) {
      shouldDefer = false;
      prevInput = input;
      return initialValue;
    }
    const result = untrack(() => fn(input, prevInput, prevValue));
    prevInput = input;
    return result;
  };
}

/**
 * Get entries of an object
 */
export const entries = Object.entries as <T extends object>(obj: T) => [keyof T, T[keyof T]][];

/**
 * Get keys of an object
 */
export const keys = Object.keys as <T extends object>(object: T) => (keyof T)[];

/**
 * Solid's `onCleanup` that doesn't warn in development if used outside of a component.
 */
export const tryOnCleanup: typeof onCleanup = isDev
  ? fn => (getOwner() ? onCleanup(fn) : fn)
  : onCleanup;

export const createCallbackStack = <A0 = void, A1 = void, A2 = void, A3 = void>(): {
  push: (...callbacks: ((arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void)[]) => void;
  execute: (arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void;
  clear: VoidFunction;
} => {
  let stack: Array<(arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void> = [];
  const clear: VoidFunction = () => (stack = []);
  return {
    push: (...callbacks) => stack.push(...callbacks),
    execute(arg0, arg1, arg2, arg3) {
      stack.forEach(cb => cb(arg0, arg1, arg2, arg3));
      clear();
    },
    clear,
  };
};

/**
 * Group synchronous function calls.
 * @param fn
 * @returns `fn`
 */
export function createMicrotask<A extends any[] | []>(fn: (...a: A) => void): (...a: A) => void {
  let calls = 0;
  let args: A;
  onCleanup(() => (calls = 0));
  return (...a: A) => {
    (args = a), calls++;
    queueMicrotask(() => --calls === 0 && fn(...args));
  };
}

/**
 * A hydratable version of the {@link createSignal}. It will use the serverValue on the server and the update function on the client. If initialized during hydration it will use serverValue as the initial value and update it once hydration is complete.
 *
 * @param serverValue initial value of the state on the server
 * @param update called once on the client or on hydration to initialize the value
 * @param options {@link SignalOptions}
 * @returns
 * ```ts
 * [state: Accessor<T>, setState: Setter<T>]
 * ```
 * @see {@link createSignal}
 */
export function createHydratableSignal<T>(
  serverValue: T,
  update: () => T,
  options?: SignalOptions<T>,
): ReturnType<typeof createSignal<T>> {
  if (isServer) {
    return createSignal(serverValue, options);
  }
  if (sharedConfig.context) {
    const [state, setState] = createSignal(serverValue, options);
    onMount(() => setState(() => update()));
    return [state, setState];
  }
  return createSignal(update(), options);
}

/** @deprecated use {@link createHydratableSignal} instead */
export const createHydrateSignal = createHydratableSignal;

/**
 * Handle items removed and added to the array by diffing it by refference.
 *
 * @param current new array instance
 * @param prev previous array copy
 * @param handleAdded called once for every added item to array
 * @param handleRemoved called once for every removed from array
 */
export function handleDiffArray<T>(
  current: readonly T[],
  prev: readonly T[],
  handleAdded: (item: T) => void,
  handleRemoved: (item: T) => void,
): void {
  const currLength = current.length;
  const prevLength = prev.length;
  let i = 0;

  if (!prevLength) {
    for (; i < currLength; i++) handleAdded(current[i]!);
    return;
  }

  if (!currLength) {
    for (; i < prevLength; i++) handleRemoved(prev[i]!);
    return;
  }

  for (; i < prevLength; i++) {
    if (prev[i] !== current[i]) break;
  }

  let prevEl: T;
  let currEl: T;
  prev = prev.slice(i);
  current = current.slice(i);

  for (prevEl of prev) {
    if (!current.includes(prevEl)) handleRemoved(prevEl);
  }
  for (currEl of current) {
    if (!prev.includes(currEl)) handleAdded(currEl);
  }
}

// ─── String transforms ────────────────────────────────────────────────────────

/**
 * Parse a string as a single JSON value.
 *
 * ```ts
 * const { data } = createSSE<{ status: string }>(url, { transform: json });
 * ```
 */
export const json = <T>(raw: string): T => JSON.parse(raw) as T;

/**
 * Parse a string as newline-delimited JSON (NDJSON / JSON Lines).
 *
 * Each non-empty line is parsed as a separate JSON value and returned as an array.
 *
 * ```ts
 * const { data } = createSSE<TickEvent[]>(url, { transform: ndjson });
 * // data() === [{ id: 1, type: "tick" }, { id: 2, type: "tick" }]
 * ```
 */
export const ndjson = <T>(raw: string): T[] =>
  raw
    .split("\n")
    .filter(line => line !== "")
    .map(line => JSON.parse(line) as T);

/**
 * Split a string into individual lines, returning a `string[]`. Empty lines are filtered out.
 *
 * ```ts
 * const { data } = createSSE<string[]>(url, { transform: lines });
 * // data() === ["line one", "line two"]
 * ```
 */
export const lines = (raw: string): string[] => raw.split("\n").filter(line => line !== "");

/**
 * Parse a string as a number using `Number()` semantics.
 *
 * Note: `""` → `0`, non-numeric strings → `NaN`.
 *
 * ```ts
 * const { data } = createSSE<number>(url, { transform: number });
 * // data() === 42
 * ```
 */
export const number = (raw: string): number => Number(raw);

/**
 * Wrap any `(string) => T` transform in a `try/catch`. Returns `fallback`
 * (default `undefined`) instead of throwing on malformed input.
 *
 * ```ts
 * const { data } = createSSE<MyEvent>(url, { transform: safe(json) });
 * const { data } = createSSE<number>(url, { transform: safe(number, 0) });
 * ```
 */
export function safe<T>(transform: (raw: string) => T): (raw: string) => T | undefined;
export function safe<T>(transform: (raw: string) => T, fallback: T): (raw: string) => T;
export function safe<T>(
  transform: (raw: string) => T,
  fallback?: T,
): (raw: string) => T | undefined {
  return (raw: string): T | undefined => {
    try {
      return transform(raw);
    } catch {
      return fallback;
    }
  };
}

/**
 * Compose two transforms into one: the output of `a` is passed as the input of `b`.
 *
 * ```ts
 * const { data } = createSSE<RawEvent[]>(url, {
 *   transform: pipe(ndjson<RawEvent>, rows => rows.filter(r => r.type === "tick")),
 * });
 * ```
 */
export function pipe<A, B>(a: (raw: string) => A, b: (a: A) => B): (raw: string) => B {
  return (raw: string): B => b(a(raw));
}
