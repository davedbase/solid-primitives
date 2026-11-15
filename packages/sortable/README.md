<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=sortable" alt="Solid Primitives sortable">
</p>

# @solid-primitives/sortable

[![size](https://img.shields.io/badge/size-743_B-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/sortable)
[![version](https://img.shields.io/npm/v/@solid-primitives/sortable?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/sortable)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Reactive sorting primitives — comparators, reactive sort (with an in-place `dirty` mode), sorted
search/insert, and two flavors of granular per-item rank tracking built directly on `mapArray` and
`createProjection`.

- **`ascending` / `descending`** — comparators where `null`/`undefined`/`NaN` always sort to the
  end, regardless of direction.
- **`by`** — builds a comparator from a derived key.
- **`combine`** — composes comparators, later ones breaking ties left by earlier ones.
- **`reverse`** — flips any comparator.
- **`makeSorted`** — non-reactive sorted copy.
- **`createSorted`** — reactive sort, with a reactive comparator and an in-place `dirty` mode.
- **`sortedIndex` / `sortedIndexBy`** — binary search for the insertion point in a sorted array.
- **`insertSorted`** — immutable O(log n) insert into an already-sorted array.
- **`createSortedIndex`** — per-item reactive rank; an item's accessor only updates when _that
  item's_ position actually changes, built on `mapArray` (the same primitive behind `<For>`).
- **`createSortedProjection`** — a store-shaped sorted view, reconciled by key via
  `createProjection`, so unrelated rows don't notify when one row changes.

## Installation

```bash
npm install @solid-primitives/sortable
# or
yarn add @solid-primitives/sortable
# or
pnpm add @solid-primitives/sortable
```

## `ascending` / `descending`

Default comparators for `Array.prototype.sort` and every primitive in this package.
`null`/`undefined`/`NaN` always sort to the end — unlike a naive `a < b ? -1 : a > b ? 1 : 0`,
which silently treats them as equal to everything they're compared against.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { ascending, descending } from "@solid-primitives/sortable";

function Demo() {
  const [values, setValues] = createSignal<(number | null)[]>([3, null, 1, NaN, 2]);
  const add = () => setValues(v => [...v, Math.floor(Math.random() * 10)]);
  return (
    <>
      <button onClick={add}>Add random number</button>
      <p>input: {values().map(String).join(", ")}</p>
      <p>ascending: {values().slice().sort(ascending).map(String).join(", ")}</p>
      <p>descending: {values().slice().sort(descending).map(String).join(", ")}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
type Comparator<T> = (a: T, b: T) => number;
const ascending: Comparator<any>;
const descending: Comparator<any>;

// Example
import { ascending, descending } from "@solid-primitives/sortable";

[3, 1, 2].sort(ascending); // [1, 2, 3]
[3, 1, 2].sort(descending); // [3, 2, 1]
[2, undefined, 1].sort(ascending); // [1, 2, undefined]
```

## `by`

Builds a comparator that orders items by a derived key.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { by } from "@solid-primitives/sortable";

type Product = { name: string; price: number };
const products: Product[] = [
  { name: "Milk", price: 2.5 },
  { name: "Apple", price: 1.2 },
  { name: "Cheese", price: 4 },
];

function Demo() {
  const [key, setKey] = createSignal<"name" | "price">("name");
  const sorted = () => products.slice().sort(by((p: Product) => p[key()]));
  return (
    <>
      <button onClick={() => setKey(k => (k === "name" ? "price" : "name"))}>
        Sort by {key() === "name" ? "price" : "name"}
      </button>
      <ul>
        {sorted().map(p => (
          <li>
            {p.name} — ${p.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function by<T, K>(accessor: (item: T) => K, comparator?: Comparator<K>): Comparator<T>;

// Example
import { by, descending } from "@solid-primitives/sortable";

const byPrice = by((item: Product) => item.price);
products.sort(byPrice);

const byPriceDesc = by((item: Product) => item.price, descending);
```

## `combine`

Composes comparators so later ones break ties left by earlier ones.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { ascending, by, combine, descending } from "@solid-primitives/sortable";

type Product = { category: string; name: string; price: number };
const products: Product[] = [
  { category: "Fruit", name: "Apple", price: 1.2 },
  { category: "Dairy", name: "Milk", price: 2.5 },
  { category: "Fruit", name: "Banana", price: 0.5 },
  { category: "Dairy", name: "Cheese", price: 4 },
];

function Demo() {
  const [priceDesc, setPriceDesc] = createSignal(false);
  const byCategory = by((p: Product) => p.category);
  const byPrice = () => by((p: Product) => p.price, priceDesc() ? descending : ascending);
  const sorted = () => products.slice().sort(combine(byCategory, byPrice()));
  return (
    <>
      <button onClick={() => setPriceDesc(v => !v)}>
        price {priceDesc() ? "high → low" : "low → high"}
      </button>
      <ul>
        {sorted().map(p => (
          <li>
            {p.category} / {p.name} — ${p.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function combine<T>(...comparators: Comparator<T>[]): Comparator<T>;

// Example
import { combine, by, descending } from "@solid-primitives/sortable";

const cmp = combine(
  by((p: Product) => p.category),
  by((p: Product) => p.price, descending),
);
products.sort(cmp);
```

## `reverse`

Flips the order of any comparator — composes with `by` and `combine`.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { ascending, reverse } from "@solid-primitives/sortable";

const words = ["pear", "apple", "fig", "kiwi"];

function Demo() {
  const [reversed, setReversed] = createSignal(false);
  const sorted = () => words.slice().sort(reversed() ? reverse(ascending) : ascending);
  return (
    <>
      <button onClick={() => setReversed(v => !v)}>{reversed() ? "Z → A" : "A → Z"}</button>
      <p>{sorted().join(", ")}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function reverse<T>(comparator: Comparator<T>): Comparator<T>;

// Example
import { reverse, ascending } from "@solid-primitives/sortable";

[1, 3, 2].sort(reverse(ascending)); // [3, 2, 1]
```

## `makeSorted`

Non-reactive: returns a new sorted copy of a plain array, leaving the original untouched.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { makeSorted } from "@solid-primitives/sortable";

function Demo() {
  const [list, setList] = createSignal([5, 2, 8]);
  const add = () => setList(l => [...l, Math.floor(Math.random() * 10)]);
  return (
    <>
      <button onClick={add}>Add random number</button>
      <p>original: {list().join(", ")}</p>
      <p>makeSorted: {makeSorted(list()).join(", ")}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function makeSorted<T>(list: T[], comparator?: Comparator<T>): T[];

// Example
import { makeSorted } from "@solid-primitives/sortable";

makeSorted([3, 1, 2]); // [1, 2, 3]
```

## `createSorted`

Reactively sorts `list`, re-sorting whenever `list` or `comparator` changes. `comparator` may
itself be reactive (an accessor), so toggling sort direction/column doesn't require rebuilding the
primitive.

```tsx repl
import { render } from "@solidjs/web";
import { createMemo, createSignal, For } from "solid-js";
import { ascending, createSorted, descending } from "@solid-primitives/sortable";

function Demo() {
  const [list, setList] = createSignal([5, 2, 8, 1]);
  const [desc, setDesc] = createSignal(false);
  const comparator = createMemo(() => (desc() ? descending : ascending));
  const sorted = createSorted(list, comparator);
  return (
    <>
      <button onClick={() => setList(l => [...l, Math.floor(Math.random() * 10)])}>Add</button>
      <button onClick={() => setDesc(v => !v)}>{desc() ? "Descending" : "Ascending"}</button>
      <ul>
        <For each={sorted()}>{n => <li>{n}</li>}</For>
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
type CreateSortedOptions = {
  /**
   * Sort the array in place and return that same reference, instead of allocating a new sorted
   * copy on every recompute. Only meaningful when `list` is a mutable array you own (e.g. paired
   * with a signal set via `setList(list => (list.sort(cmp), list))`).
   * @default false
   */
  dirty?: boolean;
};

function createSorted<T>(
  list: MaybeAccessor<T[]>,
  comparator?: MaybeAccessor<Comparator<T>>,
  options?: CreateSortedOptions,
): Accessor<T[]>;

// Example
import { createSorted, by } from "@solid-primitives/sortable";

const [column, setColumn] = createSignal<"name" | "price">("name");
const comparator = createMemo(() => by((item: Product) => item[column()]));
const sorted = createSorted(products, comparator);

<For each={sorted()}>{product => <Row product={product} />}</For>;
```

### Notes

- The default (`dirty: false`) path with a static comparator delegates directly to
  `@solid-primitives/signal-builders`'s `sort()` — no reason to re-implement a `createMemo` wrapper
  that already exists and is tested.
- `dirty: true` mutates and reuses the same array reference — mirrors VueUse's `useSorted`'s
  `dirty` option under Solid's signal model. Only use it on an array you own and don't share.

## `sortedIndex` / `sortedIndexBy`

Binary search for the leftmost index at which a value could be inserted into an already-sorted
array while keeping it sorted.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { sortedIndex } from "@solid-primitives/sortable";

const list = [10, 20, 30, 40];

function Demo() {
  const [value, setValue] = createSignal(25);
  return (
    <>
      <p>list: {list.join(", ")}</p>
      <input type="number" value={value()} onInput={e => setValue(+e.currentTarget.value)} />
      <p>insert at index: {sortedIndex(list, value())}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { sortedIndexBy } from "@solid-primitives/sortable";

type User = { name: string; age: number };
const users: User[] = [
  { name: "Ada", age: 20 },
  { name: "Alan", age: 30 },
  { name: "Grace", age: 40 },
];

function Demo() {
  const [age, setAge] = createSignal(35);
  const index = () => sortedIndexBy(users, { name: "New", age: age() }, u => u.age);
  return (
    <>
      <p>ages: {users.map(u => u.age).join(", ")}</p>
      <input type="number" value={age()} onInput={e => setAge(+e.currentTarget.value)} />
      <p>insert at index: {index()}</p>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function sortedIndex<T>(list: readonly T[], value: T, comparator?: Comparator<T>): number;
function sortedIndexBy<T, K>(
  list: readonly T[],
  value: T,
  accessor: (item: T) => K,
  comparator?: Comparator<K>,
): number;

// Example
import { sortedIndex } from "@solid-primitives/sortable";

sortedIndex([1, 3, 5, 7], 4); // 2
```

## `insertSorted`

Immutably inserts a value into an already-sorted array at the position the comparator dictates —
an O(log n) search plus an O(n) copy, versus an O(n log n) full re-sort for a single insertion.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { insertSorted } from "@solid-primitives/sortable";

function Demo() {
  const [scores, setScores] = createSignal([12, 40, 75]);
  const add = () => setScores(s => insertSorted(s, Math.floor(Math.random() * 100)));
  return (
    <>
      <button onClick={add}>Add random score</button>
      <ol>
        <For each={scores()}>{s => <li>{s}</li>}</For>
      </ol>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function insertSorted<T>(list: readonly T[], value: T, comparator?: Comparator<T>): T[];

// Example
import { insertSorted } from "@solid-primitives/sortable";

insertSorted([1, 3, 5], 4); // [1, 3, 4, 5]
```

## `createSortedIndex`

Tracks each item's index within the sorted view of `list`, without invalidating every consumer on
every reorder. Returns a function that, given an item, returns a reactive accessor for its current
index (`-1` if the item isn't present).

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { by, createSortedIndex, descending } from "@solid-primitives/sortable";

const random = () => Math.floor(Math.random() * 100);
const players = ["Ada", "Grace", "Alan", "Linus"].map(name => {
  const [score, setScore] = createSignal(random());
  return { name, score, setScore };
});

function Demo() {
  const rankOf = createSortedIndex(
    players,
    by(p => p.score(), descending),
  );
  const randomizeOne = () =>
    players[Math.floor(Math.random() * players.length)]!.setScore(random());
  return (
    <>
      <button onClick={randomizeOne}>Randomize one score</button>
      <ul>
        <For each={players}>
          {p => (
            <li>
              {p.name} ({p.score()}) — rank #{rankOf(p)() + 1}
            </li>
          )}
        </For>
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function createSortedIndex<T>(
  list: MaybeAccessor<T[]>,
  comparator?: MaybeAccessor<Comparator<T>>,
): (item: T) => Accessor<number>;

// Example
import { createSortedIndex, by } from "@solid-primitives/sortable";

const indexOf = createSortedIndex(rows, by((r: Row) => r.name));
const rank = indexOf(row); // only updates when `row`'s own position changes

<For each={sortedRows()}>{row => <Row row={row} rank={indexOf(row)()} />}</For>;
```

### Notes

- Built on `mapArray` — the same primitive that powers `<For>`. `mapArray` keys by reference
  identity and reuses the same computation (and its `index` signal) for an item across reorders,
  so an item's index accessor only updates when _that item's_ position actually changes; unrelated
  moves elsewhere in the list never notify it. This is Solid core's own keyed-diff algorithm, not a
  bespoke one.
- Each call to the returned function does an O(n) scan (untracked) to find the item's stable
  per-item accessor — cheap relative to the granular reactivity it buys you.

## `createSortedProjection`

A store-shaped sorted view of `list`, reconciled by `key` so surviving items keep their store
identity across recomputes — reordering only touches the slots that actually changed, instead of
treating a reorder as "everything changed".

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { by, createSortedProjection } from "@solid-primitives/sortable";

type User = { id: number; name: string };

function Demo() {
  const [users, setUsers] = createSignal<User[]>([
    { id: 1, name: "Mira" },
    { id: 2, name: "Kai" },
    { id: 3, name: "Zed" },
  ]);
  const sorted = createSortedProjection(
    users,
    by((u: User) => u.name),
    "id",
  );
  const toggleName = (u: User) => ({ ...u, name: u.name === "Kai" ? "Zoe" : "Kai" });
  const rename = () => setUsers(list => list.map(u => (u.id === 2 ? toggleName(u) : u)));
  return (
    <>
      <button onClick={rename}>Rename user #2</button>
      <ul>
        <For each={sorted}>
          {user => (
            <li>
              {user.name} (id {user.id})
            </li>
          )}
        </For>
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Type
function createSortedProjection<T extends object>(
  list: MaybeAccessor<T[]>,
  comparator?: MaybeAccessor<Comparator<T>>,
  key?: string | ((item: T) => unknown),
): Refreshable<Store<T[]>>;

// Example
import { createSortedProjection, by } from "@solid-primitives/sortable";

const sortedUsers = createSortedProjection(users, by((u: User) => u.name), "id");

<For each={sortedUsers} keyed={u => u.id}>
  {user => <Row user={user} />}
</For>;
```

### Notes

- `key` identifies an item across recomputes — same contract as `reconcile`'s `key` argument.
  Defaults to `"id"`.
- Prefer this over `createSorted` when consumers read individual item fields through the store
  proxy, or render with `<For each={projection} keyed={item => item[key]}>` — both get
  move-not-recreate behavior for free from the store's own reconciliation, with no bespoke tracking
  code in this package at all.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
