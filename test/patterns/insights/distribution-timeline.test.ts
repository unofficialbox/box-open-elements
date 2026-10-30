// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import {
  DistributionTimeline, distributionTimeDomain, thinPoints, validDistributionTimelinePoint,
  type DistributionTimelinePoint,
} from "../../../src/patterns/insights/distribution-timeline.js";

// q1 and q3 sit either side of the median, as a real interval's do.
const point = (at: number, median = 40, samples?: number[]): DistributionTimelinePoint =>
  ({ at, min: 10, q1: median - 10, median, q3: median + 10, max: 100, count: 120, samples });

describe("DistributionTimeline", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("validates ordered statistics, times and samples within the interval", () => {
    expect(validDistributionTimelinePoint(point(0), "linear")).toBe(true);
    expect(validDistributionTimelinePoint({ ...point(0), q1: 20, median: 20 }, "linear")).toBe(true);
    expect(validDistributionTimelinePoint({ ...point(0), median: 5 }, "linear")).toBe(false);
    expect(validDistributionTimelinePoint({ ...point(0), at: Number.NaN }, "linear")).toBe(false);
    expect(validDistributionTimelinePoint({ ...point(0), min: 0 }, "log")).toBe(false);
    expect(validDistributionTimelinePoint(point(0, 40, [101]), "linear")).toBe(false);
    expect(validDistributionTimelinePoint(point(0, 40, [11, 99]), "linear")).toBe(true);
    expect(validDistributionTimelinePoint({ ...point(0), count: 1.5 }, "linear")).toBe(false);
  });

  it("spans the time axis the points cover, and widens a single instant", () => {
    expect(distributionTimeDomain([point(0), point(10)])).toEqual({ min: 0, max: 10, ticks: [0, 2, 4, 6, 8, 10] });
    expect(distributionTimeDomain([point(4)])).toEqual({ min: 4, max: 5, ticks: [4, 5] });
    expect(distributionTimeDomain([])).toEqual({ min: 0, max: 1, ticks: [0, 1] });
  });

  it("thins samples by column, so a long run keeps points across the whole of it", () => {
    const points = Array.from({ length: 100 }, (_, index) => point(index, 40, [20, 30, 40, 50, 60]));
    const time = distributionTimeDomain(points);
    const kept = thinPoints(points, time, 10, 2);
    expect(kept).toHaveLength(20); // two a column, ten columns
    // The kept points cover the run rather than its first seconds.
    expect(Math.min(...kept.map(k => k.at))).toBeLessThan(10);
    expect(Math.max(...kept.map(k => k.at))).toBeGreaterThan(89);
  });

  it("draws separate interval boxes and a median trajectory, and omits invalid intervals", () => {
    const chart = document.createElement("box-distribution-timeline") as DistributionTimeline;
    chart.heading = "files.upload over the run";
    chart.unit = "ms";
    chart.points = [point(0, 40, [12, 44]), { ...point(1), median: 5 }, point(2, 60, [30])];
    document.body.append(chart);
    expect(chart.shadowRoot?.querySelector('[part="panel"]')?.getAttribute("aria-label")).toBe("files.upload over the run");
    expect(chart.shadowRoot?.querySelectorAll('rect[part="band"]')).toHaveLength(2);
    expect(chart.shadowRoot?.querySelectorAll('path[part="range"],path[part="band"]')).toHaveLength(0);
    expect(chart.shadowRoot?.querySelector('[part="median"]')?.getAttribute("d")).toContain("L");
    expect(chart.shadowRoot?.querySelectorAll('[part="dot"]')).toHaveLength(0);
    chart.showSamples=true;expect(chart.shadowRoot?.querySelectorAll('[part="dot"]')).toHaveLength(3);
    const label = chart.shadowRoot?.querySelector('svg[part="chart"]')?.getAttribute("aria-label") ?? "";
    expect(label).toContain("2 intervals"); // the unordered one is left out
    expect(label).toContain("highest value of any interval is 100 ms");
  });

  it("holds the sample count to max-samples however many the host sends", () => {
    const chart = document.createElement("box-distribution-timeline") as DistributionTimeline;
    chart.maxSamples = 20;
    chart.showSamples = true;
    chart.points = Array.from({ length: 200 }, (_, index) => point(index, 40, [20, 30, 40, 50, 60, 70]));
    document.body.append(chart);
    const dots = chart.shadowRoot?.querySelectorAll('[part="dot"]') ?? [];
    expect(dots.length).toBeGreaterThan(0);
    expect(dots.length).toBeLessThanOrEqual(20);
  });

  it("leaves the points out when asked, and says so in its note", () => {
    const chart = document.createElement("box-distribution-timeline") as DistributionTimeline;
    chart.points = [point(0, 40, [12, 44])];
    document.body.append(chart);
    expect(chart.shadowRoot?.querySelector('[part="note"]')?.textContent).toContain("Each box is one interval");
    chart.showSamples=true;expect(chart.shadowRoot?.querySelector('[part="note"]')?.textContent).toContain("Showing 2 of 2 supplied samples");
    chart.hideSamples = true;
    expect(chart.shadowRoot?.querySelectorAll('[part="dot"]')).toHaveLength(0);
    expect(chart.shadowRoot?.querySelector('[part="note"]')?.textContent).not.toContain("supplied samples");
  });

  it("shows the intervals as a table, and says when there is nothing to draw", () => {
    const chart = document.createElement("box-distribution-timeline") as DistributionTimeline;
    chart.unit = "ms";
    chart.points = [point(0), point(1)];
    document.body.append(chart);
    (chart.shadowRoot?.querySelector('[part="table-toggle"]') as HTMLButtonElement).click();
    const table = chart.shadowRoot?.querySelector('[part="table-wrap"] table');
    expect(table?.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(table?.querySelectorAll("thead th")).toHaveLength(7); // time, five numbers, count
    const empty = document.createElement("box-distribution-timeline") as DistributionTimeline;
    document.body.append(empty);
    expect(empty.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain("No valid intervals");
  });

  it("has no automated accessibility violations in chart and table views", async () => {
    const chart = document.createElement("box-distribution-timeline") as DistributionTimeline;
    chart.heading = "Step times over the run";
    chart.points = [point(0, 40, [12, 44]), point(5, 60, [30])];
    document.body.append(chart);
    const options = { rules: { "color-contrast": { enabled: false } } };
    expect((await axe.run(chart, options)).violations).toEqual([]);
    (chart.shadowRoot?.querySelector('[part="table-toggle"]') as HTMLButtonElement).click();
    expect((await axe.run(chart, options)).violations).toEqual([]);
  });
});


it("centers a single actual interval and preserves subsecond times without inventing a run span",()=>{
 const chart=new DistributionTimeline();chart.points=[point(.001,40)];document.body.append(chart);const root=chart.shadowRoot!;
 expect(root.querySelector('svg')!.getAttribute('aria-label')).toContain('from 0.001 s to 0.001 s');expect(root.querySelectorAll('[part="time-tick"]')).toHaveLength(1);expect(root.querySelector('[part="range"]')!.getAttribute('x1')).toBe('50');
});
it("offers sampled values as a repeatable keyboard control and recovers focused controls after refresh",()=>{
 const chart=new DistributionTimeline();chart.points=[point(0,40,[12,44]),point(5,60,[30])];document.body.append(chart);const root=chart.shadowRoot!;
 const events:unknown[]=[];chart.addEventListener('samples-toggled',event=>events.push(event.detail));
 for(let i=0;i<3;i++){root.querySelector<HTMLButtonElement>('[part="samples-toggle"]')!.focus();root.querySelector<HTMLButtonElement>('[part="samples-toggle"]')!.click();expect(chart.showSamples).toBe(true);expect(root.activeElement?.getAttribute('part')).toBe('samples-toggle');expect(root.querySelectorAll('[part="dot"]')).toHaveLength(3);root.querySelector<HTMLButtonElement>('[part="samples-toggle"]')!.click();expect(root.querySelectorAll('[part="dot"]')).toHaveLength(0);}
 expect(events).toHaveLength(6);chart.hideSamples=true;expect(root.querySelector('[part="samples-toggle"]')).toBeNull();
 root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.focus();root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();chart.points=[];expect(root.querySelector('[part="empty"]')!.textContent).toContain('No valid intervals');expect(root.activeElement?.getAttribute('part')).toBe('heading');
});
it("preserves all summary statistics in table mode, including zero counts and formatted units",()=>{
 const chart=new DistributionTimeline();chart.points=[{...point(0),count:0},point(5)];chart.format=n=>`${n} milliseconds`;document.body.append(chart);const root=chart.shadowRoot!;root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();expect(root.querySelectorAll('thead th')).toHaveLength(7);expect(root.querySelector('tbody')!.textContent).toContain('10 milliseconds30 milliseconds40 milliseconds50 milliseconds100 milliseconds0');
});

it("retains every dense interval and the local scroll position when samples are toggled",()=>{
 const chart=new DistributionTimeline();chart.points=Array.from({length:500},(_,i)=>point(i,40,[12,44]));document.body.append(chart);const root=chart.shadowRoot!;
 expect(root.querySelectorAll('[part="interval"]')).toHaveLength(500);expect(root.querySelector('[part="chart-content"]')!.getAttribute('style')).toContain('8000px');
 root.querySelector('[part="chart-wrap"]')!.scrollLeft=300;chart.showSamples=true;expect(root.querySelector('[part="chart-wrap"]')!.scrollLeft).toBe(300);expect(root.querySelector('[part="note"]')!.textContent).toContain('Scroll horizontally');
 root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.click();expect(root.querySelectorAll('tbody tr')).toHaveLength(500);
});
it("keeps a stable sampled-values toggle name while pressed state and counts change",()=>{
 const chart=new DistributionTimeline();chart.points=[point(0,40,[12,44])];document.body.append(chart);const root=chart.shadowRoot!;const button=()=>root.querySelector<HTMLButtonElement>('[part="samples-toggle"]')!;expect(button().textContent).toBe('Sampled values');expect(button().getAttribute('aria-pressed')).toBe('false');button().click();expect(button().textContent).toBe('Sampled values');expect(button().getAttribute('aria-pressed')).toBe('true');expect(root.querySelector('[part="note"]')!.textContent).toContain('Showing 2 of 2');
});
