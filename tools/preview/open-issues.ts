/** Browser acceptance for #601–604 and #607 against production docs. */
import {chromium,firefox} from "playwright-core";
import {resolve,join,extname} from "node:path";
import {mkdirSync,writeFileSync} from "node:fs";
import {applyDeterministicFonts,blockRemoteFonts} from "./deterministic-fonts.js";
const root=resolve(import.meta.dir,"../.."),site=join(root,"docs-site/dist");
const output=process.env.BOE_OPEN_ISSUES_OUTPUT??join(root,".regression-tmp/open-issues");mkdirSync(output,{recursive:true});
const server=Bun.serve({port:0,async fetch(request){const pathname=decodeURIComponent(new URL(request.url).pathname);const path=resolve(site,"."+(pathname==="/"?"/index.html":pathname));if(!path.startsWith(site+"/"))return new Response("Forbidden",{status:403});const file=Bun.file(path);if(!await file.exists())return new Response("Missing",{status:404});return new Response(file,{headers:{"cache-control":"no-store","content-type":({".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json"} as Record<string,string>)[extname(path)]??file.type}});}});
const engine=process.env.BOE_OPEN_ISSUES_BROWSER==="firefox"?firefox:chromium;
const browser=await engine.launch({headless:true}),page=await browser.newPage();await blockRemoteFonts(page);
const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));const results:object[]=[];
const check=(value:unknown,message:string)=>{if(!value)throw new Error(message);};
try{
 for(const width of [1440,390])for(const theme of ["light","dark"])for(const kind of ["stacked-bar-chart","range-chart","line-chart","findings-disclosure"]){
  await page.setViewportSize({width,height:1000});await page.goto(`http://127.0.0.1:${server.port}/#patterns/${kind}`,{waitUntil:"domcontentloaded"});await page.waitForSelector(`body[data-route-ready="patterns/${kind}"]`);
  await page.evaluate(theme=>{if(document.documentElement.dataset.theme!==theme)document.getElementById("theme-toggle")?.click();},theme);await applyDeterministicFonts(page);
  await page.addStyleTag({content:".masthead{position:relative!important}"});await page.evaluate(()=>window.scrollTo(0,0));
  if(kind==="line-chart")await page.getByLabel("Preview variant").selectOption({label:"Numeric series"});
  const host=page.locator(`box-${kind}`).first(),chart=kind==="line-chart"?host.locator('[part="series-host"]'):host;
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind}/${width}/${theme} page overflow`);
  await page.addScriptTag({path:join(root,"node_modules/axe-core/axe.min.js")});
  const a11y=async()=>await host.evaluate(async element=>{const axe=(window as unknown as {axe:{run:(el:Element,opts:object)=>Promise<{violations:{id:string}[]}>}}).axe;return(await axe.run(element,{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]}})).violations.map(v=>v.id);});
  check(!(await a11y()).length,`${kind} accessibility violations: ${JSON.stringify(await a11y())}`);
  await host.screenshot({path:join(output,`${kind}-${width}-${theme}.png`),animations:"disabled"});
  if(kind==="findings-disclosure"){
   check(await chart.locator('[part="correction-summary"]').isVisible(),"Collapsed correction summary is hidden");
   const upgrade=await host.evaluate(element=>{const tag='qa-findings-'+Math.random().toString(36).slice(2);const pre=document.createElement(tag) as HTMLElement&{findings:string[];expanded:boolean;headingLevel:number;heading:string};Object.assign(pre,{findings:['Lead','More'],expanded:true});document.body.append(pre);const Constructor=element.constructor as CustomElementConstructor;customElements.define(tag,class extends Constructor{});const root=pre.shadowRoot!;const replayed=!Object.hasOwn(pre,'expanded')&&pre.hasAttribute('expanded');const toggle=root.querySelector<HTMLButtonElement>('[part="toggle"]')!;toggle.click();const reactive=!pre.expanded&&toggle.getAttribute('aria-expanded')==='false';toggle.focus();pre.findings=['Lead'];pre.headingLevel=3;pre.heading='Updated';const focused=root.activeElement?.localName==='h3'&&root.activeElement.textContent==='Updated';pre.remove();return replayed&&reactive&&focused;});check(upgrade,'Delayed disclosure upgrade or repeated fallback focus failed');
   const toggle=chart.locator('[part="toggle"]');for(let n=0;n<3;n++){await toggle.press("Enter");check(await toggle.getAttribute("aria-expanded")==="true","Disclosure Enter did not expand");check(await chart.getByText("More findings",{exact:true}).isVisible(),"Expanded details missing");if(n===0)await host.screenshot({path:join(output,`${kind}-expanded-${width}-${theme}.png`)});await toggle.press("Space");check(await toggle.getAttribute("aria-expanded")==="false","Disclosure Space did not collapse");}
  }else{
   if(kind==="stacked-bar-chart"){
    const tiny=chart.locator('[data-bar="coding"][data-segment="retries"]');await tiny.focus();check((await chart.locator('[part="inspection"]').textContent())?.includes("117 tokens of 38,978, 0.3%"),"Tiny segment inspection loses amount/share");
    const colors=await chart.locator('[data-segment="tools"]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).style.getPropertyValue("--series-color")));check(colors.every(c=>c===colors[0]),"Segment colors differ across bars");
    await host.evaluate(el=>{(el as HTMLElement&{orientation:string}).orientation="vertical";});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Vertical composition overflows");await host.screenshot({path:join(output,`${kind}-vertical-${width}-${theme}.png`)});
   }
   if(kind==="range-chart"){
    const first=chart.locator('[part="range"]').first();await first.focus();check((await chart.locator('[part="inspection"]').textContent())?.includes("between 12% and 58%; width 46%"),"Range inspection loses bounds");
    check(await chart.locator('[part="range"][data-zero="true"]').count()===2,"Zero-width intervals vanished");check(await chart.locator('[part="point"]').count()===1,"Range inferred a midpoint");
   }
   if(kind==="line-chart"){
    const legend=chart.locator('[part="legend-item"]').first();await legend.focus();check((await chart.locator('[part="inspection"]').textContent())?.includes("Flat at 539"),"Numeric series summary missing");
    check(await chart.locator('[part="series-path"]').count()===3,"Series disappeared during focus");
    await legend.evaluate(el=>(el as HTMLElement).blur());await legend.hover();check(await chart.locator('[part="series-path"][data-active="true"]').count()===1,'Hover did not identify a series');await page.mouse.move(0,0);check(await chart.locator('[part="series-path"][data-muted="true"]').count()===0,'Hover emphasis remains after leaving the host');
    await host.evaluate(element=>{const el=element as HTMLElement&{series:unknown[];markers:unknown[];xScale:string;yScale:string};el.markers=[];el.xScale='linear';el.yScale='linear';el.series=[{id:'years',label:'Years',points:[{x:2025,y:2},{x:2026,y:3}]}];});const fitted=await chart.locator('[part="series-path"]').getAttribute('d');check(fitted?.startsWith('M 0 ')&&fitted.includes('L 100 '),'Near-equal years are squeezed by a zero-inclusive x axis');const yearLabels=await chart.locator('[part="x-ticks"] [part="tick"]').allTextContents();check(new Set(yearLabels).size===yearLabels.length,'Compact x labels repeat for a fitted domain');
    await page.getByLabel("Preview variant").selectOption({label:"Logarithmic series"});check(await chart.locator('[part="reference"]').count()===2,"References missing on log axes");await host.screenshot({path:join(output,`${kind}-log-${width}-${theme}.png`)});
   }
   const toggle=chart.locator('[part="table-toggle"]');for(let n=0;n<3;n++){await toggle.press("Enter");check(await chart.locator('[part="table-wrap"]').isVisible(),"Data table does not open");if(!n){await host.screenshot({path:join(output,`${kind}-table-${width}-${theme}.png`)});check(!(await a11y()).length,`${kind} table accessibility failed`);}await toggle.press("Space");check(!await chart.locator('[part="table-wrap"]').isVisible(),"Data table does not close");}
   if(kind==="stacked-bar-chart")check((await chart.locator('tbody').textContent())?.includes("20,237"),"Exact table amounts rounded");
   for(const state of ["loading","error","partial","stale","ready"]){await host.evaluate((el,state)=>{(el as HTMLElement&{state:string}).state=state;},state);if(state==="loading"||state==="error")check(!await chart.locator(kind==="line-chart"?'[part="visual"]':'[part="chart"]').isVisible(),`${kind} exposes cached geometry while ${state}`);}
  }

  const original=await host.evaluate((element,kind)=>{
   const el=element as HTMLElement&{bars:unknown[];rows:unknown[];series:unknown[];findings:string[];corrections:unknown[]};
   const label="UninterruptedCategoryName".repeat(6);
   if(kind==="stacked-bar-chart"){const original=el.bars;el.bars=Array.from({length:12},(_,i)=>({id:String(i),label:i?`Lane ${i}`:label,segments:[{id:"a",label:"Tools",value:20000+i},{id:"b",label:"Payload",value:500+i},{id:"tiny",label:"Retries",value:.01}]}));return original;}
   if(kind==="range-chart"){const original=el.rows;el.rows=[{id:"long",label,ranges:[{id:"a",label,value:18,low:12,high:58},{id:"b",label:"Comparison",low:8,high:24}]}];return original;}
   if(kind==="line-chart"){const original=el.series;el.series=Array.from({length:9},(_,i)=>({id:String(i),label:i?`Series ${i}`:label,points:[{x:1,y:1+i},{x:20,y:i===1?null:20+i},{x:200,y:100+i}]}));return original;}
   const original={findings:el.findings,corrections:el.corrections};el.findings=[label,"Supporting detail"];el.corrections=[{field:label,was:"Earlier",now:"Revised",why:"Scope changed"}];return original;
  },kind);
  if(kind!=="findings-disclosure")check((await chart.locator('[part="inspection"]').textContent())?.startsWith("Focus "),`${kind} retains obsolete inspection after host data changes`);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind} dense/long labels overflow page`);
  await host.screenshot({path:join(output,`${kind}-long-dense-${width}-${theme}.png`)});
  if(kind==="line-chart"){
   check(await chart.locator('[part="series-path"]').count()===9,'Dense series disappeared');await chart.locator('[part="table-toggle"]').click();check(await chart.locator('thead th').count()===10,'Dense table lost series');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Dense table escapes its local scroll wrapper');await chart.locator('[part="table-toggle"]').click();
  }
  await host.evaluate((element,{kind,original})=>{const el=element as HTMLElement&{bars:unknown;rows:unknown;series:unknown;findings:unknown;corrections:unknown};if(kind==="stacked-bar-chart")el.bars=original;else if(kind==="range-chart")el.rows=original;else if(kind==="line-chart")el.series=original;else{const data=original as {findings:unknown;corrections:unknown};el.findings=data.findings;el.corrections=data.corrections;}},{kind,original});
  await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>document.documentElement.style.fontSize="200%");check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind} page overflows at text200`);await host.screenshot({path:join(output,`${kind}-text200-${width}-${theme}.png`)});await page.evaluate(()=>document.documentElement.style.fontSize="");await page.emulateMedia({reducedMotion:"no-preference"});
  results.push({kind,width,theme,status:"passed"});console.log(`passed ${kind} ${width} ${theme}`);
 }

 // #607: exercise the actual native key path and nested host control, not dispatch-only tests.
 await page.goto(`http://127.0.0.1:${server.port}/#components/table`,{waitUntil:"domcontentloaded"});
 await page.waitForSelector('body[data-route-ready="components/table"]');
 const table=page.locator('box-table').first();
 for(const mode of ["single","multiple"]){
  await table.evaluate((element,mode)=>{
   const host=element as HTMLElement&{selectionMode:string;columns:unknown[];rows:unknown[];selectedIds:string[]};host.selectionMode=mode;host.selectedIds=[];host.columns=[{key:"name",label:"Name",hostContent:true}];host.rows=[{id:"a",cells:{name:"A"}},{id:"b",cells:{name:"B"}}];
   host.querySelector('[slot="cell-a-name"]')?.remove();const input=document.createElement('input');input.slot="cell-a-name";input.setAttribute('aria-label','Independent input');host.append(input);
  },mode);
  const row=table.locator('[part="row"][data-index="1"]');await row.press('Enter');
  check(JSON.stringify(await table.evaluate(el=>(el as HTMLElement&{selectedIds:string[]}).selectedIds))===JSON.stringify(["b"]),`Enter did not select ${mode} row`);
  await table.getByRole('textbox',{name:'Independent input'}).press('Enter');check(JSON.stringify(await table.evaluate(el=>(el as HTMLElement&{selectedIds:string[]}).selectedIds))===JSON.stringify(["b"]),'Nested Enter changed table selection');
  if(mode==="multiple"){await row.press('Enter');check((await table.evaluate(el=>(el as HTMLElement&{selectedIds:string[]}).selectedIds)).length===0,'Repeated Enter did not toggle multiple row');}
 }
 for(const mode of ['none','single','multiple']){
  await table.evaluate((element,mode)=>{const el=element as HTMLElement&{selectionMode:string;rows:unknown[];selectedIds:string[];readonly expandedRows:string[]};el.selectionMode=mode;el.selectedIds=[];el.rows=[{id:'detail',cells:{name:'Detail row'},detail:'Rich content'}];if(!el.expandedRows.includes('detail'))el.shadowRoot!.querySelector<HTMLButtonElement>('[part="expander"]')!.click();el.querySelector('[slot="detail-detail"]')?.remove();const custom=document.createElement('div');custom.slot='detail-detail';const shadow=custom.attachShadow({mode:'closed'}),link=document.createElement('a');link.href='#native-detail';link.textContent='Open detail';const state=window as unknown as {nativeDetailClicks:number};state.nativeDetailClicks=0;link.addEventListener('click',event=>{event.preventDefault();state.nativeDetailClicks++;});shadow.append(link);el.append(custom);link.focus();},mode);
  await page.keyboard.press('Enter');check(await page.evaluate(()=>(window as unknown as {nativeDetailClicks:number}).nativeDetailClicks)===1,`Closed-shadow detail link Enter was cancelled in ${mode} mode`);check((await table.evaluate(el=>(el as HTMLElement&{selectedIds:string[]}).selectedIds)).length===0,'Closed-shadow detail selected a row');
 }
 console.log('passed Table Enter, multiple toggle and independent nested control');
 if(engine===chromium){
  const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await blockRemoteFonts(touch);
  for(const kind of ["stacked-bar-chart","range-chart","line-chart","findings-disclosure"]){
   await touch.goto(`http://127.0.0.1:${server.port}/#patterns/${kind}`,{waitUntil:"domcontentloaded"});await touch.waitForSelector(`body[data-route-ready="patterns/${kind}"]`);
   if(kind==="line-chart")await touch.getByLabel('Preview variant').selectOption({label:'Numeric series'});
   const host=touch.locator(`box-${kind}`).first(),chart=kind==="line-chart"?host.locator('[part="series-host"]'):host;
   if(kind==="findings-disclosure"){await chart.locator('[part="toggle"]').tap();check(await chart.locator('[part="toggle"]').getAttribute('aria-expanded')==='true','Touch disclosure failed');}
   else{await chart.locator('[part="table-toggle"]').tap();check(await chart.locator('[part="table-wrap"]').isVisible(),'Touch fallback table failed');}
   check(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind} touch page overflow`);console.log(`passed touch ${kind}`);
  }
  await touch.close();
 }
 check(!errors.length,`Browser errors: ${errors.join("; ")}`);
 writeFileSync(join(output,"results.json"),JSON.stringify({results,limitations:["Automated axe, keyboard and text reflow checks are not a manual screen-reader pass."]},null,2));
}finally{await browser.close();server.stop();}
