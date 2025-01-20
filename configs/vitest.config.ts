import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import * as utils from "../scripts/utils/index.js"

const package_name = utils.getPackageNameFromCWD()

if (package_name == null) {
  utils.log_info("Testing ALL packages...")
} else {
  utils.log_info("Testing "+package_name+" package...")
}

const from_root = package_name == null

export default defineConfig(({ mode }) => {
  // test in server environment
  // loads only server.test.ts file
  const testSSR = mode === "test:ssr" || mode === "ssr";

  return {
    plugins: [
      solidPlugin({
        // https://github.com/solidjs/solid-refresh/issues/29
        hot: false,
        // For testing SSR we need to do a SSR JSX transform
        solid: { generate: testSSR ? "ssr" : "dom", omitNestedClosingTags: false },
      }),
    ],
    test: {
      watch: false,
      isolate: false,
      passWithNoTests: true,
      environment: testSSR ? "node" : "jsdom",
      transformMode: {
        web: [/\.[jt]sx$/],
      },
      ...(from_root
        ? // Testing all packages from root
          {
            ...(testSSR && { include: ["packages/*/test/server.test.{ts,tsx}"] }),
            ...(!testSSR && {
              include: ["packages/*/test/*.test.{ts,tsx}"],
              exclude: ["packages/*/test/server.test.{ts,tsx}"],
            }),
          }
        : // Testing a single package
          {
            ...(testSSR && { include: ["test/server.test.{ts,tsx}"] }),
            ...(!testSSR && {
              include: ["test/*.test.{ts,tsx}"],
              exclude: ["test/server.test.{ts,tsx}"],
            }),
          }),
    },
    resolve: {
      conditions: testSSR
        ? ["@solid-primitives/source", "node"]
        : ["@solid-primitives/source", "browser", "development"],
    },
  };
});
