// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Indicator } from "../../../src/components/feedback/indicator.js";

describe("box-indicator", () => {
  beforeEach(() => {
    Indicator.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (attrs: Record<string, string> = {}): Indicator => {
    const element = document.createElement("box-indicator") as Indicator;
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    document.body.append(element);
    return element;
  };

  const shape = (element: Indicator): string =>
    element.shadowRoot?.querySelector('[part="shape"]')?.innerHTML ?? "";

  it("draws a different shape per tone, not just a different colour", () => {
    // A column of coloured dots is unreadable to anyone who cannot separate the
    // colours, and status is exactly what a reader needs from a dense list.
    const shapes = ["info", "success", "warning", "error", "pending"].map(tone =>
      shape(mount({ tone })),
    );

    expect(new Set(shapes).size).toBe(5);
  });

  it("falls back to the neutral disc for an unknown tone", () => {
    expect(shape(mount({ tone: "banana" }))).toBe(shape(mount({ tone: "info" })));
  });

  it("speaks the tone when there is no visible label", () => {
    // A bare dot otherwise announces nothing at all.
    const element = mount({ tone: "success" });

    expect(element.shadowRoot?.querySelector('[part="tone-label"]')?.textContent).toBe("Success");
  });

  it("stays quiet when a label already carries the meaning", () => {
    // Otherwise a reader hears "Success Signed" where the screen says "Signed".
    const element = mount({ tone: "success", label: "Signed" });

    expect(element.shadowRoot?.querySelector('[part="tone-label"]')?.textContent).toBe("");
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Signed");
  });

  it("hides the shape from assistive technology", () => {
    expect(mount().shadowRoot?.querySelector('[part="shape"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("repaints the shape only when the tone changes", () => {
    const element = mount({ tone: "info" });
    const shapeEl = element.shadowRoot!.querySelector('[part="shape"]') as HTMLElement;
    const before = shapeEl.firstElementChild;

    element.label = "Still info";
    expect(shapeEl.firstElementChild).toBe(before);

    element.tone = "error";
    expect(shapeEl.firstElementChild).not.toBe(before);
  });
});
