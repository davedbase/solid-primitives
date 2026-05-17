# Solid Primitives & Solid 2.0

Solid 2.0 is not an incremental release. The reactivity model, the async story, the DOM binding layer, and the data mutation pattern all changed in ways that ripple through every primitive in this library. This document covers what changed, why, and how Solid Primitives evolves with it.

For the full roadmap — new packages, directive redesigns, action helper plans — see [SOLID2_PLAN.md](./SOLID2_PLAN.md).

---

## New Primitive Taxonomy

Solid 2.0 sharpened the distinction between different kinds of building blocks. Solid Primitives now organises everything into four categories:

**Reactive Primitives** — `create*` hooks that live inside a Solid owner, return reactive values, and integrate with `onCleanup`. The majority of the library falls here.

**Directives** — ref factory functions that return `(el: HTMLElement) => void`. In Solid 2.0, `use:` directives are gone; the replacement is a plain function passed to `ref`. Because these are just functions, they compose in arrays without compiler involvement:

```tsx
<input ref={[autofocus, mask("(999) 999-9999"), on("blur", validate)]} />
```

**Action Helpers** — generator combinators that wrap `action(fn*)` functions. They add retry, abort, timeout, and optimistic-update behaviour as pure function composition:

```ts
const upload = action(pipe(
  withTimeout(30_000),
  withRetry({ attempts: 3 }),
)(function*(file) {
  yield api.upload(file);
  refresh(fileList);
}));
```

**General Utilities** — `make*` functions with no Solid lifecycle dependency. Always return a cleanup function. Safe to call outside any owner.

---

## Key API Changes

### `createResource` removed → async `createMemo`

`createResource` no longer exists in Solid 2.0. Any primitive that was built on top of it needed a full rewrite. The replacement is an async `createMemo` — a memo whose compute function returns a Promise. It suspends automatically and integrates with `<Loading>`.

```ts
// 1.x
const [user] = createResource(id, fetchUser);

// 2.0
const user = createMemo(() => fetchUser(id()));

<Loading fallback={<Spinner />}>
  <Profile user={user()} />
</Loading>
```

Affected packages: `fetch` (see [`packages/fetch/REDESIGN.md`](./packages/fetch/REDESIGN.md)), `resource`, `graphql`, `pagination`.

---

### `use:` directives replaced by ref factories

The `use:myDirective` compiler syntax is gone. The 2.0 equivalent is a ref factory — a function that takes options and returns `(el) => void`. The result is passed directly to `ref`:

```tsx
// 1.x
<button use:tooltip={{ content: "Save" }} />

// 2.0
<button ref={tooltip({ content: "Save" })} />
```

Multiple directives compose naturally via a ref array — no helper needed:

```tsx
<button ref={[props.ref, tooltip("Save"), on("keydown", handleKey)]} />
```

Affected packages: `autofocus`, `input-mask`, `event-listener`, `clipboard`, `pointer`, `active-element`, `intersection-observer`, `bounds`, `resize-observer`, `mutation-observer`, `cursor`, `scroll`, `fullscreen`.

---

### `onMount` replaced by `onSettled`

`onMount` ran synchronously after the first render pass. `onSettled` is its 2.0 replacement — it runs after the component fully settles, which means after any `<Loading>` boundaries above it have resolved. This makes it correct for layout measurement, focus management, and any operation that depends on the final DOM state.

```ts
// 1.x
onMount(() => {
  measureLayout();
  return () => cleanup();
});

// 2.0
onSettled(() => {
  measureLayout();
  return () => cleanup();  // return cleanup directly — onCleanup not allowed inside onSettled
});
```

Affected packages: `autofocus`, `bounds`, `lifecycle`, `scroll`, `idle`, `intersection-observer`, and any package that called `onMount` for post-render setup.

---

### Signal writes in reactive scopes are now errors

Writing to a signal inside a `createMemo`, `createEffect` compute phase, or a component body throws `SIGNAL_WRITE_IN_OWNED_SCOPE` in development. Primitives that expose writable state to callers need to be designed with this in mind.

The `ownedWrite: true` signal option is available for implementation-internal signals that genuinely need to be written inside an owned scope — but it is not a general escape hatch:

