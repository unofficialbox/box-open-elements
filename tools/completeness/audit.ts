/** Structural evidence inventory, not a claim of functional or visual completeness.
 * Run: bun tools/completeness/audit.ts
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { catalog } from "../../docs-site/registry.js";
import { examples } from "../../docs-site/examples.js";
import { storyModules } from "../../storybook/registry.js";

const files = (root: string): string[] => execFileSync("rg", ["--files", root], { encoding: "utf8" }).trim().split("\n");
const sources = files("src").filter(p=>p.endsWith(".ts")).map(path=>({path,text:readFileSync(path,"utf8")}));
const tests = files("test").filter(p=>p.endsWith(".test.ts")).map(path=>({path,text:readFileSync(path,"utf8")}));
const rows = catalog.map(entry=>{
  const story=storyModules.find(s=>s.meta.id===entry.id);
  const demo=examples[entry.id];
  const source=sources.find(s=>new RegExp(`DEFAULT_TAG_NAME = ["']${entry.tag}["']`).test(s.text));
  const matched=tests.filter(t=>t.text.includes(entry.tag) || !!source && t.text.includes(source.path.slice(4).replace(/\.ts$/,".js")));
  const variants=demo?.variants?.length && demo.variants.length>1 ? demo.variants : story?.variants ?? [];
  const richSetup=!!demo?.setup || !!demo?.variants?.some(v=>v.setup);
  const shownSetup=!!demo?.setupCode || /<script|import\s|\.\w+\s*=/.test(story?.meta.sourceSnippet ?? "");
  const bareStory=story?.variants.every(v=>!v.setup && new RegExp(`^<${entry.tag}></${entry.tag}>$`).test(v.html.trim()));
  const gaps=[!source ? "source mapping needs manual review" : "",!demo ? "no curated docs example; inspect workshop fallback" : "",!matched.length ? "no direct test reference found" : "",bareStory ? "bare-tag workshop defaults" : "",richSetup && !shownSetup ? "rich setup lacks detected runnable setup snippet; review required" : "",variants.length<2 ? "only one documented state" : ""].filter(Boolean);
  return {...entry,source:source?.path,testFiles:matched.map(t=>t.path),states:variants.length,contractRows:story?.meta.referenceRows.length ?? 0,gaps};
});
if(process.argv.includes("--json")) console.log(JSON.stringify(rows,null,2));
else {
  console.log("| Surface | Tier | Source | Direct test files¹ | Demo states² | Contract rows | Evidence gaps / recommendation |\n| --- | --- | --- | ---: | ---: | ---: | --- |");
  for(const r of rows) console.log(`| ${r.id} | ${r.tier} | ${r.source ? `[source](../${r.source})` : "Review"} | ${r.testFiles.length} | ${r.states} | ${r.contractRows} | ${r.gaps.length ? r.gaps.join("; ")+". Add the missing evidence before marking complete." : "Structural evidence present; behavior and visual sign-off remain separate."} |`);
}
