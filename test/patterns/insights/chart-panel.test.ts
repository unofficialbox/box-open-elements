// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxChartPanelElement,
  defineBoxChartPanelElement,
} from "../../../src/patterns/insights/chart-panel.js";

describe("BoxChartPanelElement", () => {
  beforeEach(() => {
    defineBoxChartPanelElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders summary, timeframe, and chart points", () => {
    const element = document.createElement("box-chart-panel") as BoxChartPanelElement;
    element.title = "Weekly activity";
    element.summary = "89%";
    element.timeframe = "Last 7 days";
    element.points = [
      { id: "mon", label: "Mon", value: 12 },
      { id: "tue", label: "Tue", value: 18 },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Weekly activity");
    expect(element.shadowRoot?.textContent).toContain("89%");
    expect(element.shadowRoot?.textContent).toContain("Last 7 days");
    expect(element.shadowRoot?.textContent).toContain("Mon");
    expect(element.shadowRoot?.textContent).toContain("Tue");
  });

  it("emits an action event when an action button is clicked", () => {
    const element = document.createElement("box-chart-panel") as BoxChartPanelElement;
    const action = vi.fn();
    element.actions = [{ id: "open-report", label: "Open report", tone: "primary" }];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="open-report"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: "open-report",
        },
      }),
    );
  });

  it("emits point-selected when a chart point is clicked", () => {
    const element = document.createElement("box-chart-panel") as BoxChartPanelElement;
    const pointSelected = vi.fn();
    element.points = [{ id: "wed", label: "Wed", value: 24, tone: "accent" }];
    element.addEventListener("point-selected", pointSelected);

    document.body.append(element);

    const point = element.shadowRoot?.querySelector('[data-point-id="wed"]') as HTMLButtonElement | null;
    point?.click();

    expect(pointSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          id: "wed",
          label: "Wed",
          value: 24,
          tone: "accent",
        },
      }),
    );
  });
});
