<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=scheduled" alt="Solid Primitives Scheduled">
</p>

# @solid-primitives/scheduled

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/scheduled?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/scheduled)
[![version](https://img.shields.io/npm/v/@solid-primitives/scheduled?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/scheduled)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for creating scheduled — throttled or debounced — callbacks.

- [`debounce`](#debounce) - Creates a callback that is **debounced** and cancellable.
- [`throttle`](#throttle) - Creates a callback that is **throttled** and cancellable.
- [`scheduleIdle`](#scheduleidle) - Creates a callback throttled using `window.requestIdleCallback()`.
- [`leading`](#leading) - Creates a scheduled and cancellable callback that will be called on **leading** edge.
- [`createScheduled`](#createscheduled) - Creates a signal used for scheduling execution of solid computations by tracking.
- [Scheduling explanation](#scheduling-explanation)

## Installation

```bash
npm install @solid-primitives/scheduled
# or
yarn add @solid-primitives/scheduled
```

## `debounce`

Creates a callback that is debounced and cancellable. The debounced callback is called on **trailing** edge.

The timeout will be automatically cleared on root dispose.

### How to use it

```ts
import { debounce } from "@solid-primitives/scheduled";

const trigger = debounce((message: string) => console.log(message), 250);
trigger("Hello!");
trigger.clear(); // clears a timeout in progress
```

## `throttle`

Creates a callback that is throttled and cancellable. The throttled callback is called on **trailing** edge.

The timeout will be automatically cleared on root dispose.

### How to use it

```ts
import { throttle } from "@solid-primitives/scheduled";

const trigger = throttle((message: string) => console.log(message), 250);
trigger("Hello!");
trigger.clear(); // clears a timeout in progress
```

## `scheduleIdle`

Creates a callback throttled using `window.requestIdleCallback()`. ([MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback))

The throttled callback is called on **trailing** edge.

The timeout will be automatically cleared on root dispose.

> **Note:** `requestIdleCallback` is not available in Safari. If it's not available, `scheduleIdle` will fallback to `throttle` with default timeout. (callbacks will be batched using setTimeout instead)

### How to use it

```ts
import { scheduleIdle } from "@solid-primitives/scheduled";

const trigger = scheduleIdle(
  (message: string) => console.log(message),
  // timeout passed to requestIdleCallback is a maximum timeout before the callback is called
  250,
);
trigger("Hello!");
trigger.clear(); // clears a timeout in progress
```

## `leading`

Creates a scheduled and cancellable callback that will be called on **leading** edge.

The timeout will be automatically cleared on root dispose.

### How to use it

```ts
// with debounce
import { leading, debounce } from "@solid-primitives/scheduled";

const trigger = leading(debounce, (message: string) => console.log(message), 250);
trigger("Hello!");
trigger.clear(); // clears a timeout in progress

// with throttle
import { leading, throttle } from "@solid-primitives/scheduled";

const trigger = leading(throttle, (message: string) => console.log(message), 250);
trigger("Hello!");
trigger.clear(); // clears a timeout in progress
```

## `leadingAndTrailing`

Creates a scheduled and cancellable callback that will be called on **leading** edge for the first call, and **trailing** edge thereafter.

The timeout will be automatically cleared on root dispose.

### How to use it

```ts
// with debounce
import { leadingAndTrailing, debounce } from "@solid-primitives/scheduled";

const trigger = leadingAndTrailing(debounce, (message: string) => console.log(message), 250);
trigger("Hello!");
trigger.clear(); // clears a timeout in progress

// with throttle
import { leadingAndTrailing, throttle } from "@solid-primitives/scheduled";

const trigger = leadingAndTrailing(throttle, (message: string) => console.log(message), 250);
trigger("Hello!");
trigger.clear(); // clears a timeout in progress
```

## `createScheduled`

Creates a signal used for scheduling execution of solid computations by tracking.

### How to use it

`createScheduled` takes only one parameter - a `schedule` function. This function is called with a callback that should be scheduled. It should return a function for triggering the timeout.

```ts
// e.g. with debounce
createScheduled(fn => debounce(fn, 1000));
// e.g. with throttle
createScheduled(fn => throttle(fn, 1000));
// e.g. with leading debounce
createScheduled(fn => leading(debounce, fn, 1000));
// e.g. with leading throttle
createScheduled(fn => leading(throttle, fn, 1000));
```

It returns a signal that can be used to schedule execution of a solid computation. The signal returns `true` if it's dirty _(callback should be called)_ and `false` otherwise.

```ts
import { createScheduled, debounce } from "@solid-primitives/scheduled";

const scheduled = createScheduled(fn => debounce(fn, 1000));

const [count, setCount] = createSignal(0);

createEffect(() => {
  // track source signal
  const value = count();
  // track the debounced signal and check if it's dirty
  if (scheduled()) {
    console.log("count", value);
  }
});

// or with createMemo
const debouncedCount = createMemo((p: number = 0) => {
  // track source signal
  const value = count();
  // track the debounced signal and check if it's dirty
  return scheduled() ? value : p;
});
```

## Scheduling explanation

This package provides 4 different methods for scheduling a callback. Pick one that suits your application.

```
TOP: scheduled function triggered
BOTTOM: called user callback

1. debounce
2. throttle
3. leading debounce
4. leading throttle
5. leadingAndTrailing debounce
6. leadingAndTrailing throttle

   █   █     █
------------------------>
1.                  █
2.        █         █
3. █
4. █         █
5. █                █
6. █      █         █
```

[**Interactive DEMO of the schematic above**](https://primitives.solidjs.community/playground/scheduled)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
