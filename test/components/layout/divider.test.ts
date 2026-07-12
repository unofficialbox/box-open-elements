// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxDividerElement, defineBoxDividerElement } from "../../../src/components/layout/divider.js";

describe("BoxDividerElement", () => {
  beforeEach(() => {
    defineBoxDividerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a horizontal separator by default", () => {
    const element = document.createElement("box-divider") as BoxDividerElement;
    document.body.append(element);

    const separator = element.shadowRoot?.querySelector('[part="divider"]');
    expect(separator?.getAttribute("role")).toBe("separator");
    expect(separator?.getAttribute("aria-orientation")).toBe("horizontal");
    expect(element.orientation).toBe("horizontal");
  });

  it("renders a label between two lines when provided", () => {
    const element = document.createElement("box-divider") as BoxDividerElement;
    element.label = "Shared";
    document.body.append(element);

    const label = element.shadowRoot?.querySelector('[part="label"]');
    const lines = element.shadowRoot?.querySelectorAll('[part~="line"]');
    expect(label?.textContent).toBe("Shared");
    expect(lines?.length).toBe(2);
  });

  it("drops the label for a vertical orientation", () => {
    const element = document.createElement("box-divider") as BoxDividerElement;
    element.orientation = "vertical";
    element.label = "Ignored";
    document.body.append(element);

    const separator = element.shadowRoot?.querySelector('[part="divider"]');
    expect(separator?.getAttribute("aria-orientation")).toBe("vertical");
    expect(element.shadowRoot?.querySelector('[part="label"]')).toBeNull();
  });

  it("normalizes unknown orientations to horizontal", () => {
    const element = document.createElement("box-divider") as BoxDividerElement;
    element.setAttribute("orientation", "diagonal");
    document.body.append(element);

    expect(element.orientation).toBe("horizontal");
  });
});
