// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxChipElement, defineBoxChipElement } from "../../../src/components/feedback/chip.js";

describe("BoxChipElement", () => {
  beforeEach(() => {
    defineBoxChipElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the label and no remove affordance by default", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "Marketing";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Marketing");
    expect(element.shadowRoot?.querySelector('[part="remove"]')).toBeNull();
  });

  it("emits remove with its value when the dismiss button is clicked", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "Legal";
    element.value = "legal";
    element.removable = true;
    const removed = vi.fn();
    element.addEventListener("remove", removed);
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="remove"]') as HTMLButtonElement | null;
    button?.click();

    expect(removed).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: "legal" } }),
    );
  });

  it("falls back to the label as the value when none is set", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "Design";
    document.body.append(element);

    expect(element.value).toBe("Design");
  });

  it("does not dismiss when disabled", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "Frozen";
    element.removable = true;
    element.disabled = true;
    const removed = vi.fn();
    element.addEventListener("remove", removed);
    document.body.append(element);

    element.dismiss();

    expect(removed).not.toHaveBeenCalled();
    const button = element.shadowRoot?.querySelector('[part="remove"]') as HTMLButtonElement | null;
    expect(button?.disabled).toBe(true);
  });

  it("toggles selection and emits select when selectable", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "PDF";
    element.value = "pdf";
    element.setAttribute("selectable", "");
    const selected = vi.fn();
    element.addEventListener("select", selected);
    document.body.append(element);

    const chip = element.shadowRoot?.querySelector('[part="chip"]') as HTMLElement | null;
    chip?.click();

    expect(element.selected).toBe(true);
    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: "pdf", selected: true } }),
    );
  });
});
