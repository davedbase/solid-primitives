<div>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Deferred%20Disposal" alt="Solid Primitives Deferred Disposal">
</div>

# @solid-primitives/deferred-disposal

[![turborepo](https://img.shields.io/badge/built%20with-turborepo-cc00ff.svg)](https://turborepo.org/)
[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/deferred-disposal)](https://bundlephobia.com/package/@solid-primitives/deferred-disposal)
[![stage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A reactive coordinator for deferring cleanup until async work completes. Designed as a low-level building block for exit animations, transitions, and any pattern where a reactive scope must signal disposal before the DOM or other resources can be safely released.

## Installation

```bash
npm install @solid-primitives/deferred-disposal
# or
pnpm add @solid-primitives/deferred-disposal
```

## `createDeferredDisposal`

Registers with `onCleanup` so that when the owning reactive scope is disposed, `isDisposing` becomes `true`. Holds block `allSettled` from resolving — once every hold is released, the wrapping layer knows cleanup can proceed.

```ts
import { createDeferredDisposal } from "@solid-primitives/deferred-disposal";

const removal = createDeferredDisposal();
```

### Return value

```ts
interface DeferredDisposal {
  hold(label?: string): DisposalHold;
  defer(work: Promise<unknown>): void;
  isHeld: Accessor<boolean>;
  isDisposing: Accessor<boolean>;
  allSettled: Accessor<Promise<void>>;
}

interface DisposalHold {
  readonly label?: string;
  release(): void;
  [Symbol.dispose](): void;
  [Symbol.asyncDispose](): Promise<void>;
}
```

| Member | Description |
|---|---|
| `hold(label?)` | Creates a hold. Disposal does not settle until every hold is released. |
| `defer(promise)` | Convenience — holds until the Promise settles (resolved **or** rejected). |
| `isHeld` | Reactive boolean. `true` while any hold is active. |
| `isDisposing` | Reactive boolean. `true` once the owning scope's `onCleanup` has fired. |
| `allSettled` | Async memo. Settles when all holds are released. Integrates with `resolve()` and `<Loading>`. |

---

## Usage

### Manual hold / release

The most explicit form. Call `hold()` to block disposal, call `release()` when the async work is done.

```ts
onExit(({ element, removal }) => {
  const hold = removal.hold("fade out");

  animate(element(), keyframes, options).finished.finally(() => {
    hold.release();
  });
});
```

### `defer` — promise shorthand

When you don't need the hold reference, `defer` wraps the hold/release pattern in one call. Releases on both resolve and reject.

```ts
onExit(({ element, removal }) => {
  removal.defer(animate(element(), keyframes, options).finished);
});
```

### `using` — Explicit Resource Management

`DisposalHold` implements both `[Symbol.dispose]` and `[Symbol.asyncDispose]`, so it works directly with the TC39 [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management) `using` / `await using` syntax.

```ts
// Sync block — hold is released when the block exits (even on throw)
onExit(({ element, removal }) => {
  using hold = removal.hold("slide out");
  startAnimation(element());
  // hold.release() called automatically when block exits
});

// Async block
onExit(async ({ element, removal }) => {
  await using hold = removal.hold("fade out");
  await animate(element(), keyframes, options).finished;
  // hold[Symbol.asyncDispose]() called automatically
});
```

### Awaiting settlement

Use Solid's `resolve()` to imperatively await all holds clearing:

```ts
await resolve(() => removal.allSettled());
```

Or read `allSettled` inside a `<Loading>` boundary for declarative pending state — Solid's runtime treats the async memo as pending while any hold is active.

---

## Aggregation with `DisposableStack` / `AsyncDisposableStack`

The TC39 proposal also introduces `DisposableStack` and `AsyncDisposableStack` — containers that collect multiple disposable resources and release them in LIFO order when the stack is disposed. Because `DisposalHold` implements both `Symbol.dispose` and `Symbol.asyncDispose`, holds are first-class citizens of both stack types.

### `DisposableStack.use()` — collect holds, release together

```ts
onExit(({ element, removal }) => {
  using stack = new DisposableStack();

  stack.use(removal.hold("fade"));
  stack.use(removal.hold("scale"));

  startAnimations(element());
  // stack[Symbol.dispose]() releases both holds in LIFO order when the block exits
});
```

### `AsyncDisposableStack.use()` — async collection

Because `DisposalHold` implements `[Symbol.asyncDispose]`, it slots directly into `AsyncDisposableStack`:

```ts
onExit(async ({ element, removal }) => {
  await using stack = new AsyncDisposableStack();

  stack.use(removal.hold("fade out"));

  await animate(element(), keyframes, options).finished;
  // stack[Symbol.asyncDispose]() releases the hold
});
```

### `adopt()` — integrate non-disposable APIs

Use `adopt()` to register any value with a custom cleanup callback:

```ts
onExit(async ({ element, removal }) => {
  await using stack = new AsyncDisposableStack();

  const animation = animate(element(), keyframes, options);
  stack.adopt(removal.hold("animation"), hold => hold.release());
  stack.adopt(animation, anim => anim.cancel());

  await animation.finished;
});
```

### `defer()` — callback form

`DisposableStack.defer()` schedules a plain callback on disposal — useful for cleanup that isn't a disposable resource:

```ts
onExit(({ element, removal }) => {
  using stack = new DisposableStack();

  stack.use(removal.hold("exit"));
  stack.defer(() => element().classList.remove("animating"));

  startAnimation(element());
});
```

### `move()` — transfer ownership

`move()` transfers all resources from one stack to another, releasing the source stack's ownership. Useful when constructing complex exit sequences where holds are built up conditionally:

```ts
function buildExitHolds(removal: DeferredDisposal, steps: string[]): DisposableStack {
  using temp = new DisposableStack();

  for (const step of steps) {
    temp.use(removal.hold(step));
  }

  // If anything above throws, temp disposes all holds automatically.
  // On success, transfer ownership to the caller.
  return temp.move();
}

onExit(({ element, removal }) => {
  using stack = buildExitHolds(removal, ["fade", "slide", "scale"]);
  runExitSequence(element(), () => stack[Symbol.dispose]());
});
```

---

## Solid async integration

`allSettled` is a Solid async memo — it participates in Solid's reactive async graph the same way as `createMemo(() => fetchData())`. This means:

- `resolve(() => removal.allSettled())` — returns a `Promise<void>` that resolves once all holds clear
- `isPending(() => removal.allSettled())` — reactive boolean for stale-while-revalidating UI states
- `<Loading>` boundaries understand its pending state

```ts
// Imperative — wait for all exit work to finish before removing the DOM node
await resolve(() => removal.allSettled());
element.remove();
```

---

## `isDisposing` — observing the exit signal

`isDisposing` becomes `true` in the same synchronous flush as `onCleanup`. A parent scope can watch it to begin the exit sequence before the child's reactive graph fully tears down:

```ts
// In the parent (presence/animation layer):
createEffect(
  () => removal.isDisposing(),
  disposing => {
    if (!disposing) return;
    // Start exit callbacks, keep element in DOM until allSettled resolves
    runExitCallbacks({ element, removal });
    resolve(() => removal.allSettled()).then(() => element.remove());
  }
);
```

---

## Definition

```ts
function createDeferredDisposal(): DeferredDisposal;
```

## Credits

Original primitive concept by [@okikio](https://github.com/okikio).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
