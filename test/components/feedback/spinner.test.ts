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
