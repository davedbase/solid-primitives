export type BaseRecordDict = Readonly<Record<string, unknown>>;
export type BaseArrayDict = readonly unknown[];
export type BaseDict = BaseRecordDict | BaseArrayDict;

const isDict = (value: unknown): value is BaseDict =>
  value != null &&
  ((value = Object.getPrototypeOf(value)), value === Array.prototype || value === Object.prototype);

const isRecordDict = (value: unknown): value is BaseRecordDict =>
  value != null && Object.getPrototypeOf(value) === Object.prototype;

type JoinPath<A, B> = A extends string | number
  ? B extends string | number
    ? `${A}.${B}`
    : A
  : B extends string | number
    ? B
    : "";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

/**
 * Flatten a nested dictionary into a flat dictionary.
 *
 * @example
 * ```typescript
 * type Dict = {
 *   a: {
 *     foo: string;
 *     b: { bar: number }
 *   }
 * }
 *
 * type FlatDict = Flatten<Dict>;
 *
 * type FlatDict = {
 *   a: {
 *     foo: string;
 *     b: { bar: number }
 *   },
 *   "a.foo": string;
 *   "a.b": { bar: number }
 *   "a.b.bar": number;
 * }
 * ```
 */
export type Flatten<Dict extends BaseDict, P = {}> = number extends Dict
  ? /* catch any */ BaseRecordDict
  : Dict extends (infer V)[]
    ? /* array */ { readonly [K in JoinPath<P, number>]?: V } & (V extends BaseDict
    ? Partial<Flatten<V, JoinPath<P, number>>>
    : {})
    : /* record */ UnionToIntersection<
    { [K in keyof Dict]: Dict[K] extends BaseDict ? Flatten<Dict[K], JoinPath<P, K>> : never }[keyof Dict]
  > & { readonly [K in keyof Dict as JoinPath<P, K>]: Dict[K] };

function flattenInternal(flat_dict: Record<string, unknown>, dict: BaseDict, scope?: string): void {
  const prefix = scope ? `${scope}.` : "";
  for (const [key, value] of Object.entries(dict)) {
    const key_path = `${prefix}${key}`;
    flat_dict[key_path] = value;
    isDict(value) && flattenInternal(flat_dict, value, key_path);
  }
}

/**
 * Flatten a nested dictionary into a flat dictionary.
 *
 * This way each nested property is available as a flat key.
 *
 * @example
 * ```typescript
 * const dict = {
 *   a: {
 *     foo: "foo",
 *     b: { bar: 1 }
 *   }
 * }
 *
 * const flat_dict = flatten(dict);
 *
 * flat_dict === {
 *   a: {
 *     foo: "foo",
 *     b: { bar: 1 }
 *   },
 *   "a.foo": "foo",
 *   "a.b": { bar: 1 },
 *   "a.b.bar": 1,
 * }
 * ```
 */
export function flatten<Dict extends BaseDict>(dict: Dict): Flatten<Dict> {
  const flat_dict: Record<string, unknown> = { ...dict };
  flattenInternal(flat_dict, dict)
  return flat_dict as Flatten<Dict>;
}

export type Prefixed<Dict extends BaseRecordDict, P extends string> = {
  readonly [K in keyof Dict as `${P}.${K & (string | number)}`]: Dict[K];
};

/**
 * Prefix all *(own)* keys in the dictionary with the provided prefix.
 *
 * Useful for namespacing a dictionary when combining multiple dictionaries.
 *
 * @example
 * ```typescript
 * const dict = {
 *   hello: "hello",
 *   goodbye: "goodbye",
 *   food: { meat: "meat" },
 * }
 *
 * const prefixed_dict = prefix(dict, "greetings");
 *
 * prefixed_dict === {
 *   "greetings.hello": "hello",
 *   "greetings.goodbye": "goodbye",
 *   "greetings.food": { meat: "meat" },
 * }
 * ```
 */
export const prefix: <Dict extends BaseRecordDict, P extends string>(
  dict: Dict,
  prefix: P,
) => Prefixed<Dict, P> = (dict: BaseRecordDict, prefix: string): any => {
  prefix += ".";
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(dict)) {
    result[prefix + key] = value;
  }
  return result;
};

export type BaseTemplateArgs<Args = string | number | boolean> = Record<string, Args>;

