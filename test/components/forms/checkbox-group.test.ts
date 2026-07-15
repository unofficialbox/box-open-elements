// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxCheckboxGroupElement,
  defineBoxCheckboxGroupElement,
} from "../../../src/components/forms/checkbox-group.js";
import { FORM_ERROR_MESSAGE_ID, getMirroredFormValue } from "../../../src/core/index.js";

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

  it("mirrors selected values as FormData entries", () => {
    const element = document.createElement("box-checkbox-group") as BoxCheckboxGroupElement;
    element.name = "permissions";
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    document.body.append(element);

    expect(getMirroredFormValue(element.internals)).toBeNull();

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];
    const firstInput = inputs[0] as HTMLInputElement;
    firstInput.checked = true;
    firstInput.dispatchEvent(new Event("change", { bubbles: true }));

    const updated = getMirroredFormValue(element.internals);
    expect(updated).toBeInstanceOf(FormData);
    expect((updated as FormData).getAll("permissions")).toEqual(["preview"]);
  });

  it("mirrors programmatic value assignment to FormData", () => {
    const element = document.createElement("box-checkbox-group") as BoxCheckboxGroupElement;
    element.name = "permissions";
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    document.body.append(element);

    element.value = ["preview", "download"];

    const formValue = getMirroredFormValue(element.internals);
    expect(formValue).toBeInstanceOf(FormData);
    expect((formValue as FormData).getAll("permissions")).toEqual(["preview", "download"]);
  });

  it("propagates invalid ARIA state to every checkbox option", () => {
    const element = document.createElement("box-checkbox-group") as BoxCheckboxGroupElement;
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    element.invalid = true;
    element.errorMessage = "Pick at least one";
    document.body.append(element);

    const inputs = Array.from(
      element.shadowRoot?.querySelectorAll('[part="input"]') ?? [],
    ) as HTMLInputElement[];

    for (const input of inputs) {
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-errormessage")).toBe(FORM_ERROR_MESSAGE_ID);
    }

    const error = element.shadowRoot?.querySelector('[part="error-message"]');
    expect(error?.textContent).toBe("Pick at least one");
    expect((error as HTMLElement | null)?.hidden).toBe(false);
  });
});
