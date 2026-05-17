# Solid Primitives 2.0 — Deep Analysis & Plan

> Based on Ryan Carniato's four-category taxonomy: Reactive Primitives, Directives, Action Helpers, General Utilities.

---

## Section 1: Reactive Primitives

Most `create*` packages are well-placed here. The main 2.0 work is API cleanup — removing 1.x patterns and adding SSR safety.

### Inputs & Sensors
*active-element, keyboard, mouse, pointer, scroll, selection, devices, orientation*

These are already solid. Minor refinements:

- **`keyboard`** — `useKeyDownSequence` should debounce the sequence reset rather than relying on a hard timeout. The sequence tracking could be backed by a reactive store for better granularity.
- **`pointer`** — `createPointerList` could expose a reactive `Map<number, PointerState>` instead of a flat accessor array, letting consumers track individual pointers without scanning the whole list.
- **`scroll`** — `createPreventScroll` currently attaches behavior reactively inside a component. It should gain a directive variant (see Section 2).

### Data & State
*deep, memo, signal-builders, trigger, state-machine, history*

- **`state-machine`** — the current API (`createMachine`) is minimal. With 2.0's async memos, state machines could have async transitions natively — `yield`ing during transitions opens natural action-helper integration.
- **`history`** — `createUndoHistory` takes a multi-source array of accessor functions. This could be simplified to a store path API or integrated with 2.0's draft-setter stores.
- **`memo`** — `createPureReaction` conflicts with 2.0's ownership rules. `createLazyMemo` maps to 2.0's `{ lazy: true }` option on `createMemo`. Both need review; `createLazyMemo` may be redundant.
- **`signal-builders`** — the tag template literal `template` builder is excellent. These could be expanded with reactive string/number/array transformers.

### Network
*fetch, sse, websocket, stream*

- **`fetch`** — built entirely on `createResource` which is removed in 2.0. Needs a full redesign. See `packages/fetch/REDESIGN.md`.
- **`websocket`** — `makeReconnectingWS` and `makeHeartbeatWS` are good `make*` primitives. The reactive layer (`createWS`, `createWSState`) is correct. Could gain an action-helper variant for send-with-retry.
- **`sse`** — well-structured already. The `createSSE` split into compute/apply form in 2.0 is done.

### Collections
*map, set, static-store, storage*

- **`ReactiveMap` / `ReactiveSet`** — good, solid primitives. The class-extension pattern is correct.
- **`storage`** — `makePersisted` is powerful. With 2.0 draft setters, the persisted signal/store pattern becomes cleaner. `wsSync` and `messageSync` are excellent for multi-tab state.

---

## Section 2: Directives (Magic Refs)

This is the biggest opportunity. Since directives are now just ref factories — plain functions returning `(el) => void` — they compose in arrays, accept options, and need no compiler magic. Several existing packages have elements as parameters and should expose directive-first APIs.

### Convention

```ts
// A directive factory — takes options, returns a ref callback
type Directive<Options = void> = Options extends void
  ? (el: HTMLElement) => void
  : (options: Options) => (el: HTMLElement) => void;
```

The composition story is the killer feature:

```tsx
<input
  ref={[
    props.ref,
    autofocus,
    mask(pattern),
    on("keydown", handleKey, { capture: true }),
    on("blur", validate, { passive: true }),
  ]}
/>
```

### Existing packages that should gain directive exports

**`event-listener` → `on(type, handler, opts)`**

The canonical example Ryan showed. Should be the anchor of the directive story:

```ts
// New export from @solid-primitives/event-listener
export const on = (type, handler, opts) => (el) =>
  el.addEventListener(type, handler, opts);

<button
  ref={[
    props.ref,
    on("click", onClick),
    on("pointerenter", onHover, { passive: true }),
    on("keydown", onKey, { capture: true }),
  ]}
/>
```

The existing `createEventListener` reactive API stays — `on` is purely additive.

---

**`bounds` / `resize-observer` → element tracking directives**

Currently both require passing an element accessor into a reactive primitive. The directive flips the ownership:

```ts
// bounds: trackBounds(setter) → (el) => void
const [bounds, setBounds] = createSignal({ width: 0, height: 0 });
<div ref={trackBounds(setBounds)} />

// resize-observer: resize(callback, options) → (el) => void
<div ref={resize(entry => setSize(entry.contentRect))} />
```

