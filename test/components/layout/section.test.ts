// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxSectionElement, defineBoxSectionElement } from "../../../src/components/layout/section.js";

describe("BoxSectionElement", () => {
  beforeEach(() => {
    defineBoxSectionElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a heading that labels the section region", () => {
    const element = document.createElement("box-section") as BoxSectionElement;
    element.heading = "Recent activity";
    document.body.append(element);

    const section = element.shadowRoot?.querySelector('[part="section"]');
    const title = element.shadowRoot?.querySelector('[part~="title"]');
    expect(title?.textContent).toContain("Recent activity");
    // The section is named by its heading for assistive tech.
    expect(section?.getAttribute("aria-labelledby")).toBe(title?.id);
  });

  it("accepts title as an alias for heading", () => {
    const element = document.createElement("box-section") as BoxSectionElement;
    element.title = "Overview";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part~="title"]')?.textContent).toContain("Overview");
    expect(element.heading).toBe("Overview");
  });

  it("renders eyebrow and description only when provided", () => {
    const element = document.createElement("box-section") as BoxSectionElement;
    element.heading = "Settings";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="eyebrow"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="description"]')).toBeNull();

    element.eyebrow = "Workspace";
    element.description = "Manage members and access.";
    expect(element.shadowRoot?.querySelector('[part="eyebrow"]')?.textContent).toContain("Workspace");
    expect(element.shadowRoot?.querySelector('[part="description"]')?.textContent).toContain(
      "Manage members and access.",
    );
  });

  it("exposes actions and default content slots", () => {
    const element = document.createElement("box-section") as BoxSectionElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="actions"] slot[name="actions"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="body"] slot:not([name])')).toBeTruthy();
  });
});
