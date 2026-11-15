import { createSignal, For, Show, untrack } from "solid-js";
import { Errored, Loading } from "@solidjs/web";
import preview from "../../../.storybook/preview.js";
import { createInfiniteScroll, createPagination, createSegment } from "../src/index.js";
import readme from "../README.md?raw";
import {
  Badge,
  BoolRow,
  Button,
  ButtonRow,
  Container,
  Section,
  Separator,
  StatRow,
} from "../../../.storybook/ui/index.js";
import { colors, font, radii } from "../../../.storybook/ui/tokens.js";

const meta = preview.meta({
  title: "UI Patterns/Pagination",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: readme,
      },
    },
  },
});

export default meta;

const PaginationBar = (barProps: {
  props: ReturnType<typeof createPagination>[0];
  center?: boolean;
}) => (
  <nav
    style={{
      display: "flex",
      gap: "0.25rem",
      "flex-wrap": "wrap",
      ...(barProps.center ? { "justify-content": "center" } : {}),
    }}
  >
    <For each={barProps.props()}>
      {props => (
        <Button
          {...props}
          variant={props["aria-current"] ? "primary" : "outline"}
          style={{ "min-width": "2rem", "font-size": font.sizeSm, padding: "0.3rem 0.6rem" }}
        >
          {props.children as string}
        </Button>
      )}
    </For>
  </nav>
);

export const CreatePaginationStory = meta.story({
  name: "Pagination bar",
  parameters: {
    docs: {
      description: {
        story:
          "`createPagination` returns a reactive array of button props alongside `page` and `setPage`. Each prop object's `aria-current` and `disabled` are reactive getters — object identity is stable so `<For>` only touches changed DOM attributes when the page changes.",
      },
    },
  },
  render: () => {
    const [totalPages, setTotalPages] = createSignal(20);
    const [maxVisible, setMaxVisible] = createSignal(7);
    // untrack: Storybook's Solid renderer wraps every story's render() in its
    // own createMemo. Without this, createPagination's internal setup memo
    // reading totalPages()/maxVisible() during its first synchronous compute
    // leaks as a dependency of that outer memo, causing it to re-invoke this
    // entire render() function (creating brand-new signals) whenever those
    // values change — which breaks rendering. See
    // https://github.com/solidjs-community/solid-primitives/issues/795
    const [paginationProps, page, _setPage] = untrack(() =>
      createPagination(() => ({
        pages: totalPages(),
        maxPages: maxVisible(),
      })),
    );

    return (
      <Errored
        fallback={(err, reset) => (
          <p>
            Error: {err}{" "}
            <button type="reset" onClick={reset}>
              Reset
            </button>
          </p>
        )}
      >
        <Container minWidth={400}>
          <StatRow label="Current page" value={page()} />
          <PaginationBar props={paginationProps} />
          <Separator />
          <Section title="Max visible">
            <ButtonRow>
              <For each={[5, 7, 10] as const}>
                {n => (
                  <Button
                    variant={maxVisible() === n ? "primary" : "outline"}
                    onClick={() => setMaxVisible(n)}
                  >
                    {n}
                  </Button>
                )}
              </For>
            </ButtonRow>
          </Section>
          <Section title="Total pages">
            <ButtonRow>
              <For each={[10, 20, 50] as const}>
                {n => (
                  <Button
                    variant={totalPages() === n ? "primary" : "outline"}
                    onClick={() => setTotalPages(n)}
                  >
                    {n}
                  </Button>
                )}
              </For>
            </ButtonRow>
          </Section>
        </Container>
      </Errored>
    );
  },
});

