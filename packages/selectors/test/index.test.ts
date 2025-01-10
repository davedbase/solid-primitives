import { describe, test, expect } from "vitest";
import { createRoot, createSignal } from "solid-js";
import { createArraySelector } from "../src/index.js";

describe("createArraySelector", () => {
  test("createArraySelector select single item", () =>
    createRoot(dispose => {
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
      dispose();
    }));

  test("createArraySelector select multiple items", () =>
    createRoot(dispose => {
      const [selected, setSelected] = createSignal<string[]>(["a", "b"]);
      const isSelected = createArraySelector(selected);

      expect(isSelected("a"), "initial value selected for 'a' should be true").toBe(true);
      expect(isSelected("b"), "initial value selected for 'b' should be true").toBe(true);
      expect(isSelected("c"), "initial value selected for 'c' should be false").toBe(false);
      setSelected(["c", "b"]);
      expect(isSelected("a"), "value after change for 'a' should be false").toBe(false);
      expect(isSelected("b"), "value after change for 'b' should be true").toBe(true);
      expect(isSelected("c"), "value after change for 'c' should be true").toBe(true);
      setSelected(["c", "a"]);
      expect(isSelected("a"), "value after change for 'a' should be true").toBe(true);
      expect(isSelected("b"), "value after change for 'b' should be false").toBe(false);
      expect(isSelected("c"), "value after change for 'c' should be true").toBe(true);
      setSelected([]);
      expect(isSelected("a"), "value after change empty for 'a' should be false").toBe(false);
      expect(isSelected("b"), "value after change empty for 'b' should be false").toBe(false);
      expect(isSelected("c"), "value after change empty for 'c' should be false").toBe(false);
      dispose();
    }));
});
