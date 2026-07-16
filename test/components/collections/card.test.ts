// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxCardElement, defineBoxCardElement } from "../../../src/components/collections/card.js";

describe("BoxCardElement", () => {
  beforeEach(() => {
    defineBoxCardElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders eyebrow, heading, and slotted body content", () => {
    const element = document.createElement("box-card") as BoxCardElement;
    element.eyebrow = "Project";
    element.heading = "Launch Readiness";
    element.textContent = "Body copy";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Project");
    expect(element.shadowRoot?.textContent).toContain("Launch Readiness");
    expect(element.textContent).toContain("Body copy");
  });

  it("uses compact card shell styles", () => {
    const element = document.createElement("box-card") as BoxCardElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("gap: 0.55rem;");
    expect(styles).toContain("padding: 0.7rem;");
    expect(styles).toContain("border-radius: 0.7rem;");
  });

  it("renders the heading", () => {
    const element = document.createElement("box-card") as BoxCardElement;
    element.heading = "Release Notes";

    document.body.append(element);

    expect(element.heading).toBe("Release Notes");
    const title = element.shadowRoot?.querySelector('[part~="title"]');
    expect(title?.textContent).toContain("Release Notes");
    expect(title?.tagName).toBe("H2");
  });
});