export const CreateEllipsisPaginationStory = meta.story({
  name: "Pagination bar (ellipsis)",
  parameters: {
    docs: {
      description: {
        story:
          "`createPagination` returns a reactive array of button props alongside `page` and `setPage`. Each prop object's `aria-current` and `disabled` are reactive getters — object identity is stable so `<For>` only touches changed DOM attributes when the page changes. This is the new ellipsis pattern",
      },
    },
  },
  render: () => {
    const [totalPages, setTotalPages] = createSignal(20);
    const [maxVisible, setMaxVisible] = createSignal(7);
    // untrack: Storybook's Solid renderer wraps every story's render() in its
    // own createMemo. Without this, createPagination's internal setup memo
    // reading totalPages()/maxVisible() during its first synchronous compute
    // leaks as a dependency of that outer memo, causing it to re-invoke this
    // entire render() function (creating brand-new signals) whenever those
    // values change — which breaks rendering. See
    // https://github.com/solidjs-community/solid-primitives/issues/795
    const [paginationProps, page, _setPage] = untrack(() =>
      createPagination(() => ({
        pages: totalPages(),
        maxPages: maxVisible(),
        showEllipsis: true,
      })),
    );

    return (
      <Errored
        fallback={(err, reset) => (
          <p>
            Error: {err}{" "}
            <button type="reset" onClick={reset}>
              Reset
            </button>
          </p>
        )}
      >
        <Container minWidth={400}>
          <StatRow label="Current page" value={page()} />
          <PaginationBar props={paginationProps} />
          <Separator />
          <Section title="Max visible">
            <ButtonRow>
              <For each={[5, 7, 10] as const}>
                {n => (
                  <Button
                    variant={maxVisible() === n ? "primary" : "outline"}
                    onClick={() => setMaxVisible(n)}
                  >
                    {n}
                  </Button>
                )}
              </For>
            </ButtonRow>
          </Section>
          <Section title="Total pages">
            <ButtonRow>
              <For each={[10, 20, 50] as const}>
                {n => (
                  <Button
                    variant={totalPages() === n ? "primary" : "outline"}
                    onClick={() => setTotalPages(n)}
                  >
                    {n}
                  </Button>
                )}
              </For>
            </ButtonRow>
          </Section>
        </Container>
      </Errored>
    );
  },
});

export const CreateSegmentStory = meta.story({
  name: "Paged item grid",
  parameters: {
    docs: {
      description: {
        story:
          "`createSegment` slices a reactive array to the current page window. The result only updates when the slice boundaries or array content actually change — if the array grows but the current page's slice is unaffected, no update is triggered.",
      },
    },
  },
  render: () => {
    const ITEMS = Array.from({ length: 50 }, (_, i) => `Item ${String(i + 1).padStart(2, "0")}`);
    const [limit, setLimit] = createSignal(8);
    // untrack: see the note in CreatePaginationStory above.
    const [paginationProps, page] = untrack(() =>
      createPagination(() => ({
        pages: Math.ceil(ITEMS.length / limit()),
        maxPages: 5,
        showFirst: false,
        showLast: false,
      })),
    );
    const segment = createSegment(ITEMS, limit, page);

    return (
      <Container minWidth={320}>
        <StatRow label="Page" value={`${page()} / ${Math.ceil(ITEMS.length / limit())}`} />
        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(4, 1fr)",
            gap: "0.3rem",
            "min-height": "4.5rem",
          }}
        >
          <For each={segment()}>
            {item => (
              <div
                style={{
                  padding: "0.3rem 0.25rem",
                  "text-align": "center",
                  "font-size": font.sizeSm,
                  "font-family": font.mono,
                  background: colors.secondary,
                  "border-radius": radii.sm,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {item}
              </div>
            )}
          </For>
        </div>
        <PaginationBar props={paginationProps} center />
        <Separator />
        <Section title="Items per page">
          <ButtonRow>
            <For each={[5, 8, 10, 25] as const}>
              {n => (
                <Button variant={limit() === n ? "primary" : "outline"} onClick={() => setLimit(n)}>
                  {n}
                </Button>
              )}
            </For>
          </ButtonRow>
        </Section>
      </Container>
    );
  },
});

