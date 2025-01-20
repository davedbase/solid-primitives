<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Range" alt="Solid Primitives Range">
</p>

# @solid-primitives/range

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/range?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/range)
[![version](https://img.shields.io/npm/v/@solid-primitives/range?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/range)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-1.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Control Flow Primitives for displaying a number range or given number of elements.

- [`repeat`](#repeat) - Primitive for mapping a number of elements. Underlying helper for the [`<Repeat>`](#repeat-1) control flow.
- [`<Repeat>`](#repeat-1) - Control Flow Component for displaying a number of elements.
- [`mapRange`](#maprange) - Primitive for mapping a number range of given start, end, and step values. Underlying helper for the [`<Range>`](#range) control flow.
- [`<Range>`](#range) - Control Flow Component for displaying a number range of elements.
- [`indexRange`](#indexrange) - Primitive for mapping a number range while keeping previous elements of the same index. Underlying helper for the [`<IndexRange>`](#indexrange-1) control flow.
- [`<IndexRange>`](#indexrange-1) - Control Flow Component for displaying a number range of elements, where elements receive a number value as signal.

## Installation

```bash
npm install @solid-primitives/range
# or
yarn add @solid-primitives/range
```

## `repeat`

Reactively maps a number range of specified length with a callback function - underlying helper for the [`<Repeat>`](#repeat-1) control flow.

```ts
const [length, setLength] = createSignal(10)
const mapped = repeat(length, index => {
   const [value, setValue] = createSignal(index);
   createEffect(() => {...})
   return value
})
```

#### Definition

```ts
function repeat<T>(
  times: Accessor<number>,
  mapFn: (i: number) => T,
  options?: {
    fallback?: Accessor<T>;
  },
): Accessor<T[]>;
```

## `<Repeat>`

Control Flow component for displaying a specified number of elements.

The `times` prop is reactive – changing it will only create new elements for added numbers.

```tsx
<Repeat times={10}>
   <div></div>
</Repeat>

// with a render prop:
<Repeat times={10}>
   {n => <div>{n}</div>}
</Repeat>

// with fallback:
<Repeat times={0} fallback={<p>no items...</p>}>
   <div></div>
</Repeat>
```

#### Definition

```ts
function Repeat<T>(props: {
  times: number;
  fallback?: T;
  children: ((index: number) => T) | T;
}): Accessor<T[]>;
```

## `mapRange`

Reactively maps a number range of specified `stop`, `to` and `step`, with a callback function - underlying helper for the [`<Range>`](#range) control flow.

All `stop`, `to` and `step` arguments are accessors, and changing them will cause the mapped array to be recalculated, mapping new items for numbers added to the range.

`step` will become negative _(the range will be descending)_ if `to` is smaller than `start`. Range stops at `to`, it is not included in the range.

```ts
const [to, setTo] = createSignal(5)
const mapped = mapRange(() => 0, to, () => 0.5, number => {
   const [value, setValue] = createSignal(number);
   createEffect(() => {...})
   return value
})
mapped() // => [0, 0.5, 1, 1.5, 2...]
setTo(3) // changes the output array, mapping only added numbers
```

#### Definition

```ts
function mapRange<T>(
  start: Accessor<number>,
  to: Accessor<number>,
  step: Accessor<number>,
  mapFn: (n: number) => T,
  options?: {
    fallback?: Accessor<T>;
  },
): Accessor<T[]>;
```

## `<Range>`

Creates a list of elements by mapping a number range of specified `start`, `to`, and `step`.

All `stop`, `to` and `step` props are reactive, and changing them will cause the elements array to be recalculated, creating new elements for numbers added to the range.

- `start` defaults to 0.

- `to` defaults to 1. Range stops at `to`, it is not included in the range.

- `step` will become negative _(the range will be descending)_ if `to` is smaller than `start`.

```tsx
<Range start={2} to={14} step={0.5}>
   <div></div>
</Range>

// with a render prop:
<Range start={2} to={14} step={0.5}>
   {n => <div>{n}</div>}
</Range>

// with fallback:
<Range to={0}  fallback={<p>no items...</p>}>
   <div></div>
</Range>
```

Array spread shortcut:

```tsx
const [start, setStart] = createSignal(0);
const [to, setTo] = createSignal(10);
const [step, setStep] = createSignal(2);

<Range {...[start, to, step]} />
<Range {...[0, 10, 2]} />
<Range start={start()} to={to()} step={step()} />
```

#### Definition

`RangeProps` is an interface of `stop`, `to` and `step` props, OR `0`, `1` and `2` indexes of a spread array.

```ts
function Range<T>(
  props: RangeProps & {
    fallback?: T;
    children: ((number: number) => T) | T;
  },
): Accessor<T[]>;
```

## `indexRange`

Primitive for mapping a number range of specified `stop`, `to` and `step`, while keeping previous elements of the same index. Underlying helper for the [`<IndexRange>`](#indexrange-1) control flow.

All `stop`, `to` and `step` arguments are accessors, and changing them will cause the mapped array to be recalculated, mapping new items appended at the end of the range.

`step` will become negative _(the range will be descending)_ if `to` is smaller than `start`. Range stops at `to`, it is not included in the range.

```ts
const [to, setTo] = createSignal(5);
const mapped = indexRange(
  () => 0,
  to,
  () => 0.5,
  number => {
    const [value, setValue] = createSignal(number());
    createEffect(() => handleNewNumber(number()));
    return value;
  },
);
mapped(); // => [0, 0.5, 1, 1.5, 2...]
setTo(3); // changes the output array, mapping only added indexes
```

#### Definition

```ts
function indexRange<T>(
  start: Accessor<number>,
  to: Accessor<number>,
  step: Accessor<number>,
  mapFn: (n: Accessor<number>) => T,
  options?: {
    fallback?: Accessor<T>;
  },
): Accessor<T[]>;
```

## `<IndexRange>`

Control Flow Component for displaying a number range of elements, where elements receive a number value as signal, by mapping a number range of specified `start`, `to`, and `step`.

All `stop`, `to` and `step` props are reactive, and changing them will cause the elements array to be recalculated, creating new elements for numbers added to the range.

- `start` defaults to 0.

- `to` defaults to 1. Range stops at `to`, it is not included in the range.

- `step` will become negative _(the range will be descending)_ if `to` is smaller than `start`.

```tsx
<IndexRange start={2} to={14} step={0.5}>
   <div></div>
</IndexRange>

// with a render prop:
<IndexRange start={2} to={14} step={0.5}>
   {n => <div>{n()}</div>}
</IndexRange>

// with fallback:
<IndexRange to={0}  fallback={<p>no items...</p>}>
   <div></div>
</IndexRange>
```

Array spread shortcut:

```tsx
const [start, setStart] = createSignal(0);
const [to, setTo] = createSignal(10);
const [step, setStep] = createSignal(2);

<IndexRange {...[start, to, step]} />
<IndexRange {...[0, 10, 2]} />
<IndexRange start={start()} to={to()} step={step()} />
```

#### Definition

`RangeProps` is an interface of `stop`, `to` and `step` props, OR `0`, `1` and `2` indexes of a spread array.

```ts
function IndexRange<T>(
  props: RangeProps & {
    fallback?: T;
    children: ((number: Accessor<number>) => T) | T;
  },
): Accessor<T[]>;
```

## Demo

Codesandbox: https://codesandbox.io/s/solid-primitives-range-demo-y3sc5c?file=/index.tsx

## Possible improvements

###### (PRs Welcome)

- [ ] Currently the `mapRange` is handling decremanting ranges by swapping `start` and `to` with each other, and then cloning and reversing the mapped array. Doing this during the range mapping could possibly be more performant.
- [ ] For Ranges, because of how numbers are calculated, fractions might sometimes loose precision. E.g. a range from `1.64` to `2` by `0.2` step would generate numbers: `[1.64, 1.8399999999999999]` instead of `[1.64, 1.84]`.
- [ ] Both `mapRange` and `indexRange` are missing index arguments in the mapping function.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
