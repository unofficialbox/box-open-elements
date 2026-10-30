// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { BarChart } from "../../../src/patterns/insights/bar-chart.js";
import { ChartPanel } from "../../../src/patterns/insights/chart-panel.js";
import { LineChart } from "../../../src/patterns/insights/line-chart.js";
import { DonutChart } from "../../../src/patterns/insights/donut-chart.js";
import { chartScale } from "../../../src/patterns/insights/chart-scale.js";

afterEach(() => document.body.replaceChildren());
const point = (id: string, value: number) => ({ id, label: id, value });

for (const Constructor of [BarChart, ChartPanel]) describe(Constructor.name, () => {
  it("uses one labelled zero baseline, including zero and negative values", () => {
    const element = new Constructor();
    element.points = [point("negative", -20), point("zero", 0), point("positive", 60)];
    document.body.append(element);
    const bars = [...element.shadowRoot!.querySelectorAll<HTMLElement>('[part="bar"]')];
    expect(bars.map(bar => bar.style.getPropertyValue("--bar-height"))).toEqual(["25%", "0%", "75%"]);
    expect(bars.map(bar => bar.style.getPropertyValue("--bar-bottom"))).toEqual(["0%", "25%", "25%"]);
    expect([...element.shadowRoot!.querySelectorAll('[part="axis-label"]')].map(label => label.textContent)).toEqual(["-20", "0", "20", "40", "60"]);
  });
  it("keeps a 2:1 height ratio and the focused button after data refresh", () => {
    const element = new Constructor();
    element.points = [point("a", 40), point("b", 80)];
    document.body.append(element);
    const button = element.shadowRoot!.querySelector<HTMLButtonElement>('[data-point-id="a"]')!;
    button.focus();
    element.points = [point("a", 20), point("b", 40)];
    expect(element.shadowRoot!.activeElement).toBe(button);
    const heights = [...element.shadowRoot!.querySelectorAll<HTMLElement>('[part="bar"]')].map(bar => parseFloat(bar.style.getPropertyValue("--bar-height")));
    expect(heights[1] / heights[0]).toBe(2);
  });
});

describe("chart scale", () => {
  it("uses readable count intervals instead of quarter-range fractions", () => {
    expect(chartScale([310,355,348,402,431]).ticks).toEqual([0,100,200,300,400,500]);
    expect(chartScale([12,18,24,21,28]).ticks).toEqual([0,10,20,30]);
  });

  it.each([[0,0], [-1e308,1e308], [Number.MAX_VALUE], [5e-324], [-1e-300,1e-300]])("keeps finite endpoints and tick labels for %j", (...values) => {
    const scale = chartScale(values);
    expect(scale.ticks.every(Number.isFinite)).toBe(true);
    for (const value of values) {
      expect(scale.position(value)).toBeGreaterThanOrEqual(0);
      expect(scale.position(value)).toBeLessThanOrEqual(1);
    }
  });
});

