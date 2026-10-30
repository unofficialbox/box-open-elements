import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupedBarChart } from "../../../src/patterns/insights/grouped-bar-chart.js";
import { ScatterChart } from "../../../src/patterns/insights/scatter-chart.js";
import { BubbleChart } from "../../../src/patterns/insights/bubble-chart.js";
import { AreaChart } from "../../../src/patterns/insights/area-chart.js";
import { MixedChart } from "../../../src/patterns/insights/mixed-chart.js";
import { RadarChart } from "../../../src/patterns/insights/radar-chart.js";
import { PolarAreaChart } from "../../../src/patterns/insights/polar-area-chart.js";
import { PieChart } from "../../../src/patterns/insights/pie-chart.js";
import { groupedBars, numericScale, bubbleRadius, linePath, renderingPoints, validateCartesian, type CartesianSeries } from "../../../src/patterns/insights/cartesian-model.js";
import { calendarScale } from "../../../src/patterns/insights/calendar-scale.js";
import { activitySeries, scatterSeries } from "../../../storybook/fixtures/chart-family.js";

afterEach(() => document.body.replaceChildren());
const mount = <T extends HTMLElement>(chart: T) => { document.body.append(chart); return chart.shadowRoot!; };
const click = (root: ShadowRoot, action: string) => root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!.click();

describe("shared mathematical contracts", () => {
 it("accumulates positive and negative stacks independently, preserving input", () => {
  const input = [4, -3, 5, -2].map((y, i) => ({ id: String(i), label: String(i), points: [{ id: `p${i}`, x: 1, y }] }));
  input.forEach(s => { Object.freeze(s.points[0]); Object.freeze(s.points); Object.freeze(s); }); Object.freeze(input);
  expect(groupedBars(input, true).map(g => [g.low, g.high])).toEqual([[0,4],[-3,0],[4,9],[-5,-3]]);
  expect(groupedBars(input, false).map(g => g.group)).toEqual([0,1,2,3]);
 });
 it("separates stack groups and units and rejects overflowing totals", () => {
  const series = [1,2,3].map((y,i) => ({ id: String(i), label: "S", stack: i === 2 ? "b" : "a", axis: i === 1 ? "right" : "left", points: [{ id: String(i), x: 0, y }] }));
  expect(groupedBars(series, true).map(g => [g.group,g.low,g.high])).toEqual([[0,0,1],[1,0,2],[2,0,3]]);
  expect(() => groupedBars([0,1].map(i => ({ id:String(i),label:"S",points:[{id:String(i),x:0,y:Number.MAX_VALUE}] })), true)).toThrow(/finite/);
 });
 it("scales bubbles by area with an actual zero", () => {
  expect(bubbleRadius(0, 100)).toBe(0);
  expect(bubbleRadius(50,100) ** 2 / bubbleRadius(100,100) ** 2).toBeCloseTo(.5);
 });
 it("never connects a null in linear, monotone or step paths", () => {
  for (const mode of ["linear","monotone","step-before","step-after","step-middle"] as const) {
   const path = linePath([{x:0,y:1},{x:2,y:4},{x:4,y:null},{x:8,y:3}], mode);
   expect(path.match(/M /g)).toHaveLength(2); expect(path).not.toMatch(/NaN|Infinity/);
  }
  expect(linePath([{x:0,y:0},{x:10,y:10}], "step-middle")).toContain("H 5 V 10 H 10");
 });
 it("bounds dense views while retaining peaks and source arrays", () => {
  const points = Array.from({length:100000}, (_,i) => ({id:String(i),x:i,y:i===12345?1000:1}));
  const reduced = renderingPoints(points, 1000);
  expect(reduced.length).toBeLessThanOrEqual(1000); expect(reduced.some(p=>p.y===1000)).toBe(true);
  expect(points).toHaveLength(100000); expect(reduced[0]).toBe(points[0]);
  points[100].y = null as unknown as number;
  expect(renderingPoints(points,1000).some(p=>p.y===null)).toBe(true);
 });
 it("validates stable IDs and ordering without imposing line ordering on scatter", () => {
  const input = [{id:"s",label:"S",points:[{id:"a",x:2,y:1},{id:"b",x:1,y:null}]}];
  expect(validateCartesian(input,[{id:"primary",label:"Y"}],false)).toBeNull();
  expect(validateCartesian(input,[{id:"primary",label:"Y"}],true)).toMatch(/increasing/);
  input[0].points[1].id="a"; expect(validateCartesian(input,[{id:"primary",label:"Y"}],false)).toMatch(/unique/);
 });
 it("uses finite domains at opposite numeric extremes and rejects nonpositive log data", () => {
  const scale = numericScale([],false,[-Number.MAX_VALUE,Number.MAX_VALUE]);
  expect(scale.position(0)).toBe(.5); expect(scale.ticks.every(Number.isFinite)).toBe(true);
  expect(()=>numericScale([0,1],true)).toThrow(/positive/);
  expect(numericScale([1,10,100],true).position(10)).toBe(.5);
 });
 it("aligns local calendar days across DST rather than adding 24 hours", () => {
  const scale=calendarScale([Date.parse("2026-03-07T00:00:00-05:00"),Date.parse("2026-03-10T00:00:00-04:00")],"America/New_York",10);
  expect(scale.ticks[2]-scale.ticks[1]).toBe(23*3600000);
  const fall=calendarScale([Date.parse("2026-10-31T00:00:00-04:00"),Date.parse("2026-11-03T00:00:00-05:00")],"America/New_York",10);
  expect(fall.ticks[2]-fall.ticks[1]).toBe(25*3600000);
  expect(()=>calendarScale([0,100],"Bad/Zone")).toThrow();
 });
});

