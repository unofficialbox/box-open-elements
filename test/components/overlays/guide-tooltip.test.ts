// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxGuideTooltipElement,
  defineBoxGuideTooltipElement,
} from "../../../src/components/overlays/guide-tooltip.js";

const create = (attrs: Record<string, string> = {}): BoxGuideTooltipElement => {
  const element = document.createElement("box-guide-tooltip") as BoxGuideTooltipElement;
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  document.body.append(element);
  return element;
};

const callout = (element: BoxGuideTooltipElement): HTMLElement =>
  element.shadowRoot?.querySelector('[part="callout"]') as HTMLElement;

describe("BoxGuideTooltipElement", () => {
  beforeEach(() => {
    defineBoxGuideTooltipElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("stays hidden until opened, then positions as a fixed callout", () => {
    const element = create({ heading: "Welcome" });
    expect(callout(element).hidden).toBe(true);

    element.show();
    expect(callout(element).hidden).toBe(false);
    expect(callout(element).style.position).toBe("fixed");
    expect(callout(element).getAttribute("role")).toBe("dialog");
  });

  it("renders the heading and a step indicator", () => {
    const element = create({ heading: "Upload files", step: "2", total: "4", open: "" });
    expect(element.shadowRoot?.querySelector('[part="heading"]')?.textContent).toBe("Upload files");
    const step = element.shadowRoot?.querySelector('[part="step"]') as HTMLElement;
    expect(step.hidden).toBe(false);
    expect(step.textContent).toBe("2 of 4");
  });

  it("hides Back on the first step and finishes Next on the last", () => {
    const element = create({ step: "1", total: "3", open: "" });
    const back = element.shadowRoot?.querySelector('[part="back"]') as HTMLElement;
    const next = element.shadowRoot?.querySelector('[part="next"]') as HTMLElement;
    expect(back.hidden).toBe(true);
    expect(next.textContent).toBe("Next");

    element.step = 3;
    expect(back.hidden).toBe(false);
    expect(next.textContent).toBe("Done");
  });

  it("emits next / back / close with the current step", () => {
    const element = create({ step: "2", total: "4", open: "" });
    const onNext = vi.fn();
    const onBack = vi.fn();
    const onClose = vi.fn();
    element.addEventListener("next", onNext);
    element.addEventListener("back", onBack);
    element.addEventListener("close", onClose);

    (element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement).click();
    (element.shadowRoot?.querySelector('[part="back"]') as HTMLButtonElement).click();
    (element.shadowRoot?.querySelector('[part="close"]') as HTMLButtonElement).click();

    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ detail: { step: 2 } }));
    expect(onBack).toHaveBeenCalledWith(expect.objectContaining({ detail: { step: 2 } }));
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ detail: { step: 2 } }));
    // Close also dismisses the callout.
    expect(element.open).toBe(false);
  });

  it("anchors to the element referenced by `for`", () => {
    const target = document.createElement("button");
    target.id = "tour-target";
    document.body.append(target);
    const element = create({ for: "tour-target", open: "" });

    // Positioning ran without throwing against the referenced anchor.
    expect(callout(element).style.position).toBe("fixed");
    expect(callout(element).style.top).not.toBe("");
  });

  it("closes on Escape from the callout", () => {
    const element = create({ open: "" });
    callout(element).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(element.open).toBe(false);
  });
});
