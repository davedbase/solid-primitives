import { getLastClipboardEntry } from "./setup.js";
import { createComputed, createRoot, createSignal } from "solid-js";
import { createClipboard } from "../src/index.js";
import { describe, expect, it } from "vitest";

const tick = () => new Promise<void>(resolve => queueMicrotask(resolve));

describe("createClipboard", () => {
  it("test initial read values", () =>
    createRoot(async () => {
      const [clipboard, refetch] = createClipboard();
      let i = 0;

      await new Promise<void>(resolve => {
        createComputed(() => {
          const items = clipboard();
          if (i === 0) {
            expect(items).toHaveLength(0);
            queueMicrotask(() => refetch());
          } else {
            expect(items).toHaveLength(1);
            expect(items[0]!.text).toBe("InitialValue");
            resolve();
          }
          i++;
        });
      });
    }));

  it("does not write the initial signal value by default (deferInitial)", () =>
    createRoot(async dispose => {
      const [data] = createSignal("Skip me");
      createClipboard(data);
      await tick();
      expect(getLastClipboardEntry().value).toBe("InitialValue");
      dispose();
    }));

  it("does not write the initial signal value when deferInitial is true", () =>
    createRoot(async dispose => {
      const [data] = createSignal("Skip me too");
      createClipboard(data, true);
      await tick();
      expect(getLastClipboardEntry().value).toBe("InitialValue");
      dispose();
    }));

  it("writes the initial signal value when deferInitial is false", () =>
    createRoot(async dispose => {
      const [data] = createSignal("Write me");
      createClipboard(data, false);
      await tick();
      expect(getLastClipboardEntry().value).toBe("Write me");
      dispose();
    }));

  it("still writes on subsequent changes when deferInitial is false", () =>
    createRoot(async dispose => {
      const [data, setData] = createSignal("Write me");
      createClipboard(data, false);
      await tick();
      expect(getLastClipboardEntry().value).toBe("Write me");
      setData("Then me");
      await tick();
      expect(getLastClipboardEntry().value).toBe("Then me");
      dispose();
    }));
});
