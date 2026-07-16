// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxAlertElement, defineBoxAlertElement } from "../../../src/components/feedback/alert.js";

describe("BoxAlertElement", () => {
  beforeEach(() => {
    defineBoxAlertElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders title and message", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    element.heading = "Heads up";
    element.message = "Your session will expire soon.";
    element.tone = "warning";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Heads up");
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("Heads up");
    expect(element.shadowRoot?.textContent).toContain("Your session will expire soon.");
  });

  it("dismisses and emits an event", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    const dismissed = vi.fn();
    const openChanged = vi.fn();
    element.heading = "Saved";
    element.message = "Settings updated.";
    element.addEventListener("dismiss", dismissed);
    element.addEventListener("open-changed", openChanged);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    button?.click();

    expect(dismissed).toHaveBeenCalled();
    expect(openChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { open: false },
      }),
    );
    expect(element.open).toBe(false);
  });

  it("supports description as a compatible alias for message", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    element.heading = "Heads up";
    element.description = "Storage is almost full.";

    document.body.append(element);

    expect(element.message).toBe("Storage is almost full.");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("almost full");
  });

  it("exposes accessible alert and dismiss labels", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    element.heading = "Heads up";
    element.message = "Storage is almost full.";

    document.body.append(element);

    const alert = element.shadowRoot?.querySelector('[part="alert"]') as HTMLElement | null;
    const dismiss = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    const title = element.shadowRoot?.querySelector("#alert-title") as HTMLElement | null;
    expect(alert?.getAttribute("aria-labelledby")).toBe("alert-title");
    expect(alert?.hasAttribute("aria-label")).toBe(false);
    expect(title).not.toBeNull();
    expect(dismiss?.getAttribute("aria-label")).toBe("Dismiss alert");
  });

  it("names heading-less alerts with tone and message", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    element.message = "Storage is almost full.";
    element.tone = "warning";

    document.body.append(element);

    const alert = element.shadowRoot?.querySelector('[part="alert"]') as HTMLElement | null;
    expect(alert?.hasAttribute("aria-labelledby")).toBe(false);
    expect(alert?.getAttribute("aria-label")).toBe("Warning: Storage is almost full.");
  });

  it("announces tone with visually hidden text", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    element.heading = "Heads up";
    element.message = "Storage is almost full.";
    element.tone = "warning";

    document.body.append(element);

    const toneLabel = element.shadowRoot?.querySelector('[part="tone-label"]') as HTMLElement | null;
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(toneLabel?.textContent).toBe("Warning");
    expect(toneLabel?.classList.contains("sr-only")).toBe(true);
    expect(styles).toContain(".sr-only");
  });

  it("uses compact alert shell styles", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("gap: 0.55rem;");
    expect(styles).toContain("padding: 0.75rem;");
    expect(styles).toContain("border-radius: 0.7rem;");
  });

  it("includes focus-visible and interactive styles for dismiss", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    element.heading = "Heads up";
    element.message = "Storage is almost full.";
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="dismiss"]:focus-visible');
    expect(styles).toContain('[part="dismiss"]:hover:not(:disabled)');
    expect(styles).toContain('[part="dismiss"]:active:not(:disabled)');
    expect(styles).toContain('[part="dismiss"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-hover");
  });
});
