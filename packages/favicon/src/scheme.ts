import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
} from "solid-js";
import { isServer } from "@solidjs/web";
import { access, INTERNAL_OPTIONS, type MaybeAccessor, noop } from "@solid-primitives/utils";
import { makeEventListener } from "@solid-primitives/event-listener";
import { makeFavicon } from "./favicon.ts";
import { resolveFaviconHref, type FaviconController, type FaviconOptions } from "./link.ts";

export type FaviconColorScheme = "light" | "dark";

export type FaviconSchemeIcons = {
  light: string;
  dark: string;
};

export type FaviconSchemeController = FaviconController & {
  /** Which icon is currently showing, based on `prefers-color-scheme`. */
  readonly scheme: FaviconColorScheme;
};

/** SSR has no `matchMedia` to query — every export here treats the server as `"light"`. */
const SERVER_SCHEME: FaviconColorScheme = "light";

/**
 * Sets the document favicon to `icons.light` or `icons.dark` to match the OS/browser
 * `prefers-color-scheme`, and keeps it in sync as that preference changes.
 *
 * Non-reactive: `icons` is a plain object, read once (the light/dark swap still keeps working —
 * only the two href strings themselves are static). For a reactive, auto-disposing version see
 * {@link createFaviconScheme}.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/favicon#makeFaviconScheme
 * @example
 * const favicon = makeFaviconScheme({ light: "/favicon-light.svg", dark: "/favicon-dark.svg" });
 * favicon.dispose(); // restores the previous favicon, stops watching the media query
 */
export function makeFaviconScheme(
  icons: FaviconSchemeIcons,
  options: FaviconOptions = {},
): FaviconSchemeController {
  if (isServer) {
    return { href: icons[SERVER_SCHEME], scheme: SERVER_SCHEME, setHref: noop, dispose: noop };
  }

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  let scheme: FaviconColorScheme = mql.matches ? "dark" : "light";
  const favicon = makeFavicon(icons[scheme], options);

  const clear = makeEventListener<{ change: MediaQueryListEvent }>(mql, "change", event => {
    scheme = event.matches ? "dark" : "light";
    favicon.setHref(icons[scheme]);
  });

  return {
    get href() {
      return favicon.href;
    },
    get scheme() {
      return scheme;
    },
    setHref: favicon.setHref,
    dispose() {
      clear();
      favicon.dispose();
    },
  };
}

/**
 * Reactively sets the document favicon to `icons.light` or `icons.dark` to match
 * `prefers-color-scheme`, updating on both an `icons` change and an OS-level scheme change.
 * Restores the previous favicon on cleanup.
 *
 * @returns the currently-applied href and the currently-active scheme, both reactive
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/favicon#createFaviconScheme
 * @example
 * const favicon = createFaviconScheme({ light: "/favicon-light.svg", dark: "/favicon-dark.svg" });
 * favicon.scheme(); // "light" | "dark"
 */
export function createFaviconScheme(
  icons: MaybeAccessor<FaviconSchemeIcons>,
  options: FaviconOptions = {},
): { href: Accessor<string>; scheme: Accessor<FaviconColorScheme> } {
  if (isServer) {
    // Lazy, like `createFavicon`'s `() => access(href)` — re-reads `icons` on every call rather
    // than capturing a stale snapshot, in case it's a reactive accessor.
    return { href: () => access(icons)[SERVER_SCHEME], scheme: () => SERVER_SCHEME };
  }

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const [scheme, setScheme] = createSignal<FaviconColorScheme>(
    mql.matches ? "dark" : "light",
    INTERNAL_OPTIONS,
  );

  // `untrack` — this initial read must not happen as a top-level tracked read (it isn't inside
  // JSX, a memo, or an effect's compute phase), or Solid's dev-mode diagnostics flag it as
  // `STRICT_READ_UNTRACKED`.
  const initialIcons = untrack(() => access(icons));
  const favicon = makeFavicon(initialIcons[untrack(scheme)], options);
  // Derived, not mirrored: the applied href is a pure function of `icons` and `scheme`, so it is
  // a memo and lands in the same flush as `scheme` (a mirror written from the effect would show
  // the new scheme next to the previous href for one flush).
  const href = createMemo(() => resolveFaviconHref(access(icons)[scheme()]));

  makeEventListener<{ change: MediaQueryListEvent }>(mql, "change", event => {
    setScheme(event.matches ? "dark" : "light");
  });

  // `defer: true` — the initial value was already applied synchronously above.
  createEffect(
    () => [access(icons), scheme()] as const,
    ([currentIcons, currentScheme]) => {
      favicon.setHref(currentIcons[currentScheme]);
    },
    { defer: true },
  );

  onCleanup(favicon.dispose);

  return { href, scheme };
}
