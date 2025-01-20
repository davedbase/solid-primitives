<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=pagination" alt="Solid Primitives pagination">
</p>

# @solid-primitives/pagination

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/pagination?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/pagination)
[![version](https://img.shields.io/npm/v/@solid-primitives/pagination?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/pagination)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A primitive that creates all the reactive data to manage your pagination:

- [`createPagination`](#createpagination) - Provides an array with the properties to fill your pagination with and a page setter/getter.
- [`createInfiniteScroll`](#createinfinitescroll) - Provides an easy way to implement infinite scrolling.

## Installation

```bash
npm install @solid-primitives/pagination
# or
yarn add @solid-primitives/pagination
# or
pnpm add @solid-primitives/pagination
```

## `createPagination`

Provides an array with the properties to fill your pagination with and a page setter/getter.

### How to use it

```ts
type PaginationOptions = {
  /** the overall number of pages */
  pages: number;
  /** the highest number of pages to show at the same time */
  maxPages?: number;
  /** start with another page than `1` */
  initialPage?: number;
  /** show an element for the first page */
  showFirst?: boolean | ((page: number, pages: number) => boolean);
  /** show an element for the previous page */
  showPrev?: boolean | ((page: number, pages: number) => boolean);
  /** show an element for the next page */
  showNext?: boolean | ((page: number, pages: number) => boolean);
  /** show an element for the last page */
  showLast?: boolean | ((page: number, pages: number) => boolean);
  /** content for the first page element, e.g. an SVG icon, default is "|<" */
  firstContent?: JSX.Element;
  /** content for the previous page element, e.g. an SVG icon, default is "<" */
  prevContent?: JSX.Element;
  /** content for the next page element, e.g. an SVG icon, default is ">" */
  nextContent?: JSX.Element;
  /** content for the last page element, e.g. an SVG icon, default is ">|" */
  lastContent?: JSX.Element;
};

// Returns a tuple of props, page and setPage.
// Props is an array of props to spread on each button.
// Page is the current page number.
// setPage is a function to set the page number.

const [props, page, setPage] = createPagination({ pages: 3 });
```

While the preferred structure is links or buttons (if only client-side) inside a nav element, you can use arbitrary components, e.g. using your favorite UI component library (as long as it supports the same handlers and properties as DOM nodes, which it probably should). The props objects for each page will be reused in order to grant maximum performance using the `<For>` flow component to iterate over the props:

```tsx
const [paginationProps, page, setPage] = createPagination({ pages: 100 });

createEffect(() => {
  /* do something with */ page();
});

return (
  <nav class="pagination">
    <For each={paginationProps()}>{props => <button {...props} />}</For>
  </nav>
);
```

In order to allow linking the pages manually, there is a non-enumerable page property in the props object:

```tsx
const [paginationProps, page, setPage] = createPagination({ pages: 100 });

createEffect(() => {
  /* do something with */ page();
});

return (
  <nav class="pagination">
    <ul>
      <For each={paginationProps()}>
        {props => (
          <li>
            <A href={`?page=${props.page}`} {...props} />
          </li>
        )}
      </For>
    </ul>
  </nav>
);
```

### TODO

- Jump over multiple pages (e.g. +10/-10)
- options for aria-labels
- optional: touch controls

### Demo

You may view a working example here:
https://primitives.solidjs.community/playground/pagination/

## `createInfiniteScroll`

Combines [`createResource`](https://www.solidjs.com/docs/latest/api#createresource) with [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to provide an easy way to implement infinite scrolling.

### How to use it

```tsx
// fetcher: (page: number) => Promise<T[]>
const [pages, setEl, { end }] = createInfiniteScroll(fetcher);

return (
  <div>
    <For each={pages()}>{item => <h4>{item}</h4>}</For>
    <Show when={!end()}>
      <h1 ref={setEl}>Loading...</h1>
    </Show>
  </div>
);
```

Or as a directive:

```tsx
const [pages, infiniteScrollLoader, { end }] = createInfiniteScroll(fetcher);

return (
  <div>
    <For each={pages()}>{item => <h4>{item}</h4>}</For>
    <Show when={!end()}>
      <h1 use:infiniteScrollLoader>Loading...</h1>
    </Show>
  </div>
);
```

### Definition

```ts
function createInfiniteScroll<T>(fetcher: (page: number) => Promise<T[]>): [
  pages: Accessor<T[]>,
  loader: Directive<true>,
  options: {
    page: Accessor<number>;
    setPage: Setter<number>;
    setPages: Setter<T[]>;
    end: Accessor<boolean>;
    setEnd: Setter<boolean>;
  },
];
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
