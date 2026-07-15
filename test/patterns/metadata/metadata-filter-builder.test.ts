// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxMetadataFilterBuilderElement,
  defineBoxMetadataFilterBuilderElement,
} from "../../../src/patterns/metadata/metadata-filter-builder.js";

describe("BoxMetadataFilterBuilderElement", () => {
  beforeEach(() => {
    defineBoxMetadataFilterBuilderElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders configured rules", () => {
    const element = document.createElement("box-metadata-filter-builder") as BoxMetadataFilterBuilderElement;
    element.fields = [
      { id: "classification", label: "Classification" },
      { id: "department", label: "Department" },
    ];
    element.rules = [{ field: "classification", operator: "is", value: "internal" }];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Classification");
    expect(element.shadowRoot?.textContent).toContain("Remove");
  });

  it("emits value-changed when a rule value changes", () => {
    const element = document.createElement("box-metadata-filter-builder") as BoxMetadataFilterBuilderElement;
    const changed = vi.fn();
    element.fields = [{ id: "classification", label: "Classification" }];
    element.rules = [{ field: "classification", operator: "is", value: "internal" }];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    if (input) {
      input.value = "confidential";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    expect(element.rules[0]?.value).toBe("confidential");
    expect(changed).toHaveBeenCalled();
  });

  it("emits rule-added and rule-removed", () => {
    const element = document.createElement("box-metadata-filter-builder") as BoxMetadataFilterBuilderElement;
    const added = vi.fn();
    const removed = vi.fn();
    element.fields = [{ id: "classification", label: "Classification" }];
    element.addEventListener("rule-added", added);
    element.addEventListener("rule-removed", removed);

    document.body.append(element);

    const addButton = element.shadowRoot?.querySelector('[part="add"]') as HTMLButtonElement | null;
    addButton?.click();

    const removeButton = element.shadowRoot?.querySelector('[part="remove"]') as HTMLButtonElement | null;
    removeButton?.click();

    expect(added).toHaveBeenCalled();
    expect(removed).toHaveBeenCalled();
  });

  it("preserves focus and value while typing into a rule input", () => {
    const element = document.createElement("box-metadata-filter-builder") as BoxMetadataFilterBuilderElement;
    element.fields = [{ id: "classification", label: "Classification" }];
    element.rules = [{ field: "classification", operator: "is", value: "" }];
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    input.focus();
    expect(element.shadowRoot?.activeElement).toBe(input);

    input.value = "con";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input.value).toBe("con");

    input.value = "confidential";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input.value).toBe("confidential");
    expect(element.rules[0]?.value).toBe("confidential");

    // An unrelated attribute update must not destroy the focused input.
    element.label = "Filters";
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input.value).toBe("confidential");
  });

  it("keeps field/operator select focus when changing rule controls", () => {
    const element = document.createElement("box-metadata-filter-builder") as BoxMetadataFilterBuilderElement;
    element.fields = [
      { id: "classification", label: "Classification" },
      { id: "department", label: "Department" },
    ];
    element.rules = [{ field: "classification", operator: "is", value: "internal" }];
    document.body.append(element);

    const fieldSelect = element.shadowRoot?.querySelector(
      '[data-control="field"]',
    ) as HTMLSelectElement;
    fieldSelect.focus();
    fieldSelect.value = "department";
    fieldSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.shadowRoot?.activeElement).toBe(fieldSelect);
    expect(element.rules[0]?.field).toBe("department");
    expect(element.shadowRoot?.querySelector('[data-control="field"]')).toBe(fieldSelect);

    const operatorSelect = element.shadowRoot?.querySelector(
      '[data-control="operator"]',
    ) as HTMLSelectElement;
    operatorSelect.focus();
    operatorSelect.value = "contains";
    operatorSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.shadowRoot?.activeElement).toBe(operatorSelect);
    expect(element.rules[0]?.operator).toBe("contains");
  });

  it("includes brand focus-visible and interactive states for controls", () => {
    const element = document.createElement("box-metadata-filter-builder") as BoxMetadataFilterBuilderElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="input"]:focus-visible');
    expect(styles).toContain('[part="add"]:hover:not(:disabled)');
    expect(styles).toContain('[part="remove"]:active:not(:disabled)');
    expect(styles).toContain('[part="select"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});

