import { Countdown, DateInit, RelativeFormatMessages, Unit } from "./types.js";
import { DAY, DEFAULT_MESSAGES, HOUR, MINUTE, SECOND, UNITS } from "./variables.js";

/**
 * @param init timestamp `number` | date `string` | `Date` instance
 * @returns `Date` instance
 */
export const getDate = (init: DateInit): Date => (init instanceof Date ? init : new Date(init));

/**
 * @param init timestamp `number` | date `string` | `Date` instance
 * @returns timestamp `number`
 */
export const getTime = (init: DateInit): number =>
  typeof init === "number"
    ? init
    : init instanceof Date
    ? init.getTime()
    : new Date(init).getTime();

/**
 * Get the time difference between two dates *[ms]*
 */
export const getDateDifference = (from: Date, to: Date): number => to.getTime() - from.getTime();

/**
 * Provides broken down time remaining from a time difference.
 * @param difference time difference between two dates *[ms]*
 * @returns countdown object with keys: `days`, `hours`, `minutes`, etc.
 */
export const getCountdown = (difference: number): Countdown => ({
  days: Math.floor(difference / DAY),
  hours: Math.floor((difference / HOUR) % 24),
  minutes: Math.floor((difference / MINUTE) % 60),
  seconds: Math.floor((difference / SECOND) % 60),
  milliseconds: difference % 100,
});

/**
 * Apply basic formatting to a `Date` instance.
 * @example
 * const date = new Date("2020 1 11")
 * formatDate(date) // => '2020-01-10'
 */
export const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Applies relative time formatting based on a time difference from **now**.
 *
 * @param difference time difference between a date and now *[ms]*
 * @param messages custom messages for changing formatting
 * @returns formatted string, e.g. *"2 seconds ago"*, *"in 3 weeks"*...
 */
export function formatDateRelative(
  difference: number,
  messages?: Partial<RelativeFormatMessages>,
): string {
  const _messages: RelativeFormatMessages = {
    ...DEFAULT_MESSAGES,
    ...messages,
  };
  const absDiff = Math.abs(difference);

  for (const unit of UNITS) {
    if (absDiff < unit.max) return format(unit);
  }
  return _messages.justNow;

  function applyFormat(name: keyof RelativeFormatMessages, val: number | string, isPast: boolean) {
    const formatter = _messages[name];
    if (typeof formatter === "function") return formatter(val as never, isPast);
    return formatter.replace("{0}", val.toString());
  }

  function format(unit: Unit) {
    const val = Math.round(absDiff / unit.value);
    const past = difference < 0;

    const str = applyFormat(unit.name, val, past);
    return applyFormat(past ? "past" : "future", str, past);
  }
}
