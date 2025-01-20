import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { fileURLToPath } from "url";
import {
  ModuleData,
  PrimitiveData,
  formatBytes,
  getModulesData,
  getPackageBundlesize,
  isNonNullable,
} from "../../scripts/utils/index.js";
import { GITHUB_REPO } from "../src/constants.js";
import { PackageData, PackageListItem } from "../src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = path.join(__dirname, "..", "..");
const packagesPath = path.join(rootPath, "packages");
const generatedDirPath = path.join(__dirname, "..", "src", "_generated");

if (!fs.existsSync(generatedDirPath)) {
  fs.mkdirSync(generatedDirPath);
}

const PACKAGE_COLLAPSED_LIST_OF_PRIMITIVES: ReadonlySet<string> = new Set([
  "signal-builders",
  "platform",
]);

const markdownProcessor = unified()
  .use(remarkEmoji)
  .use(remarkParse)
  .use(remarkRehype)
  // support GitHub Flavored Markdown
  .use(remarkGfm)
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      // https://github.com/rehypejs/rehype-highlight#example-sanitation
      code: [
        ...(defaultSchema.attributes?.code || []),
        [
          "className",
          // List of all allowed languages:
          ...["js", "jsx", "ts", "tsx", "css", "md", "html", "json", "diff", "bash"].map(
            lang => `language-${lang}`,
          ),
        ],
      ],
    },
  })
  // highlight code blocks
  .use(rehypeHighlight)
  // add id to headings
  .use(rehypeSlug)
  // add # to headings
  .use(rehypeAutolinkHeadings, {
    properties: { class: "header-anchor" },
    content: { type: "text", value: "#" },
  })
  .use(rehypeStringify);

/**
 * Parse README.md of each package and generate HTML
 */
async function generateReadme(module: ModuleData, primitiveData: PrimitiveData) {
  const primitiveCodeElRegex = new RegExp(
    `<(code)>((?:&#x3C;|<)?(?:${primitiveData.list.join("|")})>?)<\/(code)>`,
    "g",
  );
  const readmePath = path.join(packagesPath, module.name, "README.md");
  let readme = await fsp.readFile(readmePath, "utf8");

  readme = readme
    // remove heading-1
    .replace(/#\s+.+\n*/, "")
    // remove solid img banner
    .replace(
      /<p>(?=[^]*?<img(?=[^>]+?src="https:\/\/assets\.solidjs\.com\/banner[^"]+")[^>]*?>)[^]*?<\/p>/,
      "",
    )
    // remove size, version, stage ect... img banners
    .replace(/^\[!\[(?:size|version|stage|lerna)\].+$/gm, "")
    // replace changelog relative url to github repo changelog
    .replace(/(\[CHANGELOG\.md\])(\(\.\/CHANGELOG\.md\))/i, (_, p1, p2) => {
      if (!p2) return _;
      return `${p1}(${GITHUB_REPO}/blob/main/packages/${module.name}/CHANGELOG.md)`;
    })
    // remove Installation section
    .replace(/##\s+installation[\r\n]+```[^`]+```/gi, "")
    // replace Demo links with Live Site, Codesandbox/Stackblitz, Dev Source Code
    .replace(/(?<!#)(##\s+demo\n)((.|\n)+?)(?=(\n##\s))/i, (_, p1, p2) => {
      if (p2) {
        p2 = p2.replace(/https?:\/\/[^\s]+/, (match: string) => {
          const url = new URL(match);
          const origin = url.origin;
          if (origin.match(/codesandbox/i)) {
            return `[CodeSandbox](${match})`;
          }
          if (origin.match(/stackblitz/i)) {
            return `[StackBlitz](${match})`;
          }
          return origin;
        });
        p2 = `[Live Site](https://primitives.solidjs.community/playground/${module.name}/)\n\n${p2}`;
        return `${p1}${p2}`;
      }
      return _;
    });

  return (
    String(await markdownProcessor.process(readme))
      // update code tag that contains primitives to have attribute
      .replace(primitiveCodeElRegex, (_, p1, p2, p3) => {
        if (!p2) return _;
        return `<${p1} data-code-primitive-name="${p2.replace(/\<|\>|&#x3C;/g, "")}">${p2}</${p3}>`;
      })
  );
}

async function generatePrimitiveSizes(module: ModuleData, primitiveData: PrimitiveData) {
  if (PACKAGE_COLLAPSED_LIST_OF_PRIMITIVES.has(module.name)) {
    return [];
  }

  const sizes = primitiveData.list.map(async primitive => {
    const result = await getPackageBundlesize(module.name, {
      exportName: primitive,
      peerDependencies: module.peer_deps,
    });
    if (!result) return null;
    return {
      name: primitive,
      min: formatBytes(result.min),
      gzip: formatBytes(result.gzip),
    };
  });

  return (await Promise.all(sizes)).filter(isNonNullable);
}

async function generatePackageSize(module: ModuleData) {
  const result = await getPackageBundlesize(module.name, {
    peerDependencies: module.peer_deps,
  });
  if (!result) return null;
  return {
    min: formatBytes(result.min),
    gzip: formatBytes(result.gzip),
  };
}

/**
 * Generate data for all packages
 */
(async () => {
  const packagesDirDist = path.join(generatedDirPath, "packages");
  const packagesDist = path.join(generatedDirPath, "packages.json");

  if (!fs.existsSync(packagesDirDist)) {
    await fsp.mkdir(packagesDirDist);
  }

  const packages = [] as PackageListItem[]
  
  for (let module of await getModulesData()) {
    if (module.primitive == null) continue
  
    const [readme, primitives, packageSize] = await Promise.all([
      generateReadme(module, module.primitive),
      generatePrimitiveSizes(module, module.primitive),
      generatePackageSize(module),
    ] as const);
  
    const itemData: PackageListItem = { ...module, primitives, packageSize };
  
    const data: PackageData = { ...itemData, readme };
  
    // write data to individual json file
    const outputFilename = path.join(packagesDirDist, `${module.name}.json`);
    await fsp.writeFile(outputFilename, JSON.stringify(data, null, 2));
  
    packages.push(itemData)
  }

  // gather all module names into one json file
  await fsp.writeFile(packagesDist, JSON.stringify(packages, null, 2));

  // eslint-disable-next-line no-console
  console.log(`\nGenerated data for ${packages.length} packages.\n`);
})();

/**
 * Parse root README.md and CONTRIBUTING.md to generate HTML content for the home page (home-content.html)
 */
(async () => {
  const readmeMD = await fsp.readFile(path.join(rootPath, "README.md"), "utf8");
  const contributingMD = await fsp.readFile(path.join(rootPath, "CONTRIBUTING.md"), "utf8");
  const distPath = path.join(generatedDirPath, "home-content.html");

  const headings: [string, string[]][] = [
    [readmeMD, ["Philosophy"]],
    [
      contributingMD,
      ["Design Maxims", "Basic and Compound Primitives", "Managing Primitive Complexity"],
    ],
  ];

  const sections = headings.reduce((acc, [file, headings]) => {
    for (const heading of headings) {
      const regex = new RegExp(
        `(?<!#)(##\\s+${heading}[\\r\\n])((.|[\\r\\n])+?)(?=([\\r\\n]##\\s))`,
      );
      const match = file.match(regex);
      if (match) acc += `${match[0]}\n`;
    }
    return acc;
  }, "");

  const html = String(await markdownProcessor.process(sections));

  await fsp.writeFile(distPath, html);
})();