describe("Cartesian semantic shell", () => {
 it.each([GroupedBarChart,ScatterChart,BubbleChart,AreaChart,MixedChart])("renders %s with one protected plot and meaningful data", Constructor => {
  const chart=new Constructor(); chart.series=scatterSeries; const root=mount(chart);
  expect(root.querySelector('[part="status"]')!.textContent).toBe("");
  expect(root.querySelectorAll('[part="legend-item"]')).toHaveLength(2);
  expect(root.querySelector('style')!.textContent).toContain("min-block-size:12rem");
  expect(root.querySelectorAll('tbody tr')).toHaveLength(0);
  click(root,"table"); expect(root.querySelectorAll('tbody tr')).toHaveLength(8);
 });
 it("keeps selection host-controlled and scale stable during keyboard inspection", () => {
  const chart=new GroupedBarChart();chart.series=activitySeries;const root=mount(chart);const select=vi.fn();chart.addEventListener("point-selected",select);
  const plot=root.querySelector<HTMLElement>('[part="plot"]')!;plot.focus();const before=root.querySelector('[part="marks"]')!.innerHTML;
  plot.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));
  expect(root.querySelector('[part="inspection"]')!.textContent).toContain("Oct 12: 51");
  plot.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
  expect(select.mock.calls[0][0].detail.selectedId).toBe("upload-1");expect(chart.selectedId).toBeNull();
  expect(root.querySelector('[part="marks"]')!.innerHTML).toBe(before);
  chart.selectedId="upload-1";expect(root.querySelector('[part="selection-label"]')!.textContent).toContain("Selected: Uploads");
  plot.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));expect(select.mock.calls.at(-1)![0].detail.selectedId).toBeNull();
 });
 it("uses actual x to change series, not equal array positions", () => {
  const chart=new ScatterChart();chart.series=[{id:"a",label:"A",points:[{id:"a1",x:1,y:10},{id:"a2",x:2,y:20}]},{id:"b",label:"B",points:[{id:"b1",x:2,y:30}]}];
  const root=mount(chart),plot=root.querySelector<HTMLElement>('[part="plot"]')!;plot.focus();
  for(const key of ["ArrowRight","ArrowDown"])plot.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true}));
  expect(root.querySelector('[part="inspection"]')!.textContent).toContain("B · 2: 30");
 });
 it("paginates exact data and does not build hidden table rows", () => {
  const chart=new ScatterChart();chart.series=[{id:"s",label:"S",points:Array.from({length:120},(_,i)=>({id:String(i),x:i,y:i}))}];const root=mount(chart);
  expect(root.querySelectorAll('tbody tr')).toHaveLength(0);click(root,"table");expect(root.querySelectorAll('tbody tr')).toHaveLength(50);
  click(root,"next");expect(root.querySelector('[part="page"]')!.textContent).toBe("51–100 of 120");click(root,"next");expect(root.querySelectorAll('tbody tr')).toHaveLength(20);
  click(root,"table");expect(root.querySelectorAll('tbody tr')).toHaveLength(0);
 });
 it.each(["loading","error"])("suppresses old geometry and exact values during %s", state => {
  const chart=new GroupedBarChart();chart.series=activitySeries;const root=mount(chart);click(root,"table");chart.state=state;
  expect(root.querySelectorAll('[part="mark"]')).toHaveLength(0);expect(root.querySelectorAll('tbody tr')).toHaveLength(0);
 });
 it("rejects malformed snapshots and invalid log choices without losing exact valid values", () => {
  const chart=new GroupedBarChart();const root=mount(chart);chart.setAttribute("series","{}");expect(root.querySelector('[part="status"]')!.textContent).toContain("arrays");
  chart.series=activitySeries;chart.xScale="log";expect(root.querySelector('[part="status"]')!.textContent).toContain("zero baseline");click(root,"table");expect(root.querySelectorAll('tbody tr')).toHaveLength(8);
 });
 it("preserves legend focus across host refresh and retains missing intervals", () => {
  const chart=new AreaChart();chart.series=activitySeries;const root=mount(chart);const legend=root.querySelector<HTMLButtonElement>('[part="legend-item"]')!;legend.focus();
  chart.series=activitySeries.map(s=>({...s,points:s.points.map((p,i)=>({...p,y:i===1?null:p.y}))}));
  expect(root.activeElement).toBe(legend);expect(root.querySelector('[part="series-path"]')!.getAttribute("d")!.match(/M /g)).toHaveLength(2);
 });
});

