/**
 * Built-in transform functions for common SSE data formats.
 * Pass one of these as the `transform` option to `createSSE`:
 *
 * ```ts
 * const { data } = createSSE<Event[]>(url, { transform: ndjson });
 * ```
 */

/**
 * Parse SSE message data as a single JSON value.
 *
 * Equivalent to `JSON.parse` but named for use alongside the other
 * transformers in this module.
 *
 * ```ts
 * const { data } = createSSE<{ status: string }>(url, { transform: json });
 * ```
 */
export const json = <T>(raw: string): T => JSON.parse(raw) as T;

/**
 * Parse SSE message data as newline-delimited JSON (NDJSON / JSON Lines).
 *
 * Each non-empty line in the event's `data` field is parsed as a separate
 * JSON value. Returns an array of the parsed values.
 *
 * Use this when the server batches multiple JSON objects into a single SSE
 * event, one object per line:
 *
 * ```
 * data: {"id":1,"type":"tick"}
 * data: {"id":2,"type":"tick"}
 *
 * ```
 *
 * ```ts
 * const { data } = createSSE<TickEvent[]>(url, { transform: ndjson });
 * // data() === [{ id: 1, type: "tick" }, { id: 2, type: "tick" }]
 * ```
 */
export const ndjson = <T>(raw: string): T[] =>
  raw
    .split("\n")
    .filter(line => line !== "")
    .map(line => JSON.parse(line) as T);

/**
 * Split SSE message data into individual lines, returning a `string[]`.
 * Empty lines are filtered out.
 *
 * Use this for multi-line text events that are not JSON.
 *
 * ```ts
 * const { data } = createSSE<string[]>(url, { transform: lines });
 * // data() === ["line one", "line two"]
 * ```
 */
export const lines = (raw: string): string[] => raw.split("\n").filter(line => line !== "");

/**
 * Parse SSE message data as a number using `Number()` semantics.
 *
 * Use this for streams that emit plain numeric values: counters, progress
 * percentages, sensor readings, prices, etc.
 *
 * ```ts
 * const { data } = createSSE<number>(url, { transform: number });
 * // data() === 42
 * ```
 *
 * Note: follows `Number()` coercion — `""` → `0`, non-numeric strings → `NaN`.
 */
export const number = (raw: string): number => Number(raw);

/**
 * Wrap any transform in a `try/catch` so that a malformed event does not
 * throw; instead it returns `fallback` (default `undefined`).
 *
 * ```ts
 * // Returns undefined on bad input instead of throwing
 * const { data } = createSSE<MyEvent>(url, { transform: safe(json) });
 *
 * // With an explicit fallback value
 * const { data } = createSSE<number>(url, { transform: safe(number, 0) });
 * ```
 */
export function safe<T>(transform: (raw: string) => T): (raw: string) => T | undefined;
export function safe<T>(transform: (raw: string) => T, fallback: T): (raw: string) => T;
export function safe<T>(
  transform: (raw: string) => T,
  fallback?: T,
): (raw: string) => T | undefined {
  return (raw: string): T | undefined => {
    try {
      return transform(raw);
    } catch {
      return fallback;
    }
  };
}

/**
 * Compose two transforms into one: the output of `a` is passed as the input
 * of `b`.
 *
 * ```ts
 * // Parse NDJSON then keep only "tick" events
 * const { data } = createSSE<TickEvent[]>(url, {
 *   transform: pipe(ndjson<RawEvent>, rows => rows.filter(r => r.type === "tick")),
 * });
 *
 * // Safe JSON followed by a post-processing step
 * const { data } = createSSE<string>(url, {
 *   transform: pipe(safe(json<{ label: string }>), ev => ev?.label ?? ""),
 * });
 * ```
 */
export function pipe<A, B>(a: (raw: string) => A, b: (a: A) => B): (raw: string) => B {
  return (raw: string): B => b(a(raw));
}
