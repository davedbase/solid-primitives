import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import * as utils from "../scripts/utils/index.js";

// Packages still on solid-js 1.x, not yet migrated to Solid 2.0.
const UNMIGRATED_PACKAGES = ["fetch", "immutable", "db-store", "graphql", "resource"];

function solidBabelPlugin(testSSR: boolean): Plugin {
  return {
    name: "solid-babel-transform",
    config() {
      return { esbuild: { jsx: "preserve" } };
    },
    async transform(source, id) {
      if (!/\.[mc]?[tj]sx$/i.test(id) || /node_modules/.test(id)) return null;
      id = id.replace(/\?.*$/, "");

      const { transformAsync } = await import("@babel/core");
      const babelSolid = (await import("@solidjs/babel-plugin")).default;

      const parserPlugins: string[] = ["jsx"];
      if (/\.[mc]?tsx$/i.test(id)) parserPlugins.push("typescript");

      const result = await transformAsync(source, {
        filename: id,
        sourceFileName: id,
        plugins: [
          [
            babelSolid,
            {
              moduleName: "@solidjs/web",
              generate: testSSR ? "ssr" : "dom",
            },
          ],
        ],
        ast: false,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
        parserOpts: { plugins: parserPlugins as any },
      });

      if (!result || !result.code) return null;
      return { code: result.code, map: result.map };
    },
  };
}

const package_name = utils.getPackageNameFromCWD();

if (package_name == null) {
  utils.log_info("Testing ALL packages (Solid 2.0 mode)...");
} else {
  utils.log_info("Testing " + package_name + " package (Solid 2.0 mode)...");
}

const from_root = package_name == null;

export default defineConfig(({ mode }) => {
  const testSSR = mode === "test:ssr" || mode === "ssr";

  const conditions = testSSR
    ? ["@solid-primitives/source", "node"]
    : ["@solid-primitives/source", "browser", "development"];

  return {
    plugins: [solidBabelPlugin(testSSR)],
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
      conditions,
    },
    // inlined modules are evaluated through vite's SSR pipeline, which has its own conditions
    ssr: { resolve: { conditions } },
  };
});
