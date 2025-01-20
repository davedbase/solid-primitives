<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=list" alt="Solid Primitives list">
</p>

# @solid-primitives/list

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/list?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/list)
[![version](https://img.shields.io/npm/v/@solid-primitives/list?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/list)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Package providing additional way to manage arrays. Alternative to `<For>` and `<Index>` that has reactive item value and reactive index. Focuses on avoiding recreation of mapped elements.

[`List`](#list) - Component that provides reactive item value and reactive index.
[`listArray`](#listarray) - Underlying helper for `<List>` unkeyed control flow, similar to `mapArray` and `indexArray`.

## Installation

```bash
npm install @solid-primitives/list
# or
yarn add @solid-primitives/list
# or
pnpm add @solid-primitives/list
```

## List

Example:

```tsx
function Component() {
  const [signal, setSignal] = createSignal([1, 2, 3]);

  return (
    <List each={signal()}>
      {(value, index) => {
        return (
          <div>
            {" "}
            {index()}: {value()}{" "}
          </div>
        );
      }}
    </List>
  );
}
```

Component similar to `<For>` and `<Index>`, but provides reactive item value and reactive index.

Every element is keyed by item reference and index, but item reference is prioritized. That means whenever element changes it's position in array, it's `index` signal will be updated and if element value is changed, it's `value` signal will be updated.

## listArray

Underlying helper for `<List>` unkeyed control flow. Returns array with elements mapped using provided mapping function.

Mapping function may use provided reactive value and reactive index, but signals for each of them are created only if they are used. Mapping function is ran only when original array has more elements than before. Elements are disposed only if original array has less elements than before.

## Demo

You can see the list in action in the following sandbox: https://primitives.solidjs.community/playground/list/

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
