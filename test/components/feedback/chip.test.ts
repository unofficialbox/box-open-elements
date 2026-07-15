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

  it("toggles selection via keyboard and keeps focus on the chip", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "PDF";
    element.setAttribute("selectable", "");
    document.body.append(element);

    const press = (key: string): void => {
      const chip = element.shadowRoot?.querySelector('[part="chip"]') as HTMLElement | null;
      chip?.focus();
      chip?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    };

    press("Enter");
    expect(element.selected).toBe(true);
    // Focus must survive the re-render triggered by the selection change.
    expect(element.shadowRoot?.activeElement?.getAttribute("part")).toBe("chip");

    press(" ");
    expect(element.selected).toBe(false);
    expect(element.shadowRoot?.activeElement?.getAttribute("part")).toBe("chip");
  });

  it("restores focus to the remove button across an observed-attribute re-render", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "PDF";
    element.setAttribute("removable", "");
    document.body.append(element);

    const removeButton = element.shadowRoot?.querySelector('[part="remove"]') as HTMLElement | null;
    removeButton?.focus();
    expect(element.shadowRoot?.activeElement?.getAttribute("part")).toBe("remove");

    // An unrelated observed attribute changing forces a full re-render.
    element.tone = "brand";
    expect(element.shadowRoot?.activeElement?.getAttribute("part")).toBe("remove");
  });

  it("exposes selectable as a reflected boolean property", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "PDF";
    element.selectable = true;
    document.body.append(element);

    expect(element.hasAttribute("selectable")).toBe(true);
    expect(element.shadowRoot?.querySelector('[part="chip"]')?.getAttribute("role")).toBe("button");

    element.selectable = false;
    expect(element.selectable).toBe(false);
    expect(element.hasAttribute("selectable")).toBe(false);
  });

  it("preserves selected chip surface on hover and active", () => {
    const element = document.createElement("box-chip") as BoxChipElement;
    element.label = "PDF";
    element.selectable = true;
    element.selected = true;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="chip"][data-selected="true"]:hover:not([data-disabled="true"])');
    expect(styles).toContain('[part="chip"][data-selected="true"]:active:not([data-disabled="true"])');
  });
});
