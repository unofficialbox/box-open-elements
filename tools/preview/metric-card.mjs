// #630/#631: run metric-card-bundle.mjs first; verify the actual split production build.
import {chromium,firefox} from 'playwright-core';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=path.resolve(process.env.BOE_METRIC_BUNDLE_DIR||'/tmp/boe-metric-card-bundle'),sizes=JSON.parse(readFileSync(path.join(dir,'sizes.json')));
const evidence=process.env.BOE_METRIC_EVIDENCE_DIR||'/tmp/boe-metric-card';mkdirSync(evidence,{recursive:true});
const engine=process.env.BOE_METRIC_BROWSER||'chrome';assert.ok(['chrome','chromium','firefox'].includes(engine));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Metric card regression</title><style>body{font:16px Arial;margin:24px;background:var(--bg,#fff);color:var(--ink,#222)}box-metric-card{max-width:400px}h1{font-size:22px}</style><h1>Metric card regression</h1><box-metric-card id="card" heading="Successful runs" value="42"></box-metric-card><script type="module" src="/${sizes.initial.file}"></script></html>`;
const server=createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;if(name==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}if(name==='/favicon.ico'){res.writeHead(204);res.end();return;}const file=path.resolve(dir,'.'+name);assert.ok(file.startsWith(dir+path.sep));res.setHeader('Content-Type','text/javascript');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const url=`http://127.0.0.1:${server.address().port}/`,results=[];let browser;
try{
 browser=await(engine==='firefox'?firefox:chromium).launch(engine==='chrome'?{channel:'chrome'}:{});
 for(const width of [1440,390])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:840},reducedMotion:'no-preference'}),errors=[],scripts=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});page.on('request',r=>{if(r.url().endsWith('.js'))scripts.push(new URL(r.url()).pathname);});
  await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>customElements.get('box-metric-card'));
  await page.evaluate(theme=>{if(theme==='dark')document.documentElement.style.cssText='--bg:#1c1c1c;--ink:#f4f4f4;--boe-token-surface-surface:#1c1c1c;--boe-token-text-text:#f4f4f4;--boe-token-text-text-secondary:#aaa;--boe-token-stroke-stroke:#555';},theme);
  assert.equal(page.url(),url);assert.equal(await page.title(),'Metric card regression');assert.equal(await page.locator('h1').isVisible(),true);assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(),0);
  const card=page.locator('#card'),footer=card.locator('[part=footer]');assert.equal(await card.locator('[part=value]').textContent(),'42');assert.equal(await footer.isVisible(),false);assert.equal(await footer.evaluate(e=>e.getBoundingClientRect().height),0);
  assert.deepEqual(scripts,['/'+sizes.initial.file],'Static metric fetched an optional chunk');
  await page.evaluate(()=>{window.actions=[];card.addEventListener('action',e=>actions.push(e.detail));card.action={id:'details',label:'Details'};});assert.equal(await footer.isVisible(),true);await card.getByRole('button',{name:'Details'}).click();assert.equal(await page.evaluate(()=>actions[0].id),'details');
  await page.evaluate(()=>{card.action=null;card.trend={label:'Up 12%',direction:'up'};});assert.equal(await footer.isVisible(),true);
  for(const state of ['loading','error','partial']){await page.evaluate(state=>card.state=state,state);assert.equal(await footer.isVisible(),false);}
  await page.evaluate(()=>{card.state='stale';});assert.equal(await footer.isVisible(),true);
  await page.evaluate(()=>{card.state='ready';card.trend=null;});assert.equal(await footer.isVisible(),false);
  await page.screenshot({path:`${evidence}/${engine}-${width}-${theme}.png`,fullPage:true});
  await page.evaluate(()=>{card.animationDuration=5000;card.animated=true;});await page.waitForFunction(()=>card.shadowRoot.querySelector('[part=value]').getAnimations().length>0);
  assert.ok(scripts.length>1,'Animation did not load its deferred chunk');await page.evaluate(()=>card.finishAnimation());assert.equal(await card.locator('[part=value]').evaluate(e=>e.getAnimations().length),0);
  await page.evaluate(()=>card.replayAnimation());await page.waitForFunction(()=>card.shadowRoot.querySelector('[part=value]').getAnimations().length>0);
  await page.evaluate(()=>card.animated=false);await page.waitForFunction(()=>card.shadowRoot.querySelector('[part=value]').getAnimations().length===0);
  await page.evaluate(()=>{card.heading='LongIdentifier'.repeat(12);card.status='LongStatus'.repeat(12);});assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Long heading/status overflows');await page.screenshot({path:`${evidence}/${engine}-${width}-${theme}-long-labels.png`,fullPage:true});results.push({engine,width,theme,staticRequests:1,animationLazy:true,footerTransitions:'passed',console:'clean'});await page.close();
 }
 // A failed optional chunk leaves the static snapshot and action operable.
 const failed=await browser.newPage();await failed.route('**/chart-motion-*.js',route=>route.abort());
 await failed.goto(url,{waitUntil:'networkidle'});await failed.waitForFunction(()=>customElements.get('box-metric-card'));
 const rejected=failed.waitForEvent('requestfailed',r=>r.url().includes('chart-motion-'));
 await failed.evaluate(()=>{window.actions=[];card.addEventListener('action',e=>actions.push(e.detail));card.action={id:'retry',label:'Retry report'};card.animated=true;});await rejected;
 await failed.locator('#card').getByRole('button',{name:'Retry report'}).click();assert.equal(await failed.evaluate(()=>actions[0].id),'retry');assert.equal(await failed.locator('#card [part=value]').textContent(),'42');await failed.close();
}finally{await browser?.close();await new Promise(r=>server.close(r));writeFileSync(`${evidence}/${engine}-results.json`,JSON.stringify(results,null,2));}
console.log(JSON.stringify(results));
