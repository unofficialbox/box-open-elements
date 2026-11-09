// Native-browser regressions for #611, #617, #618 and #619.
// Run: bun run build:core && node tools/preview/issue-layouts.mjs
import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('dist');
const engine = process.env.BOE_ISSUE_BROWSER || 'chrome';
assert.ok(['chrome','chromium','firefox'].includes(engine));
const dir = process.env.BOE_ISSUE_EVIDENCE_DIR || '/tmp/boe-issue-layouts';
mkdirSync(dir, { recursive: true });
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open issue layout regressions</title>
<style>body{margin:16px;font:16px Arial;background:var(--boe-token-surface-surface,#fff);color:var(--boe-token-text-text,#222)}h1{font-size:24px}section{margin-block:24px}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}box-table{font-size:18px;--boe-token-surface-item-surface-selected:rgb(220,230,240)}box-tile-group::part(tile){border-color:rgb(100,100,100)}box-tile-group::part(tile-selected){border-color:rgb(0,97,213)}box-table::part(header-cell){font-weight:500}box-drawer p{margin:0 0 24px}</style>
<h1>Open issue layout regressions</h1><button id="open">Open details</button><form id="form"><box-tile-group id="chips" name="scenario" legend="Scenario" layout="chips" value="0"></box-tile-group><button id="after">After choices</button></form>
<section class="metrics"><box-metric-card id="plain" heading="Successful runs" value="1,234" variant="plain" emphasis="primary" size="compact" tone="success"></box-metric-card><box-metric-card id="normal" heading="Total runs" value="1,500"></box-metric-card></section>
<box-table id="table" label="Run comparisons" stacked="auto" selection-mode="single"></box-table><box-drawer id="drawer" heading="Run details" size="large"><div id="long"></div><button slot="footer" id="done">Done</button></box-drawer>
<script type="module">
window.lib=await import('/runtime/index.js');lib.registerBoxDefaultDesignSystem();lib.registerBoxDarkDesignSystem();
chips.options=Array.from({length:8},(_,i)=>({id:String(i),label:'Scenario '+(i+1),meta:'Count '+i,disabled:i===2}));
window.table=document.querySelector('#table');table.columns=[{key:'name',label:'Run name',sortable:true},{key:'status',label:'Run status'}];table.rows=[{id:'one',cells:{name:'Baseline',status:'Ready'}}];
window.drawer=document.querySelector('#drawer');document.querySelector('#long').innerHTML='<p>Long drawer content keeps the footer in view.</p>'.repeat(70);
document.querySelector('#open').onclick=()=>drawer.show();document.querySelector('#done').onclick=()=>drawer.close();
window.sorts=[];table.addEventListener('sort',e=>sorts.push(e.detail));window.ready=true;
</script></html>`;
const server = createServer((req,res)=>{
  try {
    const name=new URL(req.url,'http://localhost').pathname;
    if(name==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
    if(name==='/favicon.ico'){res.writeHead(204);res.end();return;}
    assert.ok(name.startsWith('/runtime/'));
    const file=path.resolve(root,name.slice(9));assert.ok(file.startsWith(root+path.sep));
    res.setHeader('Content-Type','text/javascript');res.end(readFileSync(file));
  } catch {res.writeHead(404);res.end();}
}).listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const results=[];
let browser;
try {
  browser=await (engine==='firefox'?firefox:chromium).launch(engine==='chrome'?{executablePath:process.env.BOE_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  for(const theme of ['light','dark']) for(const width of [1440,390,320]) {
    const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
    await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ready);
    await page.evaluate(theme=>{lib.applyDesignTokens(document.documentElement,theme==='dark'?'box-dark':'box-default');table.style.setProperty('--boe-token-surface-item-surface-selected',theme==='dark'?'rgb(45,55,65)':'rgb(220,230,240)');},theme);
    assert.equal(await page.title(),'Open issue layout regressions');assert.equal(page.url(),url);
    assert.equal(await page.locator('h1').isVisible(),true);
    const presentation=await page.evaluate(()=>{
      const style=(id,part)=>getComputedStyle(document.querySelector('#'+id).shadowRoot.querySelector('[part="'+part+'"]'));
      const group=chips.shadowRoot.querySelector('[part=options]');
      return {pageWidth:document.documentElement.scrollWidth,groupWidth:group.clientWidth,scrollWidth:group.scrollWidth,
        wrap:getComputedStyle(group).flexWrap,meta:style('chips','tile-meta').display,
        plainPadding:style('plain','card').padding,plainBorder:style('plain','card').borderTopWidth,
        plainBackground:style('plain','card').backgroundColor,plainFooter:style('plain','footer').borderTopWidth,headline:style('plain','value').fontSize,
        normal:style('normal','value').fontSize,numbers:style('plain','value').fontVariantNumeric,
        tableSize:style('table','table').fontSize,
        headers:[...table.shadowRoot.querySelectorAll('thead th')].map(el=>({part:el.getAttribute('part'),transform:getComputedStyle(el).textTransform,tracking:getComputedStyle(el).letterSpacing,weight:getComputedStyle(el).fontWeight})),
        stackedTransform:getComputedStyle(table.shadowRoot.querySelector('tbody td'),'::before').textTransform};
    });
    assert.ok(presentation.pageWidth<=width,JSON.stringify(presentation));
    assert.equal(presentation.plainFooter,'0px');assert.equal(presentation.plainPadding,'0px');assert.equal(presentation.plainBorder,'0px');
    assert.equal(presentation.plainBackground,'rgba(0, 0, 0, 0)');
    assert.equal(presentation.headline,'48px');assert.equal(presentation.normal,'32px');assert.equal(presentation.numbers,'tabular-nums');
    assert.equal(presentation.tableSize,'18px');
    assert.ok(presentation.headers.every(h=>h.part.includes('header-cell')&&h.transform==='none'&&h.tracking==='normal'&&h.weight==='500'));
    assert.equal(presentation.stackedTransform,'none');assert.equal(presentation.meta,'none');
    if(width<640){assert.equal(presentation.wrap,'nowrap');assert.ok(presentation.scrollWidth>presentation.groupWidth);}
    else assert.equal(presentation.wrap,'wrap');
    if(width>640){await page.getByRole('button',{name:'Sort by Run name'}).press('Enter');assert.equal(await page.evaluate(()=>sorts[0].key),'name');}
    await page.locator('#table [part=row]').focus();await page.keyboard.press('Space');
    assert.deepEqual(await page.evaluate(()=>table.selectedIds),['one']);
    assert.equal(await page.locator('#table tbody td').first().evaluate(el=>getComputedStyle(el).backgroundColor),theme==='dark'?'rgb(45, 55, 65)':'rgb(220, 230, 240)');
    await page.evaluate(()=>table.style.setProperty('--boe-table-font-size','20px'));
    assert.equal(await page.locator('#table [part=table]').evaluate(el=>getComputedStyle(el).fontSize),'20px');
    await page.evaluate(()=>table.style.removeProperty('--boe-table-font-size'));
    await page.getByRole('radio',{name:'Scenario 1',exact:true}).focus();
    await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>chips.value),'1');
    assert.equal(await page.locator('#chips [part~=tile-selected]').evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(0, 97, 213)');
    await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>chips.value),'3');
    assert.deepEqual(await page.evaluate(()=>new FormData(document.querySelector('#form')).getAll('scenario')),['3']);
    for(let i=0;i<4;i++)await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>chips.value),'7');
    assert.ok(await page.evaluate(()=>{
      const legend=chips.shadowRoot.querySelector('legend').getBoundingClientRect();
      const chosen=chips.shadowRoot.querySelector('[data-selected="true"]').getBoundingClientRect();
      return legend.left>=0&&legend.right<=innerWidth&&chosen.left>=0&&chosen.right<=innerWidth;
    }));
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'after');
    await page.evaluate(()=>{chips.layout='tiles';chips.layout='chips';});assert.equal(await page.evaluate(()=>chips.value),'7');
    await page.screenshot({path:dir+'/'+theme+'-'+width+'-summary.png',fullPage:true});
    if(width>640){
      await page.evaluate(()=>chips.style.width='320px');
      assert.equal(await page.locator('#chips [part=options]').evaluate(el=>getComputedStyle(el).flexWrap),'nowrap');
      await page.evaluate(()=>chips.style.removeProperty('width'));
    }
    for(const position of ['left','right','bottom']) {
      await page.evaluate(position=>drawer.position=position,position);await page.locator('#open').click();
      const geometry=await page.evaluate(()=>{
        const panel=drawer.shadowRoot.querySelector('[part=drawer]'),body=drawer.shadowRoot.querySelector('[part=body]'),footer=drawer.shadowRoot.querySelector('[part=footer]');
        const rect=panel.getBoundingClientRect();return {top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right,height:rect.height,footer:footer.getBoundingClientRect().bottom,bodyClient:body.clientHeight,bodyScroll:body.scrollHeight};
      });
      assert.ok(geometry.bottom<=845&&geometry.top>=-1&&geometry.left>=-1&&geometry.right<=width+1,JSON.stringify({width,position,geometry}));
      assert.ok(geometry.footer<=845);assert.ok(geometry.bodyScroll>geometry.bodyClient);
      await page.locator('#drawer [part=body]').hover();await page.mouse.wheel(0,500);
      await page.waitForFunction(()=>drawer.shadowRoot.querySelector('[part=body]').scrollTop>0);
      assert.ok(await page.evaluate(()=>drawer.shadowRoot.querySelector('[part=backdrop]').scrollTop===0));
      assert.equal(await page.locator('#done').isVisible(),true);
      if(position==='right')await page.screenshot({path:dir+'/'+theme+'-'+width+'-drawer.png'});
      await page.locator('#done').click();assert.equal(await page.evaluate(()=>drawer.open),false);
      assert.equal(await page.evaluate(()=>document.activeElement.id),'open');
      results.push({theme,width,position,geometry});
    }
    assert.deepEqual(errors,[]);results.push({theme,width,presentation,console:'clean',keyboard:'passed',form:'passed'});await page.close();
  }
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));writeFileSync(dir+'/results.json',JSON.stringify(results,null,2));}
console.log('Passed '+engine+' layout, scrolling, keyboard, form, typography and console checks at 1440, 390 and 320px in light and dark themes. Evidence: '+dir);
