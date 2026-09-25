/** Production bundle regression checks against built package entrypoints. */
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

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
const themedButton = await bundle(`
  import { Button } from "${root}/dist/entries/button.js";
  import { createThemeController } from "${root}/dist/foundations/theming/controller.js";
  createThemeController().start();
  export { Button };
`, true);
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
console.table(Object.fromEntries(Object.entries({ glyph, icons, direct, barrel, coreButton, coreRoot, themedButton }).map(([key, value]) => [key, { bytes: value.bytes, gzip: value.gzip }])));
