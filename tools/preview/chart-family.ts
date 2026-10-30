/** Rendered acceptance for the Chart.js-informed family. Run against the local docs server. */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dir, "../..");
const output = process.env.BOE_CHART_FAMILY_OUTPUT ?? join(root, ".regression-tmp/chart-family");
mkdirSync(output, { recursive: true });
const base = process.env.BOE_CHART_FAMILY_URL ?? "http://127.0.0.1:4605";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
const check = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const families = ["grouped-bar-chart", "scatter-chart", "bubble-chart", "area-chart", "mixed-chart", "pie-chart", "radar-chart", "polar-area-chart"];
const results: object[] = [];
try {
 for (const width of [1440, 390]) for (const theme of ["light", "dark"]) for (const family of families) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${base}/#patterns/${family}`);
  await page.waitForSelector(`body[data-route-ready="patterns/${family}"]`);
  await page.evaluate(theme => { if (document.documentElement.dataset.theme !== theme) document.getElementById("theme-toggle")!.click(); }, theme);
  await page.addStyleTag({content:".masthead{position:relative!important}"});
  const chart = page.locator(`box-${family}`).first();
  await chart.scrollIntoViewIfNeeded();
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${family}/${width}/${theme}: document overflow`);
  await page.addScriptTag({ path: join(root, "node_modules/axe-core/axe.min.js") });
  const violations = await chart.evaluate(async chart => (await (window as any).axe.run(chart, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.html) })));
  check(!violations.length, `${family}/${width}/${theme}: ${JSON.stringify(violations)}`);
  if (!["pie-chart", "radar-chart", "polar-area-chart"].includes(family)) {
   const plot = chart.locator('[part="plot"]');
   check((await plot.boundingBox())!.height >= 192, `${family}: plot collapsed`);
   await chart.evaluate((chart: any) => chart.addEventListener("point-selected", (event: any) => { chart.selectedId = event.detail.selectedId; }));
   await plot.focus(); await page.keyboard.press("ArrowRight"); await page.keyboard.press("Enter");
   check(await chart.evaluate((chart: any) => !!chart.selectedId), `${family}: keyboard selection missing`);
   check(await plot.evaluate(node => node.getRootNode() instanceof ShadowRoot && (node.getRootNode() as ShadowRoot).activeElement === node), `${family}: selection discarded plot focus`);
   await page.keyboard.press("Escape");
   check(await chart.evaluate((chart: any) => chart.selectedId === null), `${family}: clear failed`);
   await chart.getByRole("button", { name: "Show data table", exact: true }).click();
   check(await chart.locator("tbody tr").count() > 0, `${family}: exact table missing`);
   await chart.getByRole("button", { name: /^Inspect / }).first().focus();
   check(await chart.evaluate((chart: any) => {
    const focused = chart.shadowRoot.activeElement;
    chart.selectedId = chart.series[0].points[0].id;
    return focused === chart.shadowRoot.activeElement;
   }), `${family}: host update discarded table focus`);
   await chart.getByRole("button", { name: "Hide data table", exact: true }).click();
  }
  if (!["pie-chart", "radar-chart", "polar-area-chart"].includes(family)) {
    await chart.evaluate((chart:any)=>{chart.selectedId=null;chart.shadowRoot.activeElement?.blur();});
  }
  await chart.screenshot({ path: join(output, `${family}-${width}-${theme}.png`), animations: "disabled" });
  const variants = page.getByLabel("Preview variant");
  for(const label of ["Loading","Partial coverage","Cached observations","Load error","No observations"]){
    await variants.selectOption({label});
    if(label==="Loading"||label==="Load error")check(await chart.locator('[part="mark"],[part="sector"],[part="segment"]').count()===0,`${family}/${label}: old geometry`);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${family}/${label}: overflow`);
  }
  await variants.selectOption({label:"Default"});
  if(!["pie-chart","radar-chart","polar-area-chart"].includes(family)){
    await chart.evaluate((chart:any)=>{
      chart.series=chart.series.map((s:any)=>({...s,label:"A deliberately long descriptive series label with an unbroken identifier ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",points:s.points.map((p:any)=>({...p,label:"A long observation label that must wrap without moving the page edge"}))}));
    });
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${family}: long labels overflow`);
    check((await chart.locator('[part="plot"]').boundingBox())!.height>=192,`${family}: long legend collapsed plot`);
    await chart.screenshot({path:join(output,`${family}-long-${width}-${theme}.png`),animations:"disabled"});
    await chart.evaluate((chart:any)=>{const original=chart.series;chart.series=Array.from({length:6},(_,i)=>{const s=original[i%original.length];return {...s,id:`series-${i}`,label:`Series ${i+1}`,points:s.points.map((p:any)=>({...p,id:`${i}:${p.id}`}))};});});
    check((await chart.locator('[part="plot"]').boundingBox())!.height>=192,`${family}: six series collapsed plot`);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${family}: six-series overflow`);
    const minimumContrast=await chart.evaluate(element=>{
      const channels=(value:string)=>{const numbers=value.match(/[\d.]+/g)!.map(Number);return numbers.slice(0,3).map(v=>value.startsWith('color(')?v:v/255);};
      const luminance=(value:string)=>channels(value).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const root=element.shadowRoot!,background=luminance(getComputedStyle(root.querySelector('[part="panel"]')!).backgroundColor);
      return Math.min(...Array.from(root.querySelectorAll('[part="mark"]')).map(mark=>{const foreground=luminance(getComputedStyle(mark).fill);return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);}));
    });
    check(minimumContrast>=3,`${family}/${theme}: mark contrast ${minimumContrast}`);
  }
  results.push({ family, width, theme, passed: true, states:5, longLabels:!['pie-chart','radar-chart','polar-area-chart'].includes(family) });
 }
 await page.setViewportSize({width:390,height:1000});
 await page.goto(`${base}/#patterns/line-chart`);await page.waitForSelector('body[data-route-ready="patterns/line-chart"]');
 for(const label of ["Stepped numeric series","Monotone interpolation","Calendar time axis","Separate y axes"]){
   await page.getByLabel("Preview variant").selectOption({label});
   const line=page.locator('box-line-chart').first();const view=line.locator('[part="series-host"]');
   check(await view.locator('[part="series-path"]').count()>0,`${label}: no line`);
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: overflow`);
   await line.screenshot({path:join(output,`line-${label.replaceAll(' ','-')}-390.png`),animations:"disabled"});
 }
 // A rendering view is bounded while source records and exact paging retain all values.
 await page.goto(`${base}/#patterns/scatter-chart`);await page.waitForSelector('body[data-route-ready="patterns/scatter-chart"]');
 const dense=page.locator('box-scatter-chart').first();
 await dense.evaluate((chart:any)=>{chart.series=[{id:'dense',label:'Dense observations',points:Array.from({length:100000},(_,i)=>({id:String(i),x:i,y:i===12345?1000:i%53}))}];});
 check(await dense.locator('[part="mark"]').count()<=2000,'Dense SVG marks unbounded');
 check(await dense.locator('tbody tr').count()===0,'Hidden exact table was built');
 await dense.getByRole('button',{name:'Show data table',exact:true}).click();check(await dense.locator('tbody tr').count()===50,'Dense table paging unbounded');
 const timings=await dense.evaluate((chart:any)=>{const values=[];for(let i=0;i<20;i++){const t=performance.now();chart.selectedId=String(i);values.push(performance.now()-t);}return values;});
 results.push({denseSource:100000,selectionUpdateMs:timings,renderedMarks:await dense.locator('[part="mark"]').count()});
 check(errors.length === 0, `Browser errors: ${JSON.stringify(errors)}`);
 writeFileSync(join(output, "results.json"), JSON.stringify({ results, errors }, null, 2));
 console.log(`${results.length} rendered family/theme/viewport checks passed; screenshots: ${output}`);
} finally { await browser.close(); }
