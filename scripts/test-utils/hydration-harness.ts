/**
 * Real server-render → client-hydrate round trip, for catching hydration hazards that
 * per-package `test/server.test.ts` files structurally cannot: those run under this
 * monorepo's `@solid-primitives/source` resolve condition, so every `@solid-primitives/*`
 * import resolves to workspace `src` instead of the published `dist` build a real consumer
 * gets from node_modules.
 *
 * The SERVER half genuinely closes that gap: it's rendered in a real `node` subprocess with no
 * special resolve conditions, so `@solid-primitives/*` and `@solidjs/web` resolve exactly as
 * they would for a real npm consumer (dist builds, the real "node" export condition).
 *
 * The CLIENT half does not close it the same way. `hydrate()` runs back in the calling Vitest
 * worker, so the dom-compiled fixture's own `@solid-primitives/*` imports still resolve through
 * Vite's module graph — this project's `@solid-primitives/source` condition is active there,
 * i.e. workspace `src`, not `dist` (confirmed empirically: a marker export added only to a
 * package's `src` was visible from inside the dynamically-imported dom module). For packages
 * with no JSX of their own — the common case for `create*` primitives — this doesn't affect the
 * property under test: Solid's owner-id allocation lives entirely in `@solidjs/signals`'s
 * runtime and doesn't depend on whether the *calling* code was pre-compiled. It would matter for
 * a package whose own public surface includes JSX.
 *
 * ⚠️ Because the server half resolves `dist` and the client half resolves `src`, a **stale**
 * `dist` build (edited `src` without rebuilding) makes the two halves run genuinely different
 * code — e.g. one side still has an old `createMemo` the other doesn't — which desyncs owner-id
 * allocation for real and surfaces as a false-positive "unclaimed server-rendered node" warning
 * that has nothing to do with the hazard under test. Rebuild (`pnpm -w build`, or scoped to the
 * touched packages) after editing a package's `src` and before trusting a hydration test result.
 *
 * See the hope-ui solid-primitives-eval.md "transform-boundary hydration hazard": a
 * render-body `createSignal(fn)`/`createMemo(fn)` living in an un-transformed dependency was
 * reported to desync hydration ids between server and client. Whether that's a general
 * solid-js limitation or specific to a non-standard SSR harness, this test proves (or
 * disproves) it for each package using the real, standard `@solidjs/web` renderToString +
 * hydrate pipeline — no custom harness of our own to second-guess.
 */

import { transformAsync } from "@babel/core";
import babelTypescript from "@babel/preset-typescript";
import babelSolid from "@solidjs/babel-plugin";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

async function compile(source: string, generate: "ssr" | "dom"): Promise<string> {
  const result = await transformAsync(source, {
    filename: "hydration-app.tsx",
    // Plugins run before presets, so the Solid plugin would see TS syntax; the typescript
    // preset is a sibling visitor pass and strips types in the same traversal.
    plugins: [[babelSolid, { moduleName: "@solidjs/web", generate, hydratable: true }]],
    presets: [[babelTypescript, { isTSX: true, allExtensions: true }]],
    ast: false,
    sourceMaps: false,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ["jsx", "typescript"] },
  });
  if (!result?.code) throw new Error("[hydration-harness] @solidjs/babel-plugin produced no output");
  return result.code;
}

type PreparedFixture = { html: string; domFile: string };

// Compiling + spawning the SSR subprocess is deterministic given (appSource, cwd), so it's
// cached and reused across every `it()` block in a test file that shares the same fixture
// source — each test still gets its own fresh container/hydrate() call, only the expensive
// "produce the server HTML" step is shared. Temp files are cleaned up once, at process exit,
// rather than per-call, since the cached domFile path is reused across calls.
const fixtureCache = new Map<string, Promise<PreparedFixture>>();
const tempDirsPendingCleanup = new Set<string>();
let exitCleanupRegistered = false;

function registerExitCleanup(): void {
  if (exitCleanupRegistered) return;
  exitCleanupRegistered = true;
  process.once("exit", () => {
    for (const dir of tempDirsPendingCleanup) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort — the process is exiting regardless
      }
    }
  });
}

