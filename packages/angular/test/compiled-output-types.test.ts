// @vitest-environment node
import {execFile} from "node:child_process";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import {describe,it,expect} from "vitest";
const exec=promisify(execFile);
const root=fileURLToPath(new URL("../../../",import.meta.url));
describe("Angular strict compiled output contracts",()=>{
 it("accepts published DTOs and rejects incompatible payload handlers",async()=>{
  const dir=await mkdtemp(resolve(tmpdir(),"boe-ngc-output-"));
  try {
   const config=resolve(dir,"tsconfig.json");const settings={extends:resolve(root,"packages/angular/tsconfig.json"),compilerOptions:{noEmit:true,baseUrl:root},angularCompilerOptions:{strictTemplates:true},include:[] as string[],files:[] as string[]};
   const compile=async(name:string)=>{settings.files=[resolve(root,"packages/angular/test/fixtures",name)];await writeFile(config,JSON.stringify(settings));return exec(process.execPath,[resolve(root,"node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js"),"-p",config],{cwd:root,maxBuffer:1024*1024});};
   await expect(compile("output-contracts.ts")).resolves.toBeDefined();
   let diagnostics="";try{await compile("output-contracts-invalid.ts");}catch(error){diagnostics=(error as {stderr:string}).stderr;}
   expect(diagnostics).toContain("TS2345");expect(diagnostics).toContain("Type 'string' is not assignable to type 'number'");expect(diagnostics).toContain("CustomEvent<null>");
  } finally {await rm(dir,{recursive:true,force:true});}
 },60000);
});
