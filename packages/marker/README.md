<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=marker" alt="Solid Primitives marker">
</p>

# @solid-primitives/marker

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/marker?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/marker)
[![version](https://img.shields.io/npm/v/@solid-primitives/marker?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/marker)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-1.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A reactive primitive for marking parts of a string that match a regular expression. Useful for highlighting search results.

## Installation

```bash
npm install @solid-primitives/marker
# or
yarn add @solid-primitives/marker
# or
pnpm add @solid-primitives/marker
```

## How to use it

`createMarker` creates a function for marking parts of a string that match a regex. Each match will be mapped by `mapMatch` callback and returned as an array of strings and mapped values.

```tsx
import { createMarker } from "@solid-primitives/marker";

const highlight = createMarker(matchedText => {
  // matchedText param is the sting matched by regex
  // it's an accessor, because each mapped value is reused between marker calls
  return <mark>{matchedText()}</mark>;
});

<p>
  {highlight("Hello world!", /\w+/g)} {/* <mark>Hello</mark> <mark>world</mark>! */}
</p>;
```

## Mapping matches

The `mapMatch` callback is **not** reactive. The value returned by it is cached and reused between marker calls. This is useful for performance reasons, but it also means that the callback should handle the matched text as an accessor.

It behaves similarly to the `mapFn` param of `indexArray`, where the returned element is reused for different values.

Any computations created in that callback will be disposed when `createMarker` gets disposed, not on each marker call, because the results are cached between calls.

```tsx
const mark = createMarker(text => {
  // you can safely create computations here
  createEffect(() => {
    console.log(text());
  });

  return <mark>{text()}</mark>;
});
```

## Caching

The marker callback is cached between calls.

This way returned elements are reused as much as possible.

But every cache needs a limit. By default, the cache size is 100. You can change it by passing the `cacheSize` option to `createMarker`.

```tsx
const mark = createMarker(text => <mark>{text()}</mark>, { cacheSize: 1000 });
```

The marker will still be able to handle more than 1000 different regexes, but it will start to dispose the unused ones that exceed the limit.

## Search highlighting

`createMarker` is very useful for highlighting the searched text in a search results list.

But when used alone, it can be easy to forget to escape the regex special characters. This can lead to unexpected results.

To avoid this, you can use the `makeSearchRegex` helper function to create a regex that will match the searched text.

```tsx
import { createMarker, makeSearchRegex } from "@solid-primitives/marker";

const [search, setSearch] = createSignal("");

const regex = createMemo(() => makeSearchRegex(search()));

const highlight = createMarker(text => <mark>{text()}</mark>);

<>
  <input onInput={e => setSearch(e.target.value)} />
  <p>{highlight(textToHighlight, regex())}</p>
</>;
```

Regex returned by `makeSearchRegex` will:

- match the searched text case-insensitively
- escape all regex special characters (only words can be matched)
- trim the searched text
- match multiple words independently

## Demo

[Deployed example](https://primitives.solidjs.community/playground/marker) | [Source code](https://github.com/solidjs-community/solid-primitives/tree/main/packages/marker/dev)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
