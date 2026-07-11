// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxCheckboxGroupElement,
  defineBoxCheckboxGroupElement,
} from "../../../src/components/forms/checkbox-group.js";

describe("BoxCheckboxGroupElement", () => {
  beforeEach(() => {
    defineBoxCheckboxGroupElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders checkbox options", () => {
    const element = document.createElement("box-checkbox-group") as BoxCheckboxGroupElement;
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];

    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];
    expect(inputs).toHaveLength(2);
  });

  it("emits selected values when options change", () => {
    const element = document.createElement("box-checkbox-group") as BoxCheckboxGroupElement;
    const changed = vi.fn();
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];
    const firstInput = inputs[0] as HTMLInputElement | undefined;
    firstInput!.checked = true;
    firstInput?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.value).toEqual(["preview"]);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: ["preview"] },
      }),
    );
  });

  it("forwards disabled state to checkbox inputs", () => {
    const element = document.createElement("box-checkbox-group") as BoxCheckboxGroupElement;
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    element.disabled = true;

    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];

    expect(Array.from(inputs).every(node => (node as HTMLInputElement).disabled)).toBe(true);
  });
});
