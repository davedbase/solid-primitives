import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { PACKAGES_DIR, pathExists } from "./utils.js";

const STAR_EXPORT_RE = /^export \* from ["'](\.\/[^"']+)["'];?\s*$/gm;
const DECLARATION_EXPORT_RE =
  /^export\s+(?:async\s+)?(?:function\s*\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
const BRACE_EXPORT_RE = /^export\s*\{([^}]*)\}\s*(?:from\s*["'][^"']+["'])?\s*;?\s*$/gm;

function getBraceExportedNames(source: string): string[] {
  const names: string[] = [];

  for (const match of source.matchAll(BRACE_EXPORT_RE)) {
    const inner = match[1]!.trim();
    if (!inner) continue;

    for (const part of inner.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const as_match = trimmed.match(/^.+?\s+as\s+(.+)$/);
      const exported_name = as_match ? as_match[1]!.trim() : trimmed;
      if (exported_name !== "default") names.push(exported_name);
    }
  }

  return names;
}

function getExportedNames(source: string): string[] {
  return [
    ...Array.from(source.matchAll(DECLARATION_EXPORT_RE), match => match[1]!),
    ...getBraceExportedNames(source),
  ];
}

/**
 * Rolldown (Vite 8+) doesn't resolve named imports through `export * from "./x.js"`
 * re-exports the way Rollup does. Since a barrel's `export *` in `src/` is
 * convenient to author but unreliable for bundlers to link against, this appends
 * explicit `export { ... } from "./x.js"` lines to each package's built
 * `dist/index.js`, derived from the actual runtime exports tsc already emitted
 * for each re-exported submodule — so the list can't drift out of sync.
 */
export async function flattenBarrelExports(packages_dir: string = PACKAGES_DIR): Promise<void> {
  const pkg_names = await fsp.readdir(packages_dir);

  await Promise.all(
    pkg_names.map(async pkg_name => {
      const index_path = path.join(packages_dir, pkg_name, "dist", "index.js");
      if (!(await pathExists(index_path))) return;

      const index_src = await fsp.readFile(index_path, "utf8");
      const star_exports = Array.from(index_src.matchAll(STAR_EXPORT_RE));
      if (star_exports.length === 0) return;

      const already_exported = new Set(getExportedNames(index_src));
      let additions = "";

      for (const match of star_exports) {
        const specifier = match[1]!;
        const target_path = path.join(path.dirname(index_path), specifier);
        if (!(await pathExists(target_path))) continue;

        const target_src = await fsp.readFile(target_path, "utf8");
        const new_names = getExportedNames(target_src).filter(name => !already_exported.has(name));
        if (new_names.length === 0) continue;

        for (const name of new_names) already_exported.add(name);
        additions += `export { ${new_names.join(", ")} } from "${specifier}";\n`;
      }

      if (additions) {
        await fsp.writeFile(index_path, `${index_src.trimEnd()}\n${additions}`);
      }
    }),
  );
}
