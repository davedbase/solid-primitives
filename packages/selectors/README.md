<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=selectors" alt="Solid Primitives selectors">
</p>

# @solid-primitives/selectors

[![turborepo](https://img.shields.io/badge/built%20with-turborepo-cc00ff.svg?style=for-the-badge&logo=turborepo)](https://turborepo.org/)
[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/selectors?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/selectors)
[![version](https://img.shields.io/npm/v/@solid-primitives/selectors?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/selectors)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A sample primitive that is made up for templating with the following options:

`createArraySelcetor` - Provides a getter and setter for the primitive.

## Installation

```bash
npm install @solid-primitives/selectors
# or
yarn add @solid-primitives/selectors
# or
pnpm add @solid-primitives/selectors
```

## How to use it

```tsx
const list: string[] = ["apple", "pear", "orange"]
const [selectedItems] = createSignal<string[]>(["apple"])
const isSelected = createArraySelector(selectedItems)

<For each={list}>
  {(item) => <li classList={{ active: isSelected(item) }}>{item}</li>}
</For>
```

## Demo

You can use this template for publishing your demo on CodeSandbox: https://codesandbox.io/s/solid-primitives-demo-template-sz95h

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
