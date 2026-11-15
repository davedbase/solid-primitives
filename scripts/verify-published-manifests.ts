// Guards against unresolved pnpm workspace-protocol strings (`catalog:`,
// `catalog:<name>`, `workspace:`) making it into a package's PUBLISHED
// manifest. Source package.json files are expected to contain these
// protocols — pnpm resolves them at pack/publish time. This script actually
// packs every package (via `pnpm pack`, the same manifest-resolution path
// `pnpm publish` uses) and inspects the packed package/package.json, not the
// source file, so it only fails on a genuine resolution failure.
//
// Background: @solid-primitives/event-listener@3.0.0-next.4 and
// @solid-primitives/pagination@1.0.0-next.7 were published to npm with
// literal "catalog:peer" strings left in peerDependencies, which breaks
// plain npm/yarn installs (EUNSUPPORTEDPROTOCOL). See
// https://github.com/solidjs-community/solid-primitives/issues/1052.
//
// It also scans the BUILT output inside each packed tarball (what consumers actually
// install) for two kinds of breakage that no workspace test can see, because tests resolve
// `@solid-primitives/*` to `src` and alias old Solid paths:
//   1. imports of Solid 1.x subpaths that no longer exist in Solid 2.0 (`solid-js/web`,
//      `solid-js/store`, ...), which fail at import time with ERR_PACKAGE_PATH_NOT_EXPORTED.
//      Typically caused by compiling JSX without `moduleName: "@solidjs/web"`.
//   2. imports of the Solid runtime (`solid-js`, `@solidjs/web`) that the manifest does not declare
//      as a dependency or peer dependency (e.g. dist importing `@solidjs/web` while only
//      `solid-js` is a peer). Other packages are not checked: several packages intentionally
//      import optional integrations.
// Packages that still target Solid 1.x (peer `solid-js` ^1) are exempt from check 1.
// See https://github.com/solidjs-community/solid-primitives/issues/1098.
//
// Usage: pnpm run verify:manifests
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const DEP_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const;
const BAD_PROTOCOLS = ["catalog:", "workspace:"];
// Solid 1.x subpaths that were removed or moved in Solid 2.0.
const REMOVED_SOLID_SUBPATHS =
  /^solid-js\/(web|store|html|h|universal|jsx-runtime|jsx-dev-runtime)(\/|$)/;
// Runtime packages whose imports must be declared in the manifest.
const SOLID_RUNTIME_PACKAGES = new Set(["solid-js", "@solidjs/web"]);
const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;

/** Package name of a bare import specifier (`@scope/pkg/sub` -> `@scope/pkg`), or null if not a package import. */
const packageNameOf = (specifier: string): string | null => {
  if (specifier.startsWith(".") || specifier.startsWith("/")) return null;
  if (specifier.startsWith("node:") || specifier.startsWith("data:")) return null;
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
};

const targetsSolid1 = (manifest: any): boolean => {
  const range = manifest.peerDependencies?.["solid-js"];
  return typeof range === "string" && /^[\^~>=<\s]*1\./.test(range);
};

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(m?js|d\.m?ts)$/.test(entry.name)) yield full;
  }
}

type PackedPackage = { name: string; version: string; filename: string };

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-manifests-"));

let packed: PackedPackage[];
try {
  const output = execFileSync(
    "pnpm",
    ["pack", "--recursive", "--json", "--pack-destination", tmpDir],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 },
  );
  packed = JSON.parse(output);
} catch (err) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  throw err;
}

const failures: string[] = [];
const distFailures: string[] = [];
const undeclaredFailures: string[] = [];

for (const pkg of packed) {
  const manifestText = execFileSync("tar", ["-xzO", "-f", pkg.filename, "package/package.json"], {
    encoding: "utf8",
  });
  const manifest = JSON.parse(manifestText);

  for (const field of DEP_FIELDS) {
    const deps = manifest[field];
    if (!deps) continue;
    for (const [dep, range] of Object.entries(deps)) {
      if (typeof range === "string" && BAD_PROTOCOLS.some(p => range.startsWith(p))) {
        failures.push(`${pkg.name}@${pkg.version} ${field}.${dep} = "${range}"`);
      }
    }
  }

  // Scan the built output that consumers actually install.
  const extractDir = fs.mkdtempSync(path.join(tmpDir, "extract-"));
  execFileSync("tar", ["-xzf", pkg.filename, "-C", extractDir]);
  const distDir = path.join(extractDir, "package", "dist");
  if (!fs.existsSync(distDir)) continue;

  const declared = new Set([
    manifest.name,
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
  const solid1 = targetsSolid1(manifest);
  const reported = new Set<string>();

  for (const file of walk(distDir)) {
    const rel = path.relative(path.join(extractDir, "package"), file);
    const text = fs.readFileSync(file, "utf8");
    for (const [, specifier] of text.matchAll(IMPORT_SPECIFIER)) {
      if (!specifier) continue;
      const key = `${rel}\0${specifier}`;
      if (reported.has(key)) continue;

      if (!solid1 && REMOVED_SOLID_SUBPATHS.test(specifier)) {
        reported.add(key);
        distFailures.push(
          `${pkg.name}@${pkg.version} ${rel} imports "${specifier}", which does not exist in Solid 2.0 (use "@solidjs/web" / "solid-js")`,
        );
        continue;
      }
      const dependency = packageNameOf(specifier);
      if (dependency && SOLID_RUNTIME_PACKAGES.has(dependency) && !declared.has(dependency)) {
        reported.add(key);
        undeclaredFailures.push(
          `${pkg.name}@${pkg.version} ${rel} imports "${specifier}", but "${dependency}" is not a dependency or peerDependency`,
        );
      }
    }
  }
}

let failed = false;

if (failures.length > 0) {
  failed = true;
  console.error("Unresolved workspace-protocol strings found in packed manifests:\n");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    "\nThese packages would be published to npm broken (npm/yarn can't resolve `catalog:`/`workspace:`). Aborting release.\n",
  );
}

if (distFailures.length > 0) {
  failed = true;
  console.error("Built output imports Solid 1.x subpaths that no longer exist:\n");
  for (const f of distFailures) console.error(`  - ${f}`);
  console.error(
    '\nThese packages would fail to import under Solid 2.0 (ERR_PACKAGE_PATH_NOT_EXPORTED). Check that the JSX transform uses `moduleName: "@solidjs/web"`.\n',
  );
}

if (undeclaredFailures.length > 0) {
  failed = true;
  console.error("Built output imports the Solid runtime without declaring it:\n");
  for (const f of undeclaredFailures) console.error(`  - ${f}`);
  console.error(
    "\nAdd it to `peerDependencies`, otherwise consumers can't resolve it.\n",
  );
}

fs.rmSync(tmpDir, { recursive: true, force: true });
if (failed) process.exit(1);

console.log(
  `Verified ${packed.length} packed packages: no unresolved workspace protocols, no removed Solid subpaths, no undeclared imports in dist.`,
);
