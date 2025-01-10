import { describe, test, expect } from "vitest";
import { createSignal } from "solid-js";
import { createArraySelector } from "../src/index.js";

describe("createArraySelector", () => {
  test("doesn't break in SSR", () => {
    const [selected, setSelected] = createSignal<string[]>(["a"]);
    const isSelected = createArraySelector(selected);

    expect(isSelected("a"), "initial value selected for 'a' should be true").toBe(true);
    expect(isSelected("b"), "initial value selected for 'b' should be false").toBe(false);
    setSelected(["c"]);
    expect(isSelected("a"), "value after change for 'a' should be false").toBe(false);
    expect(isSelected("b"), "value after change for 'b' should be false").toBe(false);
    setSelected(["b"]);
    expect(isSelected("a"), "value after change for 'a' should be false").toBe(false);
    expect(isSelected("b"), "value after change for 'b' should be true").toBe(true);
  });
});
