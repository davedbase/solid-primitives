import { defineConfig } from "vitest/config";
import solidPlugin from "@solidjs/vite-plugin";

export default defineConfig(({ mode }) => {
  const testSSR = mode === "test:ssr" || mode === "ssr";
  return {
    plugins: [
      solidPlugin({
        refresh: false,
        solid: { generate: testSSR ? "ssr" : "dom", omitNestedClosingTags: false },
      }),
    ],
    resolve: {
      conditions: testSSR
        ? ["@solid-primitives/source", "node"]
        : ["@solid-primitives/source", "browser", "development"],
      alias: {
        "solid-js/web": new URL(
          testSSR
            ? "../../node_modules/@solidjs/web/dist/server.js"
            : "../../node_modules/@solidjs/web/dist/web.js",
          import.meta.url,
        ).pathname,
        "@solidjs/web": new URL(
          testSSR
            ? "../../node_modules/@solidjs/web/dist/server.js"
            : "../../node_modules/@solidjs/web/dist/web.js",
          import.meta.url,
        ).pathname,
      },
    },
    test: {
      watch: false,
      isolate: false,
      passWithNoTests: true,
      environment: testSSR ? "node" : "jsdom",
      transformMode: { web: [/\.[jt]sx$/] },
      ...(testSSR
        ? { include: ["test/server.test.{ts,tsx}"] }
        : {
            include: ["test/*.test.{ts,tsx}"],
            exclude: ["test/server.test.{ts,tsx}"],
          }),
    },
  };
});
