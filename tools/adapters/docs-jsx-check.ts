import { mkdtemp, mkdir, readdir, realpath, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { catalog } from "../../docs-site/registry.js";
import { examples } from "../../docs-site/examples.js";
import { FRAMEWORKS, frameworkSnippet } from "../../docs-site/framework-snippets.js";
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
for (const { id: framework } of FRAMEWORKS.filter(({ id }) => !process.env.BOE_DOCS_FRAMEWORKS || process.env.BOE_DOCS_FRAMEWORKS.split(",").includes(id))) {
  const project = join(directory, framework);
  await mkdir(project);
  const extension = ({ html: "html", react: "tsx", preact: "tsx", solid: "tsx", angular: "ts", vue: "vue", svelte: "svelte" } as const)[framework];
  const files: string[] = [];
  const cases: Array<{file:string;tag?:string;html?:string;lesson?:string;step?:number}> = [];
  for (const entry of catalog) {
    const example = examples[entry.id];
    const variants = [example?.codeHtml ?? example?.html ?? `<${entry.tag}></${entry.tag}>`,
      ...(example?.variants?.map(variant => variant.html) ?? []),
      ...(workshop.stories.find(story => story.id === entry.id)?.variants.map(variant => variant.html) ?? [])];
    for (const [index, html] of [...new Set(variants)].entries()) {
      const file = `${entry.id}-${index}.${extension}`;
      await writeFile(join(project, file), frameworkSnippet(framework, entry.id, entry.tag, html));
      files.push(file);
      cases.push({file, tag:entry.tag, html:frameworkSnippet("html",entry.id,entry.tag,html).split("</script>").slice(1).join("</script>").trim()});
    }
  }
  for (const lesson of lessons) for (const [index, code] of lesson.stepFrameworks[framework].entries()) {
    const folder = `lesson-${lesson.id}-${index}`;
    await mkdir(join(project, folder));
    await writeFile(join(project, folder, "controller.js"), lesson.controllers[index]);
    const file = `${folder}/Example.${extension}`;
    await writeFile(join(project, file), code);
    files.push(file);
    cases.push({file,lesson:lesson.id,step:index});
  }
  const jsx = ["react", "solid", "preact"].includes(framework);
  if (jsx) {
    const module = framework === "solid" ? "solid-js" : framework;
    await writeFile(join(project, "custom-elements.d.ts"), `import type { BoxElementTagName } from "@unofficialbox/box-open-elements";
      type Tags = { [Tag in BoxElementTagName]: Record<string, unknown> };
      declare module "${module}" { namespace JSX { interface IntrinsicElements extends Tags {} ${framework === "solid" ? 'interface SvgSVGAttributes<T> { focusable?: string; }' : ""} } }
      export {};`);
  }
  await writeFile(join(project, "tsconfig.json"), JSON.stringify({ compilerOptions: {
    target: "ES2022", module: "ESNext", moduleResolution: "bundler", strict: true,
    skipLibCheck: true, jsx: "react-jsx", jsxImportSource: framework === "solid" ? "solid-js" : framework,
    allowJs: true, checkJs: false, noEmit: framework !== "angular", experimentalDecorators: true,
    ...(framework === "angular" ? { outDir: "compiled" } : {}),
  }, angularCompilerOptions: { strictTemplates: true }, include: ["**/*.tsx", "**/*.ts", "**/*.js", "**/*.vue", "**/*.svelte"], exclude: ["dist", "ssr", "compiled", "vite.config.js", "entry.js"] }));
  if (framework === "svelte") await writeFile(join(project, "custom-elements.d.ts"), 'import "svelte/elements"; declare module "svelte/elements" { interface SVGAttributes<T extends EventTarget> { slot?: string; } }');
  if (framework === "svelte") await writeFile(join(project, "svelte.config.js"), 'import {vitePreprocess} from "@sveltejs/vite-plugin-svelte"; export default {preprocess:vitePreprocess()};');
  if (framework === "angular") run(join(modules, ".bin/ngc"), ["-p", join(project, "tsconfig.json")]);
  else if (framework === "vue") run(join(modules, ".bin/vue-tsc"), ["--noEmit", "-p", join(project, "tsconfig.json")]);
  else if (framework === "svelte") run(join(modules, ".bin/svelte-check"), ["--workspace", project, "--tsconfig", join(project, "tsconfig.json")]);
  else if (jsx) run(join(modules, ".bin/tsc"), ["-p", join(project, "tsconfig.json")]);
  const imports = framework === "solid" ? 'import { render } from "solid-js/web"; import { createComponent } from "solid-js";'
    : framework === "preact" ? 'import { render, h } from "preact";'
    : framework === "react" ? 'import { createRoot } from "react-dom/client"; import { flushSync } from "react-dom"; import { createElement } from "react";'
    : framework === "vue" ? 'import { createApp } from "vue";'
    : framework === "svelte" ? 'import { mount, unmount } from "svelte";'
    : framework === "angular" ? 'import "@angular/compiler"; import { createComponent, provideZonelessChangeDetection } from "@angular/core"; import { createApplication } from "@angular/platform-browser";' : "";
  const mount = framework === "solid" ? "const dispose = render(() => createComponent(examples[index], {}), target);"
    : framework === "preact" ? "render(h(examples[index], {}), target); const dispose = () => render(null, target);"
    : framework === "react" ? "const app = createRoot(target); flushSync(() => app.render(createElement(examples[index]))); const dispose = () => app.unmount();"
    : framework === "vue" ? "const app = createApp(examples[index]); app.mount(target); const dispose = () => app.unmount();"
    : framework === "svelte" ? "const app = mount(examples[index], { target }); const dispose = () => unmount(app);"
    : "const app = await createApplication({providers:[provideZonelessChangeDetection()]}); const host=document.createElement('app-example');target.append(host);const ref = createComponent(examples[index], {environmentInjector:app.injector,hostElement:host}); app.attachView(ref.hostView); ref.changeDetectorRef.detectChanges(); const dispose = () => {ref.destroy();app.destroy();host.remove();};";
  if (framework === "html") {
    // Compile the standalone HTML examples and a driver for native DOM parity checks.
    const controllers = cases.map((item,i) => item.lesson ? `import {mountExample as C${i}} from "./${item.file.replace(/Example.html$/, "controller.js")}";` : "").join("\n");
    await writeFile(join(project,"entry.js"), 'import {registerBoxDefaultDesignSystem,applyDesignTokens} from "@unofficialbox/box-open-elements"; import "@unofficialbox/box-open-elements/code-editor";\n'+controllers+`
      registerBoxDefaultDesignSystem({setActive:true});applyDesignTokens(document.documentElement,"box-default");
      const markup=${JSON.stringify(cases.map(item=>item.html??null))};
      const controllers={${cases.map((item,i)=>item.lesson?`${i}:C${i}`:"").filter(Boolean).join(",")}};
      const mounts=new Map();window.mountDocsExample=async(index,id="app")=>{mounts.get(id)?.();const target=document.getElementById(id);if(controllers[index])mounts.set(id,controllers[index](target));else{target.innerHTML=markup[index];mounts.set(id,()=>target.replaceChildren());}};
      window.unmountDocsExample=async(id="app")=>{mounts.get(id)?.();mounts.delete(id);};`);
    await writeFile(join(project,"index.html"),'<div id="app"></div><script type="module" src="./entry.js"></script>');
    await writeFile(join(project, "vite.config.js"), `export default { root: ${JSON.stringify(project)}, base:"./", build:{outDir:"dist",rollupOptions:{input:${JSON.stringify([...files.map(file => join(project, file)),join(project,"index.html")])}}} };`);
  } else {
    await writeFile(join(project, "index.html"), '<div id="app"></div><script type="module" src="./entry.js"></script>');
    const source = files.map((file, i) => {
      const path = framework === "angular" ? `compiled/${file.replace(/\.ts$/, ".js")}` : file;
      return `import ${["vue", "svelte"].includes(framework) ? `E${i}` : `{ Example as E${i} }`} from "./${path}";`;
    }).join("\n");
    await writeFile(join(project, "entry.js"), imports + '\nimport { registerBoxDefaultDesignSystem, applyDesignTokens } from "@unofficialbox/box-open-elements";\n' + source +
      `\nexport const examples = [${files.map((_, i) => `E${i}`).join(",")}];
if (typeof window !== "undefined") {
  registerBoxDefaultDesignSystem({ setActive: true }); applyDesignTokens(document.documentElement, "box-default");
  const mounts = new Map();
  window.mountDocsExample = async (index, id = "app") => { await mounts.get(id)?.(); const target = document.getElementById(id); ${mount} mounts.set(id, dispose); };
  window.unmountDocsExample = async (id = "app") => { await mounts.get(id)?.(); mounts.delete(id); };
}`);
    const plugin = framework === "solid" ? 'import solid from "vite-plugin-solid";' : framework === "vue" ? 'import vue from "@vitejs/plugin-vue";' : framework === "svelte" ? 'import {svelte} from "@sveltejs/vite-plugin-svelte";' : "";
    const plugins = framework === "solid" ? "solid({ssr:true})" : framework === "vue" ? 'vue({template:{compilerOptions:{isCustomElement:tag=>tag.startsWith("box-")}}})' : framework === "svelte" ? "svelte()" : "";
    await writeFile(join(project, "vite.config.js"), `${plugin} export default { base:"./",root:${JSON.stringify(project)}, plugins:[${plugins}],build:{outDir:"dist",chunkSizeWarningLimit:5000},ssr:{noExternal:true} };`);
  }
  run(join(modules, ".bin/vite"), ["build", "--config", join(project, "vite.config.js")]);
  if (framework !== "html") {
    run(join(modules, ".bin/vite"), ["build", "--config", join(project, "vite.config.js"), "--ssr", "entry.js", "--outDir", "ssr"]);
    run("node", ["--input-type=module", "-e", `const m = await import(${JSON.stringify(join(project, "ssr/entry.js"))}); if(m.examples.length !== ${files.length})throw Error("Missing examples");`]);
  }
  results.push({ framework, snippets: files.length, project, files, cases });
  await writeFile(join(directory,"results.json"),JSON.stringify(results,null,2));
}
await writeFile(join(directory, "results.json"), JSON.stringify(results, null, 2));
if (process.env.BOE_DOCS_JSX_BROWSER) {
  execFileSync("node", [resolve("tools/adapters/docs-jsx-browser.mjs"), directory], {
    env: process.env, stdio: "inherit",
  });
}
console.log(JSON.stringify({ status: "passed", directory, checks: ["all framework catalog/variant builds", "native framework typechecks", "shared lesson controllers", "production bundles", "DOM-free SSR imports"], results: results.map(({ files: _, cases: __, ...rest }) => rest) }, null, 2));
