<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Context" alt="Solid Primitives Context">
</p>

# @solid-primitives/context

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/context?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/context)
[![version](https://img.shields.io/npm/v/@solid-primitives/context?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/context)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives simplifying the creation and use of SolidJS Context API.

- [`createContextProvider`](#createcontextprovider) - Create the Context Provider component and useContext function with types inferred from the factory function.
- [`MultiProvider`](#multiprovider) - A component that allows you to provide multiple contexts at once.

## Installation

```bash
npm install @solid-primitives/context
# or
pnpm add @solid-primitives/context
# or
yarn add @solid-primitives/context
```

## `createContextProvider`

Create the Context Provider component and useContext function with types inferred from the factory function.

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
ctx; // T: { count: () => number; increment: () => void; } | undefined
```

### Providing context fallback

The `createContextProvider` primitive takes a second, optional argument for providing context defaults for when the context wouldn't be provided higher in the component tree.
Providing a fallback also removes `undefined` from `T | undefined` return type of the `useContext` function.

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

Definite context types without defaults:

```ts
const useDefiniteCounter = () => useCounter()!;
```

### Demo

https://codesandbox.io/s/solid-primitives-context-demo-oqyie2?file=/index.tsx

## `MultiProvider`

A component that allows you to provide multiple contexts at once.

It will work exactly like nesting multiple providers as separate components, but it will save you from the nesting.

### How to use it

`MultiProvider` takes only a single `values` with a key-value pair of the context and the value to provide.

> **Note**
> Values list is evaluated in order, so the context values will be provided in the same way as if you were nesting the providers.

```tsx
import { MultiProvider } from "@solid-primitives/context";

// before
<FooContext.Provider value={"foo"}>
  <BarContext.Provider value={"bar"}>
    <BazContext.Provider value={"baz"}>
      <MyCustomProviderComponent value={"hello-world"}>
        <BoundContextProvider>
          <App />
        </BoundContextProvider>
      </MyCustomProviderComponent>
    </BazContext.Provider>
  </BarContext.Provider>
</FooContext.Provider>;

// after
<MultiProvider
  values={[
    [FooContext, "foo"],
    [BarContext, "bar"],
    [BazContext, "baz"],
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
> Components and values passed to `MultiProvider` will be evaluated only once, so make sure that the structure is static. If is isn't, please use nested provider components instead.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