async function prepareFixture(appSource: string, cwd: string): Promise<PreparedFixture> {
  const key = `${cwd}\0${appSource}`;
  let entry = fixtureCache.get(key);
  if (!entry) {
    entry = (async () => {
      const [ssrCode, domCode] = await Promise.all([
        compile(appSource, "ssr"),
        compile(appSource, "dom"),
      ]);

      const serverEntry = `${ssrCode}\nimport { renderToString } from "@solidjs/web";\nprocess.stdout.write(renderToString(() => App({})));\n`;

      const html = execFileSync(process.execPath, ["--input-type=module"], {
        cwd,
        input: serverEntry,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "inherit"],
      });

      const tmpDir = mkdtempSync(join(cwd, ".hydration-harness-"));
      tempDirsPendingCleanup.add(tmpDir);
      registerExitCleanup();
      const domFile = join(tmpDir, "app.dom.mjs");
      writeFileSync(domFile, domCode);

      return { html, domFile };
    })();
    fixtureCache.set(key, entry);
  }
  return entry;
}

export type HydrationRoundTripResult = {
  /** The HTML produced by the real `renderToString`, run in a real `node` subprocess. */
  html: string;
  /** `container` element the server HTML was hydrated into — still attached to `document.body`. */
  container: HTMLElement;
  /** Server-rendered top-level nodes, captured before hydration. */
  serverNodes: Node[];
  /** Every `console.error`/`console.warn` message emitted while `hydrate()` ran. */
  consoleMessages: string[];
  /** Removes `container` from the document. Call in test cleanup. */
  cleanup: () => void;
};

// The console.error/console.warn monkey-patch and the shared `globalThis._$HY` reset below are
// not reentrant — serialize calls (across concurrent `it()`s/files sharing this module) through
// one chain so a second call can't restore/reassign globals out from under a first call still
// mid-hydrate.
let runQueue: Promise<unknown> = Promise.resolve();

async function runHydrationRoundTrip(appSource: string, cwd: string): Promise<HydrationRoundTripResult> {
  const { html, domFile } = await prepareFixture(appSource, cwd);

  const container = document.createElement("div");
  container.innerHTML = html;
  const serverNodes = Array.from(container.childNodes);
  document.body.appendChild(container);

  const messages: string[] = [];
  let dispose: (() => void) | undefined;
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args: unknown[]) => {
    messages.push(args.map(String).join(" "));
  };
  console.warn = (...args: unknown[]) => {
    messages.push(args.map(String).join(" "));
  };

  try {
    const { default: App } = await import(pathToFileURL(domFile).href);
    const { hydrate } = await import("@solidjs/web");
    // Equivalent of executing the inline <script> generateHydrationScript() embeds in real SSR
    // HTML — jsdom doesn't run scripts assigned via .innerHTML, so this sets up the same global
    // hydrate() otherwise expects to already be there.
    (globalThis as any)._$HY = { events: [], completed: new WeakSet(), r: {}, fe() {} };
    dispose = hydrate(() => App({}), container);
    // Solid finalizes hydration (drainHydrationCallbacks) via a `setTimeout`, after any
    // microtask-scheduled reactive updates have settled — wait for both ticks so a
    // late-firing hydration-mismatch warning isn't missed by the console restore below.
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }

  return {
    html,
    container,
    serverNodes,
    consoleMessages: messages,
    cleanup: () => {
      dispose?.();
      container.remove();
    },
  };
}

/**
 * `appSource` must be a self-contained `.tsx` module (no relative imports — only bare
 * package specifiers) whose default export is a zero-prop Solid component.
 *
 * `cwd` should be the consuming package's directory (e.g. `import.meta.dirname` from a
 * `test/*.test.tsx` file two levels under the package root) so that `node`'s bare-specifier
 * resolution walks up to the workspace's real `node_modules`, exactly as it would for an
 * installed consumer.
 */
export function renderHydrationRoundTrip(appSource: string, cwd: string): Promise<HydrationRoundTripResult> {
  const run = runQueue.then(() => runHydrationRoundTrip(appSource, cwd));
  // Keep the queue alive even if this run rejects, so a failing test doesn't wedge the ones after it.
  runQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
