// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxLineChartElement,
  defineBoxLineChartElement,
} from "../../../src/patterns/insights/line-chart.js";

describe("BoxLineChartElement", () => {
  beforeEach(() => {
    defineBoxLineChartElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders summary, timeframe, and line points", () => {
    const element = document.createElement("box-line-chart") as BoxLineChartElement;
    element.heading = "Review activity";
    element.summary = "64 reviewed";
    element.timeframe = "Last 7 days";
    element.points = [
      { id: "mon", label: "Mon", value: 12 },
      { id: "tue", label: "Tue", value: 18 },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Review activity");
    expect(element.shadowRoot?.textContent).toContain("64 reviewed");
    expect(element.shadowRoot?.textContent).toContain("Last 7 days");
    expect(element.shadowRoot?.textContent).toContain("Mon");
    expect(element.shadowRoot?.textContent).toContain("Tue");
    expect(element.shadowRoot?.querySelector('[part="path"]')).toBeTruthy();
  });

  it("emits action when an action button is clicked", () => {
    const element = document.createElement("box-line-chart") as BoxLineChartElement;
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

  it("emits point-selected when a point is clicked", () => {
    const element = document.createElement("box-line-chart") as BoxLineChartElement;
    const selected = vi.fn();
    element.points = [{ id: "wed", label: "Wed", value: 24, tone: "accent" }];
    element.addEventListener("point-selected", selected);

    document.body.append(element);

    const point = element.shadowRoot?.querySelector('[data-point-id="wed"]') as HTMLButtonElement | null;
    point?.click();

    expect(selected).toHaveBeenCalledWith(
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
