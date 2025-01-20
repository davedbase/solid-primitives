import * as utils from "./utils/index.js";

if (process.argv.length < 3)
  throw new Error(
    "measure script requires a package name argument. e.g. `pnpm measure event-listener`",
  );

const name = process.argv[2];

if (!name || !utils.checkValidPackageName(name))
  throw new Error(`Incorrect package name argument: "${name}"`);

class ConsoleTable {
  rows: string[][] = [];

  addRow(row: string[]) {
    this.rows.push(row);
  }

  addSeparator() {
    this.rows.push([]);
  }

  log() {
    const columnWidths = this.rows.reduce((columnWidths, row) => {
      row.forEach((cell, i) => {
        const cellWidth = cell.length;
        columnWidths[i] = Math.max(columnWidths[i] || 0, cellWidth);
      });
      return columnWidths;
    }, [] as number[]);

    const separator = columnWidths.map(columnWidth => "—".repeat(columnWidth)).join(" + ");

    for (const row of this.rows) {
      utils.log_info(
        row.length === 0
          ? separator
          : columnWidths
              .map((columnWidth, i) => {
                if (!row[i]) return " ".repeat(columnWidth);
                const cellWidth = row[i].length;
                const padding = " ".repeat(columnWidth - cellWidth);
                return row[i] + padding;
              })
              .join(" | "),
      );
    }

    this.rows = [];
  }
}

const module = await utils.getModuleData(name)
if (module instanceof Error) throw module;
if (module.primitive == null) throw Error(`Package ${name} doesn't have primitive data in package.json`);

const primitives = module.primitive.list
const peerDependencies = module.peer_deps;

utils.log_info(`Measuring "@solid-primitives/${name}"...\n`);

const primitivesSizesPromises = primitives.map(primitive =>
  utils.getPackageBundlesize(name, { exportName: primitive, peerDependencies }),
);
const packageSizePromise = utils.getPackageBundlesize(name, { peerDependencies });

const [primitivesSizes, packageSize] = await Promise.all([
  Promise.all(primitivesSizesPromises),
  packageSizePromise,
] as const);

const table = new ConsoleTable();

table.addRow(["Primitive", "Min", "Gzip"]);
table.addSeparator();

primitivesSizes.forEach((size, i) => {
  table.addRow([
    primitives[i]!,
    size ? utils.formatBytes(size.min).join(" ") : "N/A",
    size ? utils.formatBytes(size.gzip).join(" ") : "N/A",
  ]);
});
table.addSeparator();

table.addRow([
  "Total",
  packageSize ? utils.formatBytes(packageSize.min).join(" ") : "N/A",
  packageSize ? utils.formatBytes(packageSize.gzip).join(" ") : "N/A",
]);

table.log();

utils.log_info(`
${primitivesSizes.every(size => size) ? "✅" : "❌"} All primitives measured successfully.
${packageSize ? "✅" : "❌"} Measured the package successfully.
`);
