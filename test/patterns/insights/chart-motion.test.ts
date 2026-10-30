import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../../src/patterns/insights/index.js";
import { BarChart } from "../../../src/patterns/insights/bar-chart.js";
import type { ChartElement } from "../../../src/patterns/insights/chart-element.js";
import { chartEasing, radialReveal } from "../../../src/patterns/insights/chart-motion.js";
import { periodChartHtml, dailyChartHtml, storageChartHtml, metricChartHtml, distributionChartHtml } from "../../../storybook/fixtures/insights.js";
import { stackedBarsHtml, rangesHtml, numericLineHtml } from "../../../storybook/fixtures/analytic-charts.js";
import { distributionTimelineHtml } from "../../../storybook/fixtures/distribution-timeline.js";
import { chartFamilyExamples } from "../../../storybook/fixtures/chart-family.js";
import { animatedChartIds, withChartMotionVariants } from "../../../storybook/fixtures/chart-motion.js";
import { FRAMEWORKS, frameworkSnippet } from "../../../docs-site/framework-snippets.js";

const fixtures: Record<string,string> = {
  ...chartFamilyExamples, "bar-chart":periodChartHtml("bar-chart"), "line-chart":periodChartHtml("line-chart"),
  "chart-panel":dailyChartHtml,"donut-chart":storageChartHtml,"metric-card":metricChartHtml,
  "box-plot":distributionChartHtml,"stacked-bar-chart":stackedBarsHtml,"range-chart":rangesHtml,"distribution-timeline":distributionTimelineHtml,
};
interface Recorded { element:Element; frames:Keyframe[]; options:KeyframeAnimationOptions; animation:Animation; }
let recorded:Recorded[];
let media:MediaQueryList;
let animateDescriptor:PropertyDescriptor|undefined;
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function mount(id="grouped-bar-chart",attributes=""):ChartElement {
  const container=document.createElement("div");container.innerHTML=fixtures[id].replace(`<box-${id}`,`<box-${id} ${attributes}`);
  document.body.append(container);return container.querySelector(`box-${id}`)!;
}
beforeEach(()=>{
  recorded=[];
  animateDescriptor=Object.getOwnPropertyDescriptor(Element.prototype,"animate");
  Object.defineProperty(Element.prototype,"animate",{configurable:true,writable:true,value:function(this:Element,keyframes:Keyframe[],options:KeyframeAnimationOptions){
    const animation={playState:"running",onfinish:null,cancel:vi.fn(function(this:{playState:string}){this.playState="idle";}),pause:vi.fn(function(this:{playState:string}){this.playState="paused";}),play:vi.fn(function(this:{playState:string}){this.playState="running";})} as unknown as Animation;
    recorded.push({element:this,frames:keyframes,options,animation});return animation;
  }});
  media=Object.assign(new EventTarget(),{matches:false,media:"(prefers-reduced-motion: reduce)"}) as unknown as MediaQueryList;
  vi.stubGlobal("matchMedia",()=>media);
});
afterEach(async()=>{
  document.body.replaceChildren();await flush();vi.restoreAllMocks();vi.unstubAllGlobals();
  if(animateDescriptor)Object.defineProperty(Element.prototype,"animate",animateDescriptor);else delete (Element.prototype as Partial<Element>).animate;
});

describe.each(animatedChartIds)("%s animation contract",id=>{
  it("stays static by default and animates only after explicit boolean opt-in",async()=>{
    const chart=mount(id);await flush();expect(recorded).toHaveLength(0);expect(chart.animated).toBe(false);
    chart.animated=true;await flush();expect(recorded.length).toBeGreaterThan(0);
    expect(chart.shadowRoot!.querySelector('[part="animation-controls"]')).not.toBeNull();
    const active=recorded.map(item=>item.animation);chart.animated=false;await flush();
    for(const animation of active)expect(animation.cancel).toHaveBeenCalled();
    expect(chart.shadowRoot!.querySelector('[part="animation-controls"]')).toBeNull();
  });
});