export const CreateInfiniteScrollStory = meta.story({
  name: "Infinite scroll with per-page retry",
  parameters: {
    docs: {
      description: {
        story:
          "`createInfiniteScroll` treats every page as its own independent async unit — `pages()` is an array of `{ content, fetching, error, retry }` bundles, ready to feed straight into `<For>`. `content()` is a genuine async value, so each page is wrapped in its own `<Loading>`/`<Errored>` boundary rather than manual `fetching`/`error` checks. One page failing doesn't block the rest of the list; the retry button calls `page.retry()` directly (Errored's own `reset` only re-reads `content()`, which won't refetch on its own). Scroll to the bottom of the box below and `IntersectionObserver` loads the next page automatically via the sentinel — the manual button underneath does the same thing for convenience. Page 1 always fails once to demonstrate per-page retry.",
      },
    },
  },
  render: () => {
    // 4 pages × 6 items = 24 items, page>=4 signals end. Page 1 fails once.
    let page1Failed = false;
    const mockFetcher = async (page: number): Promise<string[]> => {
      await new Promise<void>(resolve => setTimeout(resolve, 600));
      if (page === 1 && !page1Failed) {
        page1Failed = true;
        throw new Error("Network hiccup");
      }
      if (page >= 4) return [];
      return Array.from(
        { length: 6 },
        (_, i) => `Item ${String(page * 6 + i + 1).padStart(2, "0")}`,
      );
    };

    const [pages, loader, { pageCount, end, setPageCount }] = createInfiniteScroll(mockFetcher);

    return (
      <Container width={320}>
        <StatRow label="Pages requested" value={pageCount()} />
        <div
          style={{
            height: "200px",
            overflow: "auto",
            border: `1px solid ${colors.border}`,
            "border-radius": radii.md,
            padding: "0.4rem",
            display: "flex",
            "flex-direction": "column",
            gap: "0.25rem",
          }}
        >
          <For each={pages()}>
            {(page, i) => {
              return (
                <Errored
                  fallback={err => (
                    // Errored's own `reset` just re-reads content() — since our memo
                    // only re-fetches when attempt() changes, retry() (not reset) is
                    // what actually kicks off a new request. Errored also doesn't
                    // hand control back to <Loading> while that retry is in flight,
                    // so this fallback watches `fetching()` itself for feedback.
                    <Show when={!page.fetching()} fallback={<Badge>Retrying page {i()}…</Badge>}>
                      <div style={{ display: "flex", gap: "0.4rem", "align-items": "center" }}>
                        <Badge variant="error">{String(err())}</Badge>
                        <Button variant="outline" onClick={page.retry}>
                          Retry
                        </Button>
                      </div>
                    </Show>
                  )}
                >
                  <Loading fallback={<Badge>Loading page {i()}…</Badge>}>
                    <For each={page.content()}>
                      {item => (
                        <div
                          style={{
                            padding: "0.4rem 0.75rem",
                            background: colors.secondary,
                            "border-radius": radii.sm,
                            "font-size": font.sizeSm,
                            "font-family": font.mono,
                            border: `1px solid ${colors.border}`,
                            "flex-shrink": "0",
                          }}
                        >
                          {item}
                        </div>
                      )}
                    </For>
                  </Loading>
                </Errored>
              );
            }}
          </For>
          {/* IntersectionObserver clips the target's visibility against any
              scrollable ancestor even with the default root (viewport), so
              this sentinel correctly fires on scroll within this box — no
              page-level scroll container needed. */}
          <Show when={!end()}>
            <div ref={loader} style={{ height: "1px" }} />
          </Show>
        </div>
        <Show when={!end()}>
          <Button variant="outline" onClick={() => setPageCount(p => p + 1)}>
            Load next page
          </Button>
        </Show>
        <Show when={end()}>
          <Badge variant="success">All pages loaded</Badge>
        </Show>
        <Separator />
        <BoolRow label="end" value={end()} />
      </Container>
    );
  },
});