describe("donut composition", () => {
  it("shows a useful total and shares without requiring a host summary", () => {
    const element = new DonutChart();
    element.segments = [point("a", 3), point("b", 1)];
    document.body.append(element);
    expect(element.shadowRoot!.querySelector('[part="center"]')!.textContent).toContain("4");
    expect([...element.shadowRoot!.querySelectorAll('[part="legend-share"]')].map(node => node.textContent)).toEqual(["75%", "25%"]);
    expect(element.shadowRoot!.querySelectorAll('tbody tr')).toHaveLength(2);
  });
  it("links pointer inspection and selection to the corresponding ring segment", () => {
    const element = new DonutChart();
    element.segments = [point("a", 3), point("b", 1)];
    document.body.append(element);
    const row = element.shadowRoot!.querySelector<HTMLButtonElement>('[part="legend-item"][data-segment-id="a"]')!;
    const other = element.shadowRoot!.querySelector<SVGElement>('[part="segment"][data-segment-id="b"]')!;
    row.dispatchEvent(new Event("pointerenter"));
    expect(other.dataset.muted).toBe("true");
    row.click();
    expect(row.getAttribute("aria-pressed")).toBe("true");
    expect(element.shadowRoot!.querySelector<SVGElement>('[part="segment"][data-segment-id="a"]')!.dataset.selected).toBe("true");
    row.dispatchEvent(new Event("pointerleave"));
    expect(other.dataset.muted).toBe("false");
    other.dispatchEvent(new Event("pointerenter"));
    expect(element.shadowRoot!.querySelector<HTMLElement>('[part="legend-item"][data-segment-id="b"]')!.dataset.active).toBe("true");
    other.dispatchEvent(new Event("pointerleave"));
    expect(other.dataset.muted).toBe("false");
  });
  it("does not round an automatically computed total", () => {
    const element = new DonutChart();
    element.segments = [point("a", 9870), point("b", 6)];
    document.body.append(element);
    expect(element.shadowRoot!.querySelector('[part="center"] [part="summary"]')!.textContent).toBe("9876");
  });
  it("removes binary noise from fractional totals and preserves host summaries", () => {
    const element = new DonutChart();
    element.segments = [point("a", .1), point("b", .2)];
    document.body.append(element);
    const summary = () => element.shadowRoot!.querySelector('[part="center"] [part="summary"]')!.textContent;
    expect(summary()).toBe("0.3");
    element.summary = "Custom total";
    expect(summary()).toBe("Custom total");
  });
  it("handles empty, single and finite extreme segments without invalid arcs", () => {
    const element = new DonutChart();
    document.body.append(element);
    expect(element.shadowRoot!.querySelector('[part="empty"]')).not.toBeNull();
    for (const values of [[1], [1e308,1e308], [5e-324,5e-324]]) {
      element.segments = values.map((value,index) => point(String(index), value));
      for (const path of element.shadowRoot!.querySelectorAll('path')) expect(path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
      const shares = [...element.shadowRoot!.querySelectorAll('[part="legend-share"]')].map(node => parseFloat(node.textContent!));
      expect(shares.reduce((a,b) => a+b,0)).toBeCloseTo(100);
    }
  });
});

it("shows labelled line scale and joins observed points without invented smoothing", () => {
  const element = new LineChart();
  element.points = [point("first", 10), point("middle", 30), point("last", 20)];
  document.body.append(element);
  expect(element.shadowRoot!.querySelectorAll('[part="axis-label"]')).toHaveLength(4);
  const path = element.shadowRoot!.querySelector('[part="path"]')!.getAttribute("d")!;
  expect(path).not.toContain("C");
  expect(path.match(/L/g)).toHaveLength(2);
});

for (const Constructor of [BarChart,ChartPanel,LineChart]) describe(`${Constructor.name} inspection and states`, () => {
  const mount = () => {
    const chart = new Constructor();
    chart.points = [
      {...point("Oct 12",48),inspection:{label:"Week of Oct 12",value:"48 uploads"}},
      {...point("Oct 19",64),inspection:{label:"Week of Oct 19",value:"64 uploads",comparison:"+16 (+33.3%) vs Oct 12 · 48"}},
      {...point("Oct 26",71),inspection:{label:"Latest week · Oct 26",value:"71 uploads",comparison:"+7 (+10.9%) vs Oct 19 · 64"}},
    ];
    document.body.append(chart); return chart;
  };
  it("selects and resets without reordering, rescaling or replacing focus targets", () => {
    const chart=mount(),root=chart.shadowRoot!;
    const button=root.querySelector<HTMLButtonElement>('[data-point-id="Oct 19"]')!;
    const before=[...root.querySelectorAll('[part="axis-label"]')].map(n=>n.textContent);
    button.focus();button.click();
    expect(root.activeElement).toBe(button);
    expect(root.querySelector('[part="inspection-value"]')!.textContent).toBe("64 uploads");
    expect(root.querySelector('[part="comparison"]')!.textContent).toContain("+33.3%");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector('[part="selection-label"]:not([hidden])')!.textContent).toBe("Selected");
    (root.querySelector('[part="clear-selection"]') as HTMLButtonElement).click();
    expect(chart.selectedId).toBeNull();
    expect(root.querySelector('[part="inspection-value"]')!.textContent).toBe("71 uploads");
    expect([...root.querySelectorAll('[part="axis-label"]')].map(n=>n.textContent)).toEqual(before);
  });
  it("keeps missing observations distinct from measured zero in the data table", () => {
    const chart=mount();chart.points=[point("Zero",0),{...point("Missing",0),value:null}, {...point("Partial",12),partial:true}];
    (chart.shadowRoot!.querySelector('[part="table-toggle"]') as HTMLButtonElement).click();
    expect(chart.shadowRoot!.querySelector('[data-point-id="Partial"] [part="point-value"]')!.textContent).toBe("12*");
    expect(chart.shadowRoot!.querySelector('[part="status"]')!.textContent).toContain("Incomplete observation");
    const text=chart.shadowRoot!.querySelector('[part="data-table"]')!.textContent;
    expect(text).toContain("Zero0Complete");expect(text).toContain("MissingNot observedMissing");expect(text).toContain("Partial12Incomplete");
  });
  it("suppresses incomplete comparisons and exposes cache timestamps", () => {
    const chart=mount();chart.state="partial";
    expect((chart.shadowRoot!.querySelector('[part="comparison"]') as HTMLElement).hidden).toBe(true);
    chart.state="stale";chart.statusMessage="Cached · Oct 29 09:00 UTC";
    expect(chart.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe(chart.statusMessage);
  });
  it.each(["loading","error"])("does not show cached values as %s observations",state=>{
    const chart=mount();chart.state=state;
    expect((chart.shadowRoot!.querySelector('[part="visual"]') as HTMLElement).hidden).toBe(true);
    expect((chart.shadowRoot!.querySelector('[part="inspection"]') as HTMLElement).hidden).toBe(true);
    expect(chart.shadowRoot!.querySelector('[part="status"]')!.textContent).not.toBe("");
  });
});
it("keeps missing intervals as line gaps instead of joining across them",()=>{
  const chart=new LineChart();chart.points=[point("a",10),{...point("b",0),value:null},point("c",30),point("d",40)];document.body.append(chart);
  const path=chart.shadowRoot!.querySelector('[part="path"]')!.getAttribute("d")!;
  expect(path.match(/M/g)).toHaveLength(2);expect(path.match(/L/g)).toHaveLength(1);
  expect(chart.shadowRoot!.querySelectorAll('[part="point"]')).toHaveLength(4);
});
it("uses an explicit donut denominator and a static exact-value table",()=>{
  const chart=new DonutChart();chart.readOnly=true;chart.total=250;chart.unit="GB";chart.segments=[point("Documents",115),point("Media",80)];document.body.append(chart);
  expect([...chart.shadowRoot!.querySelectorAll('[part="legend-share"]')].map(n=>n.textContent)).toEqual(["46%","32%","22%"]);
  expect(chart.shadowRoot!.querySelector('[part="center"]')!.textContent).toContain("250 GB");
  expect(chart.shadowRoot!.querySelectorAll('[part="legend-item"]')).toHaveLength(0);
  expect(chart.shadowRoot!.querySelector('[part="note"]')!.textContent).toContain("Unclassified");
});

it("keeps donut measured zero distinct from no observations",()=>{
 const chart=new DonutChart();chart.readOnly=true;chart.segments=[point("Documents",0)];document.body.append(chart);
 expect(chart.shadowRoot!.querySelector('[part="center"]')!.textContent).toContain("0");
 expect(chart.shadowRoot!.querySelector('[part="empty"]')).toBeNull();
 chart.segments=[];expect(chart.shadowRoot!.querySelector('[part="empty"]')!.textContent).toContain("No donut");
});
it("discloses and rejects an inconsistent donut denominator",()=>{
 const chart=new DonutChart();chart.total=100;chart.segments=[point("Documents",115),point("Media",80)];document.body.append(chart);
 expect(chart.shadowRoot!.querySelector('[part="center"]')!.textContent).toContain("195");
 expect(chart.shadowRoot!.querySelector('[part="note"]')!.textContent).toContain("Supplied total is smaller");
});

it("does not invent unknown storage from decimal addition noise",()=>{
 const chart=new DonutChart();chart.total=.3;chart.segments=[point("a",.1),point("b",.2)];document.body.append(chart);
 expect(chart.shadowRoot!.querySelectorAll("tbody tr")).toHaveLength(2);
 expect(chart.shadowRoot!.querySelector('[part="note"]')?.textContent ?? "").not.toContain("Supplied total");
});


it("keeps zero-prefixed donut category colors consistent in arcs and table",()=>{
  const chart=new DonutChart();chart.segments=[point("zero",0),point("a",3),point("b",1)];document.body.append(chart);
  for(const id of ["a","b"]){
    const arc=chart.shadowRoot!.querySelector(`[part="segment"][data-segment-id="${id}"]`)!;
    const swatch=chart.shadowRoot!.querySelector<HTMLElement>(`[data-segment-id="${id}"] [part="legend-swatch"]`)!;
    expect(arc.getAttribute("fill")).toBe(swatch.style.getPropertyValue("--segment-color"));
  }
});
it("uses the same responsive positions for missing and observed line intervals",()=>{
  const chart=new LineChart();chart.points=[point("a",10),point("b",20),point("c",30)];document.body.append(chart);
  const svg=chart.shadowRoot!.querySelector('[part="chart"]')!;
  Object.defineProperty(svg,"getBoundingClientRect",{value:()=>({width:300})});
  chart.heading="Measured values";
  const positions=()=>[...chart.shadowRoot!.querySelectorAll<HTMLElement>('[part="point"]')].map(n=>n.style.getPropertyValue("--point-x"));
  const before=positions();chart.points=chart.points.map((p,i)=>({...p,value:i===1?20:null}));
  expect(positions()).toEqual(before);
  chart.points=[{id:"only",label:"Only",value:null}];expect(positions()).toEqual(["50%"]);
});