it.each(["range-chart","box-plot"])("expands %s from the box center without moving the interaction surface or guides",async id=>{
  const chart=mount(id,"animated animation-easing=linear");await flush();
  const effects=recorded.filter(item=>item.element.getAttribute("part")===(id==="range-chart"?"range":"distribution"));
  expect(effects.length).toBeGreaterThan(0);
  for(const effect of effects){
    expect(effect.frames[0].transform).toBe("scaleX(0)");
    expect(effect.frames[20].transform).toBe("scaleX(0.5)");
    expect(effect.frames.at(-1)!.transform).toBe("scaleX(1)");
    expect(effect.frames[0].transformOrigin).toBe(effect.element.getAttribute("data-animation-origin")??"50% 50%");
  }
  if(id==="box-plot"){
    expect(recorded.some(item=>item.element.matches('[part="mark"],[part="reference"],[part="gridline"]'))).toBe(false);
    chart.setAttribute("orientation","vertical");chart.replayAnimation();await flush();
    const vertical=recorded.filter(item=>item.element.getAttribute("data-animation-axis")==="y");
    expect(vertical.length).toBeGreaterThan(0);
    expect(vertical[0].frames[0].transform).toBe("scaleY(0)");
    expect(vertical[0].frames.at(-1)!.transform).toBe("scaleY(1)");
    const mark=vertical[0].element.parentElement!;
    const box=mark.querySelector<HTMLElement>('[part="box"]')!;
    const center=100-parseFloat(box.style.getPropertyValue("--start"))-parseFloat(box.style.getPropertyValue("--size"))/2;
    expect(parseFloat(String(vertical[0].frames[0].transformOrigin).split(" ")[1])).toBeCloseTo(center,3);
  }
});

