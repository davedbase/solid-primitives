<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=virtual" alt="Solid Primitives virtual">
</p>

# @solid-primitives/virtual

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/virtual?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/virtual)
[![version](https://img.shields.io/npm/v/@solid-primitives/virtual?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/virtual)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

- [`createVirtualList`](#createvirtuallist) - A headless utility function for [virtualized lists](https://www.patterns.dev/vanilla/virtual-lists/)
- [`VirtualList`](#virtuallist) - a basic, unstyled component based on `createVirtualList`

## Installation

```bash
npm install @solid-primitives/virtual
# or
yarn add @solid-primitives/virtual
# or
pnpm add @solid-primitives/virtual
```

## How to use it

### `createVirtualList`

`createVirtualList` is a headless utility for constructing your own virtualized list components with maximum flexibility.

```tsx
function MyComp(): JSX.Element {
  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const rootHeight = 20;
  const rowHeight = 10;
  const overscanCount = 5;

  const [{ containerHeight, viewerTop, visibleItems }, onScroll] = createVirtualList({
    // the list of items - can be a signal
    items,
    // the height of the root element of the virtualizedList - can be a signal
    rootHeight,
    // the height of individual rows in the virtualizedList - can be a signal
    rowHeight,
    // the number of elements to render both before and after the visible section of the list, so passing 5 will render 5 items before the list, and 5 items after. Defaults to 1, cannot be set to zero. This is necessary to hide the blank space around list items when scrolling - can be a signal
    overscanCount,
  });

  return (
    <div
      style={{
        overflow: "auto",
        // root element's height must be rootHeight
        height: `${rootHeight}px`,
      }}
      // outermost container must use onScroll
      onScroll={onScroll}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          // list container element's height must be set to containerHeight()
          height: `${containerHeight()}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            // viewer element's top must be set to viewerTop()
            top: `${viewerTop()}px`,
          }}
        >
          {/* only visibleItems() are ultimately rendered */}
          <For fallback={"no items"} each={visibleItems()}>
            {item => <div>{item}</div>}
          </For>
        </div>
      </div>
    </div>
  );
}
```

### `<VirtualList />`

`<VirtualList />` is a basic, unstyled virtual list component you can drop into projects without modification.

```tsx
<VirtualList
  // the list of items (of course, to for this component to be useful, the list would need to be much bigger than shown here)
  each={[0, 1, 2, 3, 4, 5, 6, 7]}
  // the optional fallback to display if the list of items is empty
  fallback={<div>No items</div>}
  // the number of elements to render both before and after the visible section of the list, so passing 5 will render 5 items before the list, and 5 items after. Defaults to 1, cannot be set to zero. This is necessary to hide the blank space around list items when scrolling
  overscanCount={5}
  // the height of the root element of the virtualizedList itself
  rootHeight={20}
  // the height of individual rows in the virtualizedList
  rowHeight={10}
>
  {
    // the flowComponent that will be used to transform the items into rows in the list
    item => <div>{item}</div>
  }
</VirtualList>
```

The tests describe the exact behavior and how overscanCount handles the start/end of the list in more detail.
Note that the component only handles vertical lists where the number of items is known and the height of an individual item is fixed.

## Demo

You can see the VirtualList in action in the following sandbox: https://primitives.solidjs.community/playground/virtual

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
