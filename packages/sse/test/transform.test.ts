import { describe, expect, it } from "vitest";
import { json, ndjson, lines, number, safe, pipe } from "../src/transform.js";

// ── json ──────────────────────────────────────────────────────────────────────

describe("json", () => {
  it("parses a JSON object", () => {
    expect(json('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses a JSON array", () => {
    expect(json("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("parses a JSON string primitive", () => {
    expect(json('"hello"')).toBe("hello");
  });

  it("parses a JSON number primitive", () => {
    expect(json("42")).toBe(42);
  });

  it("throws on invalid JSON", () => {
    expect(() => json("not json")).toThrow();
  });
});

// ── ndjson ────────────────────────────────────────────────────────────────────

describe("ndjson", () => {
  it("parses each line as a JSON value", () => {
    expect(ndjson('{"a":1}\n{"b":2}')).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("handles a single line", () => {
    expect(ndjson('{"x":42}')).toEqual([{ x: 42 }]);
  });

  it("ignores empty lines", () => {
    expect(ndjson('{"a":1}\n\n{"b":2}')).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("returns an empty array for an empty string", () => {
    expect(ndjson("")).toEqual([]);
  });

  it("handles a trailing newline", () => {
    expect(ndjson('{"a":1}\n{"b":2}\n')).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("throws on an invalid JSON line", () => {
    expect(() => ndjson('{"a":1}\nbad')).toThrow();
  });

  it("parses mixed JSON types per line", () => {
    expect(ndjson("1\n2\n3")).toEqual([1, 2, 3]);
  });
});

// ── lines ─────────────────────────────────────────────────────────────────────

describe("lines", () => {
  it("splits data into lines", () => {
    expect(lines("one\ntwo\nthree")).toEqual(["one", "two", "three"]);
  });

  it("handles a single line with no newline", () => {
    expect(lines("only")).toEqual(["only"]);
  });

  it("ignores empty lines", () => {
    expect(lines("one\n\ntwo")).toEqual(["one", "two"]);
  });

  it("handles a trailing newline", () => {
    expect(lines("one\ntwo\n")).toEqual(["one", "two"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(lines("")).toEqual([]);
  });
});

// ── number ────────────────────────────────────────────────────────────────────

describe("number", () => {
  it("parses an integer string", () => {
    expect(number("42")).toBe(42);
  });

  it("parses a float string", () => {
    expect(number("3.14")).toBe(3.14);
  });

  it("parses a negative number", () => {
    expect(number("-7")).toBe(-7);
  });

  it("converts an empty string to 0", () => {
    expect(number("")).toBe(0);
  });

  it("converts a non-numeric string to NaN", () => {
    expect(number("not a number")).toBeNaN();
  });
});

// ── safe ──────────────────────────────────────────────────────────────────────

describe("safe", () => {
  it("returns the transform result when successful", () => {
    expect(safe(json)('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns undefined when the inner transform throws (no fallback)", () => {
    expect(safe(json)("bad json")).toBeUndefined();
  });

  it("returns the fallback when the inner transform throws", () => {
    expect(safe(json, null)("bad json")).toBeNull();
  });

  it("returns a numeric fallback on error", () => {
    expect(safe(number, 0)("NaN")).toBe(NaN); // Number("NaN") === NaN, not throwing
    // Demonstrate fallback with a throwing transform:
    const throwing = (_: string): number => {
      throw new Error("fail");
    };
    expect(safe(throwing, -1)("any")).toBe(-1);
  });

  it("is composable: safe(ndjson) returns undefined on invalid line", () => {
    expect(safe(ndjson)('{"a":1}\nbad')).toBeUndefined();
  });

  it("overload without fallback infers T | undefined return type", () => {
    const result: { a: number } | undefined = safe(json<{ a: number }>)('{"a":1}');
    expect(result).toEqual({ a: 1 });
  });

  it("overload with fallback infers T return type", () => {
    const result: { a: number } = safe(json<{ a: number }>, { a: 0 })("bad");
    expect(result).toEqual({ a: 0 });
  });
});

// ── pipe ──────────────────────────────────────────────────────────────────────

describe("pipe", () => {
  it("passes the string through both transforms in order", () => {
    const upper = (s: string) => s.toUpperCase();
    const exclaim = (s: string) => `${s}!`;
    expect(pipe(upper, exclaim)("hello")).toBe("HELLO!");
  });

  it("composes json with a post-processing step", () => {
    const getLabel = pipe(json<{ label: string }>, ev => ev.label);
    expect(getLabel('{"label":"tick"}')).toBe("tick");
  });

  it("composes ndjson with a filter step", () => {
    type Row = { type: string };
    const ticks = pipe(
      ndjson<Row>,
      rows => rows.filter(r => r.type === "tick"),
    );
    expect(ticks('{"type":"tick"}\n{"type":"other"}\n{"type":"tick"}')).toEqual([
      { type: "tick" },
      { type: "tick" },
    ]);
  });

  it("composes safe(json) with a fallback mapping", () => {
    const getLabel = pipe(safe(json<{ label: string }>), ev => ev?.label ?? "");
    expect(getLabel('{"label":"ok"}')).toBe("ok");
    expect(getLabel("bad")).toBe("");
  });

  it("infers the correct return type", () => {
    const toLength: (raw: string) => number = pipe(
      (s: string) => s.split(","),
      arr => arr.length,
    );
    expect(toLength("a,b,c")).toBe(3);
  });
});
