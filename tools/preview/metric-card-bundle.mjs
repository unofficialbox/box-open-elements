// #631: production import graph and byte budgets for the public component entry.
import {build} from 'vite';
import {gzipSync} from 'node:zlib';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const runtime=path.resolve(process.env.BOE_METRIC_RUNTIME_ROOT||'dist');
const dir=path.resolve(process.env.BOE_METRIC_BUNDLE_DIR||'/tmp/boe-metric-card-bundle');
const result=await build({configFile:false,logLevel:'error',plugins:[{name:'metric-fixture',resolveId(id){if(id==='virtual:metric')return '\0metric';},load(id){if(id==='\0metric')return `import {MetricCard} from '${runtime}/entries/metric-card.js';globalThis.MetricCard=MetricCard;`;}}],build:{write:false,minify:true,rollupOptions:{input:'virtual:metric'}}});
const chunks=result.output.filter(c=>c.type==='chunk'),entry=chunks.find(c=>c.isEntry);
assert.ok(entry);assert.ok(entry.code.includes('box-metric-card'));
assert.ok(!Object.keys(entry.modules).some(m=>/\/(chart-element|chart-motion|chart-styles)\.js$/.test(m)),'Chart runtime/styles leaked into initial metric import');
assert.ok(chunks.some(c=>!c.isEntry&&Object.keys(c.modules).some(m=>m.endsWith('/chart-motion.js'))),'Opt-in animation chunk missing');
const rows=chunks.map(c=>({file:c.fileName,entry:c.isEntry,bytes:Buffer.byteLength(c.code),gzip:gzipSync(c.code).length}));
const initial=rows.find(c=>c.entry),total=rows.reduce((sum,c)=>sum+c.bytes,0);
assert.ok(initial.bytes<=18_000,JSON.stringify(rows));assert.ok(initial.gzip<=5_500,JSON.stringify(rows));assert.ok(total<=31_000,JSON.stringify(rows));
for(const c of chunks){const file=path.join(dir,c.fileName);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,c.code);}
const report={initial,totalBytes:total,totalGzip:rows.reduce((sum,c)=>sum+c.gzip,0),chunks:rows};writeFileSync(path.join(dir,'sizes.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