The reactive `createElementBounds` and `createResizeObserver` stay but are implemented on top of the directive internally.

---

**`intersection-observer` → `intersect` / `visibility` directives**

```ts
// intersect: full access to IntersectionObserver entries
<section ref={intersect(entries => handleEntries(entries), { threshold: [0, 0.5, 1] })} />

// visibility: simpler boolean toggle
<img ref={visibility(isVisible => setVisible(isVisible), { threshold: 0.1 })} />

// lazyLoad: built on top of visibility
<img ref={lazyLoad(() => import("./HeavyImage"))} />
```

---

**`mutation-observer` → `observe` directive**

```ts
<ul ref={observe(mutations => handleMutations(mutations), { childList: true, subtree: true })} />
```

---

**`cursor` → cursor directive**

Currently `createElementCursor(() => el, cursor)` takes a reactive accessor. As a directive:

```ts
// Static
<div ref={cursor("grab")} />

// Reactive — cursor factory takes an accessor
<div ref={cursor(() => isDragging() ? "grabbing" : "grab")} />
```

---

**`scroll` → `preventScroll` directive**

```ts
<div ref={preventScroll({ axis: "y" })} />

// For modal lock — no options needed
<dialog ref={preventScroll} />
```

---

**`input-mask` → `mask` directive**

Currently `createInputMask` returns an event handler, not a ref callback. The directive should wire up the event handler itself:

```ts
const phone = mask("(999) 999-9999");
const credit = mask(/\d{4}[ -]?/, /\d{4}[ -]?/, /\d{4}[ -]?/, /\d{4}/);

<input ref={phone} />
<input ref={credit} />
```

---

**`autofocus` → clean up to plain ref callback**

Currently `autofocus()` returns a ref callback — the factory call is redundant. Should be:

```ts
<input ref={autofocus} />
// Not: <input ref={autofocus()} />
```

---

**`fullscreen` → directive variant**

```ts
const [isFullscreen, setFullscreen] = createSignal(false);
<div ref={fullscreen(setFullscreen)} />
// or with control:
<div ref={fullscreen({ active: isFullscreen, onChange: setFullscreen })} />
```

---

**`clipboard` → `copyToClipboard` is already a directive**

`copyToClipboard` already returns a ref callback. This is the pattern everyone else should follow — highlight as the canonical existing example.

---

### Net-New Standalone Directives

These warrant their own packages or a new `directives` grouping:

**`clickOutside(handler)`**
```ts
<div ref={clickOutside(() => setOpen(false))} />
```

**`longPress(handler, { duration })`**
```ts
<button ref={longPress(onLongPress, { duration: 500 })} />
```

**`focus(onFocus?, onBlur?)`** — replaces `active-element` directive
```ts
<input ref={focus(isFocused => setActive(isFocused))} />
// Or granular:
<input ref={[focus.in(onFocus), focus.out(onBlur)]} />
```

**`trap`** — focus trap within a container
```ts
<dialog ref={trap({ when: isOpen })} />
```

**`drag(options)`** — drag detection without DnD library
```ts
<div ref={drag({ onDragStart, onDrag, onDragEnd })} />
```

**`swipe(handler, { direction, threshold })`**
```ts
<div ref={swipe(dir => handleSwipe(dir), { direction: "horizontal" })} />
```

---

## Section 3: Action Helpers

This is entirely net-new — nothing in the current package list targets async generator composition for `action(fn*)`. The `resource` package has `makeRetrying`/`makeAbortable` but they're 1.x wrappers. The proposal is a new `@solid-primitives/action-helpers` package.

### Design Convention

Every helper wraps a generator function and returns a generator function. They compose via simple function wrapping:

```ts
type ActionFn<Args extends any[], Return> = (...args: Args) => Generator<unknown, Return>;
type ActionWrapper = <Args extends any[], R>(fn: ActionFn<Args, R>) => ActionFn<Args, R>;
```

### Core Combinators

**`withRetry(fn*, options)`** — retry on failure with backoff

```ts
const save = action(withRetry(function*(data) {
  yield api.save(data);
}, {
  attempts: 3,
  delay: 1000,
  backoff: "exponential",         // 1s, 2s, 4s
  when: err => err.code !== 401,  // don't retry auth errors
}));
```

