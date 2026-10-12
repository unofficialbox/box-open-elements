/** Compile and run each Angular version in a fresh dependency tree, never root node_modules. */
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const version = process.argv[2] ?? "20.3.27";
if (!["20.0.0", "20.3.27"].includes(version)) throw new Error("Supported matrix entries: 20.0.0, 20.3.27");
const node = process.argv[3] ?? Bun.which("node");
if (!node) throw new Error("Node is required; pass its executable as the second argument if it is outside PATH");
const dir = await mkdtemp(join(tmpdir(), `boe-angular-${version}-`));
const run = async (args: string[]) => {
  const child = Bun.spawn(args[0] === "bun" ? [process.execPath, ...args.slice(1)] : args[0] === "node" ? [node, ...args.slice(1)] : args, { cwd: dir, stdout: "inherit", stderr: "inherit" });
  if (await child.exited !== 0) throw new Error(`Command failed: ${args.join(" ")}; environment retained at ${dir}`);
};
await mkdir(join(dir, "core"));
await cp(join(root, "dist"), join(dir, "core/dist"), { recursive: true });
const corePackage = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
// A local built package has published runtime metadata, not monorepo-only tooling.
delete corePackage.devDependencies; delete corePackage.workspaces; delete corePackage.scripts;
await writeFile(join(dir, "core/package.json"), JSON.stringify(corePackage, null, 2));
await cp(join(root, "packages/angular/src"), join(dir, "adapter/src"), { recursive: true });
await cp(join(root, "packages/angular/package.json"), join(dir, "adapter/package.json"));
await cp(join(root, "tools/adapters/angular-compatibility/consumer.ts"), join(dir, "consumer.ts"));
await writeFile(join(dir, "package.json"), JSON.stringify({ private: true, type: "module", dependencies: {
  "@angular/common": version, "@angular/core": version, "@angular/compiler": version,
  "@angular/compiler-cli": version, "@angular/platform-browser": version,
  "@unofficialbox/box-open-elements": "file:./core",
  "@unofficialbox/box-open-elements-angular": "file:./adapter",
  typescript: "5.8.3", rxjs: "7.8.2", "zone.js": "0.15.1", jsdom: "29.0.1",
} }, null, 2));
await run(["bun", "install"]);
const require = createRequire(join(dir, "package.json"));
const installed = Object.fromEntries(["core", "common", "compiler", "compiler-cli", "platform-browser"].map(name => {
  const metadata = require(`@angular/${name}/package.json`);
  if (metadata.version !== version) throw new Error(`Wrong isolated Angular ${name}: ${metadata.version}`);
  return [name, metadata.version];
}));
const common = { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", lib: ["ES2022", "DOM"], strict: true, skipLibCheck: false, experimentalDecorators: true, useDefineForClassFields: false, types: [] };
await writeFile(join(dir, "adapter/tsconfig.json"), JSON.stringify({ compilerOptions: { ...common, rootDir: "src", outDir: "dist", declaration: true }, angularCompilerOptions: { strictTemplates: true, compilationMode: "partial" }, include: ["src/**/*.ts"] }));
const ngc = join(dirname(require.resolve("@angular/compiler-cli/package.json")), "bundles/src/bin/ngc.js");
await run(["node", ngc, "-p", join(dir, "adapter/tsconfig.json")]);
await cp(join(dir, "adapter/dist"), join(dir, "node_modules/@unofficialbox/box-open-elements-angular/dist"), { recursive: true });
await writeFile(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { ...common, outDir: "compiled" }, angularCompilerOptions: { strictTemplates: true, compilationMode: "full" }, files: ["consumer.ts"] }));
await run(["node", ngc, "-p", join(dir, "tsconfig.json")]);
// Execute the bundler inside this tree as well, so package lookup cannot fall back to repository dependencies.
await writeFile(join(dir, "bundle.ts"), `const result=await Bun.build({entrypoints:['./compiled/consumer.js'],outdir:'bundle',target:'browser',format:'iife'});if(!result.success){console.error(result.logs);process.exit(1);}`);
await run(["bun", join(dir, "bundle.ts")]);
await writeFile(join(dir, "execute.mjs"), `import {JSDOM} from 'jsdom';import {readFileSync,writeFileSync} from 'node:fs';
const results=[];
for(const production of [false,true]){
 const dom=new JSDOM('<!doctype html><compatibility-app></compatibility-app>',{url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true});
 try{dom.window.production=production;dom.window.eval(readFileSync('bundle/consumer.js','utf8'));results.push(await dom.window.compatibilityReady);}finally{dom.window.close();}
}
writeFileSync('runtime-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));`);
await run(["node", join(dir, "execute.mjs")]);
const results = JSON.parse(await readFile(join(dir, "runtime-results.json"), "utf8"));
if (results.length !== 2 || results.some((result: any) => result.angularVersion !== version || result.routes.length !== 5 || result.teardown !== "passed")) throw new Error("Runtime version or contract mismatch");
const fixtureHash = createHash("sha256").update(await readFile(join(dir, "consumer.ts"))).digest("hex");
const report = { version, installed, fixtureHash, typescript: require("typescript/package.json").version, environment: dir, results };
await writeFile(join(dir, "REPORT.json"), JSON.stringify(report, null, 2));
console.log(`Angular compatibility passed; isolated evidence: ${dir}/REPORT.json`);