it("coalesces source writes, replays updated data, and preserves the clock on metadata/layout rerenders",async()=>{
  const clock=vi.spyOn(performance,"now").mockReturnValue(0);
  const chart=mount("grouped-bar-chart","animated");await flush();const initial=recorded.length;
  chart.setAttribute("selected-id","upload-1");await flush();expect(recorded).toHaveLength(initial);
  for(const item of recorded)item.animation.currentTime=200;
  chart.setAttribute("heading","Renamed");await flush();expect(recorded.slice(initial).every(item=>item.animation.currentTime===200)).toBe(true);
  const beforeUpdate=recorded.length;
  clock.mockReturnValue(1000);
  const series=JSON.parse(chart.getAttribute("series")!);series[0].points[0].y=101;
  chart.setAttribute("series",JSON.stringify(series));series[0].points[0].y=102;chart.setAttribute("series",JSON.stringify(series));
  await flush();expect(recorded.length).toBe(beforeUpdate+initial);expect(chart.getAttribute("series")).toContain("102");expect(recorded.at(-1)!.animation.currentTime).toBe(0);
});
it("settles rapid or paused data updates to the latest exact snapshot",async()=>{
  const clock=vi.spyOn(performance,"now").mockReturnValue(0);
  const chart=mount("grouped-bar-chart","animated");await flush();const count=recorded.length;
  const series=JSON.parse(chart.getAttribute("series")!);
  for(const time of [100,200,300]){clock.mockReturnValue(time);series[0].points[0].y=time;chart.setAttribute("series",JSON.stringify(series));await flush();}
  expect(recorded).toHaveLength(count);expect(chart.getAttribute("series")).toContain("300");expect(recorded.every(item=>vi.mocked(item.animation.cancel).mock.calls.length>0)).toBe(true);
  clock.mockReturnValue(2000);chart.animationPaused=true;series[0].points[0].y=400;chart.setAttribute("series",JSON.stringify(series));await flush();expect(recorded).toHaveLength(count);
});
it("keeps data geometry, domains, source records and point hit targets unchanged",async()=>{
  const chart=mount();const series=chart.getAttribute("series"),root=chart.shadowRoot!;
  const geometry=Array.from(root.querySelectorAll('[part="marks"] > *')).map(node=>node.outerHTML);
  chart.animated=true;await flush();
  expect(chart.getAttribute("series")).toBe(series);
  expect(Array.from(root.querySelectorAll('[part="marks"] > *')).map(node=>node.outerHTML)).toEqual(geometry);
  expect(recorded.every(item=>item.element.getAttribute("fill")!=="transparent")).toBe(true);
  chart.finishAnimation();expect(recorded.every(item=>vi.mocked(item.animation.cancel).mock.calls.length>0)).toBe(true);
});
it("reveals direct values as marks settle, with exact source labels available throughout",async()=>{
  const chart=mount("grouped-bar-chart","animated");await flush();
  const labels=recorded.filter(item=>item.element.getAttribute("part")==="direct-value");expect(labels.length).toBeGreaterThan(0);
  for(const label of labels){expect(label.frames[0].opacity).toBe(0);expect(label.frames[20].opacity).toBe(0);expect(label.frames.at(-1)!.opacity).toBeCloseTo(1);}
  expect(chart.getAttribute("series")).toContain('"y":71');chart.finishAnimation();
  expect(chart.shadowRoot!.querySelector('[part="direct-value"]')!.textContent).toBe("42");
});
it("applies one global delay and bounds stagger inside the configured cycle",async()=>{
  mount("grouped-bar-chart",'animated animation-preset="delay" animation-duration="1000" animation-delay="150" animation-stagger="5000"');await flush();
  expect(recorded[0].options.delay).toBe(150);
  expect(Math.max(...recorded.map(item=>Number(item.options.delay)+Number(item.options.duration)))).toBeCloseTo(1150);
  expect(recorded.at(-1)!.options.delay).toBeGreaterThan(recorded[0].options.delay! as number);
});
it.each(["progressive","progressive-easing","drop","fade"])("supports the %s preset without changing final line paths",async preset=>{
  const chart=mount("line-chart",`animated animation-preset="${preset}"`);await flush();
  expect(recorded.length).toBeGreaterThan(0);
  expect(recorded[0].frames[0].offset).toBe(0);expect(recorded[0].frames.at(-1)!.offset).toBe(1);
  if(preset.startsWith("progressive"))expect(recorded[0].frames.at(-1)!.clipPath).toContain("0%");
  if(preset==="drop")expect(recorded.some(item=>item.frames.some(frame=>String(frame.transform).includes("scaleY")))).toBe(true);
  if(preset==="drop"){
    const dots=recorded.filter(item=>item.element.matches("circle,ellipse"));expect(dots.length).toBeGreaterThan(0);
    expect(dots.every(item=>item.frames.every(frame=>String(frame.transform).startsWith("translateY")))).toBe(true);
    expect(new Set(recorded.map(item=>item.options.delay)).size).toBe(1);
  }
  const path=chart.shadowRoot!.querySelector('[part="path"]')!.getAttribute("d");chart.finishAnimation();expect(chart.shadowRoot!.querySelector('[part="path"]')!.getAttribute("d")).toBe(path);
});
it("animates numeric line mode within its independent shadow boundary",async()=>{
  const container=document.createElement("div");container.innerHTML=numericLineHtml.replace('<box-line-chart','<box-line-chart animated');document.body.append(container);await flush();
  expect(recorded.length).toBeGreaterThan(0);expect(recorded.every(item=>item.element.getRootNode()!==container.querySelector("box-line-chart")!.shadowRoot)).toBe(true);
});
it("supports pause, resume, replay and finish through native controls and properties",async()=>{
  const chart=mount("pie-chart","animated animation-loop");await flush();
  expect(recorded[0].options.iterations).toBe(Infinity);
  const root=chart.shadowRoot!,pause=root.querySelector<HTMLButtonElement>('[data-motion-action="pause"]')!;
  pause.click();await flush();expect(chart.animationPaused).toBe(true);expect(recorded[0].animation.pause).toHaveBeenCalled();
  expect(pause.textContent).toBe("Resume animation");pause.click();await flush();expect(recorded[0].animation.play).toHaveBeenCalled();
  const count=recorded.length;root.querySelector<HTMLButtonElement>('[data-motion-action="replay"]')!.click();await flush();expect(recorded.length).toBe(count+1);
  chart.finishAnimation();expect(recorded.at(-1)!.animation.cancel).toHaveBeenCalled();
});
it("loops only the active inspected point for the loop preset and stops on exit",async()=>{
  const chart=mount("grouped-bar-chart",'animated animation-preset="loop" animation-loop');await flush();expect(recorded).toHaveLength(0);
  const plot=chart.shadowRoot!.querySelector<HTMLElement>('[part="plot"]')!;plot.focus();plot.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,composed:true}));await flush();
  expect(recorded.length).toBeGreaterThan(0);expect(recorded.at(-1)!.options.iterations).toBe(Infinity);expect(recorded.at(-1)!.element.matches("circle")).toBe(true);
  chart.dispatchEvent(new Event("pointerleave"));expect(recorded.at(-1)!.animation.cancel).toHaveBeenCalled();
  const count=recorded.length;chart.replayAnimation();await flush();expect(recorded.length).toBe(count+1);
  chart.finishAnimation();const finishedCount=recorded.length;chart.setAttribute("heading","Finished presentation");await flush();expect(recorded).toHaveLength(finishedCount);
});
it("immediately reveals final geometry when keyboard inspection starts",async()=>{
  const chart=mount("grouped-bar-chart","animated");await flush();chart.shadowRoot!.querySelector<HTMLElement>('[part="plot"]')!.focus();
  expect(recorded.every(item=>vi.mocked(item.animation.cancel).mock.calls.length>0)).toBe(true);
});
it("maps pointer inspection to the exact point even when point and series IDs overlap",async()=>{
  const chart=mount("grouped-bar-chart",'animated animation-preset="loop" animation-loop');
  chart.setAttribute("series",JSON.stringify([{id:"s",label:"S",points:[{id:"first",x:1,y:2},{id:"s",x:2,y:3}]}]));await flush();
  chart.shadowRoot!.querySelector('[fill="transparent"][data-point="s"]')!.dispatchEvent(new Event("pointerover",{bubbles:true,composed:true}));await flush();
  expect((recorded.at(-1)!.element as HTMLElement).dataset.point).toBe("s");
});
it("pulses bubble attention without changing its quantitative area",async()=>{
  const chart=mount("bubble-chart",'animated animation-preset="loop" animation-loop');await flush();
  chart.shadowRoot!.querySelector('[part="mark"]')!.dispatchEvent(new Event("pointerover",{bubbles:true,composed:true}));await flush();
  expect(recorded.at(-1)!.frames.every(frame=>frame.transform===undefined)).toBe(true);expect(recorded.at(-1)!.frames.some(frame=>Number(frame.opacity)<1)).toBe(true);
});
it("respects reduced motion initially and during an active loop, without hiding exact data",async()=>{
  Object.assign(media,{matches:true});const chart=mount("pie-chart","animated animation-loop");await flush();expect(recorded).toHaveLength(0);
  expect(chart.shadowRoot!.querySelector("table")!.textContent).toContain("115");
  Object.assign(media,{matches:false});chart.replayAnimation();await flush();expect(recorded).toHaveLength(1);
  Object.assign(media,{matches:true});media.dispatchEvent(new Event("change"));expect(recorded[0].animation.cancel).toHaveBeenCalled();expect(chart.shadowRoot!.querySelector('[part="animation-controls"]')).toBeNull();
});
it("cleans up and replays exactly once after disconnect/reconnect",async()=>{
  const chart=mount("pie-chart","animated animation-loop");await flush();chart.remove();expect(recorded[0].animation.cancel).toHaveBeenCalled();
  document.body.append(chart);await flush();expect(recorded).toHaveLength(2);
  chart.remove();chart.replayAnimation();await flush();expect(recorded).toHaveLength(2);
});
it("pauses hidden-tab work and resumes only when the host has not paused it",async()=>{
  const chart=mount("pie-chart","animated animation-loop");await flush();const hidden=vi.spyOn(document,"hidden","get");hidden.mockReturnValue(true);document.dispatchEvent(new Event("visibilitychange"));expect(recorded[0].animation.pause).toHaveBeenCalled();
  chart.animationPaused=true;await flush();hidden.mockReturnValue(false);document.dispatchEvent(new Event("visibilitychange"));expect(recorded[0].animation.play).not.toHaveBeenCalled();
});
it("has a static fallback without the Web Animations API and with zero duration",async()=>{
  Object.defineProperty(Element.prototype,"animate",{configurable:true,value:undefined});const chart=mount("pie-chart","animated");await flush();expect(chart.shadowRoot!.querySelector('[part="animation-controls"]')).toBeNull();
  chart.animationDuration=0;chart.replayAnimation();await flush();expect(recorded).toHaveLength(0);expect(chart.shadowRoot!.querySelector('[part="segment"]')).not.toBeNull();
});
it("normalizes finite timing options and retains boolean HTML semantics",()=>{
  const chart=mount();chart.animationDuration=Infinity;expect(chart.animationDuration).toBe(600);chart.animationDelay=-1;expect(chart.animationDelay).toBe(0);chart.animationStagger=100000;expect(chart.animationStagger).toBe(60000);
  chart.setAttribute("animated","false");expect(chart.animated).toBe(true);chart.animated=false;expect(chart.hasAttribute("animated")).toBe(false);
  chart.setAttribute("animation-preset","unknown");expect(chart.animationPreset).toBe("auto");chart.setAttribute("animation-easing","unknown");expect(chart.animationEasing).toBe("ease-out-cubic");
});
it("upgrades pre-registration animation properties and supports an alternate registered tag",async()=>{
  const chart=document.createElement("boe-motion-upgrade") as ChartElement;
  chart.animated=true;chart.animationDuration=900;
  chart.setAttribute("points",JSON.stringify([{id:"a",label:"A",value:42}]));document.body.append(chart);
  customElements.define("boe-motion-upgrade",class extends BarChart{});await flush();
  expect(Object.hasOwn(chart,"animated")).toBe(false);expect(chart.animationDuration).toBe(900);expect(recorded.length).toBeGreaterThan(0);
});
it.each([["stacked-bar-chart","segment"],["range-chart","range"],["metric-card","value"],["distribution-timeline","interval"]])("supports active-mark loops in %s",async(id,part)=>{
  const chart=mount(id,'animated animation-preset="loop" animation-loop');await flush();
  chart.shadowRoot!.querySelector(`[part="${part}"]`)!.dispatchEvent(new Event("pointerover",{bubbles:true,composed:true}));await flush();
  expect(recorded.length).toBeGreaterThan(0);expect(recorded.at(-1)!.options.iterations).toBe(Infinity);
});
it("keeps radial reveal vertex counts stable and easing endpoints exact",()=>{
  expect(radialReveal(0).split(",")).toHaveLength(radialReveal(.5).split(",").length);
  for(const name of ["linear","ease-out-quad","ease-out-cubic","ease-out-quart","ease-out-quint","ease-in-quad","ease-in-cubic","ease-in-quart","ease-in-quint","ease-in-out-sine","ease-out-bounce","ease-in-out-elastic"] as const){expect(chartEasing(name,0)).toBeCloseTo(0);expect(chartEasing(name,1)).toBeCloseTo(1);expect(Number.isFinite(chartEasing(name,.43))).toBe(true);}
});
it("uses the same complete optional animation markup in all seven framework examples",()=>{
  for(const id of animatedChartIds){const variant=withChartMotionVariants(id,[{name:"Default",html:fixtures[id]}]).find(v=>v.name==="Animated entrance")!;
    for(const framework of FRAMEWORKS){const snippet=frameworkSnippet(framework.id,id,`box-${id}`,variant.codeHtml!);expect(snippet).toContain("animated");expect(snippet).toContain("animation-duration");expect(snippet).toContain(`box-${id}`);}
  }
});

