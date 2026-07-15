// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxComboboxElement,
  defineBoxComboboxElement,
} from "../../../src/components/forms/combobox.js";

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
  });

  it("emits value changes as the input changes", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "Marketing";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(element.value).toBe("Marketing");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "Marketing" },
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
