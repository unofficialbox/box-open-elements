import { afterEach, describe, expect, it, vi } from "vitest";
import { BarChart } from "../../src/patterns/insights/bar-chart.js";
import { LineChart } from "../../src/patterns/insights/line-chart.js";
import { ChartPanel } from "../../src/patterns/insights/chart-panel.js";
import { MetricCard } from "../../src/patterns/insights/metric-card.js";
import { ActivityDensityStrip } from "../../src/patterns/audit/activity-density.js";
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
const points=[{id:"a",label:"Alpha",value:10},{id:"b",label:"Beta",value:20}];
const button=(e:HTMLElement,selector:string)=>e.shadowRoot!.querySelector<HTMLButtonElement>(selector)!;
const outside=()=>{const input=document.createElement("input");input.value="Host draft";document.body.append(input);return input;};
// jsdom does not perform the native focus invalidation on every shadow move.
// Model that observed legacy DOM transition; keep callbacks/assertions real.
const legacyMoves = (parent: Element, host: HTMLElement): void => {
 Object.defineProperty(parent,"moveBefore",{value:undefined,configurable:true});
 const insert=parent.insertBefore.bind(parent);
 vi.spyOn(parent,"insertBefore").mockImplementation((node,before)=>{
  const active=host.shadowRoot!.activeElement as HTMLElement|null;
  if(active&&(node===active||node.contains(active)))active.blur();
  return insert(node,before);
 });
};
for(const [name,Constructor] of [["BarChart",BarChart],["LineChart",LineChart],["ChartPanel",ChartPanel]] as const) describe(`${name} current point ownership`,()=>{
 it("keeps focused point and action nodes through metadata and same-ID data refresh",()=>{const e=new Constructor();e.points=points;e.actions=[{id:"inspect",label:"Inspect"}];document.body.append(e);const point=button(e,'[data-point-id="b"]'),action=button(e,'[data-action-id="inspect"]');point.focus();e.heading="Current chart";e.summary="Current summary";e.message="Current message";e.timeframe="Current window";e.legend=[{label:"Current legend"}];e.points=points.map(p=>({...p,value:p.value+1,label:p.label+" current"}));expect(button(e,'[data-point-id="b"]')).toBe(point);expect(button(e,'[data-action-id="inspect"]')).toBe(action);expect(e.shadowRoot!.activeElement).toBe(point);expect(point.getAttribute("aria-label")).toBe("Beta current: 21");});
 it("reorders surviving points, removes stale points and dispatches fresh metadata",()=>{const e=new Constructor();e.points=points;document.body.append(e);const a=button(e,'[data-point-id="a"]'),b=button(e,'[data-point-id="b"]');b.focus();e.points=[{id:"b",label:"Beta current",value:30},{id:"c",label:"Gamma",value:40}];expect(button(e,'[data-point-id="b"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);expect(a.isConnected).toBe(false);const selected=vi.fn();e.addEventListener("point-selected",selected);b.click();expect(selected.mock.calls[0][0].detail).toEqual({id:"b",label:"Beta current",value:30});e.points=[];expect(b.isConnected).toBe(false);expect(e.shadowRoot!.querySelector('[part="empty"]')).not.toBeNull();});
 it("retains native buttons within valid list-item ownership",()=>{const e=new Constructor();e.points=points;document.body.append(e);const list=e.shadowRoot!.querySelector('[role="list"]')!;expect(list).not.toBeNull();expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(2);for(const point of list.querySelectorAll('[part="point"]')){expect(point.tagName).toBe("BUTTON");expect(point.getAttribute("role")).toBeNull();expect(point.closest('[role="listitem"]')).not.toBeNull();expect(point.textContent).toMatch(/(Alpha|Beta)\s+\d+/);}});
 it("lets host callbacks keep external focus and caret across refresh and reconnect",()=>{const e=new Constructor();e.points=points;document.body.append(e);const input=outside();const selected=vi.fn();e.addEventListener("point-selected",event=>{selected(event);e.points=e.points.map(p=>({...p,value:p.value+1}));input.focus();input.setSelectionRange(2,6);});button(e,'[data-point-id="b"]').click();expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd]).toEqual([2,6]);e.heading="Current";expect(document.activeElement).toBe(input);e.remove();document.body.append(e);button(e,'[data-point-id="b"]').click();expect(selected).toHaveBeenCalledTimes(2);});
});
describe("LineChart finite extreme geometry",()=>{
 it.each([[-1e308,0,1e308],[-Number.MAX_VALUE,Number.MAX_VALUE],[Number.MAX_VALUE,Number.MAX_VALUE],[-Number.MAX_VALUE,-1e308],[0,0],[-1e-300,1e-300]].map(values=>[values]))("keeps coordinates finite for %j",values=>{const e=new LineChart();e.points=values.map((value,index)=>({id:String(index),label:String(index),value}));document.body.append(e);const geometry=Array.from(e.shadowRoot!.querySelectorAll("path,circle"),n=>[n.getAttribute("d"),n.getAttribute("cx"),n.getAttribute("cy")].join(" ")).join(" ");expect(geometry).not.toMatch(/NaN|Infinity/);for(const circle of e.shadowRoot!.querySelectorAll('circle[part="dot"]')){expect(Number(circle.getAttribute("cx"))).toBeGreaterThanOrEqual(0);expect(Number(circle.getAttribute("cx"))).toBeLessThanOrEqual(100);expect(Number(circle.getAttribute("cy"))).toBeGreaterThanOrEqual(4);expect(Number(circle.getAttribute("cy"))).toBeLessThanOrEqual(47);}});
 it("preserves normal scaling and extreme endpoint ordering",()=>{const e=new LineChart();e.points=points;document.body.append(e);expect(Array.from(e.shadowRoot!.querySelectorAll('circle[part="dot"]'),n=>n.getAttribute("cy"))).toEqual(["47","7"]);e.points=[{id:"a",label:"Low",value:-1e308},{id:"b",label:"Mid",value:0},{id:"c",label:"High",value:1e308}];expect(Array.from(e.shadowRoot!.querySelectorAll('circle[part="dot"]'),n=>n.getAttribute("cy"))).toEqual(["47","27","7"]);});
});
describe("MetricCard action identity",()=>{
 it("keeps the current action through value/style/status refresh and dispatches updated action",()=>{const e=new MetricCard();e.action={id:"inspect",label:"Inspect"};document.body.append(e);const b=button(e,'[part="action"]');b.focus();e.value="43";e.size="compact";e.status="Ready";e.trend={label:"Current trend",direction:"up"};e.action={id:"inspect",label:"Inspect current",tone:"primary"};expect(button(e,'[part="action"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);const selected=vi.fn();e.addEventListener("action",selected);b.click();expect(selected.mock.calls[0][0].detail).toEqual({id:"inspect",label:"Inspect current",tone:"primary"});e.action={id:"other",label:"Other"};expect(b.isConnected).toBe(false);e.action=null;expect(e.shadowRoot!.querySelector('[part="action"]')).toBeNull();});
 it("preserves host focus/caret and does not duplicate action callbacks",()=>{const e=new MetricCard();e.action={id:"inspect",label:"Inspect"};document.body.append(e);const input=outside();const selected=vi.fn();e.addEventListener("action",event=>{selected(event);e.value="44";input.focus();input.setSelectionRange(1,4);});for(let n=0;n<2;n++){e.remove();document.body.append(e);button(e,'[part="action"]').click();expect(document.activeElement).toBe(input);}expect(selected).toHaveBeenCalledTimes(2);expect([input.selectionStart,input.selectionEnd]).toEqual([1,4]);});
});
const event=(id:string,day:string)=>({id,action:"Viewed",timestamp:`${day}T01:00:00Z`});
describe("ActivityDensity day ownership",()=>{
 it("retains current day buttons and entry through roster/count and shifted-window refresh",()=>{const e=new ActivityDensityStrip();e.referenceTime="2026-10-12T12:00:00Z";e.weeks=2;e.events=[event("a","2026-10-10")];document.body.append(e);const b=button(e,'button[data-date="2026-10-10"]');b.focus();b.click();e.events=[...e.events,event("b","2026-10-10"),event("c","2026-10-11")];expect(button(e,'button[data-date="2026-10-10"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);expect(b.tabIndex).toBe(0);expect(b.getAttribute("data-count")).toBe("2");e.weeks=3;e.referenceTime="2026-10-19T12:00:00Z";expect(button(e,'button[data-date="2026-10-10"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);expect(b.tabIndex).toBe(0);e.events=[event("c","2026-10-11")];expect(b.isConnected).toBe(false);expect(e.shadowRoot!.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);});
 it("keeps chronological keyboard traversal and emits fresh events before host handoff",()=>{const e=new ActivityDensityStrip();e.referenceTime="2026-10-12T12:00:00Z";e.weeks=2;e.events=[event("a","2026-10-10"),event("b","2026-10-11")];document.body.append(e);const input=outside();const selected=vi.fn();e.addEventListener("day-selected",event=>{selected(event);e.events=[...e.events];input.focus();input.setSelectionRange(2,5);});const b=button(e,'button[data-date="2026-10-10"]');b.focus();b.dispatchEvent(new KeyboardEvent("keydown",{key:"End",bubbles:true}));expect(e.shadowRoot!.activeElement?.getAttribute("data-date")).toBe("2026-10-11");button(e,'button[data-date="2026-10-11"]').click();expect(selected.mock.calls[0][0].detail.events).toEqual([event("b","2026-10-11")]);expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd]).toEqual([2,5]);});
});


describe("ChartPanel caller-owned chart slot",()=>{
 it("preserves an editing chart and does not capture a matching caller point button",()=>{
  const e=new ChartPanel();e.points=points;const chart=document.createElement("div");chart.slot="chart";const input=document.createElement("input");input.value="Caller draft";const own=document.createElement("button");own.type="button";own.setAttribute("part","point");own.dataset.pointId="b";chart.append(input,own);e.append(chart);document.body.append(e);const selected=vi.fn();e.addEventListener("point-selected",selected);own.click();expect(selected).not.toHaveBeenCalled();input.focus();input.setSelectionRange(2,6);e.heading="Current";e.points=points.map(p=>({...p,value:p.value+1}));expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd]).toEqual([2,6]);expect(e.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="chart"]')!.assignedElements()[0]).toBe(chart);
 });
});


for(const [name,Constructor] of [["BarChart",BarChart],["LineChart",LineChart],["ChartPanel",ChartPanel]] as const) describe(`${name} fallback focusin data ownership`,()=>{
 it("does not resume an old point snapshot after header action focusin refresh",()=>{
  const e=new Constructor();e.actions=[{id:"a",label:"Alpha"},{id:"b",label:"Beta"}];e.points=[{id:"old",label:"Old",value:1}];document.body.append(e);const parent=e.shadowRoot!.querySelector('[part="actions"]')!;legacyMoves(parent,e);const b=button(e,'[data-action-id="b"]');b.focus();const refreshed=vi.fn();b.addEventListener("focusin",()=>{refreshed();e.points=[{id:"fresh",label:"Fresh",value:2}];},{once:true});e.actions=[{id:"b",label:"Beta"},{id:"a",label:"Alpha"}];expect(refreshed).toHaveBeenCalledTimes(1);expect(e.points.map(p=>p.id)).toEqual(["fresh"]);expect(Array.from(e.shadowRoot!.querySelectorAll<HTMLButtonElement>('[data-point-id]'),b=>b.dataset.pointId)).toEqual(["fresh"]);
 });
});


describe("ActivityDensity fallback focusin refresh",()=>{
 it("does not overwrite the newer roster caption after restoring a moved day",()=>{
  const e=new ActivityDensityStrip();e.referenceTime="2026-10-12T12:00:00Z";e.weeks=3;e.events=[event("old-a","2026-10-10"),event("old-b","2026-10-11")];document.body.append(e);const day=button(e,'button[data-date="2026-10-10"]');day.focus();day.click();legacyMoves(day.closest("tr")!,e);const refreshed=vi.fn();day.addEventListener("focusin",()=>{refreshed();e.events=[event("fresh-a","2026-10-10"),event("fresh-b","2026-10-10"),event("fresh-c","2026-10-18")];},{once:true});e.referenceTime="2026-10-19T12:00:00Z";expect(refreshed).toHaveBeenCalledTimes(1);expect(e.density.total).toBe(3);expect(e.shadowRoot!.querySelector('[part="caption"]')!.textContent).toMatch(/^3 events/);expect(e.shadowRoot!.querySelector('button[data-date="2026-10-11"]')).toBeNull();expect(e.shadowRoot!.querySelector('button[data-date="2026-10-18"]')).not.toBeNull();
 });
});


describe("ActivityDensity nested metadata during fallback rebuild",()=>{
 it("finishes the current window when focusin only changes the heading",()=>{
  const e=new ActivityDensityStrip();e.referenceTime="2026-10-12T12:00:00Z";e.weeks=3;e.events=[event("day","2026-10-11")];document.body.append(e);const day=button(e,'button[data-date="2026-10-11"]');day.focus();day.click();legacyMoves(day.closest("tr")!,e);const refreshed=vi.fn();day.addEventListener("focusin",()=>{refreshed();e.heading="Fresh density";},{once:true});e.referenceTime="2026-10-19T12:00:00Z";expect(refreshed).toHaveBeenCalledTimes(1);expect(e.shadowRoot!.querySelector('[part="title"]')!.textContent).toBe("Fresh density");const dates=Array.from(e.shadowRoot!.querySelectorAll<HTMLElement>('td[data-date]'),cell=>cell.dataset.date!);const expected=e.density.cells.map(cell=>cell.date).sort();expect(dates.sort()).toEqual(expected);expect(new Set(dates).size).toBe(expected.length);
 });
});
