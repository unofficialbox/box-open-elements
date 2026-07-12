// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxFieldsetElement, defineBoxFieldsetElement } from "../../../src/components/forms/fieldset.js";

describe("BoxFieldsetElement", () => {
  beforeEach(() => {
    defineBoxFieldsetElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a legend and a body slot", () => {
    const element = document.createElement("box-fieldset") as BoxFieldsetElement;
    element.label = "Contact details";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="legend"]')?.textContent).toContain("Contact details");
    expect(element.shadowRoot?.querySelector('[part="body"] slot')).toBeTruthy();
  });

  it("omits the legend when no label is set", () => {
    const element = document.createElement("box-fieldset") as BoxFieldsetElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="legend"]')).toBeNull();
  });

  it("wires a description via aria-describedby", () => {
    const element = document.createElement("box-fieldset") as BoxFieldsetElement;
    element.label = "Address";
    element.description = "Where should we ship?";
    document.body.append(element);

    const fieldset = element.shadowRoot?.querySelector('[part="fieldset"]');
    const description = element.shadowRoot?.querySelector('[part="description"]');
    expect(description?.textContent).toContain("Where should we ship?");
    expect(fieldset?.getAttribute("aria-describedby")).toBe(description?.id);
  });

  it("propagates disabled to slotted light-DOM controls", () => {
    const element = document.createElement("box-fieldset") as BoxFieldsetElement;
    const input = document.createElement("input");
    const button = document.createElement("button");
    element.append(input, button);
    document.body.append(element);

    expect(input.disabled).toBe(false);

    element.disabled = true;
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);

    element.disabled = false;
    expect(input.disabled).toBe(false);
    expect(button.disabled).toBe(false);
  });

  it("does not re-enable a control the consumer disabled independently", () => {
    const element = document.createElement("box-fieldset") as BoxFieldsetElement;
    const input = document.createElement("input");
    input.disabled = true;
    element.append(input);
    document.body.append(element);

    element.disabled = true;
    element.disabled = false;

    // The consumer's own disabled state must survive the group toggling off.
    expect(input.disabled).toBe(true);
  });
});
