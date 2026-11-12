// #622–#624: source or published-runtime acceptance. Build core before running.
import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(process.env.BOE_MODELER_RUNTIME_ROOT || 'dist');
const engine=process.env.BOE_MODELER_BROWSER || 'chrome';assert.ok(['chrome','chromium','firefox'].includes(engine));
const evidence=process.env.BOE_MODELER_EVIDENCE_DIR || '/tmp/boe-modeler-tools';mkdirSync(evidence,{recursive:true});
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Process canvas tools acceptance</title><style>body{margin:12px;font:14px Arial;background:var(--boe-token-surface-surface,#fff);color:var(--boe-token-text-text,#222)}h1{font-size:20px}box-process-modeler{height:780px;min-height:0}</style><h1>Process canvas tools acceptance</h1><box-process-modeler id="m" initial-view="100"><button slot="controls-extra" id="host">Host action</button></box-process-modeler><script type="module">
window.lib=await import('/runtime/index.js');lib.registerBoxDefaultDesignSystem();lib.registerBoxDarkDesignSystem();window.m=document.querySelector('#m');window.events=[];window.hostClicks=0;host.onclick=()=>hostClicks++;
for(const type of ['canvastoolchange','selectseveralchange'])m.addEventListener(type,e=>events.push({type,detail:e.detail,bubbles:e.bubbles,composed:e.composed}));
window.graph={boxes:['a','b','c'].map(id=>({id,title:'Step '+id.toUpperCase(),kind:'call',node:{},path:[id],fingerprint:id})),lines:[{id:'ab',from:'a',to:'b'}]};
window.reset=()=>{m.initialView='100';m.load(structuredClone(graph));m.layout={boxes:{a:{x:60,y:100},b:{x:360,y:100},c:{x:360,y:400}}};m.setView({x:0,y:0,zoom:innerWidth<600?.5:1});m.selectSeveral=false;m.canvasTool='hand';};reset();window.ready=true;
</script></html>`;
const server=createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}assert.ok(url.pathname.startsWith('/runtime/'));const file=path.resolve(root,url.pathname.slice(9));assert.ok(file.startsWith(root+path.sep));res.setHeader('Content-Type','text/javascript');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const url=`http://127.0.0.1:${server.address().port}/`,results=[];let browser;
try{
 browser=await(engine==='firefox'?firefox:chromium).launch(engine==='chrome'?{channel:'chrome'}:{});
 for(const width of [1440,390])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:940},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(['error','warning'].includes(msg.type()))errors.push(msg.text());});
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ready);
  await page.evaluate(theme=>lib.applyDesignTokens(document.documentElement,theme==='dark'?'box-dark':'box-default'),theme);
  assert.equal(page.url(),url);assert.equal(await page.title(),'Process canvas tools acceptance');assert.equal(await page.locator('h1').isVisible(),true);assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(),0);
  const canvas=page.locator('#m [part=canvas]'),step=id=>page.locator(`#m [data-box-id=${id}]`),control=cmd=>page.locator(`#m [data-command=${cmd}]`);
  const ids=()=>page.evaluate(()=>m.selectedBoxes.map(b=>b.id).sort());
  const drag=async(from,to)=>{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();};
  const fitEvidence=[];
  for(const orientation of ['wide','tall']){
   await page.evaluate(orientation=>{m.load({boxes:graph.boxes.slice(0,2),lines:graph.lines});m.layout={boxes:{a:{x:-200,y:75},b:{x:orientation==='wide'?600:-200,y:orientation==='wide'?75:875}}};m.fit();},orientation);
   const bounds=await page.evaluate(()=>{const canvas=m.shadowRoot.querySelector('[part=canvas]'),c=canvas.getBoundingClientRect(),boxes=[...m.shadowRoot.querySelectorAll('[data-box-id]')].map(b=>b.getBoundingClientRect());return{cx:c.left+canvas.clientLeft+canvas.clientWidth/2,cy:c.top+canvas.clientTop+canvas.clientHeight/2,mx:(Math.min(...boxes.map(b=>b.left))+Math.max(...boxes.map(b=>b.right)))/2,my:(Math.min(...boxes.map(b=>b.top))+Math.max(...boxes.map(b=>b.bottom)))/2};});
   assert.ok(Math.abs(bounds.cx-bounds.mx)<2,JSON.stringify(bounds));assert.ok(Math.abs(bounds.cy-bounds.my)<2,JSON.stringify(bounds));fitEvidence.push({orientation,bounds});
  }
  await page.evaluate(()=>{m.initialView='fit';m.load({boxes:graph.boxes.slice(0,2),lines:graph.lines},{positions:[{id:'a',path:['a'],fingerprint:'a',position:{x:0,y:100}},{id:'b',path:['b'],fingerprint:'b',position:{x:800,y:100}}]});});
  const initial=await page.evaluate(()=>{const c=m.shadowRoot.querySelector('[part=canvas]'),r=c.getBoundingClientRect(),b=m.shadowRoot.querySelector('[data-box-id=a]').getBoundingClientRect();return{canvas:r.top+c.clientTop+c.clientHeight/2,process:(b.top+b.bottom)/2};});assert.ok(Math.abs(initial.canvas-initial.process)<2);
  await page.evaluate(()=>reset());await control('select-several').click();assert.equal(await control('select-several').getAttribute('aria-pressed'),'true');
  for(const id of ['a','b']){const box=await step(id).boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);}assert.deepEqual(await ids(),['a','b']);
  await step('c').focus();assert.deepEqual(await ids(),['a','b']);await page.keyboard.press('Space');assert.deepEqual(await ids(),['a','b','c']);assert.equal(await page.locator('#m [part=status]').textContent(),'Added: 3 steps selected');
  await page.keyboard.press('Space');assert.deepEqual(await ids(),['a','b']);
  await step('b').focus();await page.keyboard.press('Alt+ArrowDown');assert.equal(await step('c').evaluate(el=>el.getRootNode().activeElement===el),true);assert.deepEqual(await ids(),['a','b']);
  await page.evaluate(()=>m.selectSeveral=false);await canvas.focus();await page.keyboard.press('v');assert.equal(await control('tool-pointer').getAttribute('aria-pressed'),'true');assert.equal(await canvas.evaluate(el=>getComputedStyle(el).cursor),'default');
  await page.evaluate(()=>m.select('c'));
  const a=await step('a').boundingBox(),b=await step('b').boundingBox();await drag({x:a.x-12,y:a.y-12},{x:b.x+b.width+12,y:b.y+b.height+12});assert.deepEqual(await ids(),['a','b']);
  await canvas.focus();const before=await page.evaluate(()=>m.view);await page.keyboard.down('Space');assert.equal(await canvas.evaluate(el=>getComputedStyle(el).cursor),'grab');
  const c=await canvas.boundingBox();await drag({x:c.x+12,y:c.y+15},{x:c.x+42,y:c.y+35});await page.keyboard.up('Space');const after=await page.evaluate(()=>m.view);assert.equal(Math.round(after.x-before.x),30);assert.equal(Math.round(after.y-before.y),20);assert.deepEqual(await ids(),['a','b']);
  await page.keyboard.press('h');assert.equal(await control('tool-hand').getAttribute('aria-pressed'),'true');assert.equal(await canvas.evaluate(el=>getComputedStyle(el).cursor),'grab');
  for(const tool of ['hand','pointer']){
   await page.evaluate(tool=>{reset();m.canvasTool=tool;},tool);const p=await page.evaluate(()=>({position:m.layout.boxes.a,zoom:m.view.zoom})),r=await step('a').boundingBox();
   await drag({x:r.x+r.width/4,y:r.y+r.height/2},{x:r.x+r.width/4+30,y:r.y+r.height/2+20});const next=await page.evaluate(()=>m.layout.boxes.a);assert.ok(Math.abs(next.x-p.position.x-30/p.zoom)<2);assert.ok(Math.abs(next.y-p.position.y-20/p.zoom)<2);
  }
  await page.locator('#host').click();assert.equal(await page.evaluate(()=>hostClicks),1);
  await page.evaluate(()=>{const field=document.createElement('input');field.slot='controls-extra';field.id='host-input';field.setAttribute('aria-label','Host control input');m.append(field);});
  await page.locator('#host-input').fill('h');assert.equal(await page.evaluate(()=>m.canvasTool),'pointer');await page.locator('#host-input').press('v');assert.equal(await page.evaluate(()=>m.canvasTool),'pointer');await page.evaluate(()=>document.querySelector('#host-input').remove());
  await page.evaluate(()=>{m.refresh();m.selectSeveral=true;m.selectMany(['a','b']);});assert.equal(await page.evaluate(()=>m.shadowRoot.querySelector('slot[name=controls-extra]').assignedElements().includes(document.querySelector('#host'))),true);
  const health=await page.evaluate(()=>{const r=m.shadowRoot.querySelector('[part=controls]').getBoundingClientRect(),c=m.shadowRoot.querySelector('[part=canvas]').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth+1,fits:r.left>=c.left&&r.right<=c.right+1,painted:[...m.shadowRoot.querySelectorAll('[part=controls] svg')].every(svg=>{const b=svg.getBBox();return b.width>0&&b.height>0;}),events};});assert.equal(health.overflow,false);assert.equal(health.fits,true);assert.equal(health.painted,true);assert.ok(health.events.some(e=>e.type==='canvastoolchange'&&e.detail.canvasTool==='pointer'&&e.bubbles&&e.composed));assert.ok(health.events.some(e=>e.type==='selectseveralchange'&&e.detail.selectSeveral));
  await page.screenshot({path:`${evidence}/${engine}-${width}-${theme}.png`,fullPage:true});assert.deepEqual(errors,[]);results.push({engine,width,theme,fitEvidence,initial,health,status:'passed'});await context.close();
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));writeFileSync(`${evidence}/${engine}-results.json`,JSON.stringify(results,null,2));}
console.log(`Passed ${engine} process Fit, tools, touch selection, keyboard, drag, slot, painted icons and console checks at 1440/390px in light/dark. Evidence: ${evidence}`);
