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

  it("supports title as the preferred heading alias", () => {
    const element = document.createElement("box-card") as BoxCardElement;
    element.title = "Release Notes";

    document.body.append(element);

    expect(element.heading).toBe("Release Notes");
    expect(element.shadowRoot?.querySelector('[part~="title"]')?.textContent).toContain("Release Notes");
  });
});
