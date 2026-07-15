// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxMultiSelectElement,
  defineBoxMultiSelectElement,
} from "../../../src/components/forms/multi-select.js";

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
});
