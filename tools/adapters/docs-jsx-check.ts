import { mkdtemp, mkdir, readdir, realpath, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { catalog } from "../../docs-site/registry.js";
import { examples } from "../../docs-site/examples.js";
import { jsxFrameworkSnippet } from "../../docs-site/jsx-framework-snippets.js";
import { lessons } from "../../docs-site/lessons.js";
import workshop from "../../storybook/generated/workshop.json" with { type: "json" };

const directory = await mkdtemp(join(tmpdir(), "boe-docs-jsx-"));
const modules = resolve(process.env.BOE_DOCS_JSX_NODE_MODULES ?? "node_modules");
// Bun may install the core only as an adapter's peer, without a root link.
// Give isolated snippets the same real package resolution as that adapter.
const dependencies = join(directory, "node_modules");
await mkdir(join(dependencies, "@unofficialbox"), { recursive: true });
for (const entry of await readdir(modules)) {
  if (entry !== "@unofficialbox") await symlink(join(modules, entry), join(dependencies, entry));
}
for (const entry of await readdir(join(modules, "@unofficialbox"))) {
  if (entry !== "box-open-elements") await symlink(join(modules, "@unofficialbox", entry), join(dependencies, "@unofficialbox", entry));
}
const adapter = await realpath(join(modules, "@unofficialbox/box-open-elements-solid"));
const core = dirname(dirname(Bun.resolveSync("@unofficialbox/box-open-elements", adapter)));
await symlink(core, join(dependencies, "@unofficialbox/box-open-elements"));
await writeFile(join(directory, "package.json"), JSON.stringify({ private: true, type: "module" }));
const run = (command: string, args: string[], cwd = directory): string => {
  try { return execFileSync(command, args, { cwd, stdio: "pipe", maxBuffer: 16_000_000 }).toString(); }
  catch (error) {
    const failure = error as { stdout?: Buffer; stderr?: Buffer };
    throw new Error(`${command} ${args.join(" ")}\n${failure.stdout?.toString() ?? ""}\n${failure.stderr?.toString() ?? ""}`);
  }
};
const results = [];
for (const framework of ["solid", "preact"] as const) {
  const project = join(directory, framework);
  await mkdir(project);
  const files: string[] = [];
  for (const entry of catalog) {
    const example = examples[entry.id];
    const variants = [example?.codeHtml ?? example?.html ?? `<${entry.tag}></${entry.tag}>`,
      ...(example?.variants?.map(variant => variant.html) ?? []),
      ...(workshop.stories.find(story => story.id === entry.id)?.variants.map(variant => variant.html) ?? [])];
    for (const [index, html] of [...new Set(variants)].entries()) {
      const file = `${entry.id}-${index}.tsx`;
      await writeFile(join(project, file), jsxFrameworkSnippet(framework, entry.id, entry.tag, html));
      files.push(file);
    }
  }
  for (const lesson of lessons) {
    for (const [index, code] of lesson.stepFrameworks[framework].entries()) {
      const file = `lesson-${lesson.id}-${index}.jsx`;
      await writeFile(join(project, file), code);
      files.push(file);
    }
  }
  await writeFile(join(project, "tsconfig.json"), JSON.stringify({ compilerOptions: {
    target: "ES2022", module: "ESNext", moduleResolution: "bundler", strict: true,
    skipLibCheck: true, jsx: "react-jsx", jsxImportSource: framework === "solid" ? "solid-js" : "preact",
    allowJs: true, checkJs: false, noEmit: true,
  }, include: ["*.tsx", "*.jsx"] }));
  await writeFile(join(project, "index.html"), '<div id="app"></div><script type="module" src="./entry.js"></script>');
  const runtime = framework === "solid"
    ? 'import { render } from "solid-js/web"; import { createComponent } from "solid-js";'
    : 'import { render, h } from "preact";';
  const mount = framework === "solid"
    ? "const dispose = render(() => createComponent(examples[index], {}), target);"
    : "render(h(examples[index], {}), target); const dispose = () => render(null, target);";
  await writeFile(join(project, "entry.js"), runtime + '\nimport { registerBoxDefaultDesignSystem, applyDesignTokens } from "@unofficialbox/box-open-elements";\n' + files.map((file, i) => `import { Example as E${i} } from "./${file}";`).join("\n") +
    `\nexport const examples = [${files.map((_, i) => `E${i}`).join(",")}];
if (typeof window !== "undefined") {
  registerBoxDefaultDesignSystem({ setActive: true });
  applyDesignTokens(document.documentElement, "box-default");
  const mounts = new Map();
  window.mountDocsExample = (index, id = "app") => {
    mounts.get(id)?.();
    const target = document.getElementById(id);
    ${mount}
    mounts.set(id, dispose);
  };
  window.unmountDocsExample = (id = "app") => { mounts.get(id)?.(); mounts.delete(id); };
}`);
  const plugin = framework === "solid" ? 'import solid from "vite-plugin-solid";' : "";
  const nativeGuard = `{ name: "native-jsx", generateBundle() { for (const id of this.getModuleIds()) if (/(?:^|\\/)(?:react|react-dom)(?:\\/|$)/.test(id)) this.error("Docs snippets must use the native framework runtime: " + id); } }`;
  await writeFile(join(project, "vite.config.js"), `${plugin}\nexport default { base: "./", root: ${JSON.stringify(project)}, plugins: [${framework === "solid" ? "solid({ ssr: true })," : ""}${nativeGuard}], build: { outDir: "dist", chunkSizeWarningLimit: 4000 }, ssr: { noExternal: true } };`);
  run(join(modules, ".bin/tsc"), ["-p", join(project, "tsconfig.json")]);
  run(join(modules, ".bin/vite"), ["build", "--config", join(project, "vite.config.js")]);
  run(join(modules, ".bin/vite"), ["build", "--config", join(project, "vite.config.js"), "--ssr", "entry.js", "--outDir", "ssr"]);
  run("node", ["--input-type=module", "-e", `const m = await import(${JSON.stringify(join(project, "ssr/entry.js"))}); if(m.examples.length !== ${files.length})throw Error("Missing examples");`]);
  results.push({ framework, snippets: files.length, project, files });
}
await writeFile(join(directory, "results.json"), JSON.stringify(results, null, 2));
if (process.env.BOE_DOCS_JSX_BROWSER) {
  execFileSync("node", [resolve("tools/adapters/docs-jsx-browser.mjs"), directory], {
    env: process.env, stdio: "inherit",
  });
}
console.log(JSON.stringify({ status: "passed", directory, checks: ["all catalog/variant JSX types", "all lesson JSX builds", "production bundles", "DOM-free SSR imports"], results: results.map(({ files: _, ...rest }) => rest) }, null, 2));
