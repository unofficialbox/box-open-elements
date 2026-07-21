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

  it("caps a numeric label at max, rendering max+", () => {
    const element = document.createElement("box-badge") as BoxBadgeElement;
    element.label = "128";
    element.max = 99;
    document.body.append(element);

    const badge = element.shadowRoot?.querySelector('[part="badge"]') as HTMLElement;
    expect(badge.textContent).toBe("99+");
    expect(badge.getAttribute("aria-label")).toBe("99+");

    // At or below the cap the raw value shows through.
    element.label = "42";
    expect(badge.textContent).toBe("42");

    // Non-numeric labels are never capped.
    element.label = "Beta";
    expect(badge.textContent).toBe("Beta");
  });

  it("hides the badge when the count is zero or empty with hide-when-zero", () => {
    const element = document.createElement("box-badge") as BoxBadgeElement;
    element.hideWhenZero = true;
    element.label = "0";
    document.body.append(element);

    expect(element.hasAttribute("hidden")).toBe(true);

    element.label = "3";
    expect(element.hasAttribute("hidden")).toBe(false);

    element.label = "";
    expect(element.hasAttribute("hidden")).toBe(true);
  });

  it("pops on value change only when animate is set", () => {
    const element = document.createElement("box-badge") as BoxBadgeElement;
    element.setAttribute("animate", "");
    element.label = "1";
    document.body.append(element);

    const badge = element.shadowRoot?.querySelector('[part="badge"]') as HTMLElement;
    // First render establishes the baseline; no pop yet.
    expect(badge.classList.contains("boe-pop")).toBe(false);

    element.label = "2";
    expect(badge.classList.contains("boe-pop")).toBe(true);
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
