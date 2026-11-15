import { describe, test, expect } from "vitest";
import { createMemo, createRoot, createSignal, flush, For } from "solid-js";
import { render } from "@solidjs/web";
import {
  createInfiniteScroll,
  createPagination,
  createSegment,
  type PaginationOptions,
} from "../src/index.js";

describe("createPagination", () => {
  test("createPagination returns page getter and setter", () => {
    const { page, setPage, dispose } = createRoot(dispose => {
      const [, page, setPage] = createPagination({ pages: 100 });
      return { page, setPage, dispose };
    });
    expect(page(), "initial value should be 1").toBe(1);
    setPage(2);
    flush();
    expect(page(), "value after change should be 2").toBe(2);
    dispose();
  });

  test("createPagination returns props", () => {
    const { paginationProps, page, setPage, dispose } = createRoot(dispose => {
      const [paginationProps, page, setPage] = createPagination({ pages: 100 });
      return { paginationProps, page, setPage, dispose };
    });
    expect(paginationProps().map(({ children }) => children)).toEqual([
      "|<",
      "<",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      ">",
      ">|",
    ]);
    expect(paginationProps().findIndex(({ ["aria-current"]: current }) => current)).toBe(2);
    setPage(page() + 1);
    flush();
    expect(paginationProps().findIndex(({ ["aria-current"]: current }) => current)).toBe(3);
    dispose();
  });

  test("createPagination with ellipsis returns correct props", () => {
    const { paginationProps, page, setPage, dispose } = createRoot(dispose => {
      const [paginationProps, page, setPage] = createPagination({ pages: 100, showEllipsis: true });
      return { paginationProps, page, setPage, dispose };
    });
    expect(paginationProps().map(({ children }) => children)).toEqual([
      "<",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "...",
      "100",
      ">",
    ]);
    expect(paginationProps()[9].inert).toBeTruthy();
    dispose();
  });

  test("createPagination applies default aria-labels", () => {
    const { paginationProps, dispose } = createRoot(dispose => {
      const [paginationProps] = createPagination({ pages: 100 });
      return { paginationProps, dispose };
    });
    const [first, prev, , , , , , , , , , , next, last] = paginationProps();
    expect(first?.["aria-label"]).toBe("First page");
    expect(prev?.["aria-label"]).toBe("Previous page");
    expect(next?.["aria-label"]).toBe("Next page");
    expect(last?.["aria-label"]).toBe("Last page");
    dispose();
  });

  test("createPagination applies custom aria-labels", () => {
    const { paginationProps, dispose } = createRoot(dispose => {
      const [paginationProps] = createPagination({
        pages: 100,
        firstAriaLabel: "Go to first page",
        prevAriaLabel: "Go to previous page",
        nextAriaLabel: "Go to next page",
        lastAriaLabel: "Go to last page",
      });
      return { paginationProps, dispose };
    });
    const [first, prev, , , , , , , , , , , next, last] = paginationProps();
    expect(first?.["aria-label"]).toBe("Go to first page");
    expect(prev?.["aria-label"]).toBe("Go to previous page");
    expect(next?.["aria-label"]).toBe("Go to next page");
    expect(last?.["aria-label"]).toBe("Go to last page");
    dispose();
  });

  test("createPagination clamps start", () =>
    createRoot(dispose => {
      const [paginationProps, _page, _setPage] = createPagination({
        pages: 10,
        maxPages: 13,
      });
      const extraProps = 4;
      expect(paginationProps().length, "pages").toBe(10 + extraProps);
      dispose();
    }));

  test("createPagination reacts to options update", () => {
    const commonOptions = {
      showFirst: false,
      showPrev: false,
      showNext: false,
      showLast: false,
    };
    const [options, setOptions] = createSignal({ ...commonOptions, pages: 10, maxPages: 20 });
    const { paginationProps, dispose } = createRoot(dispose => {
      const [paginationProps] = createPagination(options);
      return { paginationProps, dispose };
    });
    expect(paginationProps().length, "initial pages").toBe(10);
    setOptions({ ...commonOptions, pages: 5, maxPages: 10 });
    flush();
    expect(paginationProps().length, "pages after change").toBe(5);
    dispose();
  });

  test("createPagination pages reused", () => {
    const commonOptions = {
      showFirst: false,
      showPrev: false,
      showNext: false,
      showLast: false,
    };
    const [options, setOptions] = createSignal({ ...commonOptions, pages: 3 });
    const { paginationProps, dispose } = createRoot(dispose => {
      const [paginationProps] = createPagination(options);
      return { paginationProps, dispose };
    });
    const initialPages = paginationProps();
    setOptions({ ...commonOptions, pages: 2 });
    flush();
    const updatedPages = paginationProps();
    expect(updatedPages.every((page, index) => Object.is(page, initialPages[index]))).toBe(true);
    dispose();
  });

  test("createPagination next back", () =>
    createRoot(dispose => {
      const [paginationProps, _page, _setPage] = createPagination({
        pages: 100,
        maxPages: 1,
        showFirst: false,
        initialPage: 3,
      });
      var back = paginationProps()[0];
      var next = paginationProps()[2];

      expect(back?.page, "back page should be 2").toStrictEqual(2);
      expect(next?.page, "next page should be 4").toStrictEqual(4);

      dispose();
    }));

  test("setting page below one will yield the first page", () => {
    const { page, setPage, dispose } = createRoot(dispose => {
      const [, page, setPage] = createPagination({ pages: 10, maxPages: 5 });
      return { page, setPage, dispose };
    });
    expect(page()).toBe(1);
    setPage(0);
    flush();
    expect(page()).toBe(1);
    setPage(-1);
    flush();
    expect(page()).toBe(1);
    dispose();
  });

  test("setting page beyond the number pages will yield the last page", () => {
    const { page, setPage, dispose } = createRoot(dispose => {
      const [, page, setPage] = createPagination({ pages: 10, maxPages: 5, initialPage: 10 });
      return { page, setPage, dispose };
    });
    expect(page()).toBe(10);
    setPage(11);
    flush();
    expect(page()).toBe(10);
    setPage(Infinity);
    flush();
    expect(page()).toBe(10);
    dispose();
  });

  test("lowering the number of pages will not make the page go beyond it", () => {
    const [options, setOptions] = createSignal<PaginationOptions>({
      pages: 10,
      maxPages: 5,
      initialPage: 10,
    });
    const { page, dispose } = createRoot(dispose => {
      const [, page] = createPagination(options);
      return { page, dispose };
    });
    expect(page()).toBe(10);
    setOptions({ pages: 8, maxPages: 5 });
    flush();
    expect(page()).toBe(8);
    dispose();
  });

  test("sets the focus after going to a new page", async () => {
    const originalFocus = HTMLElement.prototype.focus;
    let current = document.body;
    HTMLElement.prototype.focus = function () {
      current = this;
      originalFocus.call(this);
    };
    let dispose;
    try {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const Pagination = () => {
        const [pagination] = createPagination({ pages: 10, maxPages: 5, initialPage: 1 });
        return (
          <nav>
            <For each={pagination()}>{props => <button type="button" {...props} />}</For>
          </nav>
        );
      };
      dispose = render(() => <Pagination />, container);
      const activeButton = container?.querySelector('nav button[aria-current="page"]');
      activeButton instanceof HTMLElement && activeButton.focus();
      for (var i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 15));
        current?.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            charCode: 0,
            code: "ArrowRight",
            key: "ArrowRight",
            keyCode: 39,
          }),
        );
        current?.dispatchEvent(
          new KeyboardEvent("keyup", {
            bubbles: true,
            charCode: 0,
            code: "ArrowRight",
            key: "ArrowRight",
            keyCode: 39,
          }),
        );
        await new Promise(r => setTimeout(r, 45));
        expect(current.getAttribute("aria-current")).toBe("page");
      }
    } finally {
      queueMicrotask(dispose);
      HTMLElement.prototype.focus = originalFocus;
    }
  });
});

