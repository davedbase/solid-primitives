<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Debounce" alt="Solid Primitives Debounce">
</p>

# @solid-primitives/debounce

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg?style=for-the-badge)](https://lerna.js.org/)
[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/debounce?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/debounce)
[![size](https://img.shields.io/npm/v/@solid-primitives/debounce?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/debounce)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-1.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Creates a helpful debounce function.

## Installation

```
npm install @solid-primitives/debounce
# or
yarn add @solid-primitives/debounce
```

## How to use it

```ts
const fn = createDebounce((message: string) => console.log(message), 250));
fn('Hello!');
fn.clear() // clears a timeout in progress
```

### Definition

```ts
function createDebounce<Args extends any[]>(
  func: (...args: Args) => void,
  wait?: number
): DebouncedFunction<Args>;

interface DebouncedFunction<Args extends any[]> {
  (...args: Args): void;
  clear: () => void;
}
```

## Demo

You may view a working example here: https://codesandbox.io/s/solid-primitives-debounce-ng9bs?file=/src/index.tsx

## Changelog

<details>
<summary><b>Expand Changelog</b></summary>

1.0.0

Initial commit and publish of debounce primitive.

1.0.1

Improved types, minor clean-up and added tests.

1.0.2

Changed any to unknown type and applied patch from high1.

1.0.5

Adding CJS support to package.

1.0.8

Cleaned up documentation

1.1.0

Updated to Solid 1.3

1.1.2

Added missing automated clean-up.

1.2.0

Improved types, changed output format from `[fn, clear]` to `fn & { clear }`

</details>
