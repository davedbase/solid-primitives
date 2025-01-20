<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Props" alt="Solid Primitives Props">
</p>

# @solid-primitives/props

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/props?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/props)
[![size](https://img.shields.io/npm/v/@solid-primitives/props?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/props)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Library of primitives focused around component props.

- [`combineProps`](#combineprops) - Reactively merges multiple props objects together while smartly combining some of Solid's JSX/DOM attributes.
- [`filterProps`](#filterprops) - Create a new props object with only the property names that match the predicate.

## Installation

```bash
npm install @solid-primitives/props
# or
yarn add @solid-primitives/props
# or
pnpm add @solid-primitives/props
```

## `combineProps`

A helper that reactively merges multiple props objects together while smartly combining some of Solid's JSX/HTML attributes.

Event handlers _(onClick, onclick, onMouseMove, onSomething)_, and refs _(props.ref)_ are chained.

`class`, `className`, `classList` and `style` are combined.

For all other props, the last prop object overrides all previous ones. Similarly to Solid's [mergeProps](https://www.solidjs.com/docs/latest/api#mergeprops).

### How to use it

```tsx
import { combineProps } from "@solid-primitives/props";

const MyButton: Component<ButtonProps> = props => {
  // primitives of a lot of headless ui libraries will provide props to spread
  const { buttonProps } = createButton();
  // they can be combined with user's props easily
  const combined = combineProps(props, buttonProps);

  return <button {...combined} />;
};

// component consumer can provide button props
// they will be combined with those provided by createButton() primitive
<MyButton style={{ margin: "24px" }} />;
```

#### Chaining of event listeners

Every [function/tuple](https://www.solidjs.com/docs/latest/api#on___) property with `on___` name get's chained. That could potentially include properties that are not actually event-listeners – such as `only` or `once`. Hence you should remove them from the props (with [splitProps](https://www.solidjs.com/docs/latest/api#splitprops)).

Chained functions will always return `void`. If you want to get the returned value from a callback, you have to split those props and handle them yourself.

**Warning:** The types for event-listeners often won't correctly represent the values. Chaining is meant only for DOM Events spreading to an element.

```ts
const combined = combineProps(
  {
    onClick: e => {},
    onclick: e => {},
  },
  {
    onClick: [(n, e) => {}, 123],
  },
);
// combined.onClick() will call all 3 of the functions above
```

The default order of execution is left-to-right. If you want to change it, you can use an options object as the last argument: (`reverseEventHandlers: true`)

```ts
const combined = combineProps(
  // props need to be passed in an array
  [{ onClick: () => console.log("parent") }, { onClick: () => console.log("child") }],
  {
    reverseEventHandlers: true,
  },
);
combined.onClick(); // "child" "parent"
```

##### For better reference of how exactly `combineProps` works, see the [TESTS](https://github.com/solidjs-community/solid-primitives/blob/main/packages/props/test/combineProps.test.ts)

### Additional helpers

A couple of lower-lever helpers that power `combineProps`:

#### `stringStyleToObject`

```ts
const styles = stringStyleToObject("margin: 24px; border: 1px solid #121212");
styles; // { margin: "24px", border: "1px solid #121212" }
```

#### `combineStyle`

```ts
const styles = combineStyle("margin: 24px; border: 1px solid #121212", {
  margin: "2rem",
  padding: "16px",
});
styles; // { margin: "2rem", border: "1px solid #121212", padding: "16px" }
```

### DEMO

https://codesandbox.io/s/combineprops-demo-ytw247?file=/index.tsx

## `filterProps`

A helper that creates a new props object with only the property names that match the predicate.

An alternative primitive to Solid's [splitProps](https://www.solidjs.com/docs/latest/api#splitprops) that will split the props eagerly, without letting you change the omitted keys afterwards.

The `predicate` is run for every property read lazily — any signal accessed within the `predicate` will be tracked, and `predicate` re-executed if changed.

### How to use it

Params:

- `props` — The props object to filter.
- `predicate` — A function that returns `true` if the property should be included in the filtered object.

Returns A new props object with only the properties that match the predicate.

```tsx
import { filterProps } from "@solid-primitives/props";

const MyComponent = props => {
  const dataProps = filterProps(props, key => key.startsWith("data-"));

  return <div {...dataProps} />;
};
```

### `createPropsPredicate`

Creates a predicate function that can be used to filter props by the prop name dynamically.

The provided `predicate` function get's wrapped with a cache layer to prevent unnecessary re-evaluation. If one property is requested multiple times, the `predicate` will only be evaluated once.

The cache is only cleared when the keys of the props object change. _(when spreading props from a singal)_ This also means that any signal accessed within the `predicate` won't be tracked.

```tsx
import { filterProps, createPropsPredicate } from "@solid-primitives/props";

const MyComponent = props => {
  const predicate = createPropsPredicate(props, key => key.startsWith("data-"));
  const dataProps = filterProps(props, predicate);

  return <div {...dataProps} />;
};
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
