import { defineConfig, type Plugin } from "vitest/config";
import solidPlugin from "@solidjs/vite-plugin";
import * as utils from "../../scripts/utils/index.js";

const package_name = utils.getPackageNameFromCWD();

if (package_name != null) {
  utils.log_info("Testing " + package_name + " package...");
}

export default defineConfig(({ mode }) => {
  const testSSR = mode === "test:ssr" || mode === "ssr";

  return {
    plugins: [
      solidPlugin({
        refresh: false,
        solid: {
          generate: testSSR ? "ssr" : "dom",
          omitNestedClosingTags: false,
          moduleName: "@solidjs/web",
        },
      }) as unknown as Plugin,
    ],
    test: {
      watch: false,
      isolate: false,
      passWithNoTests: true,
      environment: testSSR ? "node" : "jsdom",
      transformMode: {
        web: [/\.[jt]sx$/],
      },
      ...(testSSR
        ? { include: ["test/server.test.{ts,tsx}"] }
        : {
            include: ["test/*.test.{ts,tsx}"],
            exclude: ["test/server.test.{ts,tsx}"],
          }),
    },
    resolve: {
      conditions: testSSR
        ? ["@solid-primitives/source", "node"]
        : ["@solid-primitives/source", "browser", "development"],
    },
  };
});
