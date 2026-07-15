// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxMultiSelectElement,
  defineBoxMultiSelectElement,
} from "../../../src/components/forms/multi-select.js";
import { FORM_ERROR_MESSAGE_ID, getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxMultiSelectElement", () => {
  beforeEach(() => {
    defineBoxMultiSelectElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders options and emits selected values", () => {
    const element = document.createElement("box-multi-select") as BoxMultiSelectElement;
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

  it("renders option-level disabled state through the public options API", () => {
    const element = document.createElement("box-multi-select") as BoxMultiSelectElement;
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download", disabled: true },
    ];
    document.body.append(element);

    const inputs = element.shadowRoot?.querySelectorAll('[part="input"]') ?? [];
    expect((inputs[0] as HTMLInputElement).disabled).toBe(false);
    expect((inputs[1] as HTMLInputElement).disabled).toBe(true);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="option"]:has([part="input"]:disabled)');
  });

  it("mirrors selected values as FormData entries and omits empty selection", () => {
    const element = document.createElement("box-multi-select") as BoxMultiSelectElement;
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

    const secondInput = inputs[1] as HTMLInputElement;
    secondInput.checked = true;
    secondInput.dispatchEvent(new Event("change", { bubbles: true }));

    const multi = getMirroredFormValue(element.internals);
    expect((multi as FormData).getAll("permissions")).toEqual(["preview", "download"]);

    firstInput.checked = false;
    secondInput.checked = false;
    secondInput.dispatchEvent(new Event("change", { bubbles: true }));

    expect(getMirroredFormValue(element.internals)).toBeNull();
  });

  it("restores form value via formStateRestoreCallback", () => {
    const element = document.createElement("box-multi-select") as BoxMultiSelectElement;
    element.name = "permissions";
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    document.body.append(element);

    const restored = new FormData();
    restored.append("permissions", "preview");
    restored.append("permissions", "download");
    element.formStateRestoreCallback(restored);

    expect(element.value).toEqual(["preview", "download"]);
    const mirrored = getMirroredFormValue(element.internals);
    expect(mirrored).toBeInstanceOf(FormData);
    expect((mirrored as FormData).getAll("permissions")).toEqual(["preview", "download"]);
  });

  it("propagates invalid ARIA state to every checkbox option", () => {
    const element = document.createElement("box-multi-select") as BoxMultiSelectElement;
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