describe("createSegment", () => {
  test("creates valid segments", () => {
    const [page, setPage] = createSignal(1);
    const { segment, dispose } = createRoot(dispose => {
      const items = createMemo(() => Array.from({ length: 50 }, (_, i) => i + 1));
      return { segment: createSegment(items, 10, page), dispose };
    });

    expect(segment()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    setPage(5);
    flush();
    expect(segment()).toEqual([41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
    setPage(6);
    flush();
    expect(segment()).toEqual([]);
    dispose();
  });

  test("does not create the same segment twice", () => {
    const [length, setLength] = createSignal(50);
    const [page, setPage] = createSignal(1);
    const { segment, dispose } = createRoot(dispose => {
      const items = createMemo(() => Array.from({ length: length() }, (_, i) => i + 1));
      return { segment: createSegment(items, 10, page), dispose };
    });

    const seg1 = segment();
    setLength(10);
    flush();
    const seg2 = segment();
    expect(seg1).toBe(seg2);
    setPage(2);
    flush();
    const seg3 = segment();
    setPage(3);
    flush();
    const seg4 = segment();
    expect(seg3).toBe(seg4);
    dispose();
  });

  test("creates a new segment if new items are added", () => {
    const [length, setLength] = createSignal(55);
    const [page] = createSignal(6);
    const { segment, dispose } = createRoot(dispose => {
      const items = createMemo(() => Array.from({ length: length() }, (_, i) => i + 1));
      return { segment: createSegment(items, 10, page), dispose };
    });

    const seg1 = segment();
    expect(seg1).toEqual([51, 52, 53, 54, 55]);
    setLength(57);
    flush();
    const seg2 = segment();
    expect(seg2).toEqual([51, 52, 53, 54, 55, 56, 57]);
    expect(seg1).not.toBe(seg2);
    dispose();
  });
});

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  observed = new Set<Element>();
  constructor(public callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as never);
  }
}
//@ts-ignore
global.IntersectionObserver = MockIntersectionObserver;

const settle = async () => {
  flush();
  await Promise.resolve();
  await Promise.resolve();
  flush();
};

describe("createInfiniteScroll", () => {
  const fetcher = async (page: number) => Array.from({ length: page + 1 }, (_, i) => page * 10 + i);

  test("requests page 0 eagerly and resolves its content", async () => {
    await createRoot(async dispose => {
      const [pages, , { pageCount }] = createInfiniteScroll(fetcher);
      expect(pages().length).toBe(1);
      expect(pageCount()).toBe(1);

      const page0 = pages()[0]!;
      expect(page0.fetching(), "fetching until the effect's first pass resolves").toBe(true);

      await settle();

      expect(page0.fetching()).toBe(false);
      expect(page0.error()).toBeUndefined();
      expect(page0.content()).toEqual([0]);

      dispose();
    });
  });

  test("setPageCount grows the page list and fetches the new page", async () => {
    await createRoot(async dispose => {
      const [pages, , { setPageCount }] = createInfiniteScroll(fetcher);
      await settle();

      setPageCount(p => p + 1);
      flush();
      expect(pages().length).toBe(2);

      await settle();
      expect(pages()[1]!.content()).toEqual([10, 11]);

      dispose();
    });
  });

  test("a page returning an empty array sets end without touching earlier pages", async () => {
    const fetchUntilEmpty = async (page: number) => (page >= 1 ? [] : [0]);
    await createRoot(async dispose => {
      const [pages, , { setPageCount, end }] = createInfiniteScroll(fetchUntilEmpty);
      await settle();
      expect(end()).toBe(false);

      setPageCount(p => p + 1);
      await settle();

      expect(end()).toBe(true);
      expect(pages()[0]!.content()).toEqual([0]);
      dispose();
    });
  });

  test("a failed fetch surfaces error() without setting end, and retry() recovers", async () => {
    let shouldFail = true;
    const flaky = async (page: number) => {
      if (shouldFail) throw new Error("network down");
      return [page];
    };
    await createRoot(async dispose => {
      const [pages, , { end }] = createInfiniteScroll(flaky);
      const page0 = pages()[0]!;
      await settle();

      expect(page0.fetching()).toBe(false);
      expect(page0.error()).toBeInstanceOf(Error);
      expect(end(), "an error is not the same as running out of content").toBe(false);

      shouldFail = false;
      page0.retry();
      await settle();

      expect(page0.error()).toBeUndefined();
      expect(page0.content()).toEqual([0]);

      dispose();
    });
  });

  test("the sentinel auto-advances once settled, but not while fetching or errored", async () => {
    await createRoot(async dispose => {
      const [pages, loader, { pageCount }] = createInfiniteScroll(fetcher);
      const el = document.createElement("div");
      loader(el);
      const io = MockIntersectionObserver.instances.at(-1)!;

      // page 0 hasn't resolved yet — must not advance
      io.trigger(true);
      flush();
      expect(pageCount()).toBe(1);

      await settle();

      io.trigger(true);
      flush();
      expect(pageCount()).toBe(2);
      expect(pages().length).toBe(2);

      dispose();
    });
  });

  test("the sentinel does not auto-advance past an errored page", async () => {
    const failOnPage1 = async (page: number) => {
      if (page === 1) throw new Error("boom");
      return [page];
    };
    await createRoot(async dispose => {
      const [, loader, { pageCount }] = createInfiniteScroll(failOnPage1);
      const el = document.createElement("div");
      loader(el);
      const io = MockIntersectionObserver.instances.at(-1)!;

      await settle();
      io.trigger(true);
      await settle();
      expect(pageCount()).toBe(2);

      io.trigger(true);
      flush();
      expect(pageCount(), "page 1 errored, so IO should not advance to page 2").toBe(2);

      dispose();
    });
  });

  test("shrinking pageCount disposes the pages that fall out of range", async () => {
    await createRoot(async dispose => {
      const [pages, , { setPageCount }] = createInfiniteScroll(fetcher);
      setPageCount(p => p + 2); // grow to 3 pages
      await settle();
      expect(pages().length).toBe(3);

      setPageCount(1);
      flush();
      expect(pages().length, "shrinking should drop the disposed pages from the list").toBe(1);

      dispose();
    });
  });

  test("reset disposes every page and starts over with fresh instances", async () => {
    await createRoot(async dispose => {
      const [pages, , { setPageCount, reset }] = createInfiniteScroll(fetcher);
      await settle();
      setPageCount(p => p + 1);
      await settle();
      expect(pages().length).toBe(2);

      const stalePage0 = pages()[0]!;
      reset();
      flush();
      expect(pages().length).toBe(1);

      const fresh = pages()[0]!;
      expect(
        fresh,
        "page 0 never structurally left the list across the reset, so without the generation key it would stay cached",
      ).not.toBe(stalePage0);
      await settle();
      expect(fresh.content()).toEqual([0]);

      dispose();
    });
  });

  test("initialPageCount overrides the default number of pages requested up front", async () => {
    await createRoot(async dispose => {
      const [pages, , { pageCount, reset }] = createInfiniteScroll(fetcher, {
        initialPageCount: 3,
      });
      expect(pageCount()).toBe(3);
      expect(pages().length).toBe(3);

      await settle();
      expect(pages()[2]!.content()).toEqual([20, 21, 22]);

      // reset() should return to initialPageCount, not the single-page default
      reset();
      flush();
      expect(pageCount()).toBe(3);
      expect(pages().length).toBe(3);

      dispose();
    });
  });
});
