// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ProgressBar,
} from "../../../src/components/feedback/progress-bar.js";

describe("ProgressBar", () => {
  beforeEach(() => {
    ProgressBar.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders percentage based on value and max", () => {
    const element = document.createElement("box-progress-bar") as ProgressBar;
    element.label = "Upload";
    element.max = 200;
    element.value = 50;

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Upload");
    expect(element.shadowRoot?.textContent).toContain("25%");
    expect(element.shadowRoot?.querySelector('[part="track"]')?.getAttribute("aria-valuetext")).toBe("25%");
  });
});