describe("radial meaning", () => {
 it("uses equal angles with area proportional to values, and native category controls", () => {
  const chart=new PolarAreaChart();chart.maximum=100;chart.segments=[{id:"a",label:"A",value:25},{id:"b",label:"B",value:100}];const root=mount(chart);
  const sectors=root.querySelectorAll('[part="sector"]');expect(sectors[0].getAttribute("d")).toContain("A 50 50");expect(sectors[1].getAttribute("d")).toContain("A 100 100");
  expect(root.querySelector('[part="note"]')!.textContent).toContain("not a share-of-total");
  const first=root.querySelector<HTMLButtonElement>('[part="legend-item"]')!;first.focus();expect(root.querySelector('[part="inspection"]')!.textContent).toContain("A: 25");
 });
 it("does not fill an incomplete radar polygon or normalize mixed axes", () => {
  const chart=new RadarChart();chart.axes=[{id:"a",label:"A"},{id:"b",label:"B"},{id:"c",label:"C"}];chart.series=[{id:"s",label:"S",values:[{axis:"a",value:20},{axis:"b",value:null},{axis:"c",value:40}]}];const root=mount(chart);
  expect(root.querySelector('[part="radar-line"]')!.getAttribute("style")).toContain("fill:none");
  chart.maximum=30;expect(root.querySelector('[part="status"]')!.textContent).toContain("include every");
 });
 it("uses the donut denominator contract for pie without overlaying the total", () => {
  const chart=new PieChart();chart.segments=[{id:"a",label:"A",value:25},{id:"b",label:"B",value:75}];chart.total=100;const root=mount(chart);
  expect(root.querySelector('[part="segment"]')!.getAttribute("d")).toContain("A 0 0");
  expect(root.querySelector<HTMLElement>('[part="center"]')!.style.inset).toBe("100% 0 auto");
  chart.segments=[{id:"a",label:"Debt",value:-2}];expect(root.querySelectorAll('[part="segment"]')).toHaveLength(0);expect(root.textContent).toContain("nonnegative");
 });
});

