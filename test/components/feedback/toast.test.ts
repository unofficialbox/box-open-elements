// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxToastElement, defineBoxToastElement } from "../../../src/components/feedback/toast.js";

describe("BoxToastElement", () => {
  beforeEach(() => {
    defineBoxToastElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("shows and dismisses a toast", () => {
    const element = document.createElement("box-toast") as BoxToastElement;
    const dismissed = vi.fn();
    element.addEventListener("dismiss", dismissed);

    document.body.append(element);
    element.show("Saved", { duration: 0, tone: "success" });

    expect(element.open).toBe(true);
    expect(element.shadowRoot?.textContent).toContain("Saved");

    const dismiss = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    dismiss?.click();

    expect(dismissed).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it("auto-hides after the provided duration", () => {
    vi.useFakeTimers();
    const element = document.createElement("box-toast") as BoxToastElement;

    document.body.append(element);
    element.show("Done", { duration: 100 });
    vi.advanceTimersByTime(100);

    expect(element.open).toBe(false);
  });
});
