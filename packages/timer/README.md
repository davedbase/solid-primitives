<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Timer" alt="Solid Primitives Timer">
</p>

# @solid-primitives/timer

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/timer?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/timer)
[![version](https://img.shields.io/npm/v/@solid-primitives/timer?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/timer)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Timer primitives related to [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/setInterval) and [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout):

- [`makeTimer`](#maketimer) - Makes an automatically cleaned up timer.
- [`createTimer`](#createtimer) - [makeTimer](#maketimer), but with a fully reactive delay
- [`createTimeoutLoop`](#createtimeoutloop) - Like createInterval, except the delay only updates between executions.
- [`createPolled`](#createpolled) - Polls a function periodically. Returns an to the latest polled value.
- [`createIntervalCounter`](#createintervalcounter) - Creates a counter which increments periodically.

## Installation

```bash
npm install @solid-primitives/timer
# or
yarn add @solid-primitives/timer
```

## How to use it

### Basic Usage

#### makeTimer

Makes a timer ([setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout) or [setInterval](https://developer.mozilla.org/en-US/docs/Web/API/setInterval)), automatically cleaning up when the current reactive scope is disposed.

```ts
const callback = () => {};
const disposeTimeout = makeTimer(callback, 1000, setTimeout);
const disposeInterval = makeTimer(callback, 1000, setInterval);
// ...
dispose(); // clean up manually if needed
```

#### createTimer

[makeTimer](#maketimer), but with a fully reactive delay. The delay can also be `false`, in which case the timer is disabled. Does not return a dispose function.

```ts
const callback = () => {};
createTimer(callback, 1000, setTimeout);
createTimer(callback, 1000, setInterval);
// with reactive delay
const callback = () => {};
const [paused, setPaused] = createSignal(false);
const [delay, setDelay] = createSignal(1000);
createTimer(callback, () => !paused() && delay(), setTimeout);
createTimer(callback, () => !paused() && delay(), setInterval);
// ...
setDelay(500);
// pause
setPaused(true);
// unpause
setPaused(false);
```

#### createTimeoutLoop

Similar to an interval created with [createTimer](#createtimer), but the delay does not update until the callback is executed.

```ts
const callback = () => {};
createTimeoutLoop(callback, 1000);
// with reactive delay
const callback = () => {};
const [delay, setDelay] = createSignal(1000);
createTimeoutLoop(callback, delay);
// ...
setDelay(500);
```

#### createPolled

Periodically polls a function, returning an accessor to its last return value.

```tsx
const date = createPolled(() => new Date(), 1000);
// ...
<span>The time is: {date()}</span>;
// with reactive delay
const [delay, setDelay] = createSignal(1000);
createPolled(() => new Date(), delay);
// ...
setDelay(500);
```

#### createIntervalCounter

A counter which increments periodically based on the delay.

```tsx
const count = createIntervalCounter(1000);
// ...
<span>Count: {count()}</span>;
// with reactive delay
const [delay, setDelay] = createSignal(1000);
createIntervalCounter(delay);
// ...
setDelay(500);
```

### Note on Reactive Delays

When a delay is changed, the fraction of the existing delay already elapsed be carried forward to the new delay. For instance, a delay of 1000ms changed to 2000ms after 250ms will be considered 1/4 done, and next callback will be executed after 250ms + 1500ms. Afterwards, the new delay will be used.

## Demo

You may view a working example here: https://codesandbox.io/s/solid-primitives-timer-6n7dt?file=/src/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