it("pulses the visual interval associated with the distribution timeline's selectable control",async()=>{
  const chart=mount("distribution-timeline",'animated animation-preset="loop" animation-loop selectable');await flush();
  const controls=chart.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="interval-control"]');
  expect(controls.length).toBeGreaterThan(1);
  controls[1].focus();await flush();
  const target=recorded.at(-1)!;
  expect(target.element.getAttribute("part")).toBe("interval");
  expect(target.element.getAttribute("data-animation-point-id")).toBe(controls[1].dataset.pointId);
  expect(target.options.iterations).toBe(Infinity);
});

it.each(["box-plot","distribution-timeline"])("animates settled property snapshots in %s and settles rapid replacements",async id=>{
  const clock=vi.spyOn(performance,"now").mockReturnValue(0);
  const chart=mount(id,"animated") as ChartElement & { rows:unknown[];points:unknown[] };await flush();
  const field=id==="box-plot"?"rows":"points";
  const values=structuredClone(chart[field]) as Array<{median:number;q1:number;q3:number}>;
  expect(values.length).toBeGreaterThan(0);const count=recorded.length;
  clock.mockReturnValue(2000);values[0].median=(values[0].q1+values[0].q3)/2;
  chart[field]=values;await flush();expect(recorded.length).toBeGreaterThan(count);
  const after=recorded.length;clock.mockReturnValue(2100);chart[field]=structuredClone(values);await flush();
  expect(recorded).toHaveLength(after);
  expect(chart[field][0]).toEqual(values[0]);
});