/**
 * A string branded with arguments needed to resolve the template.
 */
export type Template<T extends BaseTemplateArgs> = string & { _template_args: T };

export type TemplateArgs<T extends Template<any>> = T extends Template<infer R> ? R : never;

/**
 * Identity function that returns the same string branded as {@link Template} with the arguments needed to resolve the template.
 * Keep in mind that you may only use arguments of a type that is supported by your template resolver
 *
 * @example
 * ```typescript
 * const template = i18n.template<{ name: string }>("hello {{ name }}!");
 *
 * // same as
 * const template = "hello {{ name }}!" as Template<{ name: string }>;
 * ```
 */
export const template = <T extends BaseTemplateArgs>(source: string): Template<T> => source as any;


/**
 * Resolve a {@link Template} with the provided {@link TemplateArgs}.
 */
export type TemplateResolver<Out = string, Args = string | number | boolean> = <Dict extends string>(
  template: Dict,
  ...args: ResolveArgs<Dict, Args>
) => Out;

/**
 * Simple template resolver that replaces `{{ key }}` with the value of `args.key`.
 *
 * @example
 * ```typescript
 * resolveTemplate("hello {{ name }}!", { name: "John" });
 * // => "hello John!"
 * ```
 */
export const resolveTemplate: TemplateResolver = (value: string, args?: BaseTemplateArgs) => {
  if (typeof value == "string" && args)
    for (const [key, argValue] of Object.entries(args))
      value = value.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), argValue as string);
  return value;
};

/**
 * Template resolver that does nothing. It's used as a fallback when no template resolver is provided.
 */
export const identityResolveTemplate = (v => v) as TemplateResolver<any, any>;

export type Resolved<Value, Out> = Value extends (...args: any[]) => infer R ? R : Value extends string ? Out : Value;

export type ResolveArgs<Value, Args = string | number | boolean> = Value extends (...args: infer A) => any
  ? A
  : Value extends Template<infer R>
    ? (R extends BaseTemplateArgs<Args> ? [args: R] : [`Translator resolver doesn't fully support the argument types used in this template`])
    : Value extends BaseRecordDict ?
      [] :
      [args?: BaseTemplateArgs<Args>];

export type Resolver<Value, Out, Args> = (...args: ResolveArgs<Value, Args>) => Resolved<Value, Out>;
export type NullableResolver<T, Out, Args> = (...args: ResolveArgs<T, Args>) => Resolved<T, Out> | undefined;

export type Translator<Dict extends BaseRecordDict, Out = string, Args = string | number | boolean> = <K extends keyof Dict>(
  path: K,
  ...args: ResolveArgs<Dict[K], Args>
) => Resolved<Dict[K], Out>;

export type NullableTranslator<Dict extends BaseRecordDict, Out = string, Args = string | number | boolean> = <K extends keyof Dict>(
  path: K,
  ...args: ResolveArgs<Dict[K], Args>
) => Resolved<Dict[K], Out> | undefined;

/**
 * Create a translator function that will resolve the path in the dictionary and return the value.
 *
 * If the value is a function, it will call it with the provided arguments.
 *
 * If the value is a string, it will resolve the template using {@link resolveTemplate} with the provided arguments.
 *
 * Otherwise, it will return the value as is.
 *
 * @param dict A function that returns the dictionary to use for translation. Will be called on each translation.
 * @param resolveTemplate A function that will resolve the template. Defaults to {@link identityResolveTemplate}.
 *
 * @example
 * ```typescript
 * const dict = {
 *   hello: "hello {{ name }}!",
 *   goodbye: (name: string) => `goodbye ${name}!`,
 *   food: {
 *     meat: "meat",
 *   }
 * }
 * const flat_dict = i18n.flatten(dict);
 *
 * const t = i18n.translator(() => flat_dict, i18n.resolveTemplate);
 *
 * t("hello", { name: "John" }) // => "hello John!"
 * t("goodbye", "John") // => "goodbye John!"
 * t("food.meat") // => "meat"
 * ```
 */
