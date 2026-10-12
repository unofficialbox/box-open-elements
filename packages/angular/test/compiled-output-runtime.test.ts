// @vitest-environment node
import {execFile} from "node:child_process";
import {mkdtemp,writeFile,readFile,rm,symlink} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import {JSDOM} from "jsdom";
import {describe,it,expect} from "vitest";
const exec=promisify(execFile);const root=fileURLToPath(new URL("../../../",import.meta.url));
describe("Angular compiled native output delivery",()=>{
 it("renders an actual ngc template and preserves native, output and explicit emission routes",async()=>{
  const dir=await mkdtemp(resolve(tmpdir(),"boe-ngc-runtime-"));let dom:JSDOM|undefined;
  try {
   await symlink(resolve(root,"node_modules"),resolve(dir,"node_modules"),"dir");
   const compiled=resolve(dir,"compiled");const config=resolve(dir,"source-config.json");
   await writeFile(config,JSON.stringify({extends:resolve(root,"packages/angular/tsconfig.json"),compilerOptions:{noEmit:false,baseUrl:root,rootDir:root,outDir:compiled},angularCompilerOptions:{strictTemplates:true,compilationMode:"full"},include:[],files:[resolve(root,"packages/angular/test/fixtures/output-runtime.ts")]}));
   await exec(process.execPath,[resolve(root,"node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js"),"-p",config],{cwd:root,maxBuffer:1024*1024});
   const paths={"@unofficialbox/box-open-elements-angular":[resolve(compiled,"packages/angular/src/index.js")],"@unofficialbox/box-open-elements/patterns/content-explorer/selection":[resolve(compiled,"src/patterns/content-explorer/selection/index.js")],"@unofficialbox/box-open-elements/*":[resolve(compiled,"src/entries/*.js")]};
   await writeFile(resolve(dir,"tsconfig.json"),JSON.stringify({compilerOptions:{baseUrl:dir,paths}}));
   const entry=resolve(compiled,"packages/angular/test/fixtures/output-runtime.js");
   await writeFile(resolve(dir,"bundle.mjs"),`const result=await Bun.build({entrypoints:[${JSON.stringify(entry)}],outdir:'bundle',target:'browser',format:'iife'});if(!result.success){console.error(result.logs);process.exit(1);}`);
   await exec("bun",[resolve(dir,"bundle.mjs")],{cwd:dir,maxBuffer:1024*1024});
   dom=new JSDOM('<!doctype html><audit-output-runtime></audit-output-runtime>',{url:"http://localhost/",runScripts:"dangerously",pretendToBeVisual:true});
   dom.window.eval(await readFile(resolve(dir,"bundle/output-runtime.js"),"utf8"));
   const api=await (dom.window as any).templateReady;
   const event=new dom.window.CustomEvent("value-changed",{bubbles:true,composed:true,detail:{value:"synthetic"}});
   api.host.dispatchEvent(event);expect(api.native).toEqual([event]);expect(api.program).toEqual([event]);expect(api.instance.records).toEqual([event]);
   api.host.dispatchEvent(event);expect(api.instance.records).toHaveLength(2);expect(api.program).toHaveLength(2);
   api.instance.field.valueChanged.emit(event);api.instance.field.valueChanged.next(event);
   expect(api.instance.records).toHaveLength(4);expect(api.program).toHaveLength(4);expect(api.native).toHaveLength(2);
   api.unmount();api.host.dispatchEvent(event);expect(api.instance.records).toHaveLength(4);expect(api.program).toHaveLength(4);expect(api.native).toHaveLength(3);
   api.instance.field.valueChanged.emit(event);expect(api.program).toHaveLength(5);
  } finally {dom?.window.close();await rm(dir,{recursive:true,force:true});}
 },60000);
});
