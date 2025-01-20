<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Script%20Loader" alt="Solid Primitives Script Loader">
</p>

# @solid-primitives/script-loader

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/script-loader?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/script-loader)
[![size](https://img.shields.io/npm/v/@solid-primitives/script-loader?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/script-loader)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Creates a primitive to load scripts dynamically, either for external services or jsonp requests

## Installation

```
npm install @solid-primitives/script-loader
# or
yarn add @solid-primitives/script-loader
# or
pnpm add @solid-primitives/script-loader
```

## How to use it

createScriptLoader expects a props object with a `src` property. All the other props will be spread to the script element.

The `src` prop is required and will be used to set the `src` or `textContent` attribute. It can be a string or an accessor.

```ts
import { createScriptLoader } from "@solid-primitives/script-loader";

// For example, to use recaptcha:
createScriptLoader({
  src: "https://www.google.com/recaptcha/enterprise.js?render=my_token",
  async onLoad() {
    await grecaptcha.enterprise.ready();
    const token = await grecaptcha.enterprise.execute("my_token", { action: "login" });
    // do your stuff...
  },
});

// or pinterest embeds:
createScriptLoader({
  src: '!function(a,b,c){var d,e,f;d="PIN_"+~~((new Date).getTime()/864e5),...',
  onLoad() {
    window?.PinUtils?.build();
  },
});
```

## Definition

```ts
function createScriptLoader(props: ScriptProps): HTMLScriptElement | undefined; // script element with be undefined only on the server

type ScriptProps = Omit<ComponentProps<"script">, "src" | "textContent"> & {
  /** URL or source of the script to load. */
  src: string | Accessor<string>;
};
```

## Demo

TODO

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
