import { describe, expect, it } from "vitest";
import { createRoot } from "solid-js";
import { createSSE } from "../src/index.js";

describe("SSR", () => {
  it("returns safe stubs without touching EventSource", () =>
    createRoot(dispose => {
      const sse = createSSE("https://example.com/events");
      expect(sse.source()).toBeUndefined();
      expect(sse.data()).toBeUndefined();
      expect(sse.error()).toBeUndefined();
      expect(sse.readyState()).toBe(2);
      expect(() => sse.close()).not.toThrow();
      expect(() => sse.reconnect()).not.toThrow();
      dispose();
    }));

  it("exposes initialValue in SSR data stub", () =>
    createRoot(dispose => {
      const { data } = createSSE<string>("https://example.com/events", {
        initialValue: "loading",
      });
      expect(data()).toBe("loading");
      dispose();
    }));
});
