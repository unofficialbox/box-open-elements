// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxItemFormElement, defineBoxItemFormElement } from "../../../src/patterns/item/item-form.js";

describe("BoxItemFormElement", () => {
  beforeEach(() => {
    defineBoxItemFormElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders schema-driven fields", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    element.fields = [
      { id: "name", label: "Name" },
      { id: "description", label: "Description", type: "textarea" },
      { id: "classification", label: "Classification", type: "select", options: [{ label: "Internal", value: "internal" }] },
      { id: "shared", label: "Shared", type: "checkbox" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.querySelectorAll('[data-field-id="name"]').length).toBe(1);
    expect(element.shadowRoot?.querySelectorAll('[data-field-id="description"]').length).toBe(1);
    expect(element.shadowRoot?.querySelectorAll('[data-field-id="classification"]').length).toBe(1);
    expect(element.shadowRoot?.querySelectorAll('[data-field-id="shared"]').length).toBe(1);
  });

  it("emits value-changed when fields update", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    const changed = vi.fn();
    element.fields = [{ id: "name", label: "Name" }];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[data-field-id="name"]') as HTMLInputElement | null;
    if (input) {
      input.value = "Quarterly Brief";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    expect(element.value).toEqual({ name: "Quarterly Brief" });
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: { name: "Quarterly Brief" } },
      }),
    );
  });

  it("emits submit with the current form value", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    const submitted = vi.fn();
    element.fields = [{ id: "name", label: "Name" }];
    element.value = { name: "Policy" };
    element.addEventListener("submit", submitted);

    document.body.append(element);

    const form = element.shadowRoot?.querySelector('[part="form"]') as HTMLFormElement | null;
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: { name: "Policy" } },
      }),
    );
  });

  it("emits cancel", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    const cancelled = vi.fn();
    element.fields = [{ id: "name", label: "Name" }];
    element.addEventListener("cancel", cancelled);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement | null;
    button?.click();

    expect(cancelled).toHaveBeenCalled();
  });

  it("groups fields into sections", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    element.fields = [
      { id: "name", label: "Name", section: "Basics" },
      { id: "classification", label: "Classification", section: "Governance" },
    ];

    document.body.append(element);

    const sections = element.shadowRoot?.querySelectorAll('[part="section-label"]') ?? [];
    expect(sections.length).toBe(2);
    expect((sections[0] as HTMLElement).textContent).toBe("Basics");
    expect((sections[1] as HTMLElement).textContent).toBe("Governance");
  });

  it("supports read mode", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    element.mode = "read";
    element.fields = [{ id: "name", label: "Name" }];
    element.value = { name: "Brand Strategy.pdf" };

    document.body.append(element);

    const fieldValue = element.shadowRoot?.querySelector('[part="field-value"]') as HTMLElement | null;
    const actions = element.shadowRoot?.querySelector('[part="actions"]');

    expect(fieldValue?.textContent).toBe("Brand Strategy.pdf");
    expect(actions).toBeNull();
  });
});
