# Built-in transformers

Ready-made `transform` functions for the most common SSE data formats. Pass one as the `transform` option to `createSSE`:

```ts
import { createSSE, json } from "@solid-primitives/sse";

const { data } = createSSE<{ status: string }>(url, { transform: json });
```

---

## `json`

Parse the message data as a single JSON value. Equivalent to `JSON.parse` but named for consistency with the other transformers.

```ts
import { createSSE, json } from "@solid-primitives/sse";

const { data } = createSSE<{ status: string; ts: number }>(url, { transform: json });
// data() === { status: "ok", ts: 1718000000 }
```

---

## `ndjson`

Parse the message data as [newline-delimited JSON](https://ndjson.org/) (NDJSON / JSON Lines). Each non-empty line is parsed as a separate JSON value and the transformer returns an array.

Use this when the server batches multiple objects into one SSE event:

```
data: {"id":1,"type":"tick"}
data: {"id":2,"type":"tick"}

```

```ts
import { createSSE, ndjson } from "@solid-primitives/sse";

const { data } = createSSE<TickEvent[]>(url, { transform: ndjson });
// data() === [{ id: 1, type: "tick" }, { id: 2, type: "tick" }]
```

---

## `lines`

Split the message data into individual lines, returning a `string[]`. Empty lines are filtered out. Useful for multi-line text events that are not JSON.

```ts
import { createSSE, lines } from "@solid-primitives/sse";

const { data } = createSSE<string[]>(url, { transform: lines });
// data() === ["line one", "line two"]
```

---

## `number`

Parse the message data as a number using `Number()` semantics. Handy for streams that emit counters, progress percentages, sensor readings, or prices.

```ts
import { createSSE, number } from "@solid-primitives/sse";

const { data } = createSSE<number>(url, { transform: number });
// data() === 42
```

Note: follows `Number()` coercion — an empty string becomes `0` and non-numeric strings become `NaN`.

---

## `safe(transform, fallback?)`

Wraps any transform in a `try/catch`. When the inner transform throws, `safe` returns `fallback` instead of propagating the error. This keeps the stream alive across malformed events.

```ts
import { createSSE, json, number, safe } from "@solid-primitives/sse";

// Returns undefined on a bad event instead of throwing
const { data } = createSSE<MyEvent>(url, { transform: safe(json) });

// With an explicit fallback value
const { data } = createSSE<number>(url, { transform: safe(number, 0) });
```

---

## `pipe(a, b)`

Composes two transforms into one: the output of `a` is passed as the input of `b`. Useful for building custom transforms from existing primitives without writing anonymous functions.

```ts
import { createSSE, ndjson, json, safe, pipe } from "@solid-primitives/sse";

// Parse NDJSON then keep only "tick" rows
type RawEvent = { type: string };
const { data } = createSSE<RawEvent[]>(url, {
  transform: pipe(ndjson<RawEvent>, rows => rows.filter(r => r.type === "tick")),
});

// Safe JSON with a post-processing step
const { data } = createSSE<string>(url, {
  transform: pipe(safe(json<{ label: string }>), ev => ev?.label ?? ""),
});
```
