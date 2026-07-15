// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxMetricCardElement,
  defineBoxMetricCardElement,
} from "../../../src/patterns/insights/metric-card.js";

describe("BoxMetricCardElement", () => {
  beforeEach(() => {
    defineBoxMetricCardElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders value, status, and trend", () => {
    const element = document.createElement("box-metric-card") as BoxMetricCardElement;
    element.heading = "External shares";
    element.value = "148";
    element.status = "Healthy";
    element.trend = { label: "+12% this week", direction: "up" };

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("148");
    expect(element.shadowRoot?.textContent).toContain("Healthy");
    expect(element.shadowRoot?.textContent).toContain("+12% this week");
  });

  it("emits action when the card action is clicked", () => {
    const element = document.createElement("box-metric-card") as BoxMetricCardElement;
    const action = vi.fn();
    element.action = { id: "open-report", label: "Open report", tone: "primary" };
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="open-report"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          id: "open-report",
          label: "Open report",
          tone: "primary",
        },
      }),
    );
  });
});
