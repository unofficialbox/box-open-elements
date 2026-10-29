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
    expect(distributionTimeDomain([point(0), point(10)])).toEqual({ min: 0, max: 10, ticks: [0, 2.5, 5, 7.5, 10] });
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

  it("draws the band, the median and the sampled points, and omits invalid intervals", () => {
    const chart = document.createElement("box-distribution-timeline") as DistributionTimeline;
    chart.heading = "files.upload over the run";
    chart.unit = "ms";
    chart.points = [point(0, 40, [12, 44]), { ...point(1), median: 5 }, point(2, 60, [30])];
    document.body.append(chart);
    expect(chart.shadowRoot?.querySelector('[part="panel"]')?.getAttribute("aria-label")).toBe("files.upload over the run");
    expect(chart.shadowRoot?.querySelector('[part="band"]')?.getAttribute("d")).toContain("M");
    expect(chart.shadowRoot?.querySelector('[part="median"]')?.getAttribute("d")).toContain("L");
    expect(chart.shadowRoot?.querySelectorAll('[part="dot"]')).toHaveLength(3);
    const label = chart.shadowRoot?.querySelector('svg[part="chart"]')?.getAttribute("aria-label") ?? "";
    expect(label).toContain("2 intervals"); // the unordered one is left out
    expect(label).toContain("highest value of any interval is 100 ms");
  });

  it("holds the sample count to max-samples however many the host sends", () => {
    const chart = document.createElement("box-distribution-timeline") as DistributionTimeline;
    chart.maxSamples = 20;
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
    expect(chart.shadowRoot?.querySelector('[part="note"]')?.textContent).toContain("Points are a sample");
    chart.hideSamples = true;
    expect(chart.shadowRoot?.querySelectorAll('[part="dot"]')).toHaveLength(0);
    expect(chart.shadowRoot?.querySelector('[part="note"]')?.textContent).not.toContain("Points are a sample");
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
