/**
 * Ensures every rendered component/pattern host consumes the base font token.
 *
 * Usage:
 *   bun tools/migrate-typography-hosts.ts          # check only
 *   bun tools/migrate-typography-hosts.ts --write  # apply missing declarations
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const WRITE = process.argv.includes("--write");
const HOST_DECLARATION = "font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);";

const filesUnder = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });

const renderedFiles = [...filesUnder(join(ROOT, "src/components")), ...filesUnder(join(ROOT, "src/patterns"))]
  .filter(file => readFileSync(file, "utf8").includes(":host {"));

const invalid: string[] = [];
for (const file of renderedFiles) {
  const source = readFileSync(file, "utf8");
  const hostStart = source.indexOf(":host {");
  const hostEnd = source.indexOf("}", hostStart);
  if (hostStart < 0 || hostEnd < 0) continue;
  const hostBlock = source.slice(hostStart, hostEnd);
  const inheritIndex = hostBlock.indexOf("font: inherit;");
  const declarationIndex = hostBlock.indexOf(HOST_DECLARATION);
  let updated = source;

  if (inheritIndex >= 0) {
    const inheritEnd = hostStart + inheritIndex + "font: inherit;".length;
    const indentation = hostBlock.match(/\n([ \t]*)font: inherit;/)?.[1] ?? "    ";
    const separator = hostBlock.includes("\n") ? `\n${indentation}` : " ";

    if (declarationIndex >= 0) {
      const declarationStart = hostStart + declarationIndex;
      const prefixStart = hostBlock.includes("\n") ? source.lastIndexOf("\n", declarationStart) : declarationStart - 1;
      updated = `${source.slice(0, prefixStart)}${separator}${HOST_DECLARATION}${source.slice(declarationStart + HOST_DECLARATION.length)}`;
    } else {
      updated = `${source.slice(0, inheritEnd)}${separator}${HOST_DECLARATION}${source.slice(inheritEnd)}`;
    }
  } else if (declarationIndex < 0) {
    const insertAt = hostStart + ":host {".length;
    updated = `${source.slice(0, insertAt)}\n    ${HOST_DECLARATION}${source.slice(insertAt)}`;
  }

  if (updated === source) continue;
  invalid.push(file);
  if (WRITE) await Bun.write(file, updated);
}

if (invalid.length && !WRITE) {
  console.error(`${invalid.length} rendered files have a missing or misformatted base font declaration`);
  for (const file of invalid) console.error(`- ${file.slice(ROOT.length + 1)}`);
  process.exit(1);
}

console.log(`${WRITE ? "updated" : "verified"} ${renderedFiles.length} rendered typography hosts${WRITE ? ` (${invalid.length} changed)` : ""}`);
