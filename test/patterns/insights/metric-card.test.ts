// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MetricCard,
} from "../../../src/patterns/insights/metric-card.js";

describe("MetricCard", () => {
  beforeEach(() => {
    MetricCard.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders value, status, and trend", () => {
    const element = document.createElement("box-metric-card") as MetricCard;
    element.heading = "External shares";
    element.value = "148";
    element.status = "Healthy";
    element.trend = { label: "+12% this week", direction: "up" };

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("External shares");
    expect(element.shadowRoot?.textContent).toContain("148");
    expect(element.shadowRoot?.textContent).toContain("Healthy");
    expect(element.shadowRoot?.textContent).toContain("+12% this week");
  });

  it("emits action when the card action is clicked", () => {
    const element = document.createElement("box-metric-card") as MetricCard;
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

  it("includes brand focus-visible and interactive states for the action", () => {
    const element = document.createElement("box-metric-card") as MetricCard;
    element.action = { id: "open-report", label: "Open report", tone: "primary" };
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="action"]:focus-visible');
    expect(styles).toContain('[part="action"]:hover:not(:disabled)');
    expect(styles).toContain('[part="action"][data-tone="primary"]:active:not(:disabled)');
    expect(styles).toContain('[part="action"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});
