import * as fsp from "node:fs/promises"
import * as cp from "node:child_process"
import * as path from "node:path"
import * as esb from "esbuild"
import * as esb_solid from "esbuild-plugin-solid"
import * as utils from "./utils/index.js"

const ROOT_DIST_DIR = path.join(utils.ROOT_DIR, "dist")

// Emit d.ts and .js(x) files
const tsc = cp.spawn("tsc", ["-b", "packages/*"], {
  stdio: "inherit",
  cwd: utils.ROOT_DIR,
  shell: true,
})

tsc.on("close", code => {
  if (code === 0) {
    utils.log_info(`tsc step completed in ${performance.now().toFixed()}ms.`)
  } else {
    utils.log_error("tsc step failed.")
    process.exit(1)
  }
})

try {
  // Emit .js files for packages with jsx
  await esb.build({
    plugins:     [esb_solid.solidPlugin()],
    entryPoints: [
      path.join(utils.PACKAGES_DIR, "controlled-props", "src", "index.tsx"),
      path.join(utils.PACKAGES_DIR, "virtual", "src", "index.tsx"),
    ],
    outdir:      ROOT_DIST_DIR,
    format:      "esm",
    platform:    "browser",
    target:      ["esnext"]
  })

  // Copy esbuild output to /packages/*/dist/
  await fsp.readdir(ROOT_DIST_DIR).then(names => Promise.all(names.map(name => {
      const module_dist_dir = path.join(ROOT_DIST_DIR, name, "src")
      const target_dist_dir = path.join(utils.PACKAGES_DIR, name, "dist")
      return utils.copyDirectory(module_dist_dir, target_dist_dir)
  })))
  
  await fsp.rm(ROOT_DIST_DIR, {recursive: true, force: true})

  utils.log_info(`esbuild step completed in ${performance.now().toFixed()}ms.`)
} catch (err) {
  utils.log_error("esbuild step failed.")
  throw err
}
