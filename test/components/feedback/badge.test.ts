// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxBadgeElement, defineBoxBadgeElement } from "../../../src/components/feedback/badge.js";

describe("BoxBadgeElement", () => {
  beforeEach(() => {
    defineBoxBadgeElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders label and tone", () => {
    const element = document.createElement("box-badge") as BoxBadgeElement;
    element.label = "Beta";
    element.tone = "info";

    document.body.append(element);

    const badge = element.shadowRoot?.querySelector('[part="badge"]') as HTMLSpanElement | null;
    expect(badge?.textContent).toBe("Beta");
    expect(badge?.getAttribute("data-tone")).toBe("info");
    expect(badge?.getAttribute("role")).toBe("status");
  });

  it("uses BUE badge geometry", () => {
    const element = document.createElement("box-badge") as BoxBadgeElement;
    element.label = "New";
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 2px 4px 3px;");
    expect(styles).toContain("border-radius: 4px;");
    expect(styles).toContain("font-size: 10px;");
    expect(styles).not.toContain("border-radius: 999px");
  });
});