export function translator<Dict extends BaseRecordDict, Out = string, Args = string | number | boolean>(
  dict: () => Dict,
  resolveTemplate?: TemplateResolver<Out, Args>,
): Translator<Dict, Out, Args>;
export function translator<Dict extends BaseRecordDict, Out = string, Args = string | number | boolean>(
  dict: () => Dict | undefined,
  resolveTemplate?: TemplateResolver<Out, Args>,
): NullableTranslator<Dict, Out, Args>;
export function translator<Dict extends BaseRecordDict, Out = string, Args = string | number | boolean>(
  dict: () => Dict | undefined,
  resolveTemplate: TemplateResolver<Out, Args> = identityResolveTemplate,
): Translator<Dict, Out, Args> {
  return (path, ...args) => {
    const value = dict()?.[path];
    switch (typeof value) {
      case "function":
        return value(...args);
      case "string":
        // @ts-expect-error: The types don't work out well, because of the template resolution,
        // but it shouldn't matter, because in the implementation we don't care about that
        return resolveTemplate(value, args[0])
      default:
        return value;
    }
  };
}

type InternalSplit<S extends string, D extends string> =
  S extends `${infer T}${D}${infer U}` ?
    "" | `${D}${T}${InternalSplit<U, D>}`
    : "";


type Split<S extends string, D extends string> =
  S extends `${infer T}${D}${infer U}` ?
    `${T}${InternalSplit<U, D>}`
    : "";

export type Scopes<T extends BaseRecordDict> = "" | undefined | null | Split<Extract<keyof T, string>, ".">

// this type does not work with a union type as Scope,
// it only works with a single string
export type Scoped<Dict extends BaseRecordDict, Scope extends Scopes<Dict>> =
    "" | undefined | null extends Scope ? Dict :
  { readonly [P in keyof Dict as P extends `${Scope}.${infer Rest}` ? Rest : never]: Dict[P] }

/**
 * Scopes the provided {@link Translator} to the given {@link scope}.
 *
 * @example
 * ```typescript
 * const dict = {
 *   greetings: {
 *     hello: "hello {{ name }}!",
 *     hi: "hi {{ name }}!",
 *   },
 *   goodbye: (name: string) => `goodbye ${name}!`,
 * }
 * const flat_dict = i18n.flatten(dict);
 *
 * const t = i18n.translator(() => flat_dict, i18n.resolveTemplate);
 *
 * const greetings = i18n.scopedTranslator(t, "greetings");
 *
 * greetings("hello", { name: "John" }) // => "hello John!"
 * greetings("hi", { name: "John" }) // => "hi John!"
 * greetings("goodbye", "John") // => undefined
 * ```
 */
export function scopedTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  translator: Translator<Dict, Out, Args>,
  scope: Scope,
): Translator<Scoped<Dict, Scope>, Out, Args>;
export function scopedTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  translator: NullableTranslator<Dict, Out, Args>,
  scope: Scope,
): NullableTranslator<Scoped<Dict, Scope>, Out, Args>;
export function scopedTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  translator: Translator<Dict, Out, Args>,
  scope: Scope,
): Translator<Scoped<Dict, Scope>, Out, Args> {
  // @ts-expect-error: Caused due to the scope not supporting union types
  return ((path, ...args) => translator(`${scope}.${path}` as keyof Dict, ...args));
}

export type ChainedTranslator<Dict extends BaseRecordDict, Out = string, Args = string | number | boolean> = {
  readonly [K in keyof Dict]: Dict[K] extends BaseRecordDict
    ? ChainedTranslator<Dict[K], Out, Args>
    : Resolver<Dict[K], Out, Args>;
};

export type NullableChainedTranslator<Dict extends BaseRecordDict, Out = string, Args = string | number | boolean> = {
  readonly [K in keyof Dict]: Dict[K] extends BaseRecordDict
    ? NullableChainedTranslator<Dict[K], Out, Args>
    : NullableResolver<Dict[K], Out, Args>;
};

/**
 * Create an object-chained translator that will resolve the path in the dictionary and return the value.
 *
 * @param init_dict The initial dictionary used for getting the structure of nested objects.
 * @param translate {@link Translator} function that will resolve the path in the dictionary and return the value.
 *
 * @param scope The initial path to use for the chained translator.
 * @example
 * ```typescript
 * const dict = {
 *   greetings: {
 *     hello: "hello {{ name }}!",
 *     hi: "hi!",
 *   },
 *   goodbye: (name: string) => `goodbye ${name}!`,
 * }
 * const flat_dict = i18n.flatten(dict);
 *
 * const t = i18n.translator(() => flat_dict, i18n.resolveTemplate);
 *
 * const chained = i18n.chainedTranslator(dict, t);
 *
 * chained.greetings.hello({ name: "John" }) // => "hello John!"
 * chained.greetings.hi() // => "hi!"
 * chained.goodbye("John") // => "goodbye John!"
 * ```
 */
