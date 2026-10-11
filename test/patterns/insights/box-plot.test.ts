// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import { BoxPlot, boxPlotDomain, boxPlotPosition, boxPlotWhiskerValues, validBoxPlotRow, type BoxPlotRow } from "../../../src/patterns/insights/box-plot.js";

const row: BoxPlotRow = { id: "upload", label: "files.upload", min: 10, p5: 20, q1: 30, median: 40, q3: 50, p95: 80, p99: 90, max: 100, count: 1204, reference: 45, samples: [12, 33, 95] };
describe("BoxPlot", () => {
  afterEach(() => { document.body.innerHTML = ""; });
  it("validates ordered statistics and positive log values", () => {
    expect(validBoxPlotRow(row, "linear")).toBe(true);
    expect(validBoxPlotRow({ ...row, median: 55 }, "linear")).toBe(false);
    expect(validBoxPlotRow({ ...row, p99: 75 }, "linear")).toBe(false);
    expect(validBoxPlotRow({ ...row, min: 0 }, "log")).toBe(false);
    expect(validBoxPlotRow({ ...row, samples: [101] }, "linear")).toBe(false);
    expect(validBoxPlotRow({ ...row, label: " " }, "linear")).toBe(false);
  });
  it("uses the selected whisker endpoints", () => {
    expect(boxPlotWhiskerValues(row, "min-max")).toEqual([10, 100]);
    expect(boxPlotWhiskerValues(row, "p5-p95")).toEqual([20, 80]);
    expect(boxPlotWhiskerValues(row, "p5-p99")).toEqual([20, 90]);
    expect(boxPlotWhiskerValues({ ...row, p95: undefined }, "p5-p95")).toEqual([10, 100]);
  });
  it("builds shared nice linear and log domains", () => {
    expect(boxPlotDomain([row], "linear")).toEqual({ min: 0, max: 100, ticks: [0, 50, 100] });
    const log = boxPlotDomain([row], "log");
    expect(log.ticks).toEqual([10, 100]);
    expect(boxPlotPosition(10, log, "log")).toBe(0);
    expect(boxPlotPosition(100, log, "log")).toBe(100);
    const tiny = boxPlotDomain([{ ...row, min: 0.00001, p5: 0.00002, q1: 0.00003, median: 0.00004, q3: 0.00005, p95: 0.00006, p99: 0.00007, max: 0.00008, reference: undefined, samples: [] }], "linear");
    expect(tiny.max).toBeGreaterThan(tiny.min);
    expect(Number.isFinite(boxPlotPosition(0.00004, tiny, "linear"))).toBe(true);
    const offset = boxPlotDomain([{ ...row, min: 1e9, p5: 1e9 + 0.00001, q1: 1e9 + 0.00002, median: 1e9 + 0.00003, q3: 1e9 + 0.00004, p95: 1e9 + 0.00005, p99: 1e9 + 0.00006, max: 1e9 + 0.0001, reference: undefined, samples: [] }], "linear");
    expect(offset.max).toBeGreaterThan(offset.min);
    expect(Number.isFinite(boxPlotPosition(1e9 + 0.00003, offset, "linear"))).toBe(true);
  });
  it("renders named row marks, reference and optional samples", () => {
    const chart = document.createElement("box-box-plot") as BoxPlot;
    chart.heading = "Step times";
    chart.whiskers = "p5-p95";
    chart.rows = [row];
    document.body.append(chart);
    expect(chart.shadowRoot?.querySelector('[part="panel"]')?.getAttribute("aria-label")).toBe("Step times");
    expect(chart.shadowRoot?.querySelector('[part="mark"]')?.getAttribute("aria-label")).toContain("5% to 95% 20 to 80");
    expect(chart.shadowRoot?.querySelectorAll('[part="dot"]')).toHaveLength(3);
    expect(chart.shadowRoot?.querySelector('[part="reference"]')).toBeTruthy();
    expect(chart.shadowRoot?.querySelector('[part="mark"]')?.getAttribute("aria-label")).toContain("minimum 10");
    expect(chart.shadowRoot?.querySelector('[part="box"]')?.getAttribute("style")).toContain("--start:30%");
  });
  it("toggles a semantic table and updates streaming rows", () => {
    const chart = document.createElement("box-box-plot") as BoxPlot;
    chart.rows = [row];
    document.body.append(chart);
    (chart.shadowRoot?.querySelector('[part="table-toggle"]') as HTMLButtonElement).click();
    expect(chart.shadowRoot?.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(chart.shadowRoot?.querySelector("caption")?.textContent).toBe("Distribution");
    expect(chart.shadowRoot?.querySelectorAll("thead th")).toHaveLength(11);
    expect(chart.shadowRoot?.querySelector('[part="table-wrap"]')?.getAttribute("tabindex")).toBe("0");
    expect(chart.shadowRoot?.querySelector('[part="table-wrap"]')?.getAttribute("aria-label")).toBe("Distribution data table");
    chart.rows = [row, { ...row, id: "signin", label: "Signing in" }];
    expect(chart.shadowRoot?.querySelectorAll("tbody tr")).toHaveLength(2);
    (chart.shadowRoot?.querySelector('[part="table-toggle"]') as HTMLButtonElement).click();
    expect(chart.shadowRoot?.querySelectorAll('[part="mark"]')).toHaveLength(2);
  });
  it("keeps a focused row focused when streamed summaries update", () => {
    const chart = document.createElement("box-box-plot") as BoxPlot;
    chart.rows = [row];
    document.body.append(chart);
    (chart.shadowRoot?.querySelector('[part="mark"]') as HTMLElement).focus();
    chart.rows = [{ ...row, median: 41 }];
    expect(chart.shadowRoot?.activeElement?.getAttribute("data-row-id")).toBe("upload");
    expect(chart.shadowRoot?.activeElement?.getAttribute("aria-label")).toContain("median 41");
  });
  it("labels percentile fallback as actual min-max endpoints", () => {
    const chart = document.createElement("box-box-plot") as BoxPlot;
    chart.whiskers = "p5-p95";
    chart.rows = [{ ...row, p95: undefined }];
    document.body.append(chart);
    const label = chart.shadowRoot?.querySelector('[part="mark"]')?.getAttribute("aria-label") ?? "";
    expect(label).toContain("minimum to maximum 10 to 100");
    expect(label).not.toContain("5% to 95% 10 to 100");
  });
  it("has no automated accessibility violations in chart and table views", async () => {
    const chart = document.createElement("box-box-plot") as BoxPlot;
    chart.heading = "Step times";
    chart.rows = [row];
    document.body.append(chart);
    const options = { rules: { "color-contrast": { enabled: false } } };
    expect((await axe.run(chart, options)).violations).toEqual([]);
    (chart.shadowRoot?.querySelector('[part="table-toggle"]') as HTMLButtonElement).click();
    expect((await axe.run(chart, options)).violations).toEqual([]);
  });
  it("renders vertical/log marks and omits invalid rows", () => {
    const chart = document.createElement("box-box-plot") as BoxPlot;
    chart.orientation = "vertical";
    chart.scale = "log";
    chart.rows = [{ ...row, min: 0 }, row];
    document.body.append(chart);
    expect(chart.shadowRoot?.querySelector('[data-orientation="vertical"]')).toBeTruthy();
    expect(chart.shadowRoot?.querySelectorAll('[part="mark"]')).toHaveLength(1);
  });
});

describe("BoxPlot theme, embedding and optional table contracts", () => {
  afterEach(() => { document.body.innerHTML=""; });
  const mount=(rows:BoxPlotRow[]):BoxPlot=>{const chart=new BoxPlot();chart.rows=rows;document.body.append(chart);return chart;};
  const table=(chart:BoxPlot):string[]=>{(chart.shadowRoot!.querySelector('[part="table-toggle"]') as HTMLButtonElement).click();return [...chart.shadowRoot!.querySelectorAll('thead th')].map(th=>th.textContent!);};
  const basic:BoxPlotRow={id:"basic",label:"One run",min:-2,q1:-1,median:0,q3:1,max:2};
  it("omits optional columns absent from all valid rows",()=>{
    const chart=mount([basic,{...basic,id:"bad",mean:NaN}]);
    expect(table(chart)).toEqual(["Row","Min","5%","25%","Median","75%","95%","99%","Max"]);
    expect(chart.shadowRoot!.querySelectorAll('tbody tr')).toHaveLength(1);
  });
  it("retains zero-valued optional fields and aligns sparse cells",()=>{
    const chart=mount([basic,{...basic,id:"zero",mean:0,reference:0,count:0}]);
    expect(table(chart).slice(-3)).toEqual(["Mean","Reference","Count"]);
    const cells=[...chart.shadowRoot!.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].slice(-3).map(td=>td.textContent));
    expect(cells).toEqual([["—","—","—"],["0","0","0"]]);
  });
  it("includes only the supplied optional column",()=>{
    const chart=mount([{...basic,mean:0}]);expect(table(chart).slice(-1)).toEqual(["Mean"]);
    expect(chart.shadowRoot!.querySelectorAll('thead th')).toHaveLength(10);
  });
  it.each([1,2,3,4,5,6])("uses native heading level%s with embedded and hide-note options",level=>{
    const chart=new BoxPlot();chart.setAttribute("heading-level",String(level));chart.setAttribute("embedded","");chart.setAttribute("hide-note","");chart.description="Host summary";chart.rows=[basic];document.body.append(chart);
    expect(chart.shadowRoot!.querySelector('header > div > :first-child')!.tagName).toBe(`H${level}`);
    expect(chart.shadowRoot!.querySelector('[part="note"]')).toBeNull();
    expect(chart.shadowRoot!.querySelector('[part="description"]')!.textContent).toBe("Host summary");
    expect(chart.shadowRoot!.querySelector('[part="mark"]')!.getAttribute('aria-label')).toContain("median 0");
  });
  it("uses one continuous vertical grid instead of grids inside each mark",()=>{
    const chart=mount([basic,{...basic,id:"two"}]);chart.orientation="vertical";
    const overlay=chart.shadowRoot!.querySelector('[part="gridlines"]')!;
    expect(overlay).not.toBeNull();expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.querySelectorAll('[part="gridline"]')).toHaveLength(boxPlotDomain([basic],"linear").ticks.length);
    expect(chart.shadowRoot!.querySelector('[part="mark"] [part="gridline"]')).toBeNull();
    expect(chart.shadowRoot!.querySelector('[part="plot-scroll"]')!.getAttribute('tabindex')).toBe('0');
  });
  it("derives distribution mark defaults from semantic theme tokens",()=>{
    const chart=mount([basic]),css=chart.shadowRoot!.querySelector('style')!.textContent!;
    const rule=(part:string)=>css.match(new RegExp(`\\[part=${part}\\]\\s*\\{([^}]+)\\}`))![1]!;
    expect(rule('box')).toContain('--boe-token-surface-surface-brand');
    expect(rule('median')).toContain('--boe-token-text-text');
    expect(rule('whisker')).toContain('--boe-token-text-text-secondary');
    expect(rule('gridline')).toContain('--boe-token-stroke-stroke');
  });
});