describe("refresh, dates and edge conditions", () => {
 it("hands focus to the heading when its series disappears", () => {
  const chart=new GroupedBarChart();chart.series=activitySeries;const root=mount(chart);
  root.querySelector<HTMLButtonElement>('[part="legend-item"]')!.focus();chart.series=[];
  expect(root.activeElement).toBe(root.querySelector('[part="heading"]'));
 });
 it("preserves the exact table button through controlled selection updates", () => {
  const chart=new ScatterChart();chart.series=scatterSeries;const root=mount(chart);click(root,"table");
  const button=root.querySelector<HTMLButtonElement>('tbody button')!;button.focus();chart.selectedId="t1";
  expect(root.activeElement).toBe(button);expect(root.querySelectorAll('tbody tr')).toHaveLength(8);
 });
 it("rejects missing bubble sizes without fabricating a zero", () => {
  const chart=new BubbleChart();chart.series=activitySeries;const root=mount(chart);
  expect(root.querySelector('[part="status"]')!.textContent).toContain("explicit");expect(root.querySelectorAll('[part="mark"]')).toHaveLength(0);
 });
 it("treats all-null input as unmeasured while retaining exact missing rows", () => {
  const chart=new ScatterChart();chart.series=[{id:"s",label:"S",points:[{id:"p",x:1,y:null}]}];const root=mount(chart);
  expect(root.querySelector('[part="status"]')!.textContent).toContain("No measured");click(root,"table");expect(root.querySelector('tbody')!.textContent).toContain("Not observed");
 });
 it("keeps mixed endpoint bars inside the plot", () => {
  const chart=new MixedChart();chart.series=activitySeries.map(s=>({...s,kind:"bar"}));const root=mount(chart);
  const rects=Array.from(root.querySelectorAll<SVGRectElement>('[part="mark"]'));
  for(const r of rects){expect(Number(r.getAttribute("x"))).toBeGreaterThanOrEqual(0);expect(Number(r.getAttribute("x"))+Number(r.getAttribute("width"))).toBeLessThanOrEqual(640);}
 });
 it("does not stack observations across distinct axes", () => {
  const chart=new GroupedBarChart();chart.stacked=true;chart.yAxes=[{id:"files",label:"Files"},{id:"people",label:"People"}];
  chart.series=[{id:"a",label:"A",points:[{id:"a1",x:1,y:2}]},{id:"b",label:"B",axis:"files",points:[{id:"b1",x:1,y:3}]},{id:"c",label:"C",axis:"people",points:[{id:"c1",x:1,y:100}]}];const root=mount(chart);
  expect(root.querySelector('[part="status"]')!.textContent).toBe("");expect(root.querySelectorAll('[part="mark"]')).toHaveLength(3);
 });
 it("gaps every stacked area at an incomplete coordinate and rejects unaligned grids", () => {
  const chart=new AreaChart();chart.stacked=true;chart.series=activitySeries.map((s,i)=>({...s,points:s.points.map((p,j)=>({...p,y:i===0&&j===1?null:p.y}))}));const root=mount(chart);
  for(const path of root.querySelectorAll('[part="series-path"]'))expect(path.getAttribute("d")!.match(/M /g)).toHaveLength(2);
  chart.series=[activitySeries[0],{...activitySeries[1],points:activitySeries[1].points.slice(1)}];expect(root.querySelector('[part="status"]')!.textContent).toContain("aligned");
 });
 it("uses calendar months including leap day", () => {
  const scale=calendarScale([Date.parse("2024-01-01Z"),Date.parse("2024-05-01Z")],"UTC",10);
  expect(scale.ticks.map(v=>new Date(v).getUTCDate()).every(v=>v===1)).toBe(true);
  expect(scale.ticks[2]-scale.ticks[1]).toBe(29*86400000);
 });
 it("does not mutate input while interpolating a flat series", () => {
  const points=Object.freeze([{x:0,y:4},{x:1,y:4},{x:2,y:4}]);
  const path=linePath([...points],"monotone");expect(path).not.toMatch(/NaN|Infinity/);expect(points.map(p=>p.y)).toEqual([4,4,4]);
 });
 it("remounts safely and preserves focus given to another host control", () => {
  const chart=new ScatterChart();chart.series=scatterSeries;const root=mount(chart);chart.remove();mount(chart);
  const external=document.createElement("button");document.body.append(external);external.focus();chart.series=[];
  expect(document.activeElement).toBe(external);expect(root.querySelectorAll('[part="mark"]')).toHaveLength(0);
 });
});

