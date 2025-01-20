<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Date" alt="Solid Primitives Date">
</p>

# @solid-primitives/date

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/date?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/date)
[![size](https://img.shields.io/npm/v/@solid-primitives/date?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/date)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Collection of reactive primitives and utility functions, providing easier ways to deal with dates in SolidJS.

- [`createDate`](#createdate) - Creates a reactive `Date` signal.
- [`createDateNow`](#createdatenow) - Creates an autoupdating and reactive `new Date()`.
- [`createTimeDifference`](#createtimedifference) - Provides a reactive time difference _(in ms)_ signal.
- [`createTimeDifferenceFromNow`](#createtimedifferencefromnow) - Provides a autoupdating, reactive time difference _(in ms)_ from **now** as a signal.
- [`createTimeAgo`](#createtimeago) - Provides a reactive, formatted, autoupdating date difference in relation to **now**.
- [`createCountdown`](#createcountdown) - Provides a reactive broken down time remaining Store.
- [`createCountdownFromNow`](#createcountdownfromnow) - Provides a reactive, autoupdating _(from **now**)_, broken down "time remaining" as a Store.
- \+ [some non-reactive date-related utility functions](#utility-functions).

## Installation

```
npm install @solid-primitives/date
# or
yarn add @solid-primitives/date
```

## Reactive Primitives:

### `createDate`

Creates a reactive `Date` signal.

```ts
const [date, setDate] = createDate(1641408329089);

date(); // T: Date

setDate("2020 1 11");

// passed initial value can be reactive
const [timestamp, setTimestamp] = createSignal(1641408329089);
const [date, setDate] = createDate(timestamp);

setTimestamp(1341708325070); // will update the date
```

### `createDateNow`

Creates an autoupdating and reactive `new Date()`.

```ts
import { createDateNow } from "@solid-primitives/date";

// updates every second:
const [now] = createDateNow(1000);

// reactive timeout value
const [timeout, setTimeout] = createSignal(500);
const [now] = createDateNow(timeout);

// won't autoupdate:
const [now, update] = createDateNow(() => false);

// update manually:
update();
```

### `createTimeDifference`

Provides a reactive time difference _(in ms)_ signal.

```ts
// the arguments can be reactive
const [target, setTarget] = createSignal(1641408329089);
const [diff, { from, to }] = createTimeDifference("2020 1 11", target);
diff(); // T: number
from(); // T: Date
to(); // T: Date
```

### `createTimeDifferenceFromNow`

Provides a autoupdating, reactive time difference _(in ms)_ from **now** as a signal.

```ts
const [target, setTarget] = createSignal(1641408329089);
const [diff, { target, now, update }] = createTimeDifferenceFromNow(target);
diff(); // T: number
target(); // T: Date
now(); // T: Date
// manual update (automatic one can be disabled by passing false)
update();

// you can pass a custom interval (number or function or false)
createTimeDifferenceFromNow(target, diff => (diff > 100000 ? 30000 : 1000));
```

### `createTimeAgo`

Provides a reactive, formatted date difference in relation to now.

```ts
import { createTimeAgo, createDate } from "@solid-primitives/date";

const [myDate, setMyDate] = createDate("Jun 28, 2021");
const [timeago, { target, now, update, difference }] = createTimeAgo(myDate);
// => 5 months ago

timeago(); // => 5 months ago
difference(); // T: number
target(); // T: Date
now(); // T: Date
// manual update (automatic one can be disabled by passing false)
update();

// use custom libraries to change formatting:
import { formatRelative } from "date-fns";
const [timeago] = createTimeAgo(1577836800000, {
  min: 10000,
  interval: 30000,
  relativeFormatter: (target, now) => formatRelative(target, now),
});
// => last Monday at 9:25 AM
```

### `createCountdown`

Provides a reactive broken down time remaining Store.

```ts
const [to, setTo] = createSignal(1641408329089);
const countdown = createCountdown("2020 1 11", to);

countdown.minutes; // e.g. 5
countdown.hours; // e.g. 1
countdown.seconds; // e.g. 48
```

### `createCountdownFromNow`

Provides a reactive, autoupdating _(from **now**)_, broken down "time remaining" as a Store.

```ts
// target date may be reactive
const [to, setTo] = createSignal(1641408329089);
const [countdown, { now, target, update }] = createCountdownFromNow(to);

countdown.minutes; // e.g. 5
countdown.hours; // e.g. 1
countdown.seconds; // e.g. 48

target(); // T: Date
now(); // T: Date
// manual update (automatic one can be disabled by passing false)
update();

// you can pass a custom interval (number or function or false)
createCountdownFromNow(to, diff => (diff > 100000 ? 30000 : 1000));
```

## Utility Functions

### `getDate`

```ts
/**
 * @param init timestamp `number` | date `string` | `Date` instance
 * @returns `Date` instance
 */
const getDate = (init: DateInit): Date
```

### `getTime`

```ts
/**
 * @param init timestamp `number` | date `string` | `Date` instance
 * @returns timestamp `number`
 */
const getTime = (init: DateInit): number
```

### `getDateDifference`

Get the time difference between two dates _[ms]_

```ts
const getDateDifference = (from: Date, to: Date): number
```

### `getCountdown`

Provides broken down time remaining from a time difference.

```ts
/**
 * @param difference time difference between two dates *[ms]*
 * @returns countdown object with keys: `days`, `hours`, `minutes`, etc.
 */
const getCountdown = (difference: number): Countdown
```

### `formatDate`

Apply basic formatting to a `Date` instance.

```ts
const formatDate = (date: Date): string

// example
const date = new Date("2020 1 11")
formatDate(date) // => '2020-01-10'
```

### `formatDateRelative`

Applies relative time formatting based on a time difference from **now**.

```ts
/**
 * @param difference time difference between a date and now *[ms]*
 * @param messages custom messages for changing formatting
 * @returns formatted string, e.g. *"2 seconds ago"*, *"in 3 weeks"*...
 */
function formatDateRelative(difference: number, messages?: Partial<RelativeFormatMessages>): string;
```

## Demo

https://codesandbox.io/s/solid-date-hjxui?file=/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Acknowledgement

- [VueUse — useTimeAgo](https://vueuse.org/core/usetimeago/)
