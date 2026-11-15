<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Pagination" alt="Solid Primitives pagination">
</p>

# @solid-primitives/pagination

[![docs](https://img.shields.io/badge/-docs-blue?style=for-the-badge)](https://primitives.solidjs.community/package/pagination)
[![size](https://img.shields.io/badge/size-2.17_kB-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/pagination)
[![version](https://img.shields.io/npm/v/@solid-primitives/pagination?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/pagination)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

A primitive that creates all the reactive data to manage your pagination:

- [`createPagination`](#createpagination) - Provides an array with the properties to fill your pagination with and a page setter/getter.
- [`createSegment`](#createSegment) - Provides a reactive segment of an array (e.g. a page of a number of items).
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

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { createPagination } from "@solid-primitives/pagination";

function Demo() {
  const [ellipsis, setEllipsis] = createSignal(false);
  const [paginationProps, page] = createPagination(() => ({
    pages: 20,
    maxPages: 7,
    showEllipsis: ellipsis(),
  }));
  return (
    <>
      <nav style={{ display: "flex", gap: "4px" }}>
        <For each={paginationProps()}>{props => <button {...props} />}</For>
      </nav>
      <p>Current page: {page()}</p>
      <button onClick={() => setEllipsis(e => !e)}>Ellipsis: {ellipsis() ? "on" : "off"}</button>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

### How to use it

```ts
export type PaginationOptions = {
  /** the overall number of pages */
  pages: number;
  /** the highest number of pages to show at the same time */
  maxPages?: number;
  /** start with another page than `1` */
  initialPage?: number;
  /** number of pages a large jump, if it should exist, should skip */
  jumpPages?: number;
  /** show an element for the previous page */
  showPrev?: boolean | ((page: number, pages: number) => boolean);
  /** show an element for the next page */
  showNext?: boolean | ((page: number, pages: number) => boolean);
  /** content for the previous page element, e.g. an SVG icon, default is "<" */
  prevContent?: JSX.Element;
  /** content for the next page element, e.g. an SVG icon, default is ">" */
  nextContent?: JSX.Element;
  /** accessible name for the previous page element, default is "Previous page" */
  prevAriaLabel?: string;
  /** accessible name for the next page element, default is "Next page" */
  nextAriaLabel?: string;
  /** show an element for the first page */
  showFirst?: boolean | ((page: number, pages: number) => boolean);
  /** show an element for the last page */
  showLast?: boolean | ((page: number, pages: number) => boolean);
  /** content for the first page element, e.g. an SVG icon, default is "|<" */
  firstContent?: JSX.Element;
  /** content for the last page element, e.g. an SVG icon, default is ">|" */
  lastContent?: JSX.Element;
  /** accessible name for the first page element, default is "First page" */
  firstAriaLabel?: string;
  /** accessible name for the last page element, default is "Last page" */
  lastAriaLabel?: string;
  /** always show first and last page, with an adjacent ellipsis if there is a gap */
  showEllipsis?: boolean | ((page: number, pages: number) => boolean);
  /** content for the ellipsis element, e.g. an SVG icon or a text */
  ellipsisContent?: () => JSX.Element;
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

### Ellipsis-style pagination

Beyond the classic pagination pattern, this primitive now also supports an ellipsis-style pattern. The difference is best illustrated like this:

#### Classic

```
[First] [Previous] [3] [4] |5| [6] [7] [Next] [Last]
```

#### Ellipsis

```
[Previous] [1] ... [4] |5| [6] ... [7] [Next]
```

This does away with the duplication of `[First]` and `[1]` and `[Last]` and its respective page. You merely need to set the `showEllipsis` option and handle the `inert` attribute for the ellipsis if not already supported.

In this mode, the first and last page are always present, and while the `maxPages` option will still reflect the number of page items that are displayed, each visible ellipsis will take the place of a page item. Also, the `[First]` and `[Last]` buttons are always disabled, regardless of settings.

### TODO

- Jump over multiple pages (e.g. +10/-10)
- options for aria-labels
- optional: touch controls

## `createSegment`

It is a common requirement to put multiple items on a single page, which exactly is what `createSegment` is for.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { createPagination, createSegment } from "@solid-primitives/pagination";

const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

function Demo() {
  const [limit, setLimit] = createSignal(5);
  const [paginationProps, page] = createPagination(() => ({
    pages: Math.ceil(items.length / limit()),
    maxPages: 5,
  }));
  const segment = createSegment(items, limit, page);
  return (
    <>
      <button onClick={() => setLimit(l => (l === 5 ? 10 : 5))}>Items per page: {limit()}</button>
      <ul>
        <For each={segment()}>{item => <li>{item}</li>}</For>
      </ul>
      <nav style={{ display: "flex", gap: "4px" }}>
        <For each={paginationProps()}>{props => <button {...props} />}</For>
      </nav>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
const segment = createSegment(items, limit, page);

return <For each={segment()}>{item => <Item item={item} />}</For>;
```

- `items` can be any array of items or an accessor with an array of items; even if the array increases in size, the segment will only change if the growth brings an actual change
- `limit` is the limit for the number of items within a segment; this can be a number or an accessor containing a number
- `page` is an accessor with the number or the segment page, starting with 1

## `createInfiniteScroll`

```tsx repl
import { render } from "@solidjs/web";
import { For, Loading, Show } from "solid-js";
import { createInfiniteScroll } from "@solid-primitives/pagination";

// fake API: 5 pages of 10 items, then an empty page signals the end
const fetcher = (page: number) =>
  new Promise<string[]>(resolve => {
    const items = Array.from({ length: 10 }, (_, i) => `Item ${page * 10 + i + 1}`);
    setTimeout(() => resolve(page < 5 ? items : []), 500);
  });

function Demo() {
  const [pages, setEl, { pageCount, end }] = createInfiniteScroll(fetcher);
  return (
    <div style={{ height: "200px", overflow: "auto", border: "1px solid #ccc" }}>
      <p>Pages requested: {pageCount()}</p>
      <For each={pages()}>
        {page => (
          <Loading fallback={<p>Loading…</p>}>
            <For each={page.content()}>{item => <p>{item}</p>}</For>
          </Loading>
        )}
      </For>
      <Show when={!end()} fallback={<p>No more items</p>}>
        <div ref={setEl} style={{ height: "1px" }} />
      </Show>
    </div>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

Combines [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) with a page-based fetcher to provide an easy way to implement infinite scrolling. The sentinel-based auto-loading is browser-only, but fetching itself isn't: pass `initialPageCount` to request pages during SSR too, so the first page(s) are present in the server-rendered HTML for SEO and perceived speed.

Each page is its own independent async unit, so it can be rendered with `<Loading>`/`<Errored>` for idiomatic suspense and retry, or read via plain `fetching`/`error` signals if you'd rather not use boundaries.

### How to use it

```tsx
// fetcher: (page: number) => Promise<T[]>
const [pages, setEl, { end }] = createInfiniteScroll(fetcher);

return (
  <div>
    <For each={pages()}>
      {page => (
        // Note: use `page.retry`, not Errored's own `reset` — `content` only
        // re-fetches when `retry()` bumps its internal version signal, so a
        // bare `reset()` would just re-surface the same cached rejection.
        // Errored also won't hand control back to <Loading> while that retry
        // is in flight, so the fallback watches `fetching()` itself.
        <Errored
          fallback={err => (
            <Show when={!page.fetching()} fallback={<h4>Retrying…</h4>}>
              <button onClick={page.retry}>Retry: {String(err())}</button>
            </Show>
          )}
        >
          <Loading fallback={<h4>Loading…</h4>}>
            <For each={page.content()}>{item => <h4>{item}</h4>}</For>
          </Loading>
        </Errored>
      )}
    </For>
    <Show when={!end()}>
      <h1 ref={setEl}>Loading...</h1>
    </Show>
  </div>
);
```

Prefer plain signals over boundaries? Skip `<Loading>`/`<Errored>` and use `fetching()`/`error()`/`retry()` directly:

```tsx
<For each={pages()}>
  {page => (
    <Show
      when={!page.error()}
      fallback={<button onClick={page.retry}>Retry: {String(page.error())}</button>}
    >
      <Show when={!page.fetching()} fallback={<h4>Loading…</h4>}>
        <For each={page.content()}>{item => <h4>{item}</h4>}</For>
      </Show>
    </Show>
  )}
</For>
```

### Definition

```ts
type InfiniteScrollPage<T> = {
  content: Accessor<T[]>;
  fetching: Accessor<boolean>;
  error: Accessor<unknown>;
  retry: () => void;
};

function createInfiniteScroll<T>(
  fetcher: (page: number) => Promise<T[]>,
  options?: { initialPageCount?: number },
): [
  pages: Accessor<InfiniteScrollPage<T>[]>,
  loader: (el: Element) => void,
  options: {
    pageCount: Accessor<number>;
    setPageCount: Setter<number>;
    end: Accessor<boolean>;
    reset: () => void;
  },
];
```

- `pages()` is the `{ content, fetching, error, retry }` bundle for every page requested so far, in order — feed it directly to `<For>`. `retry()` re-runs that page's fetcher and clears its error.
- `options.initialPageCount` sets how many pages are requested up front — same fetch/retry/error mechanics as any other page. Defaults to `0` on the server and `1` in the browser; raise it on the server to render initial content into the SSR'd HTML.
- `end` is `true` once a page fetch returns zero items. A failed page does **not** set `end` — the sentinel just pauses auto-loading until that page is retried.
- `reset()` disposes every page's reactive state and starts over from `initialPageCount` pages. It does **not** abort an in-flight fetch — if one resolves or rejects after disposal, its result is ignored by the same stale-request check `retry()` relies on.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
