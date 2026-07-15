// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxComboboxElement,
  defineBoxComboboxElement,
} from "../../../src/components/forms/combobox.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxComboboxElement", () => {
  beforeEach(() => {
    defineBoxComboboxElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders options in a datalist", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.options = [
      { label: "Marketing", value: "marketing" },
      { label: "Finance", value: "finance" },
    ];

    document.body.append(element);

    const options = element.shadowRoot?.querySelectorAll("datalist option") ?? [];
    expect(options).toHaveLength(2);
    expect(options[0]?.getAttribute("data-option-value")).toBe("marketing");
  });

  it("resolves option labels to option values on selection", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    const changed = vi.fn();
    element.options = [
      { label: "Marketing", value: "marketing" },
      { label: "Finance", value: "finance" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "Marketing";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(element.value).toBe("marketing");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "marketing" },
      }),
    );
    expect(getMirroredFormValue(element.internals)).toBe("marketing");
  });

  it("displays the option label when value is set programmatically", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.options = [
      { label: "Marketing", value: "marketing" },
      { label: "Finance", value: "finance" },
    ];
    document.body.append(element);

    element.value = "finance";

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    expect(input?.value).toBe("Finance");
    expect(element.value).toBe("finance");
  });

  it("resolves labels to values on blur", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.options = [{ label: "Marketing", value: "marketing" }];
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "Marketing";
    input?.dispatchEvent(new Event("blur", { bubbles: true }));

    expect(element.value).toBe("marketing");
    expect(input?.value).toBe("Marketing");
  });

  it("emits value changes as the input changes", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "custom-entry";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(element.value).toBe("custom-entry");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "custom-entry" },
      }),
    );
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.label = "Department";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Team";

    expect(document.activeElement).toBe(element);
  });

  it("supports disabled attribute on the input", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.disabled = true;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    expect(input?.disabled).toBe(true);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="input"]:focus-visible');
    expect(styles).toContain('[part="input"]:hover:not(:disabled)');
    expect(styles).toContain('[part="input"]:disabled');
  });
});
