<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=masonry" alt="Solid Primitives masonry">
</p>

# @solid-primitives/masonry

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/masonry?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/masonry)
[![version](https://img.shields.io/npm/v/@solid-primitives/masonry?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/masonry)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for creating a reactive masonry layout.

- [`createMasonry`](#createmasonry) - Creates a reactive masonry layout data from a reactive source array.

## Installation

```bash
npm install @solid-primitives/masonry
# or
yarn add @solid-primitives/masonry
# or
pnpm add @solid-primitives/masonry
```

## `createMasonry`

Calculates reactive masonry layout data from a reactive source array.

It splits the items into columns and calculates the order based on the height of each item.

The masonary is expected to be rendered in a flex container with `flex-direction: column`, `flex-wrap: wrap` and limited height
to force the items to wrap.

## How to use it

`createMasonry` requires an `options` object with the following properties:

- `source` - Accessor returning the source array of items to be mapped.

  When updating the array, the masonry will be recalculated.
  The items are compared by reference.

- `columns` - The number of columns to split the items into.

  This can be an accessor to provide a reactive number of columns.

- `mapHeight` - A function that maps the source item to a numeric height value.

  This function is not reactive, it will be called only once for each item. The value may relate to any unit of your choosing.
  To provede a reactice height, return an accessor.

- `mapElement` - A function that maps the source item to an element to render.

  This function is not reactive, it will be called only once for each item.

  **This param is not required.** If not provided, the source items with layout data will be returned.

```tsx
import { createMasonry } from "@solid-primitives/masonry";

const [source, setSource] = createSignal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const masonry = createMasonry({
  source,
  mapHeight: n => n * 100,
  columns: 3,
  mapElement: data => (
    <div
      style={{
        // data.height is the value returned by `mapHeight`
        // Height of the element should always match that value.
        height: `${data.height()}px`,
        // The flex order of the item in the masonry
        order: data.order(),
        // The space needed to be filled to prevent the next item from switching columns.
        // "margin-bottom" is just an example, you could also add this to the element's height.
        "margin-bottom": `${data.margin()}px`,
      }}
    >
      {/* a reference to the source item. (1, 2, 3, ...) */}
      Item: {data.source} <br />
      {/* The column the item falls into. The first column is 0. */}
      Column: {data.column()}
    </div>
  ),
});

return (
  <div
    style={{
      // The masonry should be rendered in a flex container with the following styles:
      display: "flex",
      "flex-direction": "column",
      "flex-wrap": "wrap",
      // align-items: stretch; is not required, but it will make items fill the full width of the container.
      "align-items": "stretch",
      // The height of the container should be limited to force the items to wrap.
      height: masonry.height(),
    }}
  >
    {/* The masonry is a reactive array of items returned from `mapElement()` */}
    {masonry()}
  </div>
);
```

### Mapping the elements in JSX

If a `mapElement` option is not provided, the source items with layout data will be returned. Those items cannot be rendered directly in JSX, but they can be mapped to elements with Solid's [`<For>`](https://www.solidjs.com/docs/latest/api#for) component.

```tsx
const masonry = createMasonry({
  source,
  mapHeight: getItemHeight,
  columns: 3,
});

return (
  <div
    style={{
      display: "flex",
      "flex-direction": "column",
      "flex-wrap": "wrap",
      "align-items": "stretch",
      height: masonry.height(),
    }}
  >
    <For each={masonry()}>
      {item => (
        <div
          style={{
            height: `${item.height()}px`,
            order: item.order(),
            "margin-bottom": `${item.margin()}px`,
          }}
        >
          {item.source}
        </div>
      )}
    </For>
  </div>
);
```

### Reactive columns

The number of columns can be provided as an accessor to provide a reactive number of columns.

This is useful when the number of columns should change based on the width of the container, size of the items, or a media query.

For example, it can be used with [`createBreakpoints` from `@solid-primitives/media`](https://primitives.solidjs.community/package/media#createmediaquery) to change the number of columns based on the screen size.

```ts
import { createBreakpoints } from "@solid-primitives/media";

const br = createBreakpoints({
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
});

const masonry = createMasonry({
  columns() {
    if (br.xl) return 6;
    if (br.lg) return 4;
    if (br.md) return 3;
    if (br.sm) return 2;
    return 1;
  },
  // ...
});
```

### Grid gap

You can freely add a gap between the items using the `gap` property or a margin on the items.

But that space needs to be accounted for in the height of the items. Otherwise, the layout will be broken.

```tsx
const gap = 10;

const masonry = createMasonry({
  mapHeight(item) {
    return getItemHeight(item) + gap;
  },
  // ...
});

return (
  <div
    style={{
      display: "flex",
      "flex-direction": "column",
      "flex-wrap": "wrap",
      gap: `${gap}px`,
      // Exclude the size of the gap from the height of the container
      // to remove the bottom margin created by the last row.
      height: masonry.height() - gap,
    }}
  >
    {masonry()}
  </div>
);
```

### Observing item's height

The `mapHeight` function is not reactive, it will be called only once for each item. But it can be used to return an accessor to provide a reactive height. The layout will be recalculated when the height changes.

For example, it can be used with [`createElementSize` from `@solid-primitives/resize-observer`](https://primitives.solidjs.community/package/resize-observer#createElementSize) to observe the height of the elements.

```ts
import { createElementSize } from "@solid-primitives/resize-observer";

const masonry = createMasonry({
  // the source should be an array of html elements
  source,
  mapHeight(item) {
    // observe the height of the element
    const size = createElementSize(item);
    // return the accessor of the height of the element
    return () => size.height ?? 100;
  },
});
```

## Demo

[Deployed example](https://primitives.solidjs.community/playground/masonry) | [Source code](https://github.com/solidjs-community/solid-primitives/tree/main/packages/masonry/dev)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
