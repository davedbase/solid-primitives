import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { MODULE_PREFIX, PACKAGES_DIR, isNonNullable, log_info } from "./utils.js";

export type PackageJson = {
  name: string;
  version: string;
  description: string;
  primitive?: PrimitiveData;
  keywords?: string[];
  peerDependencies?: {[x: string]: string};
  devDependencies?: {[x: string]: string};
  dependencies?: {[x: string]: string};
}

export type PrimitiveData = {
  list: string[];
  category: string;
  stage: number;
}

export type ModuleData = {
  name: string;
  version: string;
  description: string;
  tags: string[];
  primitive: PrimitiveData | null;
  workspace_deps: string[];
  peer_deps: string[];
};

export async function getModuleData(name: string): Promise<ModuleData | Error> {

  const pkg_path = path.join(PACKAGES_DIR, name, "package.json");

  if (!fs.existsSync(pkg_path)) {
    return new Error(`package "${name}" doesn't have package.json`);
  }

  const pkg = JSON.parse(await fsp.readFile(pkg_path, "utf8")) as PackageJson;

  const dependencies = Object.keys(pkg.dependencies ?? {});
  const peer_deps = Object.keys(pkg.peerDependencies ?? {});
  const workspace_deps: string[] = [];

  for (const dep of dependencies) {
    if (dep.startsWith(MODULE_PREFIX)) {
      const dep_name = dep.slice(MODULE_PREFIX.length);
      workspace_deps.push(dep_name);
    }
  }

  const excludedKeywords = ["primitive", "solid", pkg.name];

  return {
    name,
    version: pkg.version,
    description: pkg.description,
    tags: pkg.keywords?.filter(keyword => !excludedKeywords.includes(keyword)) ?? [],
    primitive: pkg.primitive ?? null,
    workspace_deps,
    peer_deps,
  };
}

export async function getModulesData(): Promise<ModuleData[]> {

  const module_names = await fsp.readdir(PACKAGES_DIR);

  const promises = module_names.map(async name => {
    const module = await getModuleData(name)

    if (module instanceof Error) {
      log_info(module.message);
      return null;
    }

    return module
  });

  return (await Promise.all(promises)).filter(isNonNullable)
}
