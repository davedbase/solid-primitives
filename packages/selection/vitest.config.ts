import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";

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

export default defineConfig(({ mode }) => {
  const testSSR = mode === "test:ssr" || mode === "ssr";

  return {
    plugins: [solidBabelPlugin(testSSR)],
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
