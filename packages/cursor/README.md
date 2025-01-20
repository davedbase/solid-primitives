<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=cursor" alt="Solid Primitives cursor">
</p>

# @solid-primitives/cursor

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/cursor?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/cursor)
[![version](https://img.shields.io/npm/v/@solid-primitives/cursor?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/cursor)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Two simple primitives for setting cursor css property reactively.

- [`createElementCursor`](#createelementcursor) - Set provided cursor to given HTML Element styles reactively.
- [`createBodyCursor`](#createbodycursor) - Set selected cursor to body element styles reactively.

## Installation

```bash
npm install @solid-primitives/cursor
# or
yarn add @solid-primitives/cursor
# or
pnpm add @solid-primitives/cursor
```

## `createElementCursor`

Set provided cursor to given HTML Element styles reactively.

It takes two arguments:

- `element` - HTMLElement or a reactive signal returning one. Returning falsy value will unset the cursor.
- `cursor` - Cursor css property. E.g. "pointer", "grab", "zoom-in", "wait", etc.

```ts
import { createElementCursor } from "@solid-primitives/cursor";

const target = document.querySelector("#element");
const [cursor, setCursor] = createSignal("pointer");
const [enabled, setEnabled] = createSignal(true);

createElementCursor(() => enabled() && target, cursor);

setCursor("help");
```

## `createBodyCursor`

Set selected cursor to body element styles reactively.

It takes only one argument:

- `cursor` - Signal returing a cursor css property. E.g. "pointer", "grab", "zoom-in", "wait", etc. Returning falsy value will unset the cursor.

```ts
import { createBodyCursor } from "@solid-primitives/cursor";

const [cursor, setCursor] = createSignal("pointer");
const [enabled, setEnabled] = createSignal(true);

createBodyCursor(() => enabled() && cursor());

setCursor("help");
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
