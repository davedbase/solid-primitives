<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Media" alt="Solid Primitives Media">
</p>

# @solid-primitives/media

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/media?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/media)
[![size](https://img.shields.io/npm/v/@solid-primitives/media?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/media)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Collection of reactive primitives to deal with media queries.

- [`makeMediaQueryListener`](#makemediaquerylistener) - Listen for changes to provided Media Query.
- [`createMediaQuery`](#createmediaquery) - Creates a very simple and straightforward media query monitor.
- [`createBreakpoints`](#createbreakpoints) - Creates a multi-breakpoint monitor to make responsive components easily.
- [`createPrefersDark`](#createprefersdark) - Provides a signal indicating if the user has requested dark color theme.

## Installation

```
npm install @solid-primitives/media
# or
yarn add @solid-primitives/media
```

## `makeMediaQueryListener`

Attaches a MediaQuery listener to window, listeneing to changes to provided query

```ts
import { makeMediaQueryListener } from "@solid-primitives/media";

const clear = makeMediaQueryListener("(max-width: 767px)", e => {
  console.log(e.matches);
});
// remove listeners (will happen also on cleanup)
clear();
```

## `createMediaQuery`

Creates a very simple and straightforward media query monitor.

```ts
import { createMediaQuery } from "@solid-primitives/media";

const isSmall = createMediaQuery("(max-width: 767px)");
console.log(isSmall());
```

### Server fallback

`createMediaQuery` accepts a `serverFallback` argument — value that should be returned on the server — defaults to `false`.

```ts
const isSmall = createMediaQuery("(max-width: 767px)", true);

// will return true on the server and during hydration on the client
console.log(isSmall());
```

[Working Demo](https://codesandbox.io/s/solid-media-query-5bf16?file=/src/index.tsx)

## `createBreakpoints`

Creates a multi-breakpoint monitor to make responsive components easily.

```tsx
import { createBreakpoints } from "@solid-primitives/media";

const breakpoints = {
  sm: "640px",
  lg: "1024px",
  xl: "1280px",
};

const Example: Component = () => {
  const matches = createBreakpoints(breakpoints);

  createEffect(() => {
    console.log(matches.sm); // true when screen width >= 640px
    console.log(matches.lg); // true when screen width >= 1024px
    console.log(matches.xl); // true when screen width >= 1280px
  });

  return (
    <div
      classList={{
        "text-tiny flex flex-column": true, // tiny text with flex column layout
        "text-small": matches.sm, // small text with flex column layout
        "text-base flex-row": matches.lg, // base text with flex row layout
        "text-huge": matches.xl, // huge text with flex row layout
      }}
    >
      <Switch fallback={<div>Smallest</div>}>
        <Match when={matches.xl}>Extra Large</Match>
        <Match when={matches.lg}>Large</Match>
        <Match when={matches.sm}>Small</Match>
        {/* 
          Instead of fallback, you can also use `!matches.sm`
          <Match when={!matches.sm}>Smallest</Match>
         */}
      </Switch>
    </div>
  );
};
```

### `.toString` method

As a convenience feature, the return value of `createBreakpoints` also contains a non-enumerable `.key` property that will return the last matching breakpoint id to allow using it as an object key:

```ts
import { createBreakpoints } from "@solid-primitives/media";

const breakpoints = {
  sm: "640px",
  lg: "1024px",
  xl: "1280px",
};

const matches = createBreakpoints(breakpoints);

const moduleSize = () =>
  ({
    sm: 2,
    lg: 4,
    xl: 6,
  })[matches.key];
```

This can be very helpful for things like the `mapHeight` option in [`createMasonry`](https://solid-primitives.netlify.app/package/masonry#createMasonry).

> **Warning** for this feature to work, the breakpoints needs to be ordered from small to large. If you cannot ensure this, use the `sortBreakpoints` helper.

### `sortBreakpoints` helper

If you cannot rely on the order of the breakpoints from smallest to largest, this small helper fixes it for you:

```ts
// unfortunately in the wrong order:
const breakpoints = {
  xl: "1280px",
  lg: "1024px",
  sm: "640px",
};

const matches = createBreakpoints(sortBreakpoints(breakpoints));

const moduleSize = () =>
  ({
    sm: 2,
    lg: 4,
    xl: 6,
  })[matches.key];
```

### Demo

[Working Demo](https://codesandbox.io/s/solid-responsive-breakpoints-h4emy8?file=/src/index.tsx)

## `createPrefersDark`

Provides a signal indicating if the user has requested dark color theme. The setting is being watched with a [Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme).

### How to use it

```ts
import { createPrefersDark } from "@solid-primitives/media";

const prefersDark = createPrefersDark();
createEffect(() => {
  prefersDark(); // => boolean
});
```

### Server fallback

`createPrefersDark` accepts a `serverFallback` argument — value that should be returned on the server — defaults to `false`.

```ts
const prefersDark = createPrefersDark(true);
// will return true on the server and during hydration on the client
prefersDark();
```

### `usePrefersDark`

This primitive provides a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) variant that will reuse the same signal and media query across the whole application.

```ts
import { usePrefersDark } from "@solid-primitives/media";

const prefersDark = usePrefersDark();
createEffect(() => {
  prefersDark(); // => boolean
});
```

> Note: `usePrefersDark` will deopt to `createPrefersDark` if used during hydration. (see issue [#310](https://github.com/solidjs-community/solid-primitives/issues/310))

## Notes

### iOS 13 Support & Deprecated `addListener`

Due to older versions of [mobile Safari on iOS 13 not supporting](https://github.com/mdn/sprints/issues/858) `addEventListener` on the MediaQueryList API, this primitive will need to be polyfilled. If your application needs to support much older versions of the browser you should [use a polyfill utility](https://www.npmjs.com/package/matchmedia-polyfill) or patch the missing function like so:

```ts
if ((!"addEventListener") in MediaQueryList) {
  MediaQueryList.prototype.addEventListener = function (type, callback) {
    if (type === "change") this.addListener(callback);
  };
  MediaQueryList.prototype.removeEventListener = function (type, callback) {
    if (type === "change") this.removeListener(callback);
  };
}
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Contributors

Thanks to Aditya Agarwal for contributing createBreakpoints.
