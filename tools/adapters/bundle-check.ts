/** Production bundle regression checks against built package entrypoints. */
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(import.meta.dir, "../..");
async function bundle(contents: string) {
  const result = await Bun.build({
    entrypoints: ["virtual:bundle-check"], target: "browser", minify: true,
    external: ["react", "react-dom"],
    plugins: [{ name: "fixture", setup(build) {
      build.onResolve({ filter: /^virtual:/ }, () => ({ path: "fixture", namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents, loader: "ts", resolveDir: root }));
    } }],
  });
  if (!result.success) throw new Error(result.logs.join("\n"));
  const code = await result.outputs[0].text();
  return { code, bytes: code.length, gzip: gzipSync(code).length };
}
const glyph = await bundle(`export { iconCloud } from "${root}/dist/foundations/icons/glyphs/index.js";`);
const icons = await bundle(`export { boxIconography } from "${root}/dist/foundations/icons/index.js";`);
const direct = await bundle(`export { Button } from "${root}/packages/react/dist/button.js";`);
const barrel = await bundle(`export { Button } from "${root}/packages/react/dist/index.js";`);
const coreButton = await bundle(`export { Button } from "${root}/dist/entries/button.js";`);
const coreRoot = await bundle(`import "${root}/dist/index.js";`);
if (glyph.bytes >= icons.bytes / 10) throw new Error("A glyph retained the icon registry");
if (barrel.code.includes("box-toast") || barrel.code.includes("box-drawer") || barrel.code.includes("box-select")) throw new Error("React root retained unused wrappers");
if (!barrel.code.includes("box-button") || !barrel.code.includes(".define(")) throw new Error("Used element registration was removed");
if (!coreButton.code.includes("box-button") || !coreButton.code.includes(".define(")) throw new Error("Core component registration was removed");
for (const tag of ["box-button", "box-card", "box-content-uploader", "box-flow-builder"]) {
  if (!coreRoot.code.includes(tag)) throw new Error(`Core root dropped ${tag} registration`);
}
if (barrel.bytes > direct.bytes * 1.05) throw new Error("Root import costs more than the direct wrapper");
console.table(Object.fromEntries(Object.entries({ glyph, icons, direct, barrel, coreButton, coreRoot }).map(([key, value]) => [key, { bytes: value.bytes, gzip: value.gzip }])));
