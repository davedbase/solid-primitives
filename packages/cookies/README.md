<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=cookies" alt="Solid Primitives cookies">
</p>

# @solid-primitives/cookies

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/cookies?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/cookies)
[![version](https://img.shields.io/npm/v/@solid-primitives/cookies?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/cookies)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A set of primitives for handling cookies in solid

- [`createServerCookie`](#createservercookie) - Provides a getter and setter for a reactive cookie, which works isomorphically.
- [`createUserTheme`](#createusertheme) - Creates a Server Cookie providing a type safe way to store a theme and access it on the server or client.
- [`getCookiesString`](#getCookiesString) - A primitive that allows for the cookie string to be accessed isomorphically on the client, or on the server

## Installation

```bash
npm install @solid-primitives/cookies
# or
yarn add @solid-primitives/cookies
# or
pnpm add @solid-primitives/cookies
```

## How to use it

## `createServerCookie`

A primitive for creating a cookie that can be accessed isomorphically on the client, or the server.

```ts
import { createServerCookie } from "@solid-primitives/cookies";

const [cookie, setCookie] = createServerCookie("cookieName");

cookie(); // => string | undefined
```

### Custom serialization

Custom cookie serializers and deserializers can also be implemented

```ts
import { createServerCookie } from "@solid-primitives/cookies";

const [serverCookie, setServerCookie] = createServerCookie("coolCookie", {
  deserialize: str => (str ? str.split(" ") : []), // Deserializes cookie into a string[]
  serialize: val => (val ? val.join(" ") : ""), // serializes the value back into a string
});

serverCookie(); // => string[]
```

## `createUserTheme`

Composes `createServerCookie` to provide a type safe way to store a theme and access it on the server or client.

```ts
import { createUserTheme } from "@solid-primitives/cookies";

const [theme, setTheme] = createUserTheme("cookieName");

theme(); // => "light" | "dark" | undefined

// with default value
const [theme, setTheme] = createUserTheme("cookieName", {
  defaultValue: "light",
});

theme(); // => "light" | "dark"
```

## `getCookiesString`

A primitive that allows for the cookie string to be accessed isomorphically on the client, or on the server.
Uses `getRequestEvent` on the server and `document.cookie` on the client.

```ts
import { getCookiesString, parseCookie } from "@solid-primitives/cookies";

const string = getCookiesString();
const cookie = parseCookie(string, "cookie_name");
```

## Examples

PRs welcome :)

## Demo

You can view a demo of this primitive here: <https://codesandbox.io/p/sandbox/amazing-easley-wqk38i?file=%2Fsrc%2Fcookies_primitive%2Findex.ts%3A36%2C20>

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
