import "./setup.js";
import { OBSERVE, createEffect, createRoot, createSignal, flush } from "solid-js";
import { attribution } from "solid-js/attribution";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { makeFaviconScheme, createFaviconScheme } from "../src/index.js";
import { installMatchMediaMock, setPrefersColorScheme } from "./setup.js";

const ICONS = { light: "/light.png", dark: "/dark.png" };

beforeEach(() => {
  installMatchMediaMock();
  setPrefersColorScheme("light");
});

afterEach(() => {
  document.head.querySelectorAll('link[rel="icon"]').forEach(el => el.remove());
});

describe("makeFaviconScheme", () => {
  test("starts on light when the OS prefers light", () => {
    const favicon = makeFaviconScheme(ICONS);
    expect(favicon.scheme).toBe("light");
    expect(favicon.href).toBe(new URL(ICONS.light, location.href).href);
    favicon.dispose();
  });

  test("starts on dark when the OS prefers dark", () => {
    setPrefersColorScheme("dark");
    const favicon = makeFaviconScheme(ICONS);
    expect(favicon.scheme).toBe("dark");
    expect(favicon.href).toBe(new URL(ICONS.dark, location.href).href);
    favicon.dispose();
  });

  test("switches when the OS preference changes", () => {
    const favicon = makeFaviconScheme(ICONS);
    setPrefersColorScheme("dark");
    expect(favicon.scheme).toBe("dark");
    expect(favicon.href).toBe(new URL(ICONS.dark, location.href).href);

    setPrefersColorScheme("light");
    expect(favicon.scheme).toBe("light");
    expect(favicon.href).toBe(new URL(ICONS.light, location.href).href);

    favicon.dispose();
  });

  test("dispose restores the previous favicon and stops watching", () => {
    const favicon = makeFaviconScheme(ICONS);
    favicon.dispose();
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();

    setPrefersColorScheme("dark");
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();
  });
});

describe("createFaviconScheme", () => {
  test("applies the initial scheme and restores on cleanup", () => {
    const { favicon, dispose } = createRoot(dispose => ({
      favicon: createFaviconScheme(ICONS),
      dispose,
    }));
    expect(favicon.scheme()).toBe("light");
    expect(favicon.href()).toBe(new URL(ICONS.light, location.href).href);

    dispose();
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();
  });

  test("reacts to an OS-level scheme change", () => {
    const { favicon, dispose } = createRoot(dispose => ({
      favicon: createFaviconScheme(ICONS),
      dispose,
    }));

    setPrefersColorScheme("dark");
    flush();
    expect(favicon.scheme()).toBe("dark");
    expect(favicon.href()).toBe(new URL(ICONS.dark, location.href).href);

    dispose();
  });

  test("reacts to a reactive icons change", () => {
    const [icons, setIcons] = createSignal(ICONS);
    const { favicon, dispose } = createRoot(dispose => ({
      favicon: createFaviconScheme(icons),
      dispose,
    }));

    setIcons({ light: "/light-2.png", dark: "/dark-2.png" });
    flush();
    expect(favicon.href()).toBe(new URL("/light-2.png", location.href).href);

    dispose();
  });

  test("href lands in the same flush as scheme (no torn light/dark frame)", () => {
    const seen: string[] = [];
    const { favicon, dispose } = createRoot(dispose => {
      const favicon = createFaviconScheme(ICONS);
      createEffect(
        () => [favicon.scheme(), favicon.href()] as const,
        ([scheme, href]) => {
          seen.push(`${scheme}:${href}`);
        },
      );
      return { favicon, dispose };
    });
    flush();
    seen.length = 0;

    setPrefersColorScheme("dark");
    flush();
    expect(seen).toEqual([`dark:${new URL(ICONS.dark, location.href).href}`]);
    expect(favicon.href()).toBe(new URL(ICONS.dark, location.href).href);
    dispose();
  });

  test("href is tracked: a consumer effect reading only href() sees scheme and icon changes", () => {
    const [icons, setIcons] = createSignal(ICONS);
    const seen: string[] = [];
    const { dispose } = createRoot(dispose => {
      const favicon = createFaviconScheme(icons);
      createEffect(
        () => favicon.href(),
        value => {
          seen.push(value);
        },
      );
      return { dispose };
    });
    flush();
    seen.length = 0;
    setPrefersColorScheme("dark");
    flush();
    setIcons({ light: "/l2.png", dark: "/d2.png" });
    flush();
    setPrefersColorScheme("light");
    flush();
    expect(seen).toEqual(
      [ICONS.dark, "/d2.png", "/l2.png"].map(p => new URL(p, location.href).href),
    );
    dispose();
  });

  test("href matches what the <link> element reports", () => {
    const cases = ["/a.png", "a.png", "", "https://x.com/a b.png", "data:image/png;base64,AAA"];
    const [icons, setIcons] = createSignal({ light: cases[0]!, dark: cases[0]! });
    const { favicon, dispose } = createRoot(dispose => ({
      favicon: createFaviconScheme(icons),
      dispose,
    }));
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')!;
    for (const value of cases) {
      setIcons({ light: value, dark: value });
      flush();
      expect(favicon.href()).toBe(link.href);
    }
    dispose();
  });

  test("raises no effect-feedback diagnostics over several scheme/icon changes", () => {
    const release = attribution.enable();
    const cap = OBSERVE!.diagnostics.capture();
    const [icons, setIcons] = createSignal(ICONS);
    const { dispose } = createRoot(dispose => {
      const favicon = createFaviconScheme(icons);
      createEffect(
        () => [favicon.scheme(), favicon.href()] as const,
        () => {},
      );
      return { dispose };
    });
    flush();
    for (let i = 0; i < 6; i++) {
      setPrefersColorScheme(i % 2 === 0 ? "dark" : "light");
      flush();
      setIcons({ light: `/light-${i}.png`, dark: `/dark-${i}.png` });
      flush();
    }
    dispose();
    const codes = cap.stop().map(e => e.code);
    release();
    expect(codes.filter(c => c.startsWith("EFFECT_"))).toEqual([]);
  });
});
