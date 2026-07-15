// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  formDataFromNamedValues,
  formDataFromRange,
  getMirroredFormValue,
  rangeFromFormValue,
  stringValuesFromFormValue,
} from "../../src/core/index.js";
import {
  BoxTextFieldElement,
  defineBoxTextFieldElement,
} from "../../src/components/forms/text-field.js";

describe("form value helpers", () => {
  it("builds and restores named multi-value FormData", () => {
    expect(formDataFromNamedValues("tags", [])).toBeNull();

    const data = formDataFromNamedValues("tags", ["a", "b"]);
    expect(data).toBeInstanceOf(FormData);
    expect(data!.getAll("tags")).toEqual(["a", "b"]);
    expect(stringValuesFromFormValue(data, "tags")).toEqual(["a", "b"]);
    expect(stringValuesFromFormValue('["x","y"]', "tags")).toEqual(["x", "y"]);
    expect(stringValuesFromFormValue("one, two", "tags")).toEqual(["one", "two"]);
  });

  it("builds and restores range FormData", () => {
    const data = formDataFromRange("budget", 10, 40);
    expect(data.get("budget-start")).toBe("10");
    expect(data.get("budget-end")).toBe("40");
    expect(rangeFromFormValue(data, "budget", { start: 0, end: 100 })).toEqual({
      start: 10,
      end: 40,
    });
  });
});

describe("FormAssociatedElement", () => {
  beforeEach(() => {
    defineBoxTextFieldElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects the name attribute on the host", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.name = "username";

    document.body.append(element);

    expect(element.getAttribute("name")).toBe("username");
    expect(element.name).toBe("username");
  });

  it("shows an alert region and aria-invalid when invalid with an error message", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.invalid = true;
    element.errorMessage = "Required field";

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    const error = element.shadowRoot?.querySelector('[part="error-message"]') as HTMLElement | null;

    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(input?.getAttribute("aria-errormessage")).toBe("boe-field-error");
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.hidden).toBe(false);
    expect(error?.textContent).toBe("Required field");
  });

  it("mirrors the form value after typing", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "Roadmap";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(getMirroredFormValue(element.internals)).toBe("Roadmap");
  });

  it("clears the mirrored form value when disabled", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.value = "Draft";
    document.body.append(element);

    expect(getMirroredFormValue(element.internals)).toBe("Draft");

    element.disabled = true;

    expect(getMirroredFormValue(element.internals)).toBeNull();
  });
});
