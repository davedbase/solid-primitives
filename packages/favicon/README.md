<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=favicon" alt="Solid Primitives favicon">
</p>

# @solid-primitives/favicon

[![size](https://img.shields.io/badge/size-2.55_kB-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/favicon)
[![version](https://img.shields.io/npm/v/@solid-primitives/favicon?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/favicon)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Primitives for controlling the document favicon: swap it, animate it, overlay a notification
badge, follow the OS color scheme, or show upload/download progress. The `make*` variants are
non-reactive and require no Solid owner. The `create*` variants integrate with Solid's reactive
system and restore the previous favicon `onCleanup`.

- `makeFavicon` / `createFavicon` — swap the favicon href.
- `makeFaviconAnimation` / `createFaviconAnimation` — cycle a sequence of hrefs on an interval, for
  loading spinners and status indicators.
- `makeFaviconBadge` / `createFaviconBadge` — composite a notification count/dot onto a base icon.
- `makeFaviconScheme` / `createFaviconScheme` — swap between a light/dark icon to match
  `prefers-color-scheme`.
- `makeFaviconProgress` / `createFaviconProgress` — composite a progress ring onto a base icon.
- `FaviconLink` — a Solid component that renders the favicon `<link>` directly, so its initial
  href is part of the server-rendered HTML instead of only applying once the client hydrates.

## Installation

```bash
npm install @solid-primitives/favicon
# or
yarn add @solid-primitives/favicon
# or
pnpm add @solid-primitives/favicon
```

## How to use it

### `makeFavicon` / `createFavicon`

```ts
const favicon = makeFavicon("/favicon-dark.svg");
favicon.setHref("/favicon-light.svg");
favicon.dispose(); // restores whatever favicon was there before
```

```ts
const href = createFavicon(() => (unreadCount() > 0 ? "/favicon-alert.svg" : "/favicon.svg"));
href(); // the currently-applied href, resolved to an absolute URL
```

```ts
type FaviconRel = "icon" | "shortcut icon" | "apple-touch-icon";

type FaviconOptions = {
  /** @default "icon" */
  rel?: FaviconRel;
};

type FaviconController = {
  readonly href: string;
  setHref(href: string): void;
  dispose(): void;
};

function makeFavicon(href: string, options?: FaviconOptions): FaviconController;

function createFavicon(href: MaybeAccessor<string>, options?: FaviconOptions): Accessor<string>;
```

If the page already has a `<link rel="icon">`, it's reused and its href restored on `dispose()`;
otherwise one is created and removed on `dispose()`. Nested/sequential calls compose correctly as
long as disposal happens in the reverse of creation order (the normal case for component
mount/unmount) — each call restores whatever was there right before it ran, like a stack.

### `makeFaviconAnimation` / `createFaviconAnimation`

For build-status spinners, "recording" pulses, and similar loading indicators — cycles the
favicon through a sequence of pre-rendered frames.

```ts
const anim = makeFaviconAnimation(["/spin-1.png", "/spin-2.png", "/spin-3.png"], {
  interval: 150,
});
anim.pause();
anim.play();
anim.dispose(); // restores the previous favicon, stops the interval
```

```ts
const spinner = createFaviconAnimation(["/spin-1.png", "/spin-2.png", "/spin-3.png"]);
spinner.frame(); // current frame index
spinner.playing(); // boolean
spinner.pause();
spinner.play();
```

The reactive `createFaviconAnimation` automatically pauses while the tab is hidden
(`document.visibilitychange`) and resumes if it was playing before — a backgrounded tab won't keep
repainting an icon nobody can see.

```ts
type FaviconAnimationOptions = {
  /** Milliseconds between frames. @default 200 */
  interval?: number;
  /** Start cycling immediately. @default true */
  autoplay?: boolean;
  /** Loop back to the first frame after the last. @default true */
  loop?: boolean;
} & FaviconOptions;

type FaviconAnimationController = {
  readonly href: string;
  readonly frame: number;
  readonly playing: boolean;
  play(): void;
  pause(): void;
  dispose(): void;
};

function makeFaviconAnimation(
  frames: readonly string[],
  options?: FaviconAnimationOptions,
): FaviconAnimationController;

function createFaviconAnimation(
  frames: MaybeAccessor<readonly string[]>,
  options?: FaviconAnimationOptions,
): {
  frame: Accessor<number>;
  playing: Accessor<boolean>;
  play(): void;
  pause(): void;
};
```

### `makeFaviconBadge` / `createFaviconBadge`

Overlays a notification count, short string, or plain dot onto a base icon — the way native apps
decorate their dock/taskbar icon.

```ts
const badge = makeFaviconBadge("/favicon.png", 3);
badge.dispose(); // restores the previous favicon
```

```ts
const href = createFaviconBadge("/favicon.png", () => unreadCount());
```

Value semantics:

- `undefined | false | 0 | ""` → no badge, the base icon is shown as-is.
- `true` → a plain dot, no text.
- a `number` → digits, clamped to `"{max}+"` past `max` (default `99`).
- a `string` → shown verbatim (keep it short — a badge is a small fraction of the icon).

```ts
type FaviconBadgeValue = number | string | boolean | undefined;

type FaviconBadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type FaviconBadgeOptions = {
  /** @default "#e11d48" */
  color?: string;
  /** @default "#ffffff" */
  textColor?: string;
  /** @default "bottom-right" */
  position?: FaviconBadgePosition;
  /** Numbers above this render as "{max}+". @default 99 */
  max?: number;
  /** Badge diameter as a fraction of the icon's rendered size. @default 0.6 */
  scale?: number;
} & FaviconOptions;

function makeFaviconBadge(
  href: string,
  value: FaviconBadgeValue,
  options?: FaviconBadgeOptions,
): FaviconController;

function createFaviconBadge(
  href: MaybeAccessor<string>,
  value: MaybeAccessor<FaviconBadgeValue>,
  options?: FaviconBadgeOptions,
): Accessor<string>;
```

A failed base-image load falls back to the plain `href` — a broken badge overlay doesn't take down
the favicon entirely.

### `makeFaviconScheme` / `createFaviconScheme`

Swaps between two icons to match the OS/browser `prefers-color-scheme`, staying in sync as that
preference changes (e.g. the user's system switches modes, or they toggle it in devtools).

```ts
const favicon = makeFaviconScheme({ light: "/favicon-light.svg", dark: "/favicon-dark.svg" });
favicon.scheme; // "light" | "dark"
favicon.dispose(); // restores the previous favicon, stops watching the media query
```

```ts
const favicon = createFaviconScheme({ light: "/favicon-light.svg", dark: "/favicon-dark.svg" });
favicon.href(); // reactive, currently-applied href
favicon.scheme(); // reactive, "light" | "dark"
```

```ts
type FaviconColorScheme = "light" | "dark";

type FaviconSchemeIcons = {
  light: string;
  dark: string;
};

type FaviconSchemeController = FaviconController & {
  readonly scheme: FaviconColorScheme;
};

function makeFaviconScheme(
  icons: FaviconSchemeIcons,
  options?: FaviconOptions,
): FaviconSchemeController;

function createFaviconScheme(
  icons: MaybeAccessor<FaviconSchemeIcons>,
  options?: FaviconOptions,
): { href: Accessor<string>; scheme: Accessor<FaviconColorScheme> };
```

SSR has no `prefers-color-scheme` to read — both exports treat the server as `"light"`.

### `makeFaviconProgress` / `createFaviconProgress`

Overlays a progress ring (0–100) onto a base icon — for upload/download-style indicators.
`undefined` shows the base icon with no ring at all; `0` **does** draw a ring (an empty track) —
the opposite of the badge overlay above, where `0` means "no badge." Use `undefined` while there's
no operation in progress, and `0`/a number once one starts.

```ts
const favicon = makeFaviconProgress("/favicon.png", 40);
favicon.dispose(); // restores the previous favicon
```

```ts
const href = createFaviconProgress("/favicon.png", () => uploadProgress());
```

```ts
type FaviconProgressOptions = {
  /** Color of the unfilled ring track. @default "rgba(0, 0, 0, 0.15)" */
  trackColor?: string;
  /** Color of the filled progress arc. @default "#6366f1" */
  color?: string;
  /** Ring stroke width as a fraction of the icon's rendered size. @default 0.15 */
  thickness?: number;
} & FaviconOptions;

function makeFaviconProgress(
  href: string,
  progress: number | undefined,
  options?: FaviconProgressOptions,
): FaviconController;

function createFaviconProgress(
  href: MaybeAccessor<string>,
  progress: MaybeAccessor<number | undefined>,
  options?: FaviconProgressOptions,
): Accessor<string>;
```

Values are clamped to `[0, 100]`. Like the badge overlay, a failed base-image load falls back to
the plain `href`.

### `FaviconLink` — server-rendering the initial favicon

Every `make*`/`create*` primitive above is SSR-safe in the sense that it won't crash on the
server — but since it works by mutating `document.head` imperatively, **nothing about the favicon
is rendered into the server-rendered HTML itself.** The actual `<link rel="icon">` shown before
your client JS hydrates is whatever's already in your static document shell. `FaviconLink` closes
that gap: it's a plain component that renders the `<link>` tag directly, so its `href` is part of
the initial HTML response.

```tsx
function Head() {
  const scheme = createFaviconScheme({ light: "/icon-light.svg", dark: "/icon-dark.svg" });
  return <FaviconLink href={scheme.href()} />;
}
```

```ts
type FaviconLinkProps = {
  href: string;
} & FaviconOptions;

function FaviconLink(props: FaviconLinkProps): JSX.Element;
```

Place it once in your document's actual `<head>` region — your SSR framework's root
document/`<Head>` component, not your regular app body tree, since a `<link>` rendered there
wouldn't physically live in `<head>` at all. A `make*`/`create*` call anywhere else in the app
composes with it automatically: `bindFaviconLink`'s existing "reuse an existing link" lookup finds
and takes over this exact element once it runs client-side — no coordination needed beyond both
touching the same DOM node.

For `createFaviconScheme`, this means the SSR-rendered HTML shows a _guessed_ initial icon (SSR
has no `prefers-color-scheme` to read, so it's always `icons.light`) that the client corrects
immediately on hydration if the OS actually prefers dark. For `createFaviconBadge`/
`createFaviconProgress`, `FaviconLink` can only render the _base_ icon during SSR (no canvas
server-side) — the badge/ring overlay still only appears once client JS composites it.

#### SolidStart

`FaviconLink` is a plain Solid component, so it drops straight into the `document` shell you
already pass to `<StartServer>` in `src/entry-server.tsx` — no special wiring:

```tsx
// src/entry-server.tsx
import { StartServer, createHandler } from "@solidjs/start/server";
import { FaviconLink } from "@solid-primitives/favicon";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <FaviconLink href="/favicon.svg" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

A static `href` here is no better than a plain `<link>` in `index.html` — `FaviconLink` earns its
keep once the href is _computed server-side per request_. The `createFaviconScheme` guess-then-
correct flash exists only because the client has no way to know the server's guess was wrong until
after hydration; if you already have the real preference server-side (a `theme` cookie, for
example), read it once and skip the guess entirely:

```tsx
// src/entry-server.tsx — same createHandler/StartServer wrapper as above, `document` swapped for:
import { getRequestEvent } from "@solidjs/web";
import { FaviconLink } from "@solid-primitives/favicon";

const document = ({ assets, children, scripts }) => {
  const theme = getRequestEvent()?.request.headers.get("cookie")?.includes("theme=dark")
    ? "dark"
    : "light";
  return (
    <html lang="en">
      <head>
        <FaviconLink href={theme === "dark" ? "/icon-dark.svg" : "/icon-light.svg"} />
        {assets}
      </head>
      <body>
        <div id="app">{children}</div>
        {scripts}
      </body>
    </html>
  );
};
```

Pair this with `createFaviconScheme` (or plain `createFavicon`) somewhere in your client tree to
keep tracking `prefers-color-scheme` changes after load — its "reuse an existing link" lookup
takes over the exact element `FaviconLink` rendered, so nothing further needs to change.

#### Astro

Astro renders imported framework components to static HTML by default — no `client:*` directive
means zero JS ships for that component, which is exactly what a non-interactive `<link>` tag
wants. Import `FaviconLink` straight into your root layout's frontmatter and place it in `<head>`:

```astro
---
// src/layouts/Layout.astro
import { FaviconLink } from "@solid-primitives/favicon";
const theme = Astro.cookies.get("theme")?.value === "dark" ? "dark" : "light";
---

<html lang="en">
  <head>
    <FaviconLink href={theme === "dark" ? "/icon-dark.svg" : "/icon-light.svg"} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

To keep reacting to OS scheme changes after the page loads, put `createFaviconScheme` in its own
component and hydrate just that island — `client:load` (or `client:idle`) is enough, since it only
needs to run once to attach its `matchMedia` listener:

```tsx
// src/components/FaviconSync.tsx
import { createFaviconScheme } from "@solid-primitives/favicon";

export default function FaviconSync() {
  createFaviconScheme({ light: "/icon-light.svg", dark: "/icon-dark.svg" });
  return null;
}
```

```astro
<FaviconSync client:load />
```

`bindFaviconLink`'s reuse lookup finds the `<link>` the layout already rendered and takes it over,
so the static SSR icon and the client-reactive one stay in sync without any explicit coordination
between the two components.

## Design notes

See [DESIGN.md](./DESIGN.md) for the reasoning behind splitting this into small, focused primitive
pairs (rather than one `createAdvancedFavicon`), the async-reactivity considerations, and the
canvas/`Image`/`matchMedia` mocking strategy used in tests.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
