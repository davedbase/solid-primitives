<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Clipboard" alt="Solid Primitives Clipboard">
</p>

# @solid-primitives/clipboard

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/clipboard?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/clipboard)
[![size](https://img.shields.io/npm/v/@solid-primitives/clipboard?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/clipboard)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

This primitive is designed to that make reading and writing to [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) easy. It also comes with a convenient directive to write to clipboard.

- [`readClipboard`](#readclipboard) - A basic non-reactive primitive that makes accessing the clipboard easy.
- [`writeClipboard`](#writeclipboard) - A basic non-reactive primitive that makes writing to the clipboard easy.
- [`createClipboard`](#createclipboard) - This primitive provides full facilities for reading and writing to the clipboard. It allows for writing to clipboard via exported function or input signal. It wraps the Clipboard Async API with a resource and supplies reactive helpers to make pulling from the clipboard easy.
- [`copyToClipboard`](#copytoclipboard) - convenient directive for setting the clipboard value.

## Installation

```bash
npm install @solid-primitives/clipboard
# or
yarn add @solid-primitives/clipboard
# or
pnpm add @solid-primitives/clipboard
```

## `readClipboard`

A basic non-reactive primitive that makes accessing the clipboard easy. Note that write supports both string and ClipboardItems object structure.

### How to use it

```ts
import { readClipboard } from "@solid-primitives/clipboard";

const clipboard = await readClipboard();

clipboard.forEach(item => {
  if (item.type == "text/plain") {
    console.log(item.text());
  }
});
```

## `writeClipboard`

A basic non-reactive primitive that makes writing to the clipboard easy. Note that write supports both string and ClipboardItems object structure.

### How to use it

```ts
import { writeClipboard } from "@solid-primitives/clipboard";

writeClipboard("Hello World");

// or

writeClipboard([
  new ClipboardItem({
    "text/plain": new Blob(["Hello World"], { type: "text/plain" }),
  }),
]);
```

## `createClipboard`

This primitive provides full facilities for reading and writing to the clipboard. It allows for writing to clipboard via exported function or input signal. It wraps the Clipboard Async API with a resource and supplies reactive helpers to make pulling from the clipboard easy.

### How to use it

```tsx
const [data, setData] = createSignal("Hello");
const [clipboard, refresh] = createClipboard(data); // will write "Hello" to clipboard

setData("foobar"); // will write "foobar" to clipboard

refresh(); // will read from clipboard and update clipboard() signal

return (
  <Suspense fallback={"Loading..."}>
    <For each={clipboard()}>
      {item => (
        <Switch>
          <Match when={item.type == "text/plain"}>{item.text}</Match>
          <Match when={item.type == "image/png"}>
            <img class="w-full" src={URL.createObjectURL(item.blob)} />
          </Match>
        </Switch>
      )}
    </For>
  </Suspense>
);
```

Note: The primitive binds and listens for `clipboardchange` meaning that clipboard changes should automatically propagate. The implementation however is buggy on certain browsers.

## `copyToClipboard`

You can also use clipboard as a convenient directive for setting the clipboard value. You can override the default value and the setter with the options parameter.

```ts
import { copyToClipboard } from "@solid-primitives/clipboard";
<input type="text" use:copyToClipboard />;
```

### Definition

```ts
function copyToClipboard(
  el: Element,
  options: MaybeAccessor<{
    value?: any;
    setter?: ClipboardSetter;
    highlight?: HighlightModifier;
  }>,
);
```

### Highlighters/Range Selection

In some scenarios you'll want to highlight or select a range of text. copyToClipboard has an option to specify the type of highlighting you'd like. Use either `input` or `element` based on the type you're making selectable.

```tsx
import { copyToClipboard, input, element } from "@solid-primitives/clipboard";
<input type="text" use:copyToClipboard={{ highlight: input() }} />;
<div use:copyToClipboard={{ highlight: element(5, 10) }} />;
```

## `newItem`

This package ships with newItem which is a helper method for creating new ClipboardItem types.

```ts
import { newItem } from "@solid-primitives/clipboard";
write([newItem("image/png", await image.blob())]);
```

### Definition

```ts
function newItem(type: string, data: ClipboardItemData): ClipboardItem;
```

## Demo

You may view a working example in [the /dev playground](./dev/index.tsx) deplayed on [primitives.solidjs.community/playground/clipboard](https://primitives.solidjs.community/playground/clipboard/)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
