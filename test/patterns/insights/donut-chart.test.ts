// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxDonutChartElement,
  defineBoxDonutChartElement,
} from "../../../src/patterns/insights/donut-chart.js";

describe("BoxDonutChartElement", () => {
  beforeEach(() => {
    defineBoxDonutChartElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders summary, timeframe, and segments", () => {
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
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
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
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
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
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
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
    element.segments = [{ id: "only", label: "Only", value: 100 }];

    document.body.append(element);

    const onlyPath = element.shadowRoot?.querySelector('[data-segment-id="only"]') as SVGPathElement | null;
    expect(onlyPath?.getAttribute("d")).toBeTruthy();
    expect((onlyPath?.getAttribute("d")?.match(/A/g) ?? []).length).toBeGreaterThan(2);
  });

  it("cycles distinct default colors for untuned segments", () => {
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
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
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
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
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
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
    const element = document.createElement("box-donut-chart") as BoxDonutChartElement;
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
