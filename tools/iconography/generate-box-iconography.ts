/**
 * Generate `src/foundations/icons/box-iconography.generated.ts` from the Box
 * icon source pack (not vendored in this repo).
 *
 * Usage:
 *   BOX_ICONOGRAPHY_SOURCE=/path/to/pack bun run icons:generate
 *   bun tools/iconography/generate-box-iconography.ts --source /path/to/pack
 *
 * Source layout (either works):
 *   - pack/2023-Icon-collection-blue-svg/*.svg + pack/2023-Icon-collection-white-svg/*.svg
 *   - any directory tree containing `Icon_*_{blue|white}*.svg` files
 *
 * Pure helpers are exported for fixture tests under test/tools/.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOL_DIR, "../..");
const DEFAULT_OUT = join(ROOT, "src/foundations/icons/box-iconography.generated.ts");

export type IconTone = "blue" | "white";

export interface SourceIconFile {
  absolutePath: string;
  filename: string;
  tone: IconTone;
}

export interface ParsedIconFilename {
  base: string;
  tone: IconTone;
}

export interface GeneratedIcon {
  key: string;
  tone: IconTone;
  filename: string;
  viewBox: string;
  body: string;
}

const FILENAME_RE = /^Icon_(.+?)_(blue|white)(?:-(\d+))?\.svg$/i;

/** Parse an `Icon_*_{blue|white}*.svg` filename into a slug base + tone. */
export const parseIconFilename = (filename: string): ParsedIconFilename => {
  const match = filename.match(FILENAME_RE);
  if (!match) {
    throw new Error(`Unrecognized icon filename: ${filename}`);
  }

  let base = match[1].replace(/[_\s]+/g, "-").toLowerCase();
  base = base.replace(/[^a-z0-9+-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return { base, tone: match[2].toLowerCase() as IconTone };
};

/** Allocate unique keys; on collision append `-2`, `-3`, … */
export const allocateIconKeys = (
  files: Array<{ filename: string; tone: IconTone }>,
): Array<{ key: string; filename: string; tone: IconTone; base: string }> => {
  const blues = files
    .filter(file => file.tone === "blue")
    .sort((left, right) => left.filename.localeCompare(right.filename));
  const whites = files
    .filter(file => file.tone === "white")
    .sort((left, right) => left.filename.localeCompare(right.filename));

  const used = new Set<string>();
  const allocate = (base: string): string => {
    if (!used.has(base)) {
      used.add(base);
      return base;
    }
    let n = 2;
    while (used.has(`${base}-${n}`)) {
      n += 1;
    }
    const key = `${base}-${n}`;
    used.add(key);
    return key;
  };

  return [...blues, ...whites].map(file => {
    const { base } = parseIconFilename(file.filename);
    return { key: allocate(base), filename: file.filename, tone: file.tone, base };
  });
};

/** Normalize paint attributes to `currentColor` (preserve none / currentColor / opacity). */
export const normalizeIconColors = (svg: string): string =>
  svg.replace(
    /\b(fill|stroke)\s*=\s*(["'])(?!none\b|currentColor\b)(.*?)\2/gi,
    (_match, attr: string, quote: string) => `${attr}=${quote}currentColor${quote}`,
  );

/** Prefix `id` / `url(#id)` / `href="#id"` references so icons can share a document. */
export const prefixIconIds = (body: string, key: string): string => {
  const ids = [...body.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
  const unique = [...new Set(ids)].sort((left, right) => right.length - left.length);
  let next = body;
  for (const id of unique) {
    const prefixed = `${key}__${id}`;
    next = next.replaceAll(`id="${id}"`, `id="${prefixed}"`);
    next = next.replaceAll(`id='${id}'`, `id='${prefixed}'`);
    next = next.replaceAll(`url(#${id})`, `url(#${prefixed})`);
    next = next.replaceAll(`href="#${id}"`, `href="#${prefixed}"`);
    next = next.replaceAll(`href='#${id}'`, `href='#${prefixed}'`);
    next = next.replaceAll(`xlink:href="#${id}"`, `xlink:href="#${prefixed}"`);
    next = next.replaceAll(`xlink:href='#${id}'`, `xlink:href='#${prefixed}'`);
  }
  return next;
};

export const extractSvgParts = (svg: string): { viewBox: string; body: string } => {
  const viewBox = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1] ?? "0 0 150 150";
  const body = svg
    .replace(/^[\s\S]*?<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();
  return { viewBox, body };
};

/** Adapt one source SVG into a normalized icon body + viewBox. */
export const adaptIconSvg = (rawSvg: string, key: string): { viewBox: string; body: string } => {
  const normalized = normalizeIconColors(rawSvg);
  const { viewBox, body } = extractSvgParts(normalized);
  return { viewBox, body: prefixIconIds(body, key) };
};

const walkSvgFiles = (dir: string, out: string[]): void => {
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      walkSvgFiles(absolute, out);
      continue;
    }
    if (FILENAME_RE.test(entry)) {
      out.push(absolute);
    }
  }
};

/** Discover `Icon_*_{blue|white}*.svg` files under a source pack root. */
export const discoverSourceIcons = (sourceRoot: string): SourceIconFile[] => {
  const absoluteRoot = resolve(sourceRoot);
  const paths: string[] = [];
  walkSvgFiles(absoluteRoot, paths);

  return paths.map(absolutePath => {
    const filename = absolutePath.split(/[/\\]/).at(-1) ?? absolutePath;
    const { tone } = parseIconFilename(filename);
    return { absolutePath, filename, tone };
  });
};

export const generateIconsFromSource = (sourceRoot: string): GeneratedIcon[] => {
  const discovered = discoverSourceIcons(sourceRoot);
  if (!discovered.length) {
    throw new Error(
      `No Icon_*_{blue|white}*.svg files found under ${resolve(sourceRoot)}. ` +
        "Pass --source or set BOX_ICONOGRAPHY_SOURCE to the icon pack root.",
    );
  }

  const allocated = allocateIconKeys(discovered);
  const byFilename = new Map(discovered.map(file => [file.filename, file]));

  return allocated.map(entry => {
    const source = byFilename.get(entry.filename);
    if (!source) {
      throw new Error(`Missing source for ${entry.filename}`);
    }
    const raw = readFileSync(source.absolutePath, "utf8");
    const adapted = adaptIconSvg(raw, entry.key);
    return {
      key: entry.key,
      tone: entry.tone,
      filename: entry.filename,
      viewBox: adapted.viewBox,
      body: adapted.body,
    };
  });
};

const escapeTemplateLiteral = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");

/** Render the TypeScript manifest matching the vendored export surface. */
export const renderGeneratedManifest = (icons: GeneratedIcon[]): string => {
  const iconEntries = icons
    .map(icon => {
      const body = escapeTemplateLiteral(icon.body);
      return `  ${JSON.stringify(icon.key)}: iconSvg(${JSON.stringify(icon.viewBox)}, \`${body}\`),`;
    })
    .join("\n");

  const metadataEntries = icons
    .map(
      icon =>
        `  ${JSON.stringify(icon.key)}: { tone: ${JSON.stringify(icon.tone)}, filename: ${JSON.stringify(icon.filename)} },`,
    )
    .join("\n");

  const blue = icons.filter(icon => icon.tone === "blue").length;
  const white = icons.filter(icon => icon.tone === "white").length;

  return `/* eslint-disable */
/* auto-generated by tools/iconography/generate-box-iconography.ts */

const iconSvg = (viewBox: string, body: string): string =>
  \`<svg viewBox="\${viewBox}" width="1em" height="1em" role="img" aria-hidden="true" focusable="false">\${body}</svg>\`;

export const boxGeneratedIcons = {
${iconEntries}
} as const;

export const boxGeneratedIconMetadata = {
${metadataEntries}
} as const;

export const boxGeneratedIconKeys = Object.keys(boxGeneratedIcons);

export const boxGeneratedIconCounts = {
  total: ${icons.length},
  blue: ${blue},
  white: ${white},
} as const;
`;
};

const printHelp = (): void => {
  console.log(`Generate box-iconography.generated.ts from a Box icon source pack.

Usage:
  BOX_ICONOGRAPHY_SOURCE=/path/to/pack bun run icons:generate
  bun tools/iconography/generate-box-iconography.ts --source /path/to/pack [--out path]

Options:
  --source <dir>   Icon pack root (or set BOX_ICONOGRAPHY_SOURCE)
  --out <file>     Output path (default: src/foundations/icons/box-iconography.generated.ts)
  --dry-run        Print counts and sample keys; do not write
  --help           Show this help
`);
};

const parseArgs = (argv: string[]): { source?: string; out: string; dryRun: boolean; help: boolean } => {
  let source = process.env.BOX_ICONOGRAPHY_SOURCE;
  let out = DEFAULT_OUT;
  let dryRun = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--source") {
      source = argv[++index];
      continue;
    }
    if (arg === "--out") {
      out = resolve(argv[++index] ?? "");
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { source, out, dryRun, help };
};

export const main = (argv = process.argv.slice(2)): number => {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return 0;
  }

  if (!args.source) {
    printHelp();
    console.error("\nerror: --source or BOX_ICONOGRAPHY_SOURCE is required");
    return 1;
  }

  const icons = generateIconsFromSource(args.source);
  const manifest = renderGeneratedManifest(icons);

  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          source: resolve(args.source),
          total: icons.length,
          blue: icons.filter(icon => icon.tone === "blue").length,
          white: icons.filter(icon => icon.tone === "white").length,
          sampleKeys: icons.slice(0, 8).map(icon => icon.key),
          out: args.out,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  mkdirSync(join(args.out, ".."), { recursive: true });
  writeFileSync(args.out, manifest, "utf8");
  console.log(
    `Wrote ${icons.length} icons → ${relative(ROOT, args.out)} ` +
      `(blue=${icons.filter(icon => icon.tone === "blue").length}, ` +
      `white=${icons.filter(icon => icon.tone === "white").length})`,
  );
  return 0;
};

if (import.meta.main) {
  process.exit(main());
}