export function chainedTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  init_dict: Dict,
  translate: Translator<Dict, Out, Args>,
  scope?: Scope,
): ChainedTranslator<Scoped<Dict, Scope>, Out, Args>;
export function chainedTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  init_dict: Dict,
  translate: NullableTranslator<Dict, Out, Args>,
  scope?: Scope,
): NullableChainedTranslator<Scoped<Dict, Scope>, Out, Args>;
export function chainedTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  init_dict: Dict,
  translate: Translator<Dict, Out, Args>,
  scope?: Scope,
): ChainedTranslator<Scoped<Dict, Scope>, Out, Args> {
  const result: any = {};
  const prefix = scope ? `${scope}.` : "";

  for (const [key, value] of Object.entries(init_dict)) {
    const key_path = `${prefix}${key}`;

    result[key] = isRecordDict(value) ?
      chainedTranslator(value, translate, key_path as Scopes<typeof value>) :
      (...args: ResolveArgs<Dict[string], Args>) => translate(key_path as keyof Dict, ...args);
  }

  return result;
}

/**
 * Create an object-chained translator *(implemented using a Proxy)* that will resolve the path in the dictionary and return the value.
 *
 * @param translate {@link Translator} function that will resolve the path in the dictionary and return the value.
 *
 * @param scope The initial path to use for the chained translator.
 * @example
 * ```typescript
 * const dict = {
 *   greetings: {
 *     hello: "hello {{ name }}!",
 *     hi: "hi!",
 *   },
 *   goodbye: (name: string) => `goodbye ${name}!`,
 * }
 * const flat_dict = i18n.flatten(dict);
 *
 * const t = i18n.translator(() => flat_dict, i18n.resolveTemplate);
 *
 * const proxy = i18n.proxyTranslator(t);
 *
 * proxy.greetings.hello({ name: "John" }) // => "hello John!"
 * proxy.greetings.hi() // => "hi!"
 * proxy.goodbye("John") // => "goodbye John!"
 * ```
 */
export function proxyTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  translate: Translator<Dict, Out, Args>,
  scope?: Scope,
): ChainedTranslator<Scoped<Dict, Scope>, Out, Args>;
export function proxyTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  translate: NullableTranslator<Dict, Out, Args>,
  scope?: Scope,
): NullableChainedTranslator<Scoped<Dict, Scope>, Out, Args>;
export function proxyTranslator<Dict extends BaseRecordDict, Out, Args, Scope extends Scopes<Dict>>(
  translate: Translator<Dict, Out, Args>,
  scope?: Scope,
): ChainedTranslator<Scoped<Dict, Scope>, Out, Args> {
  return new Proxy(translate.bind(void 0, scope ?? ""), new Traps(translate, scope));
}

class Traps<Dict extends BaseRecordDict, Out, Args> {
  private readonly prefix: string;

  constructor(
    private readonly translate: Translator<Dict, Out, Args>,
    scope: Scopes<Dict>,
  ) {
    this.prefix = scope ? `${scope}.` : "";
  }

  get(target: Translator<Dict, Out, Args>, prop: PropertyKey): any {
    if (typeof prop !== "string") return Reflect.get(target, prop);
    return (proxyTranslator as any)(this.translate, `${this.prefix}${prop}`);
  }

  has(target: Translator<Dict, Out, Args>, prop: PropertyKey): boolean {
    if (typeof prop !== "string") return Reflect.has(target, prop);
    return (proxyTranslator as any)(this.translate, `${this.prefix}${prop}`) !== undefined;
  }

  getOwnPropertyDescriptor(target: any, prop: PropertyKey): PropertyDescriptor | undefined {
    if (typeof prop !== "string") return Reflect.getOwnPropertyDescriptor(target, prop);
    return {
      enumerable: true,
      get: () => (proxyTranslator as any)(this.translate, `${this.prefix}${prop}`),
    };
  }
}
