<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Context" alt="Solid Primitives Context">
</p>

# @solid-primitives/context

[![docs](https://img.shields.io/badge/-docs-blue?style=for-the-badge)](https://primitives.solidjs.community/package/context)
[![size](https://img.shields.io/badge/size-502_B-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/context)
[![version](https://img.shields.io/npm/v/@solid-primitives/context?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/context)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Primitives simplifying the creation and use of SolidJS Context API.

- [`createContextProvider`](#createcontextprovider) - Create the Context Provider component and useContext function with types inferred from the factory function.
- [`createOptionalContextProvider`](#createoptionalcontextprovider) - Like `createContextProvider`, but returns `undefined` instead of throwing if the context is missing.
- [`createLayeredContext`](#createlayeredcontext) - Like `createContextProvider`, but each provider extends the parent context value rather than replacing it.
- [`MultiProvider`](#multiprovider) - A component that allows you to provide multiple contexts at once.
- [`ContextConsumer`](#contextconsumer) - A component that allows you to consume contexts directly within JSX.

## Installation

```bash
npm install @solid-primitives/context
# or
pnpm add @solid-primitives/context
# or
yarn add @solid-primitives/context
```

Requires `solid-js@^2.0.0-beta.13` and `@solidjs/web@^2.0.0-beta.13`.

## `createContextProvider`

Create the Context Provider component and useContext function with types inferred from the factory function.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createContextProvider } from "@solid-primitives/context";

const [CounterProvider, useCounter] = createContextProvider((props: { initial: number }) => {
  const [count, setCount] = createSignal(props.initial);
  return { count, increment: () => setCount(n => n + 1) };
});

function Counter(props: { label: string }) {
  const { count, increment } = useCounter();
  return (
    <button onClick={increment}>
      {props.label}: {count()}
    </button>
  );
}

function Demo() {
  return (
    <CounterProvider initial={1}>
      <Counter label="A" />
      <Counter label="B (same counter)" />
    </CounterProvider>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### How to use it

Given a factory function, `createContextProvider` creates a SolidJS Context and returns both a Provider component for setting the context, and a useContext helper for getting the context. The factory function gets called when the provider component gets executed; all `props` of the provider component get passed into the factory function, and what it returns will be available in the contexts for all the underlying components. The types of the provider props and context are inferred from the factory function.

```tsx
import { createContextProvider } from "@solid-primitives/context";

const [CounterProvider, useCounter] = createContextProvider((props: { initial: number }) => {
  const [count, setCount] = createSignal(props.initial);
  const increment = () => setCount(count() + 1);
  return { count, increment };
});

// Provide the context
<CounterProvider initial={1}>
  <App />
</CounterProvider>;

// Use the context in a child component
const ctx = useCounter();
ctx; // T: { count: () => number; increment: () => void; }
```

### Providing context fallback

The `createContextProvider` primitive takes a second, optional argument for providing context defaults for when the context wouldn't be provided higher in the component tree.
If no fallback is provided, the `useContext` function will throw when the context is not provided.

```ts
const [CounterProvider, useCounter] = createContextProvider(
  () => {
    const [count, setCount] = createSignal(0);
    const increment = () => setCount(count() + 1);
    return { count, increment };
  },
  {
    count: () => 0,
    increment: () => {},
  },
);

// then when using the context:
const { count } = useCounter();
```

The `useContext` function always returns `Exclude<T, undefined>`. If the factory or fallback value is `undefined`, Solid treats the value as missing and `useContext` will throw instead of returning it.

### Debug name

An optional `name` can be passed as part of the third argument. It labels the context's Symbol for Solid DevTools and improves `ContextNotFoundError` stack traces (dev mode only).

```ts
const [ThemeProvider, useTheme] = createContextProvider(() => createTheme(), defaultTheme, {
  name: "Theme",
});
```

## `createOptionalContextProvider`

Like `createContextProvider`, but the `useContext` function returns `undefined` when the context is missing or when the provider value is `undefined`.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, Show } from "solid-js";
import { createOptionalContextProvider } from "@solid-primitives/context";

const [GroupProvider, useGroup] = createOptionalContextProvider((props: { id: string }) => ({
  groupId: props.id,
}));

function Item() {
  const group = useGroup();
  return <p>{group ? `In group "${group.groupId}"` : "No group (undefined, no throw)"}</p>;
}

function Demo() {
  const [grouped, setGrouped] = createSignal(true);
  return (
    <>
      <button onClick={() => setGrouped(g => !g)}>Toggle provider</button>
      <Show when={grouped()} fallback={<Item />}>
        <GroupProvider id="admins">
          <Item />
        </GroupProvider>
      </Show>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
import { createOptionalContextProvider } from "@solid-primitives/context";

const [GroupProvider, useGroup] = createOptionalContextProvider((props: { id: string }) => ({
  groupId: props.id,
}));

const group = useGroup();
group; // T: { groupId: string } | undefined
```

The fallback is returned when no provider is present. If a provider is present and its factory returns `undefined`, the `useContext` function returns `undefined`.

An optional `name` can be passed as the third argument.

## `createLayeredContext`

Like `createContextProvider`, but each provider in the tree _extends_ the parent context value rather than replacing it entirely. The factory function receives the nearest parent's context value as its second argument.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createLayeredContext } from "@solid-primitives/context";

const [ThemeProvider, useTheme] = createLayeredContext(
  (props: { color?: string }, parent) => ({
    get color() {
      return props.color ?? parent.color;
    },
  }),
  { color: "blue" },
);

function Label(props: { text: string }) {
  const theme = useTheme();
  return (
    <p style={{ color: theme.color }}>
      {props.text}: {theme.color}
    </p>
  );
}

function Demo() {
  const [color, setColor] = createSignal("red");
  const toggle = () => setColor(c => (c === "red" ? "purple" : "red"));
  return (
    <>
      <button onClick={toggle}>Toggle root color</button>
      <ThemeProvider color={color()}>
        <Label text="Root" />
        <ThemeProvider>
          <Label text="Nested (inherits)" />
        </ThemeProvider>
      </ThemeProvider>
      <Label text="Outside (default)" />
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

This is useful for incremental overrides such as themes, permissions layers, or i18n patches where a child provider should inherit what it does not explicitly change.

```tsx
import { createLayeredContext } from "@solid-primitives/context";

const [ThemeProvider, useTheme] = createLayeredContext(
  (props: { primary?: string; secondary?: string }, parent) => ({
    ...parent,
    primary: props.primary ?? parent.primary,
    secondary: props.secondary ?? parent.secondary,
  }),
  { primary: "blue", secondary: "gray" }, // base defaults
);

// Root: { primary: "red", secondary: "gray" }
<ThemeProvider primary="red">
  {/* Nested: { primary: "green", secondary: "gray" } — secondary inherited */}
  <ThemeProvider primary="green">
    <App />
  </ThemeProvider>
</ThemeProvider>;
```

`createLayeredContext` always requires a `defaults` value (the base used when no parent provider wraps the component). The hook return type is always `T` (never `undefined`).

## `MultiProvider`

A component that allows you to provide multiple contexts at once.

```tsx repl
import { render } from "@solidjs/web";
import { createContext, createSignal, useContext } from "solid-js";
import { createContextProvider, MultiProvider } from "@solid-primitives/context";

const NameContext = createContext("anonymous");

const [CounterProvider, useCounter] = createContextProvider((props: { initial: number }) => {
  const [count, setCount] = createSignal(props.initial);
  return { count, increment: () => setCount(n => n + 1) };
});

function Greeting() {
  const name = useContext(NameContext);
  const { count, increment } = useCounter();
  return (
    <button onClick={increment}>
      {name} clicked {count()} times
    </button>
  );
}

function Demo() {
  return (
    <MultiProvider
      values={[
        [NameContext, "Ada"],
        [CounterProvider, { initial: 5 }],
      ]}
    >
      <Greeting />
    </MultiProvider>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

It will work exactly like nesting multiple providers as separate components, but it will save you from the nesting.

### How to use it

`MultiProvider` takes a single `values` array. Contexts and custom provider components are paired with the value to provide.
Providers created by `createContextProvider`, `createOptionalContextProvider` or `createLayeredContext` are paired with their **props** instead, exactly as if you nested them directly, so providers with any prop shape compose without a wrapper component.

> **Note**
> Values list is evaluated in order, so the context values will be provided in the same way as if you were nesting the providers.

```tsx
import { MultiProvider } from "@solid-primitives/context";

// before
<FooContext value={"foo"}>
  <BarContext value={"bar"}>
    <BazContext value={"baz"}>
      <CounterProvider initial={1} label="primary">
        <MyCustomProviderComponent value={"hello-world"}>
          <BoundContextProvider>
            <App />
          </BoundContextProvider>
        </MyCustomProviderComponent>
      </CounterProvider>
    </BazContext>
  </BarContext>
</FooContext>;

// after
<MultiProvider
  values={[
    [FooContext, "foo"],
    [BarContext, "bar"],
    [BazContext, "baz"],
    // providers from createContextProvider (and friends) receive the same props as when nested
    [CounterProvider, { initial: 1, label: "primary" }],
    // you can also provide a component, the value will be passed to a `value` prop
    [MyCustomProviderComponent, "hello-world"],
    // if you have a provider that doesn't accept a `value` prop, you can just pass a function
    BoundContextProvider,
  ]}
>
  <App />
</MultiProvider>;
```

> **Warning**
> Components and values passed to `MultiProvider` will be evaluated only once, so make sure that the structure is static. If it isn't, please use nested provider components instead.

> **Note**
> Before 2.0, a `[Provider, value]` pair for a provider created by `createContextProvider` reached its factory as `props.value`. Those providers now receive props, so wrap the value to keep that shape: `[Provider, { value }]`. Getters in the props object stay reactive.

## `ContextConsumer`

Inspired by React's `Context.Consumer` component, `ContextConsumer` allows using contexts directly within JSX without the needing to extract the content JSX into a separate function.

This is particularly useful when you want to use the context in the same JSX block where you're providing it and directly bind the context value to the frontend.

Note that this component solely serves as syntactic sugar and doesn't provide any additional functionality over using `untrack` together with `useContext` in JSX.

### How to use it

`ContextConsumer` takes a `provider` prop that can be either one of the following:

- A `use...()` function returned by `createContextProvider` or an inline function that returns the context's value: `() => useContext(MyContext)`.
- A raw SolidJS context returned by `createContext()`.

When an optional context's value is `undefined` (e.g. a `useContext` function from `createOptionalContextProvider`), a fallback element specified in the `fallback` prop is rendered instead. Without a `fallback`, nothing is rendered.

> **Note**
> `fallback` cannot suppress errors for required contexts. If a required context (a raw `createContext()` without a default, or a `useContext` function from `createContextProvider` without defaults) is not provided, or is provided with `undefined`, `useContext` throws a `ContextNotFoundError` before `fallback` is considered. Use `createOptionalContextProvider` when a missing provider should render the fallback.

```tsx
import { createOptionalContextProvider, ContextConsumer } from "@solid-primitives/context";

// Create an optional context provider (its `useContext` returns `undefined` when missing)
const [CounterProvider, useCounter] = createOptionalContextProvider(() => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(count() + 1);
  return { count, increment };
});

// Provide and consume the context within same JSX block;
// `fallback` renders if this subtree is ever used without `<CounterProvider>`
return (
  <CounterProvider>
    <ContextConsumer
      provider={useCounter}
      fallback={() => (
        <div>
          <p>Fallback</p>
        </div>
      )}
    >
      {({ count, increment }) => (
        <div>
          <p>Count: {count()}</p>
          <button onClick={increment}>Increment</button>
        </div>
      )}
    </ContextConsumer>
  </CounterProvider>
);
```

With the raw SolidJS context returned by `createContext()`:

```tsx
import { ContextConsumer } from "@solid-primitives/context";

// Create a context
const CounterContext = createContext(/*...*/);

// Consume it using the raw context
<CounterContext>
  <ContextConsumer provider={CounterContext}>
    {({ count, increment }) => {
      <div>
        <p>Count: {count()}</p>
        <button onClick={increment}>Increment</button>
      </div>;
    }}
  </ContextConsumer>
</CounterContext>;
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
