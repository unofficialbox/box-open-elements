/** Rendered acceptance for the approved component studies, separate from pixel gates. */
import { chromium, firefox } from "playwright-core";
import { join, extname, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { applyDeterministicFonts, blockRemoteFonts } from "./deterministic-fonts.js";

const root = resolve(import.meta.dir,"../..");
const output = process.env.BOE_CHART_UX_OUTPUT ?? join(root,".regression-tmp/chart-ux");
mkdirSync(output,{recursive:true});
const site = join(root,"docs-site/dist");
const server = Bun.serve({port:0, async fetch(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const file = resolve(site,"."+(pathname === "/" ? "/index.html" : pathname));
  if (!file.startsWith(site+"/")) return new Response("Forbidden",{status:403});
  const data = Bun.file(file);
  if (!await data.exists()) return new Response("Missing",{status:404});
  return new Response(data,{headers:{"cache-control":"no-store","content-type":({".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".svg":"image/svg+xml"} as Record<string,string>)[extname(file)] ?? data.type}});
}});
const engine = process.env.BOE_CHART_UX_BROWSER === "firefox" ? firefox : chromium;
const browser = await engine.launch({headless:true});
const page = await browser.newPage();
await blockRemoteFonts(page);
const errors: string[]=[];
page.on("pageerror",error=>errors.push(error.message));
const results: object[]=[];
const touchChecks: string[]=[];
const check=(condition:unknown,message:string)=>{if(!condition)throw new Error(message);};
try {
for (const width of [1440,390]) for (const theme of ["light","dark"]) {
  await page.setViewportSize({width,height:1000});
  for (const kind of ["bar-chart","line-chart","chart-panel","donut-chart","box-plot","metric-card"]) {
    await page.goto(`http://127.0.0.1:${server.port}/#patterns/${kind}`,{waitUntil:"domcontentloaded",timeout:60000});
    await page.waitForSelector(`body[data-route-ready="patterns/${kind}"]`);
    await page.evaluate(target=>{if(document.documentElement.dataset.theme!==target)document.getElementById("theme-toggle")?.click();},theme);
    await applyDeterministicFonts(page);
    // Hash navigation keeps scroll. Reset before every capture, and let the
    // fixture header flow normally so sticky docs chrome cannot cover a chart.
    await page.addStyleTag({content:".masthead { position:relative!important; }"});
    await page.evaluate(()=>window.scrollTo(0,0));
    const chart=page.locator(`box-${kind}`).first();
    await page.mouse.move(0,0);
    await page.evaluate(()=>(document.activeElement as HTMLElement)?.blur());
    await page.addScriptTag({path:join(root,"node_modules/axe-core/axe.min.js")});
    const violations=await page.evaluate(async tag=>{
      const axe=(window as unknown as {axe:{run:(element:Element,options:object)=>Promise<{violations:Array<{id:string}>}>}}).axe;
      return (await axe.run(document.querySelector(tag)!,{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]}})).violations.map(item=>item.id);
    },`box-${kind}`);
    check(!violations.length,`${kind}/${width}/${theme} axe: ${violations.join(",")}`);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind} overflows page`);
    await chart.screenshot({path:join(output,`${kind}-${width}-${theme}.png`),animations:"disabled"});
    if (kind === "bar-chart" || kind === "line-chart") {
      const before=await chart.locator('[part="axis-label"]').allTextContents();
      const expected=kind === "bar-chart" ? "64 uploads" : "402 users";
      const target=chart.getByRole("button",{name:kind === "bar-chart" ? "Oct 19: 64" : "Oct 19: 402",exact:true});
      for(let repeat=0;repeat<3;repeat++) {
        await target.press("Enter");
        check(await chart.getAttribute("selected-id")==="w4","Keyboard selection did not reflect ID");
        check(await chart.locator('[part="inspection-value"]').textContent()===expected,"Inspection has wrong scoped value");
        check(JSON.stringify(await chart.locator('[part="axis-label"]').allTextContents())===JSON.stringify(before),"Selection changed the scale");
        if(kind === "line-chart") {
          const separated=await chart.locator('[part="point"]').evaluateAll(points=>points.every((point,index)=>{
            if(!index)return true;
            const prior=points[index-1].getBoundingClientRect(),current=point.getBoundingClientRect();
            return prior.right<=current.left+1;
          }));
          check(separated,"Line focus/selection targets overlap adjacent categories");
        }
        if(repeat===0)await chart.screenshot({path:join(output,`${kind}-selected-${width}-${theme}.png`),animations:"disabled"});
        await chart.getByRole("button",{name:"Clear selection",exact:true}).click();
        check(await chart.getAttribute("selected-id")===null,"Clear did not reset selection");
      }
      await chart.getByRole("button",{name:"Show data table",exact:true}).click();
      check(await chart.locator("tbody tr").count()===5,"Table lost observations");
      await chart.getByRole("button",{name:"Show chart",exact:true}).click();
      const variants=await page.getByLabel("Preview variant").locator("option").allTextContents();
      for(const label of variants) {
        await page.getByLabel("Preview variant").selectOption({label});
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind} ${label} overflows page`);
        if(label==="Long category labels" && kind === "line-chart") {
          const bounds=await chart.locator('[part="point"]').evaluateAll(points=>points.map(point=>{
            const target=point.getBoundingClientRect(),label=point.querySelector('[part="point-label"]')!.getBoundingClientRect();
            return {targetLeft:target.left,targetRight:target.right,labelLeft:label.left,labelRight:label.right};
          }));
          const contained=bounds.every(item=>item.labelLeft>=item.targetLeft-1 && item.labelRight<=item.targetRight+1);
          await chart.screenshot({path:join(output,`line-chart-long-labels-${width}-${theme}.png`),animations:"disabled"});
          check(contained,"Long line labels escape their category target: "+JSON.stringify(bounds));
        }
        if(label==="Incomplete period")check(!await chart.locator('[part="comparison"]').isVisible(),"Incomplete comparison remains visible");
        if(label==="Missing interval" && kind === "line-chart")check(((await chart.locator('[part="path"]').getAttribute("d"))?.match(/M/g)??[]).length===2,"Missing interval was interpolated");
        if(label==="Zero measured")check(await chart.locator('[part="point-value"]').allTextContents().then(values=>values.every(value=>value==="0")),"Zero was lost");
        if(label==="No observations")check(await chart.getByText("No observations for this scope.",{exact:true}).isVisible(),"No-observation state is not visible");
        if(label==="Cached observations")check((await chart.locator('[part="status"]').textContent())?.includes("09:00 UTC"),"Cached timestamp is missing");
        if(label==="Loading" || label==="Load error")check(!await chart.locator('[part="visual"]').isVisible(),"Unavailable state shows old geometry");
      }
      await page.getByLabel("Preview variant").selectOption({label:"Default"});
    }
    if(kind === "donut-chart") {
      check(await chart.locator('[part="legend-item"]').count()===0,"Composition default is interactive");
      check(JSON.stringify(await chart.locator('[part="legend-value"]').allTextContents())===JSON.stringify(["115","80","55"]),"Storage values changed");
      check(JSON.stringify(await chart.locator('[part="legend-share"]').allTextContents())===JSON.stringify(["46%","32%","22%"]),"Storage shares changed");
      await page.getByLabel("Preview variant").selectOption({label:"Incomplete classification"});
      check(JSON.stringify(await chart.locator('[part="legend-share"]').allTextContents())===JSON.stringify(["46%","32%","22%"]),"Incomplete shares silently renormalized");
      check((await chart.locator('[part="note"]').textContent())?.includes("Unclassified"),"Unknown categories not disclosed");
      await page.getByLabel("Preview variant").selectOption({label:"Default"});
    }
    if(kind === "box-plot") {
      check(JSON.stringify(await chart.locator('[part="tick"]').allTextContents())===JSON.stringify(["0 ms","50 ms","100 ms","150 ms"]),"Distribution lost shared domain");
      await chart.getByRole("button",{name:/files.upload: median 42/}).press("Enter");
      check((await chart.locator('[part="selection"]').textContent())?.includes("Min–max 16 ms–126 ms"),"Distribution detail lost extremes");
      await chart.getByRole("button",{name:"Show as a table",exact:true}).click();
      check(await chart.locator("thead th").count()===4,"Distribution squeezes optional columns into summary");
      const fits=await chart.locator("table").evaluate(table=>table.getBoundingClientRect().width <= table.parentElement!.getBoundingClientRect().width+1);
      check(fits,"Distribution table clips count column");
      const numericLabelsFit=await chart.locator("table").evaluate(table=>
        [...table.querySelectorAll('thead th:not(:first-child),tbody tr[part="table-summary"] td:nth-child(2),tbody tr[part="table-summary"] td:last-child')].every(cell=>{
          const range=document.createRange(); range.selectNodeContents(cell.firstElementChild??cell);
          return range.getClientRects().length===1 && cell.scrollWidth<=cell.clientWidth+1;
        }));
      check(numericLabelsFit,"Distribution splits a numeric header or count across lines");
      await chart.locator("summary").first().click();
      check((await chart.locator("details").first().textContent())?.includes("Q1 34 ms"),"Distribution disclosure lost quartiles");
      await chart.screenshot({path:join(output,`box-plot-table-${width}-${theme}.png`),animations:"disabled"});
    }
    if(kind === "metric-card") {
      const directionOnly = await chart.evaluate(element=>{
        const host=element as HTMLElement & {trend:{label:string;tone?:string;direction?:string}};
        const original=host.trend;
        const color=()=>getComputedStyle(host.shadowRoot!.querySelector('[part="trend"]')!).color;
        const before=color();host.trend={...original,direction:"flat"};const unchanged=color()===before;host.trend=original;return unchanged;
      });
      check(directionOnly,"Metric direction alone implies success/error");
    }
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind} overflows at 200% root text size`);
    if(kind === "donut-chart" || kind === "box-plot") {
      const intactNumbers=await chart.locator("table").evaluate(table=>
        [...table.querySelectorAll('tbody tr[part="table-summary"] td:last-child,table[part="legend"] td:last-child')].every(cell=>{
          const range=document.createRange(); range.selectNodeContents(cell.firstElementChild??cell);
          return range.getClientRects().length===1;
        }));
      check(intactNumbers,`${kind} splits numeric values at 200% root text size`);
    }
    await chart.screenshot({path:join(output,`${kind}-text200-${width}-${theme}.png`),animations:"disabled"});
    await page.evaluate(()=>document.documentElement.style.fontSize="");
    await page.emulateMedia({reducedMotion:"no-preference"});
    if(kind === "box-plot") {
      await chart.getByRole("button",{name:"Clear selection",exact:true}).press("Enter");
      const focusReturned=await chart.evaluate(host=>host.shadowRoot!.activeElement===host.shadowRoot!.querySelector('[part="table-toggle"]'));
      check(focusReturned,"Clearing table selection loses keyboard focus");
    }
    results.push({kind,width,theme,status:"passed",checks:["native controls","semantic data","no page overflow","axe","200% root text scaling","reduced motion"]});
    console.log(`passed ${kind} ${width} ${theme}`);
  }
}
if(engine === chromium) {
  const touchPage=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await blockRemoteFonts(touchPage);
  touchPage.on("pageerror",error=>errors.push(error.message));
  for(const kind of ["bar-chart","line-chart","chart-panel","box-plot"]) {
    await touchPage.goto(`http://127.0.0.1:${server.port}/#patterns/${kind}`,{waitUntil:"domcontentloaded",timeout:60000});
    await touchPage.waitForSelector(`body[data-route-ready="patterns/${kind}"]`);
    const chart=touchPage.locator(`box-${kind}`).first();
    await chart.locator(kind === "box-plot" ? '[part="mark"]' : '[part="point"]').first().tap();
    check(Boolean(await chart.getAttribute("selected-id")),`${kind} touch selection failed`);
    await chart.getByRole("button",{name:"Clear selection",exact:true}).tap();
    check(await chart.getAttribute("selected-id")===null,`${kind} touch reset failed`);
    await chart.getByRole("button",{name:kind === "box-plot" ? "Show as a table" : "Show data table",exact:true}).tap();
    check(await chart.locator("table").isVisible(),`${kind} touch table toggle failed`);
    touchChecks.push(kind); console.log(`passed touch ${kind}`);
  }
  await touchPage.close();
}
check(!errors.length,errors.join("\n"));
writeFileSync(join(output,"results.json"),JSON.stringify({status:"passed",results,touchChecks,limitations:["200% root text scaling is an automated reflow fixture, not a manual browser-zoom or screen-reader pass.","Design acceptance requires reviewing the rendered screenshots against the approved studies."]},null,2));
} finally { await browser.close(); server.stop(true); }
