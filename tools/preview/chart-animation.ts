/** Actual browser timelines, not mocked animation callbacks. Run against the docs preview. */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { animatedChartIds } from "../../storybook/fixtures/chart-motion.js";
const root=resolve(import.meta.dir,"../.."),out=join(root,".regression-tmp/chart-animation");mkdirSync(out,{recursive:true});
const base=process.env.BOE_CHART_ANIMATION_URL??"http://127.0.0.1:4600";
const browser=await chromium.launch({headless:true});const page=await browser.newPage({reducedMotion:"no-preference"});
const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
const results:object[]=[];const check=(value:unknown,message:string)=>{if(!value)throw new Error(message);};
try {
 for(const width of [1440,390])for(const theme of ["light","dark"])for(const id of animatedChartIds){
  await page.setViewportSize({width,height:1000});await page.goto(`${base}/#patterns/${id}`);await page.waitForSelector(`body[data-route-ready="patterns/${id}"]`);
  await page.evaluate(theme=>{if(document.documentElement.dataset.theme!==theme)document.getElementById("theme-toggle")!.click();},theme);
  await page.addStyleTag({content:".masthead{position:static!important}"});
  check(await page.getByLabel("Preview variant").locator('option:checked').textContent()==="Animated entrance",`${id}: animated docs default missing`);
  check((await page.locator('#code-block').textContent())?.includes('animated'),`${id}: initial code does not match animated preview`);
  await page.getByLabel("Preview variant").selectOption({label:"Animated entrance"});
  const chart=page.locator(`box-${id}`).first();
  const timeline=await chart.evaluate((chart:any)=>{
    chart.animationPaused=true;
    const nested=chart.shadowRoot.querySelector('[part="series-host"]'),root=nested&&!nested.hidden&&nested.shadowRoot?nested.shadowRoot:chart.shadowRoot;
    const animations=[...new Set(Array.from(root.querySelectorAll('*')).flatMap((node:any)=>node.getAnimations()))] as Animation[];
    for(const animation of animations){animation.pause();animation.currentTime=0;}
    return {count:animations.length,first:animations.map(a=>a.effect!.getComputedTiming().progress),data:chart.getAttribute('series')??chart.getAttribute('points')??chart.getAttribute('segments')};
  });
  check(timeline.count>0,`${id}/${width}/${theme}: no real browser animation`);
  const capture=["grouped-bar-chart","line-chart","pie-chart","radar-chart","range-chart","box-plot"].includes(id)&&width===390&&theme==="dark";
  if(capture)await chart.screenshot({path:join(out,`${id}-first.png`),animations:"allow"});
  const middle=await chart.evaluate((chart:any)=>{
    const nested=chart.shadowRoot.querySelector('[part="series-host"]'),root=nested&&!nested.hidden&&nested.shadowRoot?nested.shadowRoot:chart.shadowRoot;
    const animations=[...new Set(Array.from(root.querySelectorAll('*')).flatMap((node:any)=>node.getAnimations()))] as Animation[];
    for(const animation of animations)animation.currentTime=600;
    return animations.map(a=>a.effect!.getComputedTiming().progress);
  });
  check(middle.some(p=>p!==null&&p>0&&p<1),`${id}: missing intermediate frame`);
  if(capture)await chart.screenshot({path:join(out,`${id}-middle.png`),animations:"allow"});
  await chart.evaluate((chart:any)=>chart.finishAnimation());
  check(await chart.getByRole("button",{name:"Replay animation",exact:true}).isVisible(),`${id}: replay control missing`);
  await page.addScriptTag({path:join(root,"node_modules/axe-core/axe.min.js")});
  const violations=await chart.evaluate(async chart=>(await (window as any).axe.run(chart,{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]}})).violations.map((v:any)=>v.id));
  check(!violations.length,`${id}/${theme}: axe ${violations}`);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id}/${width}: overflow`);
  if(capture)await chart.screenshot({path:join(out,`${id}-final.png`),animations:"allow"});
  // Native pause/replay must work on repeated runs and reduced motion must win.
  await chart.getByRole("button",{name:"Replay animation",exact:true}).click();
  await chart.getByRole("button",{name:"Pause animation",exact:true}).click();
  check(await chart.evaluate((chart:any)=>chart.animationPaused),`${id}: pause property not reflected`);
  await page.emulateMedia({reducedMotion:"reduce"});
  await chart.getByRole("button",{name:"Replay animation",exact:true}).waitFor({state:"detached"});
  check(await chart.getByRole("button",{name:"Replay animation",exact:true}).count()===0,`${id}: reduced-motion controls remain`);
  check(await chart.evaluate((chart:any)=>chart.getAttribute('series')??chart.getAttribute('points')??chart.getAttribute('segments'))===timeline.data,`${id}: motion changed source observations`);
  await page.emulateMedia({reducedMotion:"no-preference"});
  results.push({id,width,theme,animations:timeline.count,first:timeline.first,middle,passed:true});
 }
 // Exercise every named sample equivalent and interrupted/repeated lifecycle.
 await page.goto(`${base}/#patterns/line-chart`);await page.waitForSelector('body[data-route-ready="patterns/line-chart"]');
 // Measure the actual geometric center and outward expansion, including vertical boxes.
 for(const width of [1440,390])for(const id of ["range-chart","box-plot"]){
  await page.setViewportSize({width,height:1000});await page.goto(`${base}/#patterns/${id}`);await page.waitForSelector(`body[data-route-ready="patterns/${id}"]`);
  for(const orientation of id==="box-plot"?["horizontal","vertical"]:["horizontal"]){
   const geometry=await page.locator(`box-${id}`).first().evaluate(async(chart:any,orientation)=>{
    if(chart.localName==='box-box-plot')chart.orientation=orientation;
    chart.animationEasing='linear';chart.animationPaused=true;chart.replayAnimation();await Promise.resolve();await Promise.resolve();
    const root=chart.shadowRoot,target=root.querySelector(chart.localName==='box-box-plot'?'[part="distribution"]':'[part="range"]');
    const shape=target.querySelector('[part="box"]')??target;
    const animations=target.getAnimations();
    const rect=()=>{const r=shape.getBoundingClientRect();return {low:orientation==='vertical'?r.top:r.left,high:orientation==='vertical'?r.bottom:r.right};};
    for(const a of animations)a.currentTime=0;const first=rect();
    for(const a of animations)a.currentTime=600;const middle=rect();
    chart.finishAnimation();const final=rect();return {first,middle,final,count:animations.length};
   },orientation);
   check(geometry.count>0,`${id}/${orientation}: no center expansion`);
   const center=(geometry.final.low+geometry.final.high)/2;
   check(Math.abs(geometry.first.low-center)<1&&Math.abs(geometry.first.high-center)<1,`${id}/${orientation}: starts away from box center`);
   check(Math.abs(geometry.middle.low-(center+(geometry.final.low-center)*.5))<1&&Math.abs(geometry.middle.high-(center+(geometry.final.high-center)*.5))<1,`${id}/${orientation}: does not expand both directions`);
   await page.locator(`box-${id}`).first().screenshot({path:join(out,`${id}-${orientation}-${width}-expanded.png`),animations:'allow'});
   if(id==="box-plot"&&orientation==="vertical"){
    await page.locator(`box-${id}`).first().evaluate(async(chart:any)=>{chart.replayAnimation();await Promise.resolve();await Promise.resolve();for(const node of chart.shadowRoot.querySelectorAll('*'))for(const animation of node.getAnimations())animation.currentTime=600;});
    await page.locator(`box-${id}`).first().screenshot({path:join(out,`${id}-${orientation}-${width}-middle.png`),animations:'allow'});
    await page.locator(`box-${id}`).first().evaluate((chart:any)=>chart.finishAnimation());
   }
  }
 }
 await page.goto(`${base}/#patterns/line-chart`);await page.waitForSelector('body[data-route-ready="patterns/line-chart"]');
 for(const name of ["Delayed marks","Drop entrance","Progressive drawing","Eased progressive drawing","Progressive dense series"]){
  await page.getByLabel("Preview variant").selectOption({label:name});
  const line=page.locator('box-line-chart').first();
  check(await line.getByRole("button",{name:"Replay animation",exact:true}).isVisible(),`${name}: missing controls`);
  if(name==="Drop entrance"){
    const geometry=await line.evaluate((line:any)=>{
      line.animationPaused=true;
      for(const node of line.shadowRoot.querySelectorAll('*'))for(const animation of node.getAnimations()){animation.pause();animation.currentTime=600;}
      const dot=line.shadowRoot.querySelector('[part="dot"]'),svg=dot.ownerSVGElement;
      const box=dot.getBoundingClientRect(),plot=svg.getBoundingClientRect();
      return {ratio:box.width/box.height,actualY:box.top+box.height/2,expectedY:plot.top+Number(dot.getAttribute('cy'))/56*plot.height*.5};
    });
    check(Math.abs(geometry.ratio-1)<.08&&Math.abs(geometry.actualY-geometry.expectedY)<2,`Drop stretched or detached its point glyph: ${JSON.stringify(geometry)}`);
    await line.screenshot({path:join(out,'line-drop-middle.png'),animations:'allow'});
  }
  if(name==="Progressive dense series")check(await line.evaluate((line:any)=>line.series.length===2&&line.series.every((series:any)=>series.points.length===1000)&&line.shadowRoot.querySelector('[part="series-host"]').shadowRoot.querySelectorAll('[part="series-path"]').length===2),'Dense progressive example lost its source series or paths');
  await line.evaluate((line:any)=>{line.replayAnimation();line.replayAnimation();line.finishAnimation();});
 }
 await page.goto(`${base}/#patterns/grouped-bar-chart`);await page.waitForSelector('body[data-route-ready="patterns/grouped-bar-chart"]');
 await page.getByLabel("Preview variant").selectOption({label:"Active mark loop"});
 const chart=page.locator('box-grouped-bar-chart').first(),plot=chart.locator('[part="plot"]');await plot.focus();await page.keyboard.press("ArrowRight");
 // ResizeObserver can replace the just-inspected mark during the same frame.
 await page.waitForFunction(()=>Array.from(document.querySelector('box-grouped-bar-chart')!.shadowRoot!.querySelectorAll('[part="focus-marker"] circle')).some(node=>node.getAnimations().some(a=>a.effect!.getTiming().iterations===Infinity)));
 await chart.locator('[part="mark"]').nth(1).hover();
 await page.waitForFunction(()=>document.querySelector('box-grouped-bar-chart')!.shadowRoot!.querySelectorAll('[part="mark"]')[1]?.getAnimations().some(a=>a.effect!.getTiming().iterations===Infinity));
 await chart.getByRole("button",{name:"Pause animation",exact:true}).click();
 await chart.evaluate((chart:any)=>{const parent=chart.parentNode;chart.remove();parent.append(chart);});
 await chart.evaluate((chart:any)=>chart.finishAnimation());
 // Current-main interval controls must animate their associated visible marks.
 await page.goto(`${base}/#patterns/distribution-timeline`);await page.waitForSelector('body[data-route-ready="patterns/distribution-timeline"]');
 await page.getByLabel("Preview variant").selectOption({label:"Inspect intervals"});
 const timelineChart=page.locator('box-distribution-timeline').first();
 await timelineChart.evaluate((chart:any)=>{chart.animated=true;chart.animationPreset='loop';chart.animationLoop=true;});
 await timelineChart.locator('[part="interval-control"]').nth(1).focus();
 await page.waitForFunction(()=>{
   const root=document.querySelector('box-distribution-timeline')!.shadowRoot!,control=root.activeElement as HTMLElement|null;
   return [...root.querySelectorAll('[part="interval"]')].some(node=>(node as HTMLElement).dataset.animationPointId===control?.dataset.pointId&&node.getAnimations().some(a=>a.effect!.getTiming().iterations===Infinity));
 });
 await page.keyboard.press('End');
 await page.waitForFunction(()=>{
   const root=document.querySelector('box-distribution-timeline')!.shadowRoot!,control=root.activeElement as HTMLElement|null,marks=root.querySelectorAll('[part="interval"]'),last=marks[marks.length-1] as HTMLElement;
   return last.dataset.animationPointId===control?.dataset.pointId&&last.getAnimations().some(a=>a.effect!.getTiming().iterations===Infinity);
 });
 await timelineChart.evaluate((chart:any)=>chart.finishAnimation());
 await page.goto(`${base}/#patterns/scatter-chart`);await page.waitForSelector('body[data-route-ready="patterns/scatter-chart"]');
 await page.getByLabel("Preview variant").selectOption({label:"Animated entrance"});
 const denseChart=page.locator('box-scatter-chart').first();
 const dense=await denseChart.evaluate(async(chart:any)=>{
   chart.animationPaused=false;chart.animationPreset="auto";
   const start=performance.now();
   chart.series=[{id:"dense",label:"Illustrative dense observations",points:Array.from({length:100000},(_,i)=>({id:String(i),x:i,y:i%53}))}];chart.replayAnimation();
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const animations=[...new Set(Array.from(chart.shadowRoot.querySelectorAll('*')).flatMap((node:any)=>node.getAnimations()))] as Animation[];
   const result={source:chart.series[0].points.length,marks:chart.shadowRoot.querySelectorAll('[part="mark"]').length,animations:animations.length,setupToFirstPaintMs:performance.now()-start};
   chart.finishAnimation();return result;
 });
 check(dense.marks>0&&dense.marks<=2000&&dense.animations>0&&dense.animations<=2000,'Dense animation was empty or not bounded by the rendering view');
 // Text-size stress applies to the new motion controls as well as the chart.
 for(const scale of [2,4]){
   await page.addStyleTag({content:`html{font-size:${16*scale}px!important}`});
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Motion controls overflow at ${scale*100}% root text size`);
 }
 check(errors.length===0,`Browser errors: ${errors}`);
 writeFileSync(join(out,"results.json"),JSON.stringify({results,dense,errors},null,2));
 console.log(`${results.length} real animation/theme/viewport cases, all presets and interrupted flows passed; ${out}`);
} finally {await browser.close();}
