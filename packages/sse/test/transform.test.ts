import { describe, expect, it } from "vitest";
import { json, ndjson, lines } from "../src/transform.js";

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