**`withTimeout(fn*, ms)`** — cancel if generator takes too long

```ts
const load = action(withTimeout(function*(id) {
  return yield api.fetchUser(id);
}, 5_000));
```

**`withAbort(fn*)`** — cancel in-flight call when a new one arrives (like RxJS `switchMap`)

```ts
const search = action(withAbort(function*(query) {
  return yield api.search(query);  // previous search is aborted
}));
```

**`sequential(fn*)`** — queue calls, never run concurrently (like `exhaustMap` queuing)

```ts
const processItem = action(sequential(function*(item) {
  yield api.processItem(item);
}));
```

**`once(fn*)`** — first call runs, subsequent calls while in-flight are no-ops

```ts
const init = action(once(function*() {
  const config = yield api.getConfig();
  setConfig(config);
}));
```

**`withProgress(fn*, setProgress)`** — thread a progress setter into the generator

```ts
const upload = action(withProgress(setProgress, function*(file, progress) {
  yield api.uploadWithProgress(file, {
    onProgress: pct => progress(pct),
  });
}));
```

**`tryCatch(fn*, onError*)`** — recover from errors inline

```ts
const submit = action(tryCatch(
  function*(data) { yield api.submit(data); },
  function*(err, data) {
    console.error("Submit failed", err);
    yield api.submitFallback(data);
  }
));
```

**`withOptimistic(store, fn*)`** — shorthand for the optimistic update + refresh pattern

```ts
const addTodo = action(withOptimistic(todos, function*(todo, { optimistic }) {
  optimistic(d => d.push(todo));
  yield api.addTodo(todo);
}));
```

**`pipe(...wrappers)`** — compose wrappers left-to-right without nesting

```ts
const reliableUpload = action(
  pipe(
    withTimeout(30_000),
    withRetry({ attempts: 3, backoff: "exponential" }),
    withProgress(setUploadProgress),
  )(function*(file) {
    yield api.upload(file);
    refresh(fileList);
  })
);
```

### Integration with Existing Packages

| Existing Package | Becomes Action-Helper Consumer |
|---|---|
| `fetch` | `fetchAction(url, opts)` wraps fetch in an action with abort + retry |
| `upload` | Upload becomes `action(withProgress(withRetry(uploadFn*)))` |
| `websocket` | `sendWithRetry` action for WS message sending |
| `clipboard` | `writeClipboard` becomes a typed action helper |
| `share` | `createWebShare` becomes an action |
| `geolocation` | Single-shot `makeGeolocation` is an action candidate |
| `storage` | `makePersisted` setter wraps as optimistic action |
| `filesystem` | All file ops (read/write/delete) become action helpers |

---

## Section 4: General Utilities

These are mostly well-placed. The `make*` convention is good. Key notes:

- **`scheduled`** — `debounce` and `throttle` work as-is. With action helpers, `withDebounce` and `withThrottle` wrapper variants should live in `action-helpers` instead of here.
- **`promise`** — `promiseTimeout` and `raceTimeout` become thin wrappers around `withTimeout` internally once that exists.
- **`props`** — `combineProps` and `filterProps` (now `omit` in 2.0) need updating to match 2.0's `merge`/`omit` naming. `splitProps` → `omit` rename should be reflected.
- **`rootless`** — `createSharedRoot` and `createBranch` are deprecated aliases. These should be removed, leaving `createSubRoot` and `createSingletonRoot` as the canonical names.
- **`utils`** — `INTERNAL_OPTIONS` / `ownedWrite` pattern is the right convention. The `defer` helper (analog to 1.x `on`) still has value as a utility for the split-effect compute phase.

---

## Section 5: Net-New Primitives

### `@solid-primitives/action-helpers`
As detailed in Section 3. The entire generator combinator library. This is the highest-value net-new package.

---

### `@solid-primitives/gesture`
The existing `gestures` package has no source files. Start fresh with a directive-first approach:

```ts
import { swipe, pinch, rotate, drag, longPress } from "@solid-primitives/gesture";

<div
  ref={[
    swipe(({ direction, distance }) => handleSwipe(direction), { threshold: 50 }),
    pinch(({ scale }) => setScale(scale)),
    longPress(onLongPress, { duration: 500 }),
  ]}
/>
```