describe("existing line chart extensions", () => {
 it("supports opt-in monotone and stepped paths without changing defaults", async () => {
  const { LineChart }=await import("../../../src/patterns/insights/line-chart.js");
  const chart=new LineChart();chart.series=[{id:"s",label:"S",points:[{x:1,y:10},{x:2,y:20},{x:3,y:null},{x:4,y:30}]}];mount(chart);
  const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;
  expect(view.querySelector('[part="series-path"]')!.getAttribute("d")).toContain(" L ");chart.interpolation="monotone";
  expect(view.querySelector('[part="series-path"]')!.getAttribute("d")).toContain(" C ");
  chart.interpolation="step-after";expect(view.querySelector('[part="series-path"]')!.getAttribute("d")).toContain(" H ");
  expect(view.querySelector('[part="series-path"]')!.getAttribute("d")!.match(/M /g)).toHaveLength(2);
 });
 it("associates series with separate labelled axes", async () => {
  const { LineChart }=await import("../../../src/patterns/insights/line-chart.js");const chart=new LineChart();
  chart.yAxes=[{id:"left",label:"Files",domain:[0,100]},{id:"right",label:"People",domain:[0,1000]}];
  chart.series=[{id:"f",label:"Files",axis:"left",points:[{x:1,y:50},{x:2,y:100}]},{id:"p",label:"People",axis:"right",points:[{x:1,y:500},{x:2,y:1000}]}];mount(chart);
  const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;
  const paths=Array.from(view.querySelectorAll('[part="series-path"]')).map(p=>p.getAttribute("d"));expect(paths[0]).toBe(paths[1]);
  expect(view.querySelector('[part="axis-names"]')!.textContent).toContain("People · right");
  expect(view.querySelector('[part="y-ticks-right"]')!.textContent).toContain("1K");
 });
 it("generates calendar ticks and discloses its zone", async () => {
  const { LineChart }=await import("../../../src/patterns/insights/line-chart.js");const chart=new LineChart();chart.xScale="time";
  chart.series=[{id:"s",label:"S",points:[{x:Date.parse("2026-01-01Z"),y:1},{x:Date.parse("2026-02-01Z"),y:2},{x:Date.parse("2026-03-01Z"),y:3}]}];mount(chart);
  const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;expect(view.querySelector('[part="axis-names"]')!.textContent).toContain("UTC");
  chart.timeZone="Invalid/Zone";expect(view.querySelector('[part="status"]')!.textContent).toContain("invalid");
 });
 it("bounds the existing numeric line table and discloses decimation", async () => {
  const { LineChart }=await import("../../../src/patterns/insights/line-chart.js");const chart=new LineChart();
  chart.series=[{id:"s",label:"S",points:Array.from({length:5000},(_,x)=>({x,y:Math.sin(x)}))}];mount(chart);
  const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;
  expect(view.querySelectorAll('tbody tr')).toHaveLength(0);expect(view.querySelector('[part="density"]')!.hasAttribute("hidden")).toBe(false);
  view.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();expect(view.querySelectorAll('tbody tr')).toHaveLength(50);
  view.querySelector<HTMLButtonElement>('[data-table-step="1"]')!.click();expect(view.querySelector('tbody th')!.textContent).toBe("50");
 });
});

