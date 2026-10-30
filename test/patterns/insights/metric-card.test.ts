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

describe("MetricCard summary options", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("defaults and normalizes unknown size and tone", () => {
    const element = document.createElement("box-metric-card") as MetricCard;
    expect(element.size).toBe("default");
    expect(element.tone).toBe("neutral");
    element.setAttribute("size", "unknown");
    element.setAttribute("tone", 'error" onclick="bad');
    document.body.append(element);
    expect(element.size).toBe("default");
    expect(element.tone).toBe("neutral");
    expect(element.shadowRoot?.querySelector('[part="value"]')?.getAttribute("data-tone")).toBe("neutral");
  });

  it("reactively colors only the value while preserving status, trend and action", () => {
    const element = document.createElement("box-metric-card") as MetricCard;
    element.value = "3";
    element.status = "Needs attention";
    element.trend = { label: "Down 2", direction: "down" };
    element.action = { id: "details", label: "Details" };
    document.body.append(element);
    for (const tone of ["error", "warning", "success", "neutral"] as const) {
      element.tone = tone;
      expect(element.shadowRoot?.querySelector('[part="value"]')?.getAttribute("data-tone")).toBe(tone);
      expect(element.shadowRoot?.querySelector('[part="status"]')?.textContent).toBe("Needs attention");
      expect(element.shadowRoot?.querySelector('[part="trend"]')?.textContent).toBe("Down 2");
      expect(element.shadowRoot?.querySelector('[part="action"]')?.textContent).toBe("Details");
    }
    element.removeAttribute("tone");
    expect(element.tone).toBe("neutral");
  });

  it("reflects compact and default size without replacing heading semantics or creating a status pill", () => {
    const element = document.createElement("box-metric-card") as MetricCard;
    element.heading = "Failed calls";
    document.body.append(element);
    element.size = "compact";
    element.tone = "error";
    expect(element.getAttribute("size")).toBe("compact");
    expect(element.shadowRoot?.querySelector("h2")?.textContent).toBe("Failed calls");
    expect(element.shadowRoot?.querySelector('[part="status"]')).toBeNull();
    element.size = "default";
    expect(element.size).toBe("default");
    element.removeAttribute("size");
    expect(element.size).toBe("default");
  });
});


it("preserves metric health beside a persistent live data-state message",()=>{
  const card=new MetricCard();document.body.append(card);const root=card.shadowRoot!;
  const live=root.querySelector('[part="data-status"]')!;
  expect(live.getAttribute("role")).toBe("status");expect(live.textContent).toBe("");
  card.status="Needs attention";
  for(const state of ["loading","error","partial","stale"]){
    card.state=state;expect(root.querySelector('[part="data-status"]')).toBe(live);
    expect(live.textContent).not.toBe("");expect(live.closest('[aria-busy="true"]')).toBeNull();
    expect(root.querySelector('[part="status"]')!.textContent).toBe("Needs attention");
  }
  card.state="ready";expect(live.textContent).toBe("");
  card.statusMessage="Cached at 09:00";expect(live.textContent).toBe("Cached at 09:00");card.remove();
});
