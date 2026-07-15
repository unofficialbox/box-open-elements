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
    const actions = element.shadowRoot?.querySelector('[part="actions"]') as HTMLElement | null;

    expect(fieldValue?.textContent).toBe("Brand Strategy.pdf");
    expect(actions?.hidden).toBe(true);
  });

  it("keeps the active field focused while typing", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    element.fields = [{ id: "name", label: "Name" }];
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[data-field-id="name"]') as HTMLInputElement;
    input.focus();
    expect(element.shadowRoot?.activeElement).toBe(input);

    input.value = "Quar";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input.value).toBe("Quar");
    expect(input.selectionStart).toBe(4);

    input.value = "Quarterly";
    input.setSelectionRange(9, 9);
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input).toBe(element.shadowRoot?.querySelector('[data-field-id="name"]'));
    expect(input.value).toBe("Quarterly");
    expect(element.value).toEqual({ name: "Quarterly" });
  });

  it("disables and syncs the focused control on external updates", () => {
    const element = document.createElement("box-item-form") as BoxItemFormElement;
    element.fields = [{ id: "name", label: "Name" }];
    element.value = { name: "Draft" };
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[data-field-id="name"]') as HTMLInputElement;
    input.focus();
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input.disabled).toBe(false);

    element.disabled = true;
    expect(input.disabled).toBe(true);
    expect(element.shadowRoot?.activeElement).toBe(input);

    element.disabled = false;
    element.value = { name: "Published" };
    expect(input.disabled).toBe(false);
    expect(input.value).toBe("Published");
    expect(element.shadowRoot?.activeElement).toBe(input);
  });
});
