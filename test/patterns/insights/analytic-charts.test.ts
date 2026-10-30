// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from "vitest";
import axe from "axe-core";
import {StackedBarChart,type StackedBar} from "../../../src/patterns/insights/stacked-bar-chart.js";
import {RangeChart} from "../../../src/patterns/insights/range-chart.js";
import {LineChart} from "../../../src/patterns/insights/line-chart.js";
import {analyticScale,categoryColor} from "../../../src/patterns/insights/analytic-shared.js";
afterEach(()=>document.body.replaceChildren());
const bars:StackedBar[]=[{id:"a",label:"Coding agent",segments:[{id:"tools",label:"Tool definitions",value:20237},{id:"payload",label:"Document payload",value:18624},{id:"tiny",label:"Retries",value:117}]},{id:"b",label:"Extraction",segments:[{id:"tools",label:"Tool definitions",value:0},{id:"payload",label:"Document payload",value:2000}]}];
describe("stacked bars",()=>{
 it("stacks supplied segments on one shared axis and retains tiny/zero table values",()=>{
  const chart=new StackedBarChart();chart.bars=bars;document.body.append(chart);const root=chart.shadowRoot!;
  expect(root.querySelectorAll('[part="legend-item"]')).toHaveLength(3);
  expect(root.querySelectorAll('[part="segment"]')).toHaveLength(5);
  const segment=root.querySelector<HTMLButtonElement>('[data-bar="a"][data-segment="tiny"]')!;
  expect(parseFloat(segment.style.getPropertyValue("--size"))).toBeGreaterThan(0);
  segment.focus();expect(root.querySelector('[part="inspection"]')!.textContent).toContain("117 of 38,978, 0.3%");
  expect(root.activeElement).toBe(segment);
  root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();
  expect(root.querySelector<HTMLElement>('[part="table-wrap"]')!.hidden).toBe(false);
  expect(root.querySelectorAll('tbody tr')).toHaveLength(5);expect(root.querySelector('tbody')!.textContent).toContain("Retries1170.3%");
  const colors=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-segment="tools"]')).map(n=>n.style.getPropertyValue("--series-color"));expect(colors[0]).toBe(colors[1]);
 });
 it("supports total labels, custom formatters, orientation and key-based theme tokens",()=>{
  const chart=new StackedBarChart();chart.bars=[{...bars[0],totalLabel:"38,978 estimated"}];chart.format=n=>`${n} tokens`;chart.seriesTokens={tools:"--host-tools"};chart.orientation="vertical";document.body.append(chart);
  expect(chart.shadowRoot!.querySelector('[part="total"]')!.textContent).toBe("38,978 estimated");
  expect(chart.shadowRoot!.querySelector<HTMLElement>('[part="chart"]')!.dataset.orientation).toBe("vertical");
  expect(chart.shadowRoot!.querySelector<HTMLElement>('[data-segment="tools"]')!.style.getPropertyValue("--series-color")).toContain("--host-tools");
 });
 it.each(["loading","error"])("does not expose old composition as %s data",state=>{
  const chart=new StackedBarChart();chart.bars=bars;document.body.append(chart);chart.state=state;
  expect(chart.shadowRoot!.querySelector<HTMLElement>('[part="chart"]')!.hidden).toBe(true);expect(chart.shadowRoot!.querySelectorAll('[part="segment"]')).toHaveLength(0);
 });
 it("distinguishes zero, empty and invalid composition",()=>{
  const chart=new StackedBarChart();document.body.append(chart);expect(chart.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe("No observations.");
  chart.bars=[{id:"a",label:"Zero",segments:[{id:"s",label:"Count",value:0}]}];expect(chart.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe("");expect(chart.shadowRoot!.querySelector('[part="total"]')!.textContent).toBe("0");
  chart.bars=[{id:"a",label:"Invalid",segments:[{id:"s",label:"Count",value:-1}]}];expect(chart.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain("invalid or negative");
 });
});
describe("range chart",()=>{
 it("renders bounds and explicit caps with no invented midpoint",()=>{
  const chart=new RangeChart();chart.unit="%";chart.rows=[{id:"cache",label:"Prompt caching",low:12,high:58},{id:"known",label:"Known",low:35,high:35}];document.body.append(chart);
  expect(chart.shadowRoot!.querySelectorAll('[part="point"]')).toHaveLength(0);
  const ranges=Array.from(chart.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="range"]'));
  expect(ranges[0].getAttribute("aria-label")).toContain("between 12% and 58%; width 46%");expect(ranges[1].dataset.zero).toBe("true");
  ranges[0].focus();expect(chart.shadowRoot!.querySelector('[part="inspection"]')!.textContent).not.toContain("35");
  chart.shadowRoot!.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();expect(chart.shadowRoot!.querySelector('tbody')!.textContent).toContain("Prompt cachingWidth 46Range1258");
 });
 it("compares series, uses host points only and validates ordering/point containment",()=>{
  const chart=new RangeChart();chart.rows=[{id:"r",label:"Savings",ranges:[{id:"before",label:"Before",low:12,high:58},{id:"after",label:"After",low:8,high:22,value:16}]}];document.body.append(chart);
  expect(chart.shadowRoot!.querySelectorAll('[part="legend-item"]')).toHaveLength(2);expect(chart.shadowRoot!.querySelectorAll('[part="point"]')).toHaveLength(1);
  chart.rows=[{id:"r",label:"Bad",low:20,high:10}];expect(chart.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain("invalid bounds");
  chart.rows=[{id:"r",label:"Bad point",low:10,high:20,value:30}];expect(chart.shadowRoot!.querySelectorAll('[part="range"]')).toHaveLength(0);
 });
});
const series=[{id:"flat",label:"Direct extraction",points:[{x:2,y:539},{x:20,y:539},{x:200,y:539}]},{id:"rising",label:"Agent",points:[{x:2,y:10},{x:20,y:null},{x:200,y:1000}]}];
describe("numeric multi-series line",()=>{
 it("uses numeric spacing, distinct line patterns, null gaps and one all-series table",()=>{
  const chart=new LineChart();chart.series=series;chart.xLabel="Characters";chart.yLabel="Tokens";document.body.append(chart);
  const root=chart.shadowRoot!,view=root.querySelector('[part="series-host"]')!.shadowRoot!;
  expect(root.querySelector<HTMLElement>('[part="content-host"]')!.hidden).toBe(true);
  const paths=view.querySelectorAll('[part="series-path"]');expect(paths).toHaveLength(2);
  expect(paths[1].getAttribute("d")!.match(/M/g)).toHaveLength(2);expect(paths[0].getAttribute("stroke-dasharray")).not.toBe(paths[1].getAttribute("stroke-dasharray"));
  const numbers=paths[0].getAttribute("d")!.match(/[-+]?\d*\.?\d+/g)!.map(Number);expect((numbers[2]-numbers[0])/(numbers[4]-numbers[2])).toBeCloseTo(.1);
  const legend=view.querySelector<HTMLButtonElement>('[part="legend-item"]')!;legend.focus();expect(view.querySelector('[part="inspection"]')!.textContent).toContain("flat at 539");expect(paths[1].getAttribute("data-muted")).toBe("true");
  view.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();expect(view.querySelectorAll('thead th')).toHaveLength(3);expect(view.querySelector('tbody')!.textContent).toContain("Not observed");
 });
 it("supports logarithmic axes, host markers/formatters and switching back to categorical data",()=>{
  const chart=new LineChart();chart.series=series;chart.markers=[{id:"sample",axis:"x",value:20,label:"Measured sample"},{id:"target",axis:"y",value:500,label:"Illustrative threshold"}];chart.xScale="log";chart.yScale="log";chart.xFormat=n=>`${n} chars`;chart.yFormat=n=>`${n} tokens`;document.body.append(chart);
  const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;
  expect(view.querySelectorAll('[part="reference"]')).toHaveLength(2);expect(view.querySelector('[part="annotations"]')!.textContent).toContain("Measured sample · X 20 chars");
  expect(view.querySelector('[part="axis-names"]')!.textContent).toContain("Log scale");
  chart.removeAttribute("series");chart.points=[{id:"a",label:"A",value:1}];expect(chart.shadowRoot!.querySelector<HTMLElement>('[part="content-host"]')!.hidden).toBe(false);expect(chart.shadowRoot!.querySelectorAll('[part="point"]')).toHaveLength(1);
 });
 it("rejects nonpositive logarithmic observations explicitly and exposes exact source values",()=>{
  const chart=new LineChart();chart.series=[{id:"a",label:"A",points:[{x:0,y:0},{x:1,y:2}]}];chart.xScale="log";document.body.append(chart);
  const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;expect(view.querySelector('[part="status"]')!.textContent).toContain("positive values");expect(view.querySelector<HTMLElement>('[part="visual"]')!.hidden).toBe(true);expect(view.querySelector<HTMLElement>('[part="table-wrap"]')!.hidden).toBe(false);
 });
 it("rejects malformed markers, duplicate series and out-of-order numeric positions without crashing",()=>{
  const chart=new LineChart();chart.series=series;document.body.append(chart);
  for(const markers of ['[null]','[{"axis":"bad","value":1}]']){chart.setAttribute("markers",markers);expect(chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain("invalid series");}
  chart.markers=[];chart.series=[series[0],series[0]];expect(chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain("invalid series");
 });
});
it("keeps log ticks and geometry finite for small and large positive domains",()=>{
 for(const values of [[1,1000],[5e-324,1e-300],[1e300,Number.MAX_VALUE],[10]]){const scale=analyticScale(values,true);expect(scale.ticks.every(n=>n>0&&Number.isFinite(n))).toBe(true);for(const value of values)expect(Number.isFinite(scale.position(value))).toBe(true);}
 expect(categoryColor("a",0,{a:'red;position:fixed'})).not.toContain("fixed");
});
it.each([StackedBarChart,RangeChart,LineChart])("provides native names and accessible fallback for %s",async Constructor=>{
 const chart=new Constructor();if(chart instanceof StackedBarChart)chart.bars=bars;else if(chart instanceof RangeChart)chart.rows=[{id:"a",label:"Savings",low:12,high:58}];else chart.series=series;
 document.body.append(chart);const result=await axe.run(chart,{rules:{"color-contrast":{enabled:false}}});expect(result.violations).toEqual([]);
});

it("preserves chart inspection focus across data refreshes without stealing outside focus",()=>{
 const stack=new StackedBarChart();stack.bars=bars;document.body.append(stack);const focus=()=>stack.shadowRoot!.querySelector<HTMLButtonElement>('[data-bar="a"][data-segment="tools"]')!;
 focus().focus();stack.description="Refreshed scope";expect(stack.shadowRoot!.activeElement).toBe(focus());
 const outside=document.createElement('button');document.body.append(outside);outside.focus();stack.unit="tokens";expect(document.activeElement).toBe(outside);
 focus().focus();stack.bars=[bars[1]];expect(stack.shadowRoot!.activeElement).toBe(stack.shadowRoot!.querySelector('[part="heading"]'));
 const range=new RangeChart();range.rows=[{id:"a",label:"A",low:10,high:20}];document.body.append(range);range.shadowRoot!.querySelector<HTMLButtonElement>('[part="range"]')!.focus();range.unit="ms";expect(range.shadowRoot!.activeElement?.getAttribute('part')).toBe('range');range.rows=[];expect(range.shadowRoot!.activeElement?.getAttribute('part')).toBe('heading');
});
it("reports partial/stale coverage and handles malformed/duplicate snapshots without stale geometry",()=>{
 const range=new RangeChart();range.rows=[{id:"a",label:"A",low:0,high:0}];document.body.append(range);
 range.state="stale";range.statusMessage="Cached at 09:00 UTC";expect(range.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain("09:00");
 range.state="loading";expect(range.shadowRoot!.querySelectorAll('[part="range"]')).toHaveLength(0);range.state="ready";range.statusMessage="";
 range.setAttribute('rows','[null]');expect(range.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain('invalid');
 const stack=new StackedBarChart();stack.bars=[bars[0],bars[0]];document.body.append(stack);expect(stack.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain('invalid');
 stack.bars=[{id:"a",label:"A",segments:[{id:"tiny",label:"Tiny",value:.00001},{id:"large",label:"Large",value:100}]}];expect(stack.shadowRoot!.querySelector('[part="segment"]')!.getAttribute('aria-label')).toContain('<0.1%');
});
it("handles empty/loading numeric series and preserves a focused series through updates",()=>{
 const chart=new LineChart();chart.series=[];document.body.append(chart);const view=()=>chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;
 expect(view().querySelector('[part="status"]')!.textContent).toBe('No observations.');chart.series=series;view().querySelector<HTMLButtonElement>('[part="legend-item"]')!.focus();chart.message="Refreshed";expect(view().activeElement?.getAttribute('data-series-id')).toBe('flat');
 chart.state="loading";expect(view().querySelector<HTMLElement>('[part="visual"]')!.hidden).toBe(true);expect(view().activeElement?.getAttribute('part')).toBe('heading');chart.state="ready";chart.series=[{id:"a",label:"Exact",points:[{x:38978,y:20237}]}];expect(view().querySelector('tbody')!.textContent).toContain('38,97820,237');
});

it("retains every missing interval when a numeric series has no observed y values",()=>{
 const chart=new LineChart();chart.series=[{id:"missing",label:"Missing series",points:[{x:1,y:null},{x:2,y:null}]}];document.body.append(chart);
 const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;
 expect(view.querySelector('[part="status"]')!.textContent).toBe('No observations.');expect(view.querySelectorAll('tbody tr')).toHaveLength(2);expect(view.querySelector('tbody')!.textContent).toBe('1Not observed2Not observed');expect(view.querySelector<HTMLElement>('[part="table-wrap"]')!.hidden).toBe(false);expect(view.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.hidden).toBe(true);
});

it("reports malformed JSON as invalid input rather than a measured empty snapshot",()=>{
 const stack=new StackedBarChart(),range=new RangeChart(),line=new LineChart();document.body.append(stack,range,line);
 stack.setAttribute('bars','[');range.setAttribute('rows','{}');line.setAttribute('series','null');
 expect(stack.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain('invalid');expect(range.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain('invalid');expect(line.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain('invalid');
});

it("refreshes inspection from the current snapshot and clears removed identities",()=>{
 const outside=document.createElement('button');document.body.append(outside);
 const stack=new StackedBarChart();stack.bars=bars;document.body.append(stack);stack.shadowRoot!.querySelector<HTMLButtonElement>('[part="segment"]')!.focus();outside.focus();stack.bars=[{id:"a",label:"Renamed",segments:[{id:"tools",label:"Tools",value:12}]}];expect(stack.shadowRoot!.querySelector('[part="inspection"]')!.textContent).toContain('Renamed: Tools 12 of 12');stack.bars=[bars[1]];expect(stack.shadowRoot!.querySelector('[part="inspection"]')!.textContent).toBe('Focus a segment to inspect its amount and share.');
 const range=new RangeChart();range.rows=[{id:"a",label:"Before",low:12,high:58}];document.body.append(range);range.shadowRoot!.querySelector<HTMLButtonElement>('[part="range"]')!.focus();outside.focus();range.rows=[{id:"a",label:"After",low:10,high:20}];expect(range.shadowRoot!.querySelector('[part="inspection"]')!.textContent).toContain('After: between 10 and 20');range.rows=[];range.rows=[{id:"b",label:"New",low:1,high:2}];expect(range.shadowRoot!.querySelector('[part="inspection"]')!.textContent).not.toContain('Before');
 const line=new LineChart();line.series=series;document.body.append(line);const view=line.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;view.querySelector<HTMLButtonElement>('[part="legend-item"]')!.focus();outside.focus();line.series=[{id:"flat",label:"Updated",points:[{x:1,y:42}]}];expect(view.querySelector('[part="inspection"]')!.textContent).toContain('Updated: flat at 42');line.series=[{id:"new",label:"New",points:[{x:1,y:43}]}];expect(view.querySelector('[part="inspection"]')!.textContent).toBe('Focus a series to inspect its shape.');expect(document.activeElement).toBe(outside);
});
it("ignores malformed tone values while preserving valid token overrides",()=>{
 expect(()=>categoryColor('a',0,{},42 as unknown as string)).not.toThrow();expect(categoryColor('a',0,{a:'--host-a'},42 as unknown as string)).toContain('--host-a');
 for(const chart of [new StackedBarChart(),new RangeChart(),new LineChart()]){document.body.append(chart);expect(()=>{if(chart instanceof StackedBarChart)chart.setAttribute('bars','[{"id":"a","label":"A","segments":[{"id":"s","label":"S","value":2,"tone":42}]}]');else if(chart instanceof RangeChart)chart.setAttribute('rows','[{"id":"a","label":"A","low":1,"high":2,"tone":42}]');else chart.setAttribute('series','[{"id":"a","label":"A","tone":42,"points":[{"x":1,"y":2}]}]');}).not.toThrow();}
});
it("fits linear numeric x domains while retaining a zero-inclusive y scale",()=>{
 const fitted=analyticScale([2025,2026],false,{includeZero:false});expect(fitted.position(2025)).toBeCloseTo(0);expect(fitted.position(2026)).toBeCloseTo(1);expect(analyticScale([2025,2026]).position(0)).toBe(0);
 const chart=new LineChart();chart.series=[{id:'a',label:'Years',points:[{x:2025,y:2},{x:2026,y:3}]}];document.body.append(chart);const view=chart.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!;const path=view.querySelector('[part="series-path"]')!.getAttribute('d')!;expect(path).toMatch(/^M 0 /);expect(path).toContain('L 100 ');const labels=[...view.querySelectorAll('[part="x-ticks"] [part="tick"]')].map(el=>el.textContent);expect(new Set(labels).size).toBe(labels.length);
});
it("clears numeric series hover emphasis when leaving the host",()=>{
 const chart=new LineChart();chart.series=series;document.body.append(chart);const container=chart.shadowRoot!.querySelector('[part="series-host"]')!,view=container.shadowRoot!;view.querySelector('[part="legend-item"]')!.dispatchEvent(new MouseEvent('pointerover',{bubbles:true,composed:true}));expect(view.querySelector('[part="series-path"]')!.getAttribute('data-active')).toBe('true');container.dispatchEvent(new Event('pointerleave'));expect([...view.querySelectorAll('[part="series-path"]')].every(el=>el.getAttribute('data-muted')==='false'&&el.getAttribute('data-active')==='false')).toBe(true);
});
it("includes the supplied unit in segment accessible names and native tooltips",()=>{
 const chart=new StackedBarChart();chart.bars=bars;chart.unit='tokens';document.body.append(chart);const segment=chart.shadowRoot!.querySelector<HTMLButtonElement>('[data-segment="tiny"]')!;expect(segment.getAttribute('aria-label')).toContain('117 tokens of 38,978');expect(segment.title).toBe(segment.getAttribute('aria-label'));
});
it("replays rich chart properties assigned before registration",()=>{
 const stack=document.createElement('boe-test-stack-upgrade') as StackedBarChart;Object.assign(stack,{bars,unit:'tokens',format:(n:number)=>String(n),orientation:'vertical'});document.body.append(stack);customElements.define('boe-test-stack-upgrade',class extends StackedBarChart{});expect(Object.hasOwn(stack,'bars')).toBe(false);expect(stack.shadowRoot!.querySelectorAll('[part="segment"]')).toHaveLength(5);stack.bars=[];expect(stack.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe('No observations.');
 const range=document.createElement('boe-test-range-upgrade') as RangeChart;Object.assign(range,{rows:[{id:'a',label:'A',low:1,high:2}],unit:'ms'});document.body.append(range);customElements.define('boe-test-range-upgrade',class extends RangeChart{});expect(Object.hasOwn(range,'rows')).toBe(false);range.rows=[];expect(range.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe('No observations.');
 const line=document.createElement('boe-test-line-upgrade') as LineChart;Object.assign(line,{series,markers:[],xLabel:'Characters',xScale:'linear'});document.body.append(line);customElements.define('boe-test-line-upgrade',class extends LineChart{});expect(Object.hasOwn(line,'series')).toBe(false);expect(line.hasAttribute('series')).toBe(true);expect(line.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!.querySelectorAll('[part="series-path"]')).toHaveLength(2);line.series=[];expect(line.shadowRoot!.querySelector('[part="series-host"]')!.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe('No observations.');
});
it("keeps fitted numeric scales finite for epoch, negative, constant and extreme domains",()=>{
 for(const values of [[1700000000000,1700000001000],[-2026,-2025],[2025],[0],[Number.MAX_VALUE],[-Number.MAX_VALUE],[5e-324],[-Number.MAX_VALUE,Number.MAX_VALUE],[5e-324,1e-300]]){const scale=analyticScale(values,false,{includeZero:false});expect(scale.ticks.every(Number.isFinite)).toBe(true);for(const value of values)expect(Number.isFinite(scale.position(value))).toBe(true);}
});
