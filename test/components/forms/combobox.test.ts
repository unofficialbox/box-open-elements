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

  const openListbox = (element: BoxComboboxElement): HTMLInputElement => {
    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent("focus"));
    return input;
  };

  it("renders options as an ARIA listbox when opened", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.options = [
      { label: "Marketing", value: "marketing" },
      { label: "Finance", value: "finance" },
    ];
    document.body.append(element);

    const listbox = element.shadowRoot?.querySelector('[part="listbox"]') as HTMLElement;
    expect(listbox.getAttribute("role")).toBe("listbox");
    expect(listbox.hidden).toBe(true);

    const input = openListbox(element);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(listbox.hidden).toBe(false);
    const options = listbox.querySelectorAll('[part="option"]');
    expect(options).toHaveLength(2);
    expect((options[0] as HTMLElement).dataset.value).toBe("marketing");
    expect(options[0].getAttribute("role")).toBe("option");
  });

  it("filters options by typed text", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.options = [
      { label: "Marketing", value: "marketing" },
      { label: "Finance", value: "finance" },
      { label: "Facilities", value: "facilities" },
    ];
    document.body.append(element);

    const input = openListbox(element);
    input.value = "fi";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const labels = Array.from(element.shadowRoot?.querySelectorAll('[part="option-label"]') ?? []).map(
      node => node.textContent,
    );
    expect(labels).toEqual(["Finance"]);
  });

  it("navigates options with the keyboard via aria-activedescendant and selects on Enter", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    const changed = vi.fn();
    element.options = [
      { label: "Marketing", value: "marketing" },
      { label: "Finance", value: "finance" },
    ];
    element.addEventListener("value-changed", changed);
    document.body.append(element);

    const input = openListbox(element);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const firstActive = input.getAttribute("aria-activedescendant");
    expect(firstActive).toBeTruthy();
    expect(element.shadowRoot?.querySelector(`#${firstActive}`)?.getAttribute("part")).toContain("option");

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(element.value).toBe("finance");
    expect(input.value).toBe("Finance");
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "finance" } }));
    // Listbox closes after selection.
    expect((element.shadowRoot?.querySelector('[part="listbox"]') as HTMLElement).hidden).toBe(true);
  });

  it("renders group dividers and per-option descriptions", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.options = [
      { label: "Morgan Lee", value: "morgan", description: "morgan@box.com", group: "People" },
      { label: "Alex Kim", value: "alex", description: "alex@box.com", group: "People" },
      { label: "Marketing", value: "marketing", group: "Groups" },
    ];
    document.body.append(element);
    openListbox(element);

    const groups = element.shadowRoot?.querySelectorAll('[part="group-label"]');
    expect(Array.from(groups ?? []).map(n => n.textContent)).toEqual(["People", "Groups"]);
    expect(element.shadowRoot?.querySelector('[part="option-description"]')?.textContent).toBe("morgan@box.com");
  });

  it("selects an option on click", () => {
    const element = document.createElement("box-combobox") as BoxComboboxElement;
    element.options = [
      { label: "Marketing", value: "marketing" },
      { label: "Finance", value: "finance" },
    ];
    document.body.append(element);
    openListbox(element);

    const option = element.shadowRoot?.querySelector('[part="option"][data-value="finance"]') as HTMLElement;
    option.click();

    expect(element.value).toBe("finance");
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
