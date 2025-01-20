<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Signal%20Builders" alt="Solid Primitives Signal Builders">
</p>

# @solid-primitives/signal-builders

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/signal-builders?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/signal-builders)
[![version](https://img.shields.io/npm/v/@solid-primitives/signal-builders?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/signal-builders)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A collection of chainable and composable reactive signal calculations, _AKA_ **Signal Builders**.

## Installation

```bash
npm install @solid-primitives/signal-builders
# or
yarn add @solid-primitives/signal-builders
```

## How to use it

Signal builders create computations when used, so they need to be used under a reactive root.

Note, since all of the signal builders use [`createMemo`](https://www.solidjs.com/docs/latest/api#creatememo) to wrap the calculation, updates will be caused only when the calculated value changes. Also the calculations should stay 'pure' – try to not cause side effects inside them.

### Array

```ts
import { push, flatten, remove } from "@solid-primitives/signal-builders";

const [fruits, setFruits] = createSignal(["apples", "bananas", "oranges", "tomatoes"]);
const [toRemove, setToRemove] = createSignal("tomatoes");

const list = flatten(remove(push(fruits, ["kiwis", "avocados"]), toRemove));

list(); // ["apples", "bananas", "oranges", "kiwis", "avocados"]
```

### Object

```ts
import { update, merge } from "@solid-primitives/signal-builders";

const [user, setUser] = createSignal({ name: { first: "John", last: "Doe" } });
const [last, setLast] = createSignal("Solid");

const modifiedUser = merge(update(user, "name", "last", last), { age: 21 });

modifiedUser(); // { name: { first: "John", last: "Solid" }, age: 21 }
```

### Number

```ts
import { add, multiply, clamp, int } from "@solid-primitives/signal-builders";

const [input, setInput] = createSignal("123");
const [ing, setIng] = createSignal(-45);
const [max, setMax] = createSignal(1000);

const value = clamp(multiply(int(input), add(ing, 54, 9)), 0, max);
```

### String

```ts
import { lowercase, substring, template, add } from "@solid-primitives/signal-builders";

const [greeting, setGreeting] = createSignal("Hello");
const [target, setTarget] = createSignal("World");

const message = template`${greeting}, ${target}!`;
message(); // => Hello, World!

const solidMessage = lowercase(add(substring(message, 0, 7), "Solid"));
solidMessage(); // => hello, solid
```

## List of builders

### Array

- **`push`** - basically `Array.prototype.push()`
- **`drop`** - drop n items from the array start
- **`dropRight`** - drop n items from the end of the array
- **`filter`** - basically `Array.prototype.filter()`
- **`filterOut`** - filter out passed item from an array
- **`remove`** - removes passed item from an array (first one from the start)
- **`removeItems`** - removes multiple items from an array
- **`splice`** - signal-builder `Array.prototype.splice()`
- **`slice`** - signal-builder `Array.prototype.slice()`
- **`map`** - signal-builder `Array.prototype.map()`
- **`sort`** - signal-builder `Array.prototype.sort()`
- **`concat`** - Append multiple arrays together
- **`flatten`** - Flattens a nested array into a one-level array
- **`filterInstance`** - filter list: only leave items that are instances of specified Classes
- **`filterOutInstance`** - filter list: remove items that are instances of specified Classes

### Object/Array

- **`get`** - Get a single property value of an object by specifying a path to it.
- **`update`** - Change single value in an object by key, or series of recursing keys.

### Object

- **`omit`** - get an object copy without the provided keys
- **`pick`** - get an object copy with only the provided keys
- **`merge`** - Merges multiple objects into a single one.

### Convert

- **`string`** - turns passed value to a string
- **`float`** - turns passed string to an float number
- **`int`** - turns passed string to an intiger
- **`join`** - join array with a separator to a string

### Number

- **`add`** - `a + b + c + ...`
- **`substract`** - `a - b - c - ...`
- **`multiply`** - `a * b * c * ...`
- **`divide`** - `a / b / c / ...`
- **`power`** - `a ** b ** c ** ...`
- **`clamp`** - clamp a number value between two other values
- **`round`** - `Math.round()`
- **`ceil`** - `Math.ceil()`
- **`floor`** - `Math.floor()`

### String

- **`add`** - `a + b + c + ...`
- **`lowercase`** - signal builder `String.prototype.toLowerCase()`
- **`uppercase`** - signal builder `String.prototype.toUpperCase()`
- **`capitalize`** - capitalize a string input e.g. `"solidJS"` -> `"Solidjs"`
- **`substring`** - signal builder `String.prototype.substring()`
- **`template`** - Create reactive string templates

## A call for feedback

`signal-builders` package is now a proof of concept of a fresh and experimental idea. Therefore all feedback/ideas/issues are highly welcome! :)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
