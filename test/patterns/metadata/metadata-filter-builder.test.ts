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
});

