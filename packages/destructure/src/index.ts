import { createMemo, Accessor, runWithOwner, getOwner, MemoOptions } from "solid-js";
import { access, MaybeAccessor, AnyObject, Values, AnyFunction } from "@solid-primitives/utils";

type ReactiveSource = [] | any[] | AnyObject;

export type DestructureOptions<T extends ReactiveSource> = MemoOptions<Values<T>> & {
  memo?: boolean | "normalize";
  lazy?: boolean;
  deep?: boolean;
};

type ReturnFunction<T> = T extends (...args: any[]) => any ? T : () => T;
type ReturnValue<T, N> = N extends true ? ReturnFunction<T> : Accessor<T>;

export type Spread<T extends ReactiveSource, N = false> = {
  readonly [K in keyof T]: ReturnValue<T[K], N>;
};

export type DeepSpread<T extends ReactiveSource, N = false> = {
  readonly [K in keyof T]: T[K] extends ReactiveSource
    ? T[K] extends AnyFunction
      ? ReturnValue<T[K], N>
      : DeepSpread<T[K], N>
    : ReturnValue<T[K], N>;
};
export type Destructure<T extends ReactiveSource, N = false> = {
  readonly [K in keyof T]-?: ReturnValue<T[K], N>;
};
export type DeepDestructure<T extends ReactiveSource, N = false> = {
  readonly [K in keyof T]-?: T[K] extends ReactiveSource
    ? T[K] extends AnyFunction
      ? ReturnValue<T[K], N>
      : DeepDestructure<T[K], N>
    : ReturnValue<T[K], N>;
};

const isReactiveObject = (value: any): boolean => typeof value === "object" && value !== null;

/**
 * Cashed object getters.
 * @description When a key is accessed for the first time, the `get` function is executed, later a cached value is used instead.
 */
function createProxyCache(obj: object, get: (key: any) => any): any {
  return new Proxy(
    {},
    {
      get: (target, key) => {
        if (key === Symbol.iterator || key === "length") return Reflect.get(obj, key);
        const saved = Reflect.get(target, key);
        if (saved) return saved;
        const value = get(key);
        Reflect.set(target, key, value);
        return value;
      },
      set: () => false,
    },
  );
}

/**
 * Destructures an reactive object *(e.g. store or component props)* or a signal of one into a tuple/map of signals for each object key.
 * @param source reactive object or signal returning one
 * @param options memo options + primitive configuration:
 * - `memo` - if true: wraps accessors in `createMemo`, making each property update independently. *(enabled by default for signal source)*
 * - `memo` - if "normalize": turn all static values to accessors e.g. `{ a: 1 } => { a: () => 1 }` but keep all functions and accessors as they are. So after destructuring all destructured props are functions
 * - `lazy` - property accessors are created on key read. enable if you want to only a subset of source properties, or use properties initially missing
 * - `deep` - destructure nested objects

 * @returns object of the same keys as the source, but with values turned into accessors.
 * @example // spread tuples
 * const [first, second, third] = destructure(() => [1,2,3])
 * first() // => 1
 * second() // => 2
 * third() // => 3
 * @example // spread objects
 * const { name, age } = destructure({ name: "John", age: 36 })
 * name() // => "John"
 * age() // => 36
 */
export function destructure<T extends ReactiveSource, O extends DestructureOptions<T>>(
  source: MaybeAccessor<T>,
  options?: O,
): O extends { lazy: true; deep: true }
  ? DeepDestructure<T, O["memo"] extends "normalize" ? true : false>
  : O extends { lazy: true }
  ? Destructure<T, O["memo"] extends "normalize" ? true : false>
  : O["deep"] extends true
  ? DeepSpread<T, O["memo"] extends "normalize" ? true : false>
  : Spread<T, O["memo"] extends "normalize" ? true : false> {
  const config: DestructureOptions<T> = options ?? {};
  const memo = config.memo ?? typeof source === "function";
  const getter = (key: any) => {
    const value = () => (typeof source === "function" ? source()[key] : source[key]);
    if (config.memo !== "normalize") return value;
    //Normalize
    const accessedValue = () => access(value());
    //If value is a function with params return the original function
    if (typeof accessedValue() === "function" && accessedValue().length) return value();
    return createMemo(accessedValue, undefined, options);
  };

  const obj = access(source);

  // lazy (use proxy)
  if (config.lazy) {
    const owner = getOwner()!;
    return createProxyCache(obj, key => {
      const calc = getter(key);
      if (config.deep && isReactiveObject(obj[key]))
        return runWithOwner(owner, () => destructure(calc, { ...config, memo }));
      return memo && config.memo !== "normalize"
        ? runWithOwner(owner, () => createMemo(calc, undefined, options))
        : calc;
    });
  }

  // eager (loop keys)
  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    const calc = getter(key);
    if (config.deep && isReactiveObject(value))
      result[key] = destructure(calc, { ...config, memo });
    else
      result[key] =
        memo && config.memo !== "normalize" ? createMemo(calc, undefined, options) : calc;
  }
  return result;
}
