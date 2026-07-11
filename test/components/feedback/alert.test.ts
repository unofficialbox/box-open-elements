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
    element.title = "Heads up";
    element.message = "Your session will expire soon.";
    element.tone = "warning";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Heads up");
    expect(element.shadowRoot?.textContent).toContain("Your session will expire soon.");
  });

  it("dismisses and emits an event", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    const dismissed = vi.fn();
    const openChanged = vi.fn();
    element.title = "Saved";
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
    element.title = "Heads up";
    element.description = "Storage is almost full.";

    document.body.append(element);

    expect(element.message).toBe("Storage is almost full.");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("almost full");
  });

  it("exposes accessible alert and dismiss labels", () => {
    const element = document.createElement("box-alert") as BoxAlertElement;
    element.title = "Heads up";
    element.message = "Storage is almost full.";

    document.body.append(element);

    const alert = element.shadowRoot?.querySelector('[part="alert"]') as HTMLElement | null;
    const dismiss = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    expect(alert?.getAttribute("aria-label")).toBe("Heads up");
    expect(dismiss?.getAttribute("aria-label")).toBe("Dismiss alert");
  });
});
