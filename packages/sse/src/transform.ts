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