describe("truthful invalid and clipped states", () => {
 it("never serializes a nonfinite y into an intentional missing value", () => {
  const chart=new ScatterChart();chart.series=[{id:"s",label:"S",points:[{id:"p",x:1,y:Infinity}]}];const root=mount(chart);
  expect(root.querySelector('[part="status"]')!.textContent).toContain("finite");expect(root.querySelectorAll('[part="mark"]')).toHaveLength(0);
 });
 it("rejects a filled logarithmic area rather than drawing from an infinite baseline", () => {
  const chart=new AreaChart();chart.series=activitySeries;chart.yAxes=[{id:"primary",label:"Files",scale:"log"}];const root=mount(chart);
  expect(root.querySelector('[part="status"]')!.textContent).toContain("containing zero");click(root,"table");expect(root.querySelectorAll('tbody tr')).toHaveLength(8);
 });
 it("discloses explicit-domain clipping and retains all exact observations", () => {
  const chart=new ScatterChart();chart.series=scatterSeries;chart.yAxes=[{id:"primary",label:"Latency",domain:[0,50]}];const root=mount(chart);
  expect(root.querySelector('[part="disclosure"]')!.textContent).toContain("3 observations");click(root,"table");expect(root.querySelector('tbody')!.textContent).toContain("82");
 });
 it("rejects empty accessible series labels", () => {
  const chart=new ScatterChart();chart.series=[{...scatterSeries[0],label:" "}];const root=mount(chart);
  expect(root.querySelector('[part="status"]')!.textContent).toContain("labels");expect(root.querySelectorAll('[part="legend-item"]')).toHaveLength(0);
 });
});

it("rejects an invalid zone before selected-point or table formatting can throw", () => {
 const chart=new ScatterChart();chart.xScale="time";chart.timeZone="Invalid/Zone";chart.selectedId="p";chart.series=[{id:"s",label:"S",points:[{id:"p",x:Date.UTC(2026,0,1),y:1}]}];const root=mount(chart);
 expect(root.querySelector('[part="status"]')!.textContent).toContain("valid IANA");expect(root.querySelectorAll('[part="mark"]')).toHaveLength(0);
});

it.each(["{}","[null]","[{\"id\":\"a\",\"label\":\"A\",\"value\":-1}]","null"])("rejects malformed pie data %s without throwing", value=>{
 const chart=new PieChart();chart.setAttribute("segments",value);const root=mount(chart);
 expect(root.querySelector('[part="status"]')!.textContent).toContain("nonnegative");expect(root.querySelectorAll('[part="segment"]')).toHaveLength(0);
});

it("does not renormalize a pie whose supplied denominator is too small",()=>{
 const chart=new PieChart();chart.total=20;chart.segments=[{id:"a",label:"A",value:30}];const root=mount(chart);
 expect(root.querySelector('[part="status"]')!.textContent).toContain("include every");expect(root.querySelectorAll('[part="segment"]')).toHaveLength(0);
});
it("shows a measured zero pie as an empty outline instead of a filled whole",()=>{
 const chart=new PieChart();chart.total=0;chart.segments=[{id:"a",label:"A",value:0}];const root=mount(chart);
 expect(root.querySelector<SVGCircleElement>('[part="track"]')!.style.fill).toBe("none");expect(root.querySelector('[part="center"]')!.textContent).toContain("0");
});

