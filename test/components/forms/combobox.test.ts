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
});
