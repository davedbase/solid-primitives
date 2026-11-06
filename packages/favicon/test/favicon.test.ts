import "./setup.js";
import { OBSERVE, createEffect, createRoot, createSignal, flush } from "solid-js";
import { attribution } from "solid-js/attribution";
import { describe, expect, test, afterEach } from "vitest";
import { makeFavicon, createFavicon } from "../src/index.js";

afterEach(() => {
  document.head.querySelectorAll('link[rel="icon"]').forEach(el => el.remove());
});

describe("makeFavicon", () => {
  test("creates a link[rel=icon] when none exists, removes it on dispose", () => {
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();

    const favicon = makeFavicon("/a.png");
    const link = document.head.querySelector('link[rel="icon"]');
    expect(link).not.toBeNull();
    expect(favicon.href).toBe(new URL("/a.png", location.href).href);

    favicon.dispose();
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();
  });

  test("reuses an existing link and restores its href on dispose", () => {
    const existing = document.createElement("link");
    existing.rel = "icon";
    existing.href = "/original.png";
    document.head.appendChild(existing);

    const favicon = makeFavicon("/new.png");
    expect(document.head.querySelectorAll('link[rel="icon"]').length).toBe(1);
    expect(favicon.href).toBe(new URL("/new.png", location.href).href);

    favicon.dispose();
    expect(existing.href).toBe(new URL("/original.png", location.href).href);
    existing.remove();
  });

  test("reusing an attribute-less existing link restores it without an href on dispose", () => {
    const existing = document.createElement("link");
    existing.rel = "icon";
    document.head.appendChild(existing);
    expect(existing.hasAttribute("href")).toBe(false);

    const favicon = makeFavicon("/new.png");
    expect(existing.getAttribute("href")).toBe("/new.png");

    favicon.dispose();
    expect(existing.hasAttribute("href")).toBe(false);
    existing.remove();
  });

  test("setHref updates the link", () => {
    const favicon = makeFavicon("/a.png");
    favicon.setHref("/b.png");
    expect(favicon.href).toBe(new URL("/b.png", location.href).href);
    favicon.dispose();
  });

  test("supports a custom rel", () => {
    const favicon = makeFavicon("/touch.png", { rel: "apple-touch-icon" });
    expect(document.head.querySelector('link[rel="apple-touch-icon"]')).not.toBeNull();
    favicon.dispose();
    expect(document.head.querySelector('link[rel="apple-touch-icon"]')).toBeNull();
  });

  test("nested make calls restore in LIFO order", () => {
    const outer = makeFavicon("/outer.png");
    const inner = makeFavicon("/inner.png");
    expect(inner.href).toBe(new URL("/inner.png", location.href).href);

    inner.dispose();
    expect(outer.href).toBe(new URL("/outer.png", location.href).href);

    outer.dispose();
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();
  });
});

describe("createFavicon", () => {
  test("applies the initial href and restores on cleanup", () => {
    const href = createRoot(dispose => {
      const href = createFavicon("/static.png");
      expect(href()).toBe(new URL("/static.png", location.href).href);
      dispose();
      return href;
    });
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();
    expect(href()).toBe(new URL("/static.png", location.href).href);
  });

  test("reactively updates when given an accessor", () => {
    const [path, setPath] = createSignal("/a.png");
    const { href, dispose } = createRoot(dispose => ({ href: createFavicon(path), dispose }));

    expect(href()).toBe(new URL("/a.png", location.href).href);

    setPath("/b.png");
    flush();
    expect(href()).toBe(new URL("/b.png", location.href).href);

    dispose();
  });

  test("a static href never sets up an effect", () => {
    createRoot(dispose => {
      const href = createFavicon("/static.png");
      flush();
      expect(href()).toBe(new URL("/static.png", location.href).href);
      dispose();
    });
  });
});

describe("createFavicon consistency", () => {
  test("href is consistent with a sibling signal changed in the same write", () => {
    const [label, setLabel] = createSignal("a");
    const [src, setSrc] = createSignal("/a.png");
    const seen: string[] = [];
    const dispose = createRoot(dispose => {
      const href = createFavicon(src);
      createEffect(
        () => [label(), href()] as const,
        ([l, h]) => {
          seen.push(`${l}:${h}`);
        },
      );
      return dispose;
    });
    flush();
    seen.length = 0;

    setLabel("b");
    setSrc("/b.png");
    flush();
    expect(seen).toEqual([`b:${new URL("/b.png", location.href).href}`]);
    dispose();
  });

  test("the returned accessor is tracked: a consumer effect sees every change", () => {
    const [src, setSrc] = createSignal("/a.png");
    const seen: string[] = [];
    const { dispose } = createRoot(dispose => {
      const href = createFavicon(src);
      createEffect(
        () => href(),
        value => {
          seen.push(value);
        },
      );
      return { dispose };
    });
    flush();
    for (const next of ["/b.png", "/c.png", "/d.png"]) {
      setSrc(next);
      flush();
    }
    expect(seen).toEqual(
      ["/a.png", "/b.png", "/c.png", "/d.png"].map(p => new URL(p, location.href).href),
    );
    dispose();
  });

  test("href() already reflects the new value before the <link> is written, in the same flush", () => {
    const [src, setSrc] = createSignal("/a.png");
    const seen: string[] = [];
    const { dispose } = createRoot(dispose => {
      const href = createFavicon(src);
      const link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')!;
      // the compute phase runs before the favicon's apply phase writes the <link>
      createEffect(
        () => `${href()}|${link.getAttribute("href")}`,
        value => {
          seen.push(value);
        },
      );
      return { dispose };
    });
    flush();
    seen.length = 0;
    setSrc("/b.png");
    flush();
    expect(seen).toEqual([`${new URL("/b.png", location.href).href}|/a.png`]);
    dispose();
  });

  test("a <base href> change: static href follows it, a reactive href's memo does not until its source changes", () => {
    const [src, setSrc] = createSignal("a.png");
    const { fixed, reactive, dispose } = createRoot(dispose => ({
      fixed: createFavicon("s.png"),
      reactive: createFavicon(src),
      dispose,
    }));
    flush();
    const base = document.createElement("base");
    base.href = "https://base.test/dir/";
    document.head.appendChild(base);
    flush();
    expect(fixed()).toBe("https://base.test/dir/s.png");
    expect(reactive()).toBe(new URL("a.png", location.href).href);
    setSrc("c.png");
    flush();
    expect(reactive()).toBe("https://base.test/dir/c.png");
    base.remove();
    dispose();
  });

  test("resolves like the <link> element", () => {
    const cases = ["/a.png", "a.png", "", "https://x.com/a b.png", "data:image/png;base64,AAA"];
    const [src, setSrc] = createSignal(cases[0]!);
    const { href, dispose } = createRoot(dispose => ({ href: createFavicon(src), dispose }));
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')!;
    for (const value of cases) {
      setSrc(value);
      flush();
      expect(href()).toBe(link.href);
    }
    dispose();
  });

  test("raises no effect-feedback diagnostics over several changes", () => {
    const release = attribution.enable();
    const cap = OBSERVE!.diagnostics.capture();
    const [src, setSrc] = createSignal("/a.png");
    const dispose = createRoot(dispose => {
      const href = createFavicon(src);
      createEffect(
        () => href(),
        () => {},
      );
      return dispose;
    });
    flush();
    for (let i = 0; i < 8; i++) {
      setSrc(`/icon-${i}.png`);
      flush();
    }
    dispose();
    const codes = cap.stop().map(e => e.code);
    release();
    expect(codes.filter(c => c.startsWith("EFFECT_"))).toEqual([]);
  });
});