it("navigates unordered grouped observations in their visual x order",()=>{
 const chart=new GroupedBarChart();chart.series=[{id:"s",label:"S",points:[{id:"b",x:2,y:20},{id:"a",x:1,y:10}]}];const root=mount(chart);
 root.querySelector<HTMLButtonElement>('[part="legend-item"]')!.click();const plot=root.querySelector<HTMLElement>('[part="plot"]')!;plot.focus();plot.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));
 expect(root.querySelector('[part="inspection"]')!.textContent).toContain("2: 20");
});
it("retains numeric x coordinates alongside optional scatter labels in the exact table",()=>{
 const chart=new ScatterChart();chart.series=[{id:"s",label:"S",points:[{id:"p",label:"File A",x:12.345,y:20}]}];const root=mount(chart);click(root,"table");
 expect(root.querySelector('tbody')!.textContent).toContain("File A · 12.345");
});

it("keeps logarithmic ticks positive and finite at both representable extremes",()=>{
 for(const value of [Number.MIN_VALUE,1e-300,1e300,Number.MAX_VALUE]){
  const scale=numericScale([value],true);expect(scale.ticks.every(v=>Number.isFinite(v)&&v>0)).toBe(true);expect(Number.isFinite(scale.position(value))).toBe(true);
 }
});

it("runs the same controlled-selection demo host with cleanup",async()=>{
 const {setupChartFamilySelection}=await import("../../../storybook/fixtures/chart-family.js");
 const root=document.createElement("div"),chart=new GroupedBarChart();chart.series=activitySeries;root.append(chart);document.body.append(root);
 const cleanup=setupChartFamilySelection(root);const plot=chart.shadowRoot!.querySelector<HTMLElement>('[part="plot"]')!;plot.focus();plot.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
 expect(chart.selectedId).toBe("upload-0");plot.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));expect(chart.selectedId).toBeNull();
 cleanup?.();plot.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));expect(chart.selectedId).toBeNull();
});

it.each(["unlabelled","conflicting labels","time"])("keeps grouped-bar ticks at category centers for %s coordinates",kind=>{
 const chart=new GroupedBarChart();
 const coordinates=kind==="time"?[2,5,9].map(hour=>Date.UTC(2026,9,30,hour)):[2,5,9];
 if(kind==="time")chart.xScale="time";
 chart.series=[{id:"s",label:"S",points:coordinates.map((x,i)=>({id:`p${i}`,x,y:i+1,...(kind==="conflicting labels"?{label:`A${i}`}:{})}))}];
 if(kind==="conflicting labels")chart.series=[...chart.series,{id:"other",label:"Other",points:coordinates.map((x,i)=>({id:`other${i}`,x,y:i+2,label:`B${i}`}))}];
 const root=mount(chart),ticks=[...root.querySelectorAll<HTMLElement>('[part="x-ticks"] > span')];
 expect(ticks).toHaveLength(3);
 ticks.forEach((tick,i)=>expect(parseFloat(tick.style.getPropertyValue("--position"))).toBeCloseTo((i+.5)/3*100,5));
 if(kind!=="time")expect(ticks.map(tick=>tick.textContent)).toEqual(["2","5","9"]);
});

it("keeps numeric-line paging focus through repeated changes and boundary pages",async()=>{
 const {LineChart}=await import("../../../src/patterns/insights/line-chart.js");const chart=new LineChart();
 chart.series=[{id:"s",label:"S",points:Array.from({length:101},(_,x)=>({x,y:x}))}];mount(chart);
 const root=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;
 root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();
 for(const [direction,first]of [[1,"50"],[1,"100"],[-1,"50"],[-1,"0"]]as const){
  const button=root.querySelector<HTMLButtonElement>(`[data-table-step="${direction}"]`)!;button.focus();button.click();
  expect(root.querySelector('tbody th')!.textContent).toBe(first);
  const replacement=root.querySelector<HTMLButtonElement>(`[data-table-step="${direction}"]`)!;
  expect(root.activeElement).toBe(replacement.disabled?root.querySelector('[part="table-wrap"]'):replacement);
 }
});