Each gesture primitive is a ref factory. No class instances, no event bus — just composable ref callbacks.

---

### `@solid-primitives/form`
No form primitive exists. With 2.0's draft stores and optimistic updates, a reactive form primitive becomes first class:

```ts
const form = createForm({
  fields: {
    email: { initial: "", validate: isEmail },
    password: { initial: "", validate: [minLength(8), hasUppercase] },
  },
  onSubmit: action(function*(values) {
    yield api.login(values);
  }),
});

form.fields.email.value()      // "user@..."
form.fields.email.error()      // "Invalid email" | null
form.fields.email.touched()    // boolean
form.dirty()                   // boolean
form.valid()                   // boolean
form.submitting()              // boolean

// Bind to DOM via directive
<input ref={form.bind("email")} />
<form ref={form.ref} />
```

---

### `@solid-primitives/focus-trap`
No focus trap primitive exists. Critical for accessible modals, dialogs, and popovers:

```ts
import { trap } from "@solid-primitives/focus-trap";

// Directive — activates when isOpen is true
<dialog ref={trap({ when: isOpen, returnFocus: true, initialFocus: "[autofocus]" })} />

// Or imperative
const [trapRef, { activate, deactivate }] = createFocusTrap({ returnFocus: true });
<div ref={trapRef} />
```

---

### `@solid-primitives/popover`
Composable positioning + accessibility for tooltips, dropdowns, menus — built on top of the Floating UI / anchor positioning API:

```ts
const tooltip = createTooltip({
  content: () => <span>Save document</span>,
  placement: "top",
  delay: 300,
});

<button ref={tooltip.anchor} />
<Portal>{tooltip.floating()}</Portal>

// Or directive-only for simple cases
<button ref={tooltip("Save document", { placement: "top" })} />
```

---

### `@solid-primitives/dnd`
Drag and drop using the HTML5 DnD API or Pointer API, directive-first:

```ts
const { draggable, droppable, isDragging, isOver } = createDnD<FileItem>();

<div ref={draggable(item)}>Drag me</div>
<div ref={droppable(onDrop)} class={{ "drag-over": isOver() }}>Drop here</div>
```

---

### `@solid-primitives/virtual` (redesign)
The current `createVirtualList` needs a full 2.0 redesign. With `<Repeat count={n}>` now built in and `<For keyed={false}>` for index-stable rendering, the virtual primitive should be a thin layer:

```ts
const virtual = createVirtualizer({
  count: () => items.length,
  estimateSize: () => 50,
  overscan: 5,
});

<div ref={virtual.container} style={{ height: `${virtual.totalSize()}px` }}>
  <For each={virtual.items()}>
    {(item) => (
      <div ref={virtual.measure(item.index)} style={{ transform: `translateY(${item.start}px)` }}>
        {items[item.index].label}
      </div>
    )}
  </For>
</div>
```

---

### `@solid-primitives/command`
No command palette / command registry primitive exists. With keyboard shortcuts (`keyboard` package) and reactive state, a command system is natural:

```ts
const commands = createCommandRegistry([
  {
    id: "save",
    label: "Save",
    shortcut: ["Meta", "S"],
    action: action(function*() { yield save(); }),
  },
  { id: "open", label: "Open File", shortcut: ["Meta", "O"], action: openFile },
]);

commands.run("save");
commands.search("sa")  // → filtered list for palette UI
```

---

## Priority Order

| Priority | Package | Effort | Impact |
|---|---|---|---|
| 1 | `event-listener` → `on()` directive export | Low | High — canonical example |
| 2 | `action-helpers` net-new package | High | High — new primitive class |
| 3 | `bounds` / `resize-observer` / `intersection-observer` directive variants | Medium | High — composable element tracking |
| 4 | `input-mask` → `mask` directive | Low | Medium |
| 5 | `fetch` 2.0 rewrite (see REDESIGN.md) | High | High |
| 6 | `gesture` net-new package | High | High |
| 7 | `form` net-new package | Very High | Very High |
| 8 | `focus-trap` net-new package | Medium | High — accessibility gap |
| 9 | `virtual` redesign | High | Medium |
| 10 | `command` net-new package | Medium | Medium |

The `on()` directive from `event-listener` is the right first PR — it's small, sets the design convention for everything else, and validates the ref-array composition story with a real example.
