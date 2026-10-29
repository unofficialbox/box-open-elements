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
    expect(element.shadowRoot!.querySelectorAll('[role="listitem"]')).toHaveLength(2);
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
