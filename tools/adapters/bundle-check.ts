/** Production bundle regression checks against built package entrypoints. */
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { build as viteBuild } from "vite";
import { rollup, type RollupOutput } from "rollup";

const root = resolve(import.meta.dir, "../..");
async function bundle(contents: string, splitting = false) {
  const result = await Bun.build({
    entrypoints: ["virtual:bundle-check"], target: "browser", minify: true, splitting,
    external: ["react", "react-dom"],
    plugins: [{ name: "fixture", setup(build) {
      build.onResolve({ filter: /^virtual:/ }, () => ({ path: "fixture", namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents, loader: "ts", resolveDir: root }));
    } }],
  });
  if (!result.success) throw new Error(result.logs.join("\n"));
  const entry = result.outputs.find(output => output.kind === "entry-point") ?? result.outputs[0];
  const code = await entry.text();
  return {
    code, bytes: code.length, gzip: gzipSync(code).length,
    chunks: await Promise.all(result.outputs.filter(output => output !== entry).map(async output => ({
      path: output.path,
      bytes: (await output.text()).length,
    }))),
  };
}
const glyph = await bundle(`export { iconCloud } from "${root}/dist/foundations/icons/glyphs/index.js";`);
const icons = await bundle(`export { boxIconography } from "${root}/dist/foundations/icons/index.js";`);
const direct = await bundle(`export { Button } from "${root}/packages/react/dist/button.js";`);
const barrel = await bundle(`export { Button } from "${root}/packages/react/dist/index.js";`);
const coreButton = await bundle(`export { Button } from "${root}/dist/entries/button.js";`);
const coreRoot = await bundle(`import "${root}/dist/index.js";`);
if (coreRoot.code.includes("box-code-editor") || coreButton.code.includes("CodeMirror")) throw new Error("Optional code editor leaked into ordinary component imports");
const themedButton = await bundle(`
  import { Button } from "${root}/dist/entries/button.js";
  import { createThemeController } from "${root}/dist/foundations/theming/controller.js";
  createThemeController().start();
  export { Button };
`, true);
const themedGlyphs = await bundle(`
  import { Button } from "${root}/dist/entries/button.js";
  import { createThemeController } from "${root}/dist/foundations/theming/controller.js";
  export { iconCloud, iconFolder, iconPlus } from "${root}/dist/foundations/icons/glyphs/index.js";
  createThemeController().start();
  export { Button };
`, true);
if (themedGlyphs.bytes > 100_000 || themedGlyphs.code.includes("boxGeneratedIcons")) throw new Error("Named glyphs pulled the lazy registry into the entry chunk");
if (glyph.bytes >= icons.bytes / 10) throw new Error("A glyph retained the icon registry");
if (barrel.code.includes("box-toast") || barrel.code.includes("box-drawer") || barrel.code.includes("box-select")) throw new Error("React root retained unused wrappers");
if (!barrel.code.includes("box-button") || !barrel.code.includes(".define(")) throw new Error("Used element registration was removed");
if (!coreButton.code.includes("box-button") || !coreButton.code.includes(".define(")) throw new Error("Core component registration was removed");
for (const tag of ["box-button", "box-card", "box-content-uploader", "box-flow-builder"]) {
  if (!coreRoot.code.includes(tag)) throw new Error(`Core root dropped ${tag} registration`);
}
if (barrel.bytes > direct.bytes * 1.05) throw new Error("Root import costs more than the direct wrapper");
if (themedButton.bytes > 80_000 || themedButton.code.includes("boxGeneratedIcons")) throw new Error("A component with the theme controller retained the full icon registry in its entry chunk");
if (!themedButton.chunks.some(chunk => chunk.bytes > 600_000)) throw new Error("The lazy icon registry chunk was not emitted");
console.table(Object.fromEntries(Object.entries({ glyph, icons, direct, barrel, coreButton, coreRoot, themedButton, themedGlyphs }).map(([key, value]) => [key, { bytes: value.bytes, gzip: value.gzip }])));

const vite = await viteBuild({
  configFile: false, logLevel: "error",
  plugins: [{ name: "glyph-fixture", resolveId(id) { if (id === "virtual:glyph-fixture") return "\0glyph-fixture"; },
    load(id) { if (id === "\0glyph-fixture") return `
      import { createThemeController } from "${root}/dist/foundations/theming/controller.js";
      import { iconCloud } from "${root}/dist/foundations/icons/glyphs/index.js";
      createThemeController().start(); globalThis.fixtureGlyph = iconCloud;
    `; } }],
  build: { write: false, minify: false, rollupOptions: { input: "virtual:glyph-fixture" } },
}) as RollupOutput;
const viteEntry = vite.output.find(chunk => chunk.type === "chunk" && chunk.isEntry);
if (!viteEntry || viteEntry.type !== "chunk") throw new Error("Vite did not emit an entry");
const entrySVGs = (viteEntry.code.match(/<svg /g) ?? []).length;
// The theme also keeps two small bespoke status glyphs available immediately.
if (entrySVGs !== 3 || viteEntry.code.length > 100_000) throw new Error(`Vite glyph entry retained unused SVGs: ${entrySVGs}`);
if (!vite.output.some(chunk => chunk.type === "chunk" && !chunk.isEntry && chunk.code.includes("boxGeneratedIcons"))) throw new Error("Vite lost the lazy registry");
console.log(`Vite single-glyph entry: ${viteEntry.code.length} bytes, ${entrySVGs} SVG`);

const fixture = `import { createThemeController } from "${root}/dist/foundations/theming/controller.js";
import { iconCloud } from "${root}/dist/foundations/icons/glyphs/index.js";
createThemeController().start(); globalThis.fixtureGlyph = iconCloud;`;
const rollupBundle = await rollup({ input: "virtual:rollup-fixture", plugins: [{
  name: "local-built-fixture",
  resolveId(id, importer) {
    if (id === "virtual:rollup-fixture") return id;
    if (id.startsWith("/")) return id;
    if (id.startsWith(".") && importer) return resolve(dirname(importer), id);
    return null;
  },
  load(id) { return id === "virtual:rollup-fixture" ? fixture : readFileSync(id, "utf8"); },
}] });
try {
  const output = await rollupBundle.generate({ format: "es" });
  const entry = output.output.find(chunk => chunk.type === "chunk" && chunk.isEntry);
  if (!entry || entry.type !== "chunk" || (entry.code.match(/<svg /g) ?? []).length !== 3 || entry.code.length > 100_000) throw new Error("Rollup retained the unused glyph inventory");
  console.log(`Rollup single-glyph entry: ${entry.code.length} bytes (one named glyph plus two immediate status glyphs)`);
} finally { await rollupBundle.close(); }
