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
    element.title = "Share distribution";
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
});
