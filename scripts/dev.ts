import child_process from "node:child_process";
import * as utils from "./utils/index.js";

const args = process.argv.slice(2);
const package_name = utils.getPackageNameFromCWD();
if (package_name == null) {
  throw "this script should be ran from one of the pacakges";
}

utils.log_info(
  `Starting dev server for the ${package_name} package...\n
Visit the playground at http://localhost:3000/playground/${package_name} to test your changes.`,
);

// execute dev script
child_process.spawn("pnpm", ["run", "dev", ...args], {
  stdio: "inherit",
  shell: true,
  cwd: utils.ROOT_DIR,
});
