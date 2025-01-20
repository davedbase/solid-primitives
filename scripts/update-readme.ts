import { readFileSync, writeFileSync } from "fs";
import path from "path";
// @ts-expect-error ts-missing-module
import tablemark from "json-to-markdown-table";
import * as utils from "./utils/index.js";

type PackageData = {
  Name: string;
  Stage: string | number;
  Size: string;
  NPM: string;
  Primitives: string;
};

// eslint-disable-next-line no-console
console.log("updateReadme", "Updating README documentation");

const githubURL = "https://github.com/solidjs-community/solid-primitives/tree/main/packages/";
const sizeShield = "https://img.shields.io/bundlephobia/minzip/";
const bundlephobiaURL = "https://bundlephobia.com/package/";
const npmShield = "https://img.shields.io/npm/v/";
const npmURL = "https://www.npmjs.com/package/";
const stageShieldBaseURL =
  "https://img.shields.io/endpoint?style=for-the-badge&label=&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-"; // add "<stage>.json" after
const stageShieldLink =
  "https://github.com/solidjs-community/solid-primitives/blob/main/CONTRIBUTING.md#contribution-process";

const categories: Record<string, PackageData[]> = {};
const rootDependencies: string[] = [
  `@solid-primitives/utils`, // utils are not included in the modulesData
];

(async () => {
  const modulesData = await utils.getModulesData();

  for (const module of modulesData) {
    if (module.primitive == null) continue

    const packageName = `@solid-primitives/${name}`;

    if (module.workspace_deps.length === 0) {
      rootDependencies.push(packageName);
    }

    const data = {} as PackageData;

    data.Name = `[${name}](${githubURL}${name}#readme)`;
    // Detect the stage and build size/version only if needed
    if (data.Stage == "X" || data.Stage == 0) {
      data.Size = "";
      data.NPM = "";
    } else {
      data.Size = `[![SIZE](${sizeShield}${packageName}?style=for-the-badge&label=)](${bundlephobiaURL}${packageName})`;
      data.NPM = `[![VERSION](${npmShield}${packageName}?style=for-the-badge&label=)](${npmURL}${packageName})`;
    }
    data.Stage = `[![STAGE](${stageShieldBaseURL}${module.primitive.stage}.json)](${stageShieldLink})`;
    data.Primitives = module.primitive.list
      .map(prim => `[${prim}](${githubURL}${name}#${prim.replace(/ /g, "-").toLowerCase()})`)
      .join("<br />");
    // Merge the package into the correct category
    const cat = categories[module.primitive.category];
    categories[module.primitive.category] = cat ? [...cat, data] : [data];
  }

  const pathToREADME = path.join(utils.ROOT_DIR, "README.md");
  let readme = readFileSync(pathToREADME).toString();

  // Update Primitives Table

  const table = Object.entries(categories).reduce((md, [category, items]) => {
    // Some MD jousting to get the table to render nicely
    // with consistent columns
    md += `|<h4>*${category}*</h4>|\n`;
    md += tablemark(items, ["Name", "Stage", "Primitives", "Size", "NPM"])
      .replace("|Name|Stage|Primitives|Size|NPM|\n", "")
      .replace("|----|----|----|----|----|\n", "");
    return md;
  }, "|Name|Stage|Primitives|Size|NPM|\n|----|----|----|----|----|\n");

  readme = utils.insertTextBetweenComments(readme, table, "INSERT-PRIMITIVES-TABLE");

  // Update Combined Downloads Badge

  const combinedDownloadsBadge = `[![combined-downloads](https://img.shields.io/endpoint?style=for-the-badge&url=https://combined-npm-downloads.deno.dev/${rootDependencies.join(
    ",",
  )})](https://dash.deno.com/playground/combined-npm-downloads)`;

  readme = utils.insertTextBetweenComments(
    readme,
    combinedDownloadsBadge,
    "INSERT-NPM-DOWNLOADS-BADGE",
  );

  writeFileSync(pathToREADME, readme);
})();
