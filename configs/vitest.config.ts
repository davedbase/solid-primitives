import { defineConfig } from "vitest/config";
import solidPlugin from "@solidjs/vite-plugin";
import * as utils from "../scripts/utils/index.js";

// Packages still on solid-js 1.x, not yet migrated to Solid 2.0.
const UNMIGRATED_PACKAGES = ["fetch", "immutable", "db-store", "graphql", "resource"];

const package_name = utils.getPackageNameFromCWD();

if (package_name == null) {
  utils.log_info("Testing ALL packages...");
} else {
  utils.log_info("Testing " + package_name + " package...");
}

const from_root = package_name == null;

export default defineConfig(({ mode }) => {
  // test in server environment
  // loads only server.test.ts file
  const testSSR = mode === "test:ssr" || mode === "ssr";

  const conditions = testSSR
    ? ["@solid-primitives/source", "node"]
    : ["@solid-primitives/source", "browser", "development"];

  return {
    plugins: [
      solidPlugin({
        refresh: false,
        // For testing SSR we need to do a SSR JSX transform
        solid: { generate: testSSR ? "ssr" : "dom", omitNestedClosingTags: false, moduleName: "@solidjs/web" },
      }),
    ],
    test: {
      watch: false,
      isolate: false,
      passWithNoTests: true,
      environment: testSSR ? "node" : "jsdom",
      // Solid ships separate dev/browser/server builds selected by resolve conditions;
      // inline it so vitest resolves through vite (and those conditions) instead of node.
      server: { deps: { inline: [/solid-js/, /@solidjs\//] } },
      ...(from_root
        ? // Testing all packages from root
          {
            ...(testSSR && {
              include: ["packages/*/test/server.test.{ts,tsx}"],
              exclude: UNMIGRATED_PACKAGES.map(name => `packages/${name}/test/server.test.{ts,tsx}`),
            }),
            ...(!testSSR && {
              include: ["packages/*/test/*.test.{ts,tsx}"],
              exclude: [
                "packages/*/test/server.test.{ts,tsx}",
                ...UNMIGRATED_PACKAGES.map(name => `packages/${name}/test/*.test.{ts,tsx}`),
              ],
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
      alias: {
        "solid-js/web": "@solidjs/web",
      },
      conditions,
    },
    // inlined modules are evaluated through vite's SSR pipeline, which has its own conditions
    ssr: { resolve: { conditions } },
  };
});
