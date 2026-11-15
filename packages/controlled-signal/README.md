# @solid-primitives/controlled-signal

[![size](https://img.shields.io/badge/size-517_B-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/controlled-signal)
[![version](https://img.shields.io/npm/v/@solid-primitives/controlled-signal?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/controlled-signal)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Reactive signals that support both **controlled** (externally managed) and **uncontrolled** (internally managed) state — a pattern commonly used in headless UI components such as dialogs, dropdowns, and toggles.

## Installation

```bash
npm install @solid-primitives/controlled-signal
# or
yarn add @solid-primitives/controlled-signal
# or
pnpm add @solid-primitives/controlled-signal
```

## How it works

A **controllable signal** has two modes:

- **Uncontrolled** — when no `value` prop is provided (or it is `undefined`). The signal manages its own internal state, initialized from `defaultValue`.
- **Controlled** — when a `value` prop is provided. The signal defers entirely to the external value; `setValue` calls `onChange` but does not update internal state.

This mirrors the [controlled/uncontrolled pattern](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components) from React, adapted for SolidJS reactivity.

## Primitives

### `createControllableSignal`

```tsx repl
import { render } from "@solidjs/web";
import { type Accessor, createSignal } from "solid-js";
import { createControllableSignal } from "@solid-primitives/controlled-signal";

function Counter(props: { value?: Accessor<number>; onChange?: (v: number) => void }) {
  const [count, setCount] = createControllableSignal<number>({
    value: props.value,
    defaultValue: () => 0,
    onChange: props.onChange,
  });
  return <button onClick={() => setCount(n => (n ?? 0) + 1)}>count: {count()}</button>;
}

function Demo() {
  const [external, setExternal] = createSignal(10);
  return (
    <>
      <p>
        Uncontrolled: <Counter />
      </p>
      <p>
        Controlled: <Counter value={external} onChange={setExternal} />{" "}
        <button onClick={() => setExternal(0)}>parent reset</button> parent value: {external()}
      </p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
import { createControllableSignal } from "@solid-primitives/controlled-signal";

const [value, setValue] = createControllableSignal<T>(props);
```

**Props:**

| Prop           | Type                       | Description                                              |
| -------------- | -------------------------- | -------------------------------------------------------- |
| `value`        | `Accessor<T \| undefined>` | Controlled value. When defined, enables controlled mode. |
| `defaultValue` | `Accessor<T \| undefined>` | Initial value for uncontrolled mode.                     |
| `onChange`     | `(value: T) => void`       | Called whenever the value would change.                  |

**Returns:** `[value: Accessor<T | undefined>, setValue: (next) => void]`

#### Uncontrolled usage

```ts
const [open, setOpen] = createControllableSignal({ defaultValue: () => false });

setOpen(true); // updates internal state and calls onChange if provided
setOpen(prev => !prev); // functional form
```

#### Controlled usage

```ts
// The consumer drives the state; your component just calls onChange.
const [value, setValue] = createControllableSignal({
  value: () => props.open,
  onChange: props.onOpenChange,
});

// setValue does NOT update internal state in controlled mode.
// It calls onChange so the consumer can update their signal.
setValue(true);
```

---

### `createControllableBooleanSignal`

Variant of `createControllableSignal` for `boolean` values. Returns `false` instead of `undefined` when unset.

```tsx repl
import { render } from "@solidjs/web";
import { createControllableBooleanSignal } from "@solid-primitives/controlled-signal";

function Demo() {
  const [open, setOpen] = createControllableBooleanSignal({});
  return (
    <>
      <button onClick={() => setOpen(o => !o)}>{open() ? "Close" : "Open"}</button>
      <p>open: {String(open())}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
const [open, setOpen] = createControllableBooleanSignal({
  defaultValue: () => false,
});
```

---

### `createControllableArraySignal`

Variant for `Array<T>` values. Returns `[]` instead of `undefined` when unset.

```tsx repl
import { render } from "@solidjs/web";
import { For } from "solid-js";
import { createControllableArraySignal } from "@solid-primitives/controlled-signal";

function Demo() {
  const [items, setItems] = createControllableArraySignal<string>({
    defaultValue: () => ["a", "b"],
  });
  return (
    <>
      <button onClick={() => setItems(prev => [...prev, `item ${prev.length + 1}`])}>Add</button>
      <button onClick={() => setItems([])}>Clear</button>
      <ul>
        <For each={items()}>{item => <li>{item}</li>}</For>
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
const [items, setItems] = createControllableArraySignal<string>({
  defaultValue: () => ["a", "b"],
});

setItems(prev => [...prev, "c"]);
```

---

### `createControllableSetSignal`

Variant for `Set<T>` values. Returns `new Set()` instead of `undefined` when unset.

```tsx repl
import { render } from "@solidjs/web";
import { For } from "solid-js";
import { createControllableSetSignal } from "@solid-primitives/controlled-signal";

function Demo() {
  const [selected, setSelected] = createControllableSetSignal<string>({
    defaultValue: () => new Set(["Solid"]),
  });
  const toggle = (fw: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (!next.delete(fw)) next.add(fw);
      return next;
    });
  return (
    <>
      <For each={["React", "Solid", "Vue", "Svelte"]}>
        {fw => (
          <label>
            <input type="checkbox" checked={selected().has(fw)} onChange={() => toggle(fw)} />
            {fw}
          </label>
        )}
      </For>
      <p>selected: {[...selected()].join(", ") || "(none)"}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
const [selected, setSelected] = createControllableSetSignal<number>({
  defaultValue: () => new Set([1, 2]),
});

setSelected(prev => new Set([...prev, 3]));
```

---

### `createToggleState`

Controllable state for toggle components — checkboxes, switches, toggle buttons — built on top of `createControllableBooleanSignal`. Adapted from [Kobalte's `createToggleState`](https://github.com/kobaltedev/kobalte/tree/main/packages/core/src/primitives/create-toggle-state).

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createToggleState } from "@solid-primitives/controlled-signal";

function Demo() {
  const [disabled, setDisabled] = createSignal(false);
  const state = createToggleState({ defaultIsSelected: () => false, isDisabled: disabled });
  return (
    <>
      <button onClick={() => state.toggle()}>{state.isSelected() ? "ON" : "OFF"}</button>
      <button onClick={() => setDisabled(d => !d)}>{disabled() ? "Enable" : "Disable"}</button>
      <p>disabled: {String(disabled())} (toggle clicks are ignored while disabled)</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
import { createToggleState } from "@solid-primitives/controlled-signal";

const { isSelected, setIsSelected, toggle } = createToggleState({
  defaultIsSelected: () => false,
});

toggle(); // isSelected() === true
```

**Props:**

| Prop                | Type                             | Description                                                       |
| ------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `isSelected`        | `Accessor<boolean \| undefined>` | Controlled selected state. When defined, enables controlled mode. |
| `defaultIsSelected` | `Accessor<boolean \| undefined>` | Initial selected state for uncontrolled mode.                     |
| `isDisabled`        | `Accessor<boolean \| undefined>` | While `true`, `toggle()` and `setIsSelected()` are no-ops.        |
| `isReadOnly`        | `Accessor<boolean \| undefined>` | While `true`, `toggle()` and `setIsSelected()` are no-ops.        |
| `onSelectedChange`  | `(isSelected: boolean) => void`  | Called whenever the selected state would change.                  |

**Returns:** `{ isSelected: Accessor<boolean>, setIsSelected: (v: boolean) => void, toggle: () => void }`

Just like `createControllableSignal`, `isSelected` can be omitted for uncontrolled usage, or provided (alongside `onSelectedChange`) to let a parent component drive the state.

## Credits

This primitive is adapted from the [`create-controllable-signal`](https://github.com/kobaltedev/kobalte/tree/main/packages/core/src/primitives/create-controllable-signal) and [`create-toggle-state`](https://github.com/kobaltedev/kobalte/tree/main/packages/core/src/primitives/create-toggle-state) implementations in [Kobalte](https://github.com/kobaltedev/kobalte) by the Kobalte Contributors, used under the [MIT License](https://github.com/kobaltedev/kobalte/blob/main/LICENSE).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
