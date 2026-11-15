import { createMemo, createSignal, For } from "solid-js";
import type { Accessor, Component, Setter, VoidComponent } from "solid-js";
import type { JSX } from "@solidjs/web";
import { INTERNAL_OPTIONS } from "@solid-primitives/utils";

export type TestPropType = "boolean" | "number" | "range" | "string" | "object";

export type TestPropObjectOptions<T> = T[] | Record<string, T> | any;

export type TestPropOptions<T> = (T extends undefined
  ? { initialValue?: T }
  : { initialValue: T }) & {
  min?: T extends number ? number : undefined;
  max?: T extends number ? number : undefined;
  step?: T extends number ? number : undefined;
  options?: TestPropObjectOptions<T>;
  type?: TestPropType;
};

export type TestPropReturn<T> = [value: Accessor<T>, setValue: Setter<T>, field: Component];

export type TestPropProps<T> = {
  name: string;
  value: Accessor<T>;
  setValue: Setter<T>;
  min?: T extends number ? number : undefined;
  max?: T extends number ? number : undefined;
  step?: T extends number ? number : undefined;
};

export const BoolProp: VoidComponent<TestPropProps<boolean>> = props => (
  <label>
    <input
      type="checkbox"
      name={props.name}
      checked={props.value()}
      onChange={ev => props.setValue(ev.currentTarget.checked)}
    />{" "}
    <span>{props.name}</span>{" "}
  </label>
);

export const NumberProp: VoidComponent<TestPropProps<number>> = props => (
  <label>
    <span>{props.name}</span>{" "}
    <input
      type="number"
      name={props.name}
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value()}
      onChange={ev => props.setValue(ev.currentTarget.valueAsNumber)}
    />{" "}
  </label>
);

export const RangeProp: VoidComponent<TestPropProps<number>> = props => (
  <label>
    <span>{props.name}</span>{" "}
    <input
      type="range"
      name={props.name}
      min={props.min ?? 0}
      max={props.max ?? 100}
      step={props.step}
      value={props.value()}
      onInput={ev => props.setValue(ev.currentTarget.valueAsNumber)}
      onChange={ev => props.setValue(ev.currentTarget.valueAsNumber)}
    />{" "}
    <span>{props.value()}</span>
  </label>
);

export const StringProp: VoidComponent<TestPropProps<string>> = props => (
  <label>
    <span>{props.name}</span>{" "}
    <input
      type="text"
      name={props.name}
      value={props.value()}
      onInput={ev => props.setValue(ev.currentTarget.value)}
      onChange={ev => props.setValue(ev.currentTarget.value)}
    />{" "}
  </label>
);

const filterEnum = <O extends Record<string, any>>(
  options: O,
): [key: string, value: number | string][] => {
  const entries = Object.entries(options);
  if (Object.keys(options).every(key => key === options[options[key] as keyof O].toString())) {
    return entries
      .reduce((items, [key, value]) => {
        if (!items.includes(key)) {
          items.push(value);
        }
        return items;
      }, [] as string[])
      .map(item => [item, options[item]]);
  }
  return entries;
};

export const SelectProp = <T,>(
  props: TestPropProps<T> & { options: TestPropObjectOptions<T> },
): JSX.Element => {
  const options = createMemo<[boolean | number | string, T][]>(() =>
    Array.isArray(props.options)
      ? props.options.map((option: any) => [option, option])
      : filterEnum(props.options),
  );
  const selectedIndex = createMemo(() => options().findIndex(([, v]) => v === props.value()));
  return (
    <label>
      <span>{props.name}</span>{" "}
      <select
        name={props.name}
        value={String(selectedIndex())}
        onChange={ev => {
          const item = options()[ev.currentTarget.selectedIndex];
          if (!item) return;
          props.setValue(item[1] as any);
        }}
      >
        <For each={options()} fallback={<option>options missing</option>}>
          {([key], index) => <option value={index()}>{key}</option>}
        </For>
      </select>{" "}
    </label>
  );
};

const defaultInitialValues: Record<TestPropType & string, boolean | number | string | undefined> = {
  boolean: false,
  number: 0,
  range: 0,
  string: "",
  object: undefined,
};

/**
 * creates a getter, a setter and a form control for a single prop
 *
 * @param name {string} The name of the property
 * @param options initialValue or Options object
 *
 * @example ```ts
 * createControlledProp('value', 'test');
 * createControlledProp('page', { initialValue: 7, min: 1, max: 99 });
 * createControlledProp('language', {
 *   initialValue: 'en',
 *   options: ['en', 'de', 'it', 'jp', 'cn', 'xy']
 * });
 * // => { value: Accessor<string>, setValue: Setter<string>, field: Component }
 * ```
 */
