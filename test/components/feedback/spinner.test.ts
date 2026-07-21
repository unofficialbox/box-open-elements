// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxSpinnerElement, defineBoxSpinnerElement } from "../../../src/components/feedback/spinner.js";
import { boeMotionDuration, boeMotionEasing } from "../../../src/foundations/motion/index.js";

describe("BoxSpinnerElement", () => {
  beforeEach(() => {
    defineBoxSpinnerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the provided label", () => {
    const element = document.createElement("box-spinner") as BoxSpinnerElement;
    element.label = "Loading folders";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Loading folders");
  });

  it("applies a data-size only for non-default sizes", () => {
    const element = document.createElement("box-spinner") as BoxSpinnerElement;
    document.body.append(element);
    const indicator = element.shadowRoot?.querySelector('[part="indicator"]') as HTMLElement;

    // Default (medium) carries no data-size attribute.
    expect(indicator.hasAttribute("data-size")).toBe(false);

    element.size = "large";
    expect(indicator.getAttribute("data-size")).toBe("large");

    element.size = "small";
    expect(indicator.getAttribute("data-size")).toBe("small");

    // An unrecognized size falls back to medium (attribute removed).
    element.size = "huge";
    expect(indicator.hasAttribute("data-size")).toBe(false);
  });

  it("uses shared motion vocabulary for spin and reduced-motion", () => {
    const element = document.createElement("box-spinner") as BoxSpinnerElement;
    document.body.append(element);

    const styleText = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styleText).toContain(
      `animation: boe-spinner-rotate ${boeMotionDuration.spin} ${boeMotionEasing.linear} infinite`,
    );
    expect(styleText).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleText).toContain('[part="indicator"]');
    expect(styleText).toContain("animation-duration: 1.6s;");
  });
});
