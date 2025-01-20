/*

npm run update-tsconfigs

(also runs after each pnpm install)

Updates ./packages/<all_packages>/tsconfig.json files
based on dependencies in package.json

*/

import * as fsp from "node:fs/promises"
import * as path from "node:path"
import * as utils from "./utils/index.js";

const modulesData = await utils.getModulesData();

type TsconfigJson = {
  extends?: string
  compilerOptions?: {
    composite?: boolean
    outDir?: string
    rootDir?: string
  }
  references?: {path: string}[]
  include?: string[]
}

for (const data of modulesData) {
  const tsconfig_path = path.join(utils.PACKAGES_DIR, data.name, 'tsconfig.json')
  const tsconfig: TsconfigJson = {
    extends: "../../tsconfig.json",
    compilerOptions: {
      composite: true,
      outDir: "dist",
      rootDir: "src",
    },
    references: data.workspace_deps.map(dep => ({path: `../${dep}`})),
    include: ["src"]
  }
  await fsp.writeFile(tsconfig_path, JSON.stringify(tsconfig, null, 2))
}
