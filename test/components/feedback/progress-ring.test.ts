// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxProgressRingElement,
  defineBoxProgressRingElement,
} from "../../../src/components/feedback/progress-ring.js";

describe("BoxProgressRingElement", () => {
  beforeEach(() => {
    defineBoxProgressRingElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders percentage based on value and max", () => {
    const element = document.createElement("box-progress-ring") as BoxProgressRingElement;
    element.label = "Upload";
    element.max = 40;
    element.value = 10;

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("25%");
    expect(element.shadowRoot?.textContent).toContain("Upload");
    expect(element.shadowRoot?.querySelector('[part="svg"]')?.getAttribute("aria-valuetext")).toBe("25%");
  });
});
