// Native-browser regression for #578. Run after bun run build:core.
import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(fileURLToPath(new URL('../../dist/', import.meta.url)));
const dir = process.env.BOE_TABLE_EVIDENCE_DIR || '/tmp/boe-table-compact';
const engine = process.env.BOE_TABLE_BROWSER || 'chrome';
assert.ok(['chrome', 'firefox'].includes(engine));
mkdirSync(dir, { recursive: true });
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Compact run list regression</title>
<style>body{margin:16px;font:14px Arial;color:var(--boe-token-text-text);background:var(--boe-token-surface-surface)}h1{font-size:20px}h2{font-size:16px}section{margin-block:24px}input{max-width:100%;box-sizing:border-box}</style>
<h1>Recent validation runs</h1><p id="event" role="status">Choose a run action</p><button id="outside">Outside focus</button><main id="stage"></main>
<script type="module">
window.lib=await import('/runtime/index.js');lib.registerBoxDarkDesignSystem();lib.applyDesignTokens(document.documentElement,'box-dark');
window.columns=[{key:'run',label:'Run',rowHeader:true},{key:'status',label:'Status',compact:'summary'},{key:'duration',label:'Duration',hostContent:true},{key:'calls',label:'Calls',compact:'hidden',hostContent:true},{key:'report',label:'Report',compact:'hidden'}];
window.rows=[{id:'run-123',current:true,cells:{run:'Oct 12, 11:45 AM · dry run',status:{text:'✓ Passed',tone:'success'},duration:'1.2 s',calls:'142',report:'Ready'},actions:[{key:'view',label:'View'},{key:'compare',label:'Compare Report'}]},
{id:'run-124',cells:{run:'Oct 12, 11:40 AM · full validation with a very long scenario name and unbroken identifier '+ 'scenario'.repeat(12),status:{text:'Failed · retry required',tone:'error'},duration:'45.8 s',calls:'980',report:'Pending'},actions:[{key:'view',label:'View'},{key:'compare',label:'Compare with the most recent successful report for this scenario'},{key:'retry',label:'Retry',disabled:true}]},
{id:'run-125',cells:{run:'Oct 12, 11:35 AM · dry run',status:'Queued',duration:'—',calls:'0',report:'Pending'}}];
for(const layout of ['compact','grid','list']){const section=document.createElement('section');section.innerHTML='<h2>'+layout+'</h2>';const t=document.createElement('box-table');t.id=layout;t.label='Recent runs '+layout;t.setAttribute('stacked','auto');t.stackedLayout=layout;t.selectionMode='multiple';t.columns=columns;t.rows=rows;section.append(t);stage.append(section);t.addEventListener('row-action',e=>{window.lastAction=e.detail;document.querySelector('#event').textContent=e.detail.action+' · '+e.detail.rowId});}
window.t=document.querySelector('#compact');window.hostButton=document.createElement('button');hostButton.textContent='Duration details';hostButton.setAttribute('aria-label','Duration details for dry run');hostButton.slot='cell-run-123-duration';t.append(hostButton);
window.hiddenInput=document.createElement('input');hiddenInput.value='142';hiddenInput.setAttribute('aria-label','Calls for dry run');hiddenInput.slot='cell-run-123-calls';t.append(hiddenInput);window.ready=true;
</script></html>`;
const server = createServer((q,r) => {
  try { const name = new URL(q.url, 'http://localhost').pathname;
    if (name === '/fixture.html') { r.setHeader('Content-Type','text/html'); r.end(fixture); return; }
    if (name === '/favicon.ico') { r.writeHead(204); r.end(); return; }
    assert.ok(name.startsWith('/runtime/'));
    const file = path.resolve(root,name.slice(9)); assert.ok(file.startsWith(root+path.sep));
    r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/plain');r.end(readFileSync(file));
  } catch { r.writeHead(404);r.end(); }
}).listen(Number(process.env.BOE_TABLE_PORT || 0),'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const url = `http://127.0.0.1:${server.address().port}/fixture.html`;
if (process.env.BOE_TABLE_SERVE) { console.log(url); await new Promise(()=>{}); }
const browser = await (engine==='firefox'?firefox:chromium).launch(engine==='firefox'?{headless:!process.env.BOE_TABLE_HEADFUL}:{executablePath:process.env.BOE_TABLE_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
try {
  for (const width of [1440,390,320]) {
    const context=await browser.newContext({viewport:{width,height:1000},colorScheme:'dark'});
    const page=await context.newPage(), errors=[];
    page.on('pageerror', e=>errors.push(e.message));page.on('console', m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
    await page.goto(url);await page.waitForFunction(()=>window.ready);
    assert.equal(await page.title(),'Compact run list regression');
    const geometry=await page.evaluate(()=>{
      const root=t.shadowRoot, row=root.querySelector('[part=row]'), cells=[...row.querySelectorAll('td,th')];
      return { compact:row.getBoundingClientRect().height,grid:document.querySelector('#grid').shadowRoot.querySelector('[part=row]').getBoundingClientRect().height,
        list:document.querySelector('#list').shadowRoot.querySelector('[part=row]').getBoundingClientRect().height,
        header:getComputedStyle(root.querySelector('thead')).display,hidden:cells.slice(3,5).map(c=>getComputedStyle(c).display),
        summaryLabel:cells[1].querySelector('[part=stacked-label]').getBoundingClientRect().width,
        noAction:getComputedStyle(root.querySelectorAll('[part=actions-cell]')[2]).display,
        overflow:[...document.querySelectorAll('box-table')].map(el=>({id:el.id,scroll:el.shadowRoot.querySelector('[part=shell]').scrollWidth,client:el.shadowRoot.querySelector('[part=shell]').clientWidth}))};});
    if(width<560){assert.deepEqual(geometry.hidden,['none','none']);assert.equal(geometry.summaryLabel,1);assert.equal(geometry.noAction,'none');assert.ok(geometry.compact<geometry.grid);assert.equal(geometry.header,'none');assert.ok(geometry.overflow.find(o=>o.id==='compact').scroll<=geometry.overflow.find(o=>o.id==='compact').client+1);}
    else {assert.notEqual(geometry.header,'none');assert.ok(geometry.hidden.every(d=>d==='table-cell'));}
    if(width>560){
      const sizes=await page.evaluate(()=>{
        const measure=()=>[...t.shadowRoot.querySelectorAll('tr')].map(r=>[...r.querySelectorAll('td,th')].map(c=>{const b=c.getBoundingClientRect();return [b.width,b.height];}));
        const compact=measure();t.stackedLayout='list';const list=measure();t.stackedLayout='grid';const grid=measure();t.stackedLayout='compact';return {compact,list,grid};
      });
      assert.deepEqual(sizes.compact,sizes.list);assert.deepEqual(sizes.compact,sizes.grid);
    }
    const snapshot=await page.locator('#compact').ariaSnapshot();
    assert.ok(snapshot.includes('View for Oct 12, 11:45 AM · dry run'));
    if(width<560){assert.ok(snapshot.includes('Status: ✓ Passed'));assert.ok(!snapshot.includes('Calls for dry run'));}
    await page.screenshot({path:`${dir}/${engine}-${width}-dark.png`,fullPage:true});
    const view=()=>page.locator('#compact').getByRole('button',{name:/^View for/}).first();
    await view().focus();
    await page.evaluate(()=>{for(let i=1;i<=6;i++)t.rows=[{...rows[0],cells:{...rows[0].cells,run:'Refreshed dry run '+i}},...rows.slice(1)].reverse();});
    assert.equal(await page.evaluate(()=>t.shadowRoot.activeElement?.getAttribute('aria-label')),'View for Refreshed dry run 6');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>lastAction.rowId),'run-123');assert.equal(await page.evaluate(()=>lastAction.row.cells.run),'Refreshed dry run 6');
    assert.deepEqual(await page.evaluate(()=>t.selectedIds),[]);
    await page.evaluate(()=>{hostButton.focus();for(let i=0;i<6;i++)t.rows=[...t.rows].reverse();});
    assert.equal(await page.evaluate(()=>document.activeElement===hostButton),true);
    await page.keyboard.press('Enter');assert.deepEqual(await page.evaluate(()=>t.selectedIds),[]);
    await page.locator('#outside').focus();await page.evaluate(()=>{t.rows=[...t.rows];});assert.equal(await page.evaluate(()=>document.activeElement.id),'outside');
    await page.evaluate(()=>{t.rows=rows;t.shadowRoot.querySelector('[part=row]').focus();});await page.keyboard.press('End');await page.keyboard.press('Space');assert.deepEqual(await page.evaluate(()=>t.selectedIds),['run-125']);
    await page.evaluate(()=>{t.rows=t.rows.map(({actions,...r})=>r);});assert.equal(await page.locator('#compact [part=actions-cell]').count(),0);
    // No columns are omitted without a consumer choice, even in compact mode.
    await page.evaluate(()=>{t.columns=columns.map(({compact,...c})=>c);});assert.equal(await page.locator('#compact input').isVisible(),true);
    await page.evaluate(()=>{t.columns=columns;t.setAttribute('stacked','always');});
    assert.equal(await page.locator('#compact input').isVisible(),false);
    await page.evaluate(()=>t.removeAttribute('stacked'));
    assert.equal(await page.locator('#compact input').isVisible(),true);
    assert.deepEqual(errors,[]);
    results.push({engine,width,theme:'dark',status:'passed',geometry,accessibility:snapshot,checks:['identity','console','long-content','multiple/no-actions','action-event-current-data','repeated-refresh-focus','host-action-focus','external-handoff','row-keyboard-selection','explicit-hiding-only']});
    await context.close();
  }
} finally {await browser.close();await new Promise(r=>server.close(r));writeFileSync(`${dir}/${engine}-RESULTS.json`,JSON.stringify(results,null,2));}
console.log(JSON.stringify(results.map(({accessibility,...r})=>r),null,2));
