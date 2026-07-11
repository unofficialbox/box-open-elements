// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxBarChartElement,
  defineBoxBarChartElement,
} from "../../../src/patterns/insights/bar-chart.js";

describe("BoxBarChartElement", () => {
  beforeEach(() => {
    defineBoxBarChartElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders summary, timeframe, and bar points", () => {
    const element = document.createElement("box-bar-chart") as BoxBarChartElement;
    element.title = "Share activity";
    element.summary = "18 shared";
    element.timeframe = "Last 7 days";
    element.points = [
      { id: "mon", label: "Mon", value: 4 },
      { id: "tue", label: "Tue", value: 7 },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Share activity");
    expect(element.shadowRoot?.textContent).toContain("18 shared");
    expect(element.shadowRoot?.textContent).toContain("Last 7 days");
    expect(element.shadowRoot?.textContent).toContain("Mon");
    expect(element.shadowRoot?.textContent).toContain("Tue");
  });

  it("emits action when an action button is clicked", () => {
    const element = document.createElement("box-bar-chart") as BoxBarChartElement;
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

  it("emits point-selected when a bar is clicked", () => {
    const element = document.createElement("box-bar-chart") as BoxBarChartElement;
    const selected = vi.fn();
    element.points = [{ id: "wed", label: "Wed", value: 9, tone: "accent" }];
    element.addEventListener("point-selected", selected);

    document.body.append(element);

    const point = element.shadowRoot?.querySelector('[data-point-id="wed"]') as HTMLButtonElement | null;
    point?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          id: "wed",
          label: "Wed",
          value: 9,
          tone: "accent",
        },
      }),
    );
  });
});