```ts
// ownedWrite: true — for internal signals only (e.g. syncing DOM state into a signal)
const [playing, setPlaying] = createSignal(false, { ownedWrite: true });
player.addEventListener("playing", () => setPlaying(true));

// Public setters belong outside reactive scopes — no ownedWrite needed
const setVolume = (v: number) => (player.volume = v);
```

This convention is established in `@solid-primitives/utils` via the `INTERNAL_OPTIONS` export.

---

### `batch` removed — writes are auto-batched

`batch()` is gone. All signal writes are queued and applied together on the next microtask. To apply writes synchronously (e.g. in tests), use `flush()`:

```ts
setA(1);
setB(2);
// a() and b() still have old values here

flush();
// now a() === 1 and b() === 2
```

Affected: test suites across all packages — two `flush()` calls are often needed (one for the initial effect apply, one after the state change).

---

### `Suspense` / `ErrorBoundary` replaced

| 1.x | 2.0 |
|---|---|
| `<Suspense fallback={...}>` | `<Loading fallback={...}>` |
| `<ErrorBoundary fallback={...}>` | `<Errored fallback={(err, reset) => ...}>` |
| `<SuspenseList>` | `<Reveal order="...">` |

Primitives that previously documented `<Suspense>` usage in their READMEs need updating. Primitives that previously required `withCatchAll()` or similar defensive patterns can now rely on `<Errored>` instead.

---

### `createEffect` is now split compute/apply

`createEffect` in 2.0 takes two functions: a reactive compute phase and a non-reactive apply phase. The compute phase runs synchronously and tracks dependencies; the apply phase receives the computed value and runs side effects.

```ts
// 1.x
createEffect(() => {
  el.title = name();
});

// 2.0
createEffect(
  () => name(),               // compute: reactive reads only
  value => { el.title = value; }  // apply: side effects, untracked
);
```

The apply phase runs in an untracked scope — store proxy reads there will warn. Pass plain values out of the compute phase instead.

Affected: any primitive that used `createEffect` for DOM synchronisation.

---

### `on` helper replaced by split effects

The `on()` deferred dependency helper is gone. Use the split form directly:

```ts
// 1.x
createEffect(on(count, (value, prev) => console.log(prev, "→", value)));

// 2.0
createEffect(() => count(), (value, prev) => console.log(prev, "→", value));
```

---

### `solid-js/web` → `@solidjs/web`

The DOM runtime moved to a separate package. All imports of `isServer`, `render`, `hydrate`, `Dynamic`, `Portal`, `HydrationScript`, and related APIs now come from `@solidjs/web`.

```ts
// 1.x
import { isServer, render } from "solid-js/web";

// 2.0
import { isServer, render } from "@solidjs/web";
```

All packages in this library have been updated.

---

### `solid-js/store` merged into `solid-js`

Store APIs (`createStore`, `reconcile`, `produce`) are now in `solid-js` directly.

```ts
// 1.x
import { createStore } from "solid-js/store";

// 2.0
import { createStore } from "solid-js";
```

The store setter is now **draft-first by default** — the old `produce()` wrapper is the new default behaviour:

```ts
// 1.x
setStore(produce(s => { s.items.push(newItem); }));

// 2.0
setStore(s => { s.items.push(newItem); });
```

---

### Other renames

| Removed | Replacement |
|---|---|
| `createComputed` | `createEffect` (split) / `createSignal(fn)` / `createMemo` |
| `createMutable` / `modifyMutable` | `createStore` with draft setters |
| `mergeProps` | `merge` (note: `undefined` now overrides, not skips) |
| `splitProps` | `omit` |
| `unwrap` | `snapshot` |
| `createSelector` | `createProjection` |
| `onError` / `catchError` | `<Errored>` / effect `error` option |
| `Index` | `<For keyed={false}>` |
| `classList` prop | `class` with object/array value |
| `equalFn` | `isEqual` |

---

## Package Status

The table in the main [README](./README.md) includes a **Solid 2** column indicating which packages have been migrated. Packages without a checkmark are still on Solid 1.x APIs and will be updated progressively.

Migration notes for individual packages are kept alongside the source:

- [`packages/fetch/REDESIGN.md`](./packages/fetch/REDESIGN.md) — full fetch package redesign rationale
- [`SOLID2_PLAN.md`](./SOLID2_PLAN.md) — library-wide roadmap: new packages, directive redesigns, action helpers