export function createControlledProp<T extends undefined>(
  name: string,
  options?: TestPropOptions<T>,
): TestPropReturn<T>;
export function createControlledProp<T = boolean>(
  name: string,
  options: TestPropOptions<T> | T,
): TestPropReturn<T>;
export function createControlledProp<T = number>(
  name: string,
  options: TestPropOptions<T> | T,
): TestPropReturn<T>;
export function createControlledProp<T = string>(
  name: string,
  options: TestPropOptions<T> | T,
): TestPropReturn<T>;
export function createControlledProp<T = any>(
  name: string,
  options: TestPropOptions<T>,
): TestPropReturn<T>;
export function createControlledProp<T>(
  name: string,
  options: T extends undefined
    ? never
    : T extends object
      ? TestPropOptions<T>
      : TestPropOptions<T> | T,
): TestPropReturn<T>;
export function createControlledProp<T>(
  name: string,
  options?: TestPropOptions<T> | T,
): TestPropReturn<T> {
  const initialValue: T | undefined =
    options == null
      ? undefined
      : typeof options !== "object"
        ? (options as T)
        : (((options as TestPropOptions<T>).initialValue as T | undefined) ??
          (defaultInitialValues[
            ((options as TestPropOptions<T>).type as
              keyof typeof defaultInitialValues | undefined) ?? "object"
          ] as T | undefined));

  if (initialValue == null) {
    throw new Error(`cannot get type for Prop ${name}`);
  }
  const propType = (options as TestPropOptions<T>).options
    ? "object"
    : ((options as TestPropOptions<T>).type ?? (typeof initialValue as TestPropType));

  const numOpts =
    options != null && typeof options === "object" ? (options as TestPropOptions<number>) : null;
  const min = numOpts?.min;
  const max = numOpts?.max;
  const step = numOpts?.step;

  const [value, setValue] = createSignal<T>(initialValue as Exclude<T, Function>, {
    ...INTERNAL_OPTIONS,
    name,
  });
  return [
    value,
    setValue,
    propType === "boolean"
      ? () => BoolProp({ name, value: value as any, setValue: setValue as any as Setter<boolean> })
      : propType === "number"
        ? () =>
            NumberProp({
              name,
              value: value as any,
              setValue: setValue as any as Setter<number>,
              min,
              max,
              step,
            })
        : propType === "range"
          ? () =>
              RangeProp({
                name,
                value: value as any,
                setValue: setValue as any as Setter<number>,
                min,
                max,
                step,
              })
          : propType === "string"
            ? () =>
                StringProp({
                  name,
                  value: value as any,
                  setValue: setValue as any as Setter<string>,
                })
            : () =>
                SelectProp<T>({
                  name,
                  value: value,
                  setValue: setValue,
                  options:
                    (options as TestPropOptions<T>).options ??
                    ([initialValue] as TestPropObjectOptions<T>),
                }),
  ];
}

export type CreateTestProps = <
  Props extends {
    [name: string]: boolean | number | string | TestPropOptions<boolean | number | string | object>;
  },
>(
  props: Props,
) => [
  props: {
    [name in keyof Props]: Accessor<
      Props[name] extends object
        ? Props[name]["options"] extends object
          ? Props[name]["options"][keyof Props[name]["options"]]
          : Props[name]["initialValue"]
        : Props[name] extends boolean
          ? boolean
          : Props[name]
    >;
  } & {
    [name in keyof Props as `set${Capitalize<name & string>}`]: Setter<
      Props[name] extends object
        ? Props[name]["options"] extends object
          ? Props[name]["options"][keyof Props[name]["options"]]
          : Props[name]["initialValue"]
        : Props[name] extends boolean
          ? boolean
          : Props[name]
    >;
  },
  fields: JSX.Element[],
];

/**
 * creates reactive props for testing a component
 *
 * @param props {Record<string, TestPropOptions>}
 * @returns ```ts
 * [
 *   props: { [name: string]: Accessor<T>, [setName: string]: Setter<T> }
 *   fields: JSX.Element[]
 * ]
 * ```
 * You get the fields to render the prop controls and getter and setter names derived from the name in `props` based on common practice, i.e. `count` would automatically translate to
 * ```ts
 * { count: Accessor<T>, getCount: Setter<T> }
 * ```
 * @example ```ts
 * const [props, fields] = createControlledProps({
 *   value: { initialValue: '' },
 *   disabled: { initialValue: false },
 *   invalid: { initialValue: false },
 *   type: { initialValue: 'text', options: ['text', 'password', 'email'] }
 * })
 * return <>
 *   <Input {...props} />
 *   {fields}
 * </>
 * ```
 */
export const createControlledProps: CreateTestProps = props =>
  Object.entries(props).reduce(
    (result, [name, options]) => {
      const [value, setValue, field] = createControlledProp(name, options as any);
      result[0][name] = value;
      result[0][`set${name.slice(0, 1).toUpperCase()}${name.slice(1)}`] = setValue;
      result[1].push(field({}));
      return result;
    },
    [{} as any, [] as JSX.Element[]],
  );
