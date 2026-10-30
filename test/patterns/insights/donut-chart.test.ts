// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DonutChart,
} from "../../../src/patterns/insights/donut-chart.js";
import { PieChart } from "../../../src/patterns/insights/pie-chart.js";

describe.each([DonutChart, PieChart])("%s sector boundaries", Chart => {
  afterEach(() => document.body.replaceChildren());

  it("preserves adjacent sector angles and uses constant-width clipped dividers", () => {
    const chart = new Chart();
    chart.segments = [{ id: "a", label: "A", value: 1 }, { id: "b", label: "B", value: 1 }];
    document.body.append(chart);
    const root = chart.shadowRoot!;
    const sectors = root.querySelectorAll('[part="segment"]');
    // Equal halves meet at the exact top and bottom of the circle, with no
    // angular padding taken out of either data sector.
    expect(sectors[0].getAttribute("d")).toMatch(/^M 50\.00 6\.00 A 44 44 0 0 1 50\.00 94\.00 /);
    expect(sectors[1].getAttribute("d")).toMatch(/^M 50\.00 94\.00 A 44 44 0 0 1 50\.00 6\.00 /);
    const dividers = root.querySelectorAll('[part="separator"]');
    expect(dividers).toHaveLength(2);
    for (const divider of dividers) {
      expect(divider.getAttribute("vector-effect")).toBe("non-scaling-stroke");
      expect(divider.getAttribute("stroke-width")).toBe("1.5");
    }
    const clipId = root.querySelector("clipPath")!.id;
    expect(root.querySelector('[part="separators"]')!.getAttribute("clip-path")).toBe(`url(#${clipId})`);
    expect(root.querySelector('[part="separators"]')!.getAttribute("aria-hidden")).toBe("true");
  });

  it("avoids a false seam in a complete circle and separates an unclassified remainder", () => {
    const chart = new Chart();
    chart.segments = [{ id: "a", label: "A", value: 50 }];
    document.body.append(chart);
    expect(chart.shadowRoot!.querySelectorAll('[part="separator"]')).toHaveLength(0);
    chart.total = 100;
    expect(chart.shadowRoot!.querySelectorAll('[part="separator"]')).toHaveLength(2);
    expect(chart.shadowRoot!.textContent).toContain("Unclassified");
    expect(chart.shadowRoot!.querySelector('[part="legend-share"]')!.textContent).toBe("50%");
  });

  it("keeps clipping independent between simultaneously mounted charts", () => {
    const charts = [new Chart(), new Chart()];
    for (const chart of charts) { chart.segments = [{ id: "a", label: "A", value: 1 }, { id: "b", label: "B", value: 2 }]; document.body.append(chart); }
    const ids = charts.map(chart => chart.shadowRoot!.querySelector("clipPath")!.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe("DonutChart", () => {
  beforeEach(() => {
    DonutChart.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders summary, timeframe, and segments", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    element.heading = "Share distribution";
    element.summary = "18 shares";
    element.timeframe = "Last 7 days";
    element.segments = [
      { id: "internal", label: "Internal", value: 10 },
      { id: "external", label: "External", value: 8, tone: "accent" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Share distribution");
    expect(element.shadowRoot?.textContent).toContain("18 shares");
    expect(element.shadowRoot?.textContent).toContain("Last 7 days");
    expect(element.shadowRoot?.textContent).toContain("Internal");
    expect(element.shadowRoot?.textContent).toContain("External");
  });

  it("emits action when an action button is clicked", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    const action = vi.fn();
    element.actions = [{ id: "open-breakdown", label: "Open breakdown", tone: "primary" }];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="open-breakdown"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: "open-breakdown",
        },
      }),
    );
  });

  it("emits segment-selected when a legend row is clicked", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    const selected = vi.fn();
    element.segments = [{ id: "external", label: "External", value: 8, tone: "accent" }];
    element.addEventListener("segment-selected", selected);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="legend-item"][data-segment-id="external"]');
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          id: "external",
          label: "External",
          value: 8,
          tone: "accent",
        },
      }),
    );
  });

  it("renders a full single-segment arc without collapsing", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    element.segments = [{ id: "only", label: "Only", value: 100 }];

    document.body.append(element);

    const onlyPath = element.shadowRoot?.querySelector('[data-segment-id="only"]') as SVGPathElement | null;
    expect(onlyPath?.getAttribute("d")).toBeTruthy();
    expect((onlyPath?.getAttribute("d")?.match(/A/g) ?? []).length).toBeGreaterThan(2);
  });

  it("cycles distinct default colors for untuned segments", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    element.segments = [
      { id: "alpha", label: "Alpha", value: 40 },
      { id: "beta", label: "Beta", value: 30 },
      { id: "gamma", label: "Gamma", value: 30 },
    ];

    document.body.append(element);

    const fills = Array.from(element.shadowRoot?.querySelectorAll('[part="segment"]') ?? []).map(node =>
      node.getAttribute("fill"),
    );
    expect(new Set(fills).size).toBe(3);
  });

  it("exposes a numeric segment summary on the chart aria-label", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    element.heading = "Share distribution";
    element.segments = [
      { id: "internal", label: "Internal", value: 10 },
      { id: "external", label: "External", value: 8 },
    ];

    document.body.append(element);

    const chart = element.shadowRoot?.querySelector('[part="chart"]');
    expect(chart?.getAttribute("aria-label")).toBe("Share distribution. Internal: 10, External: 8");
  });

  it("tracks pressed legend state after segment selection", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    element.segments = [
      { id: "internal", label: "Internal", value: 10 },
      { id: "external", label: "External", value: 8 },
    ];

    document.body.append(element);

    const external = element.shadowRoot?.querySelector(
      '[part="legend-item"][data-segment-id="external"]',
    ) as HTMLButtonElement | null;
    external?.click();

    const pressed = element.shadowRoot?.querySelector(
      '[part="legend-item"][data-segment-id="external"]',
    ) as HTMLButtonElement | null;
    expect(pressed?.getAttribute("aria-pressed")).toBe("true");
    expect(pressed?.getAttribute("data-pressed")).toBe("true");
  });

  it("clears pressed legend state when the selected segment is clicked again", () => {
    const element = document.createElement("box-donut-chart") as DonutChart;
    element.segments = [
      { id: "internal", label: "Internal", value: 10 },
      { id: "external", label: "External", value: 8 },
    ];

    document.body.append(element);

    const external = element.shadowRoot?.querySelector(
      '[part="legend-item"][data-segment-id="external"]',
    ) as HTMLButtonElement | null;
    external?.click();
    external?.click();

    const pressed = element.shadowRoot?.querySelector(
      '[part="legend-item"][data-segment-id="external"]',
    ) as HTMLButtonElement | null;
    expect(pressed?.getAttribute("aria-pressed")).toBe("false");
    expect(pressed?.getAttribute("data-pressed")).toBe("false");
  });
});
