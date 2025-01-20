import * as path from "node:path";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const CWD = process.cwd();

export const ROOT_DIR = path.join(__dirname, "..", "..");
export const PACKAGES_DIR = path.join(ROOT_DIR, "packages");

export const MODULE_PREFIX = "@solid-primitives/";

export function getPackageNameFromCWD(): string | null {
  if (CWD.startsWith(PACKAGES_DIR)) {
    const name = CWD.slice(PACKAGES_DIR.length + path.sep.length).split(path.sep)[0];
    if (name !== undefined && name.length > 0) {
      return name;
    }
  }
  return null;
}

// eslint-disable-next-line no-console
export const log_info = (string: string) => console.log(`\x1b[34m${string}\x1b[0m`);
// eslint-disable-next-line no-console
export const log_error = (string: string) => console.log(`\x1b[31m${string}\x1b[0m`);

export const checkValidPackageName = (name: string) =>
  /[a-z0-9\-]+/.test(name) && name.match(/[a-z0-9\-]+/)![0].length === name.length;

export const regexGlobalCaptureGroup = (input: string, regex: RegExp) => {
  const output = [];
  let matches;

  const getMatch = (match: any[]) => {
    for (let i = 1; i < match.length; i++) {
      const value = match[i];
      if (value) return value;
    }
  };

  while ((matches = regex.exec(input))) {
    const captured = getMatch(matches);
    if (captured) {
      output.push(captured);
    }
  }
  if (!output.length) return null;
  return output;
};

const getCommentText = (text: string, marker: "START" | "END") => `<!-- ${text}:${marker} -->`;

export function insertTextBetweenComments(file: string, text: string, comment: string): string {
  const startComment = getCommentText(comment, "START");
  const endComment = getCommentText(comment, "END");
  const lines = file.split("\n");
  const start = lines.findIndex(line => line.includes(startComment));
  const end = lines.findIndex(line => line.includes(endComment), start + 1);
  if (start === -1 || end === -1) throw `Could not find ${comment} in ${file}`;
  lines.splice(start + 1, end - start - 1, ...text.split("\n"));
  return lines.join("\n");
}

export const isNonNullable = <T>(i: T): i is NonNullable<T> => i != null;

export async function copyDirectory(src: string, dst: string): Promise<void> {
  await fsp.mkdir(dst, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const src_path = path.join(src, entry.name);
    const dst_path = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(src_path, dst_path);
    } else {
      await fsp.copyFile(src_path, dst_path);
    }
  }
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fsp.access(target);
    return true;
  } catch (_) {
    return false;
  }
}

export function getDirLastModifiedTimeSync(dir: string): number {
  let latest_time = 0
  
  try {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full_path = path.join(dir, entry.name)
      const time = entry.isDirectory() ? getDirLastModifiedTimeSync(full_path) : fs.statSync(full_path).mtimeMs
      if (time > latest_time) {
        latest_time = time
      }
    }
  } catch {}

  return latest_time;
}
