// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxMenuItemElement,
  defineBoxMenuItemElement,
} from "../../../src/components/actions/menu-item.js";

describe("BoxMenuItemElement", () => {
  beforeEach(() => {
    defineBoxMenuItemElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders label and emits selected events", () => {
    const element = document.createElement("box-menu-item") as BoxMenuItemElement;
    const selected = vi.fn();
    element.label = "Rename";
    element.value = "rename";
    element.addEventListener("selected", selected);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement | null;
    expect(button?.textContent).toContain("Rename");
    button?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "rename", label: "Rename" },
      }),
    );
  });

  it("does not emit selected when disabled", () => {
    const element = document.createElement("box-menu-item") as BoxMenuItemElement;
    const selected = vi.fn();
    element.label = "Rename";
    element.value = "rename";
    element.disabled = true;
    element.addEventListener("selected", selected);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement | null;
    button?.click();

    expect(selected).not.toHaveBeenCalled();
  });

  it("exposes menu item semantics and selected state", () => {
    const element = document.createElement("box-menu-item") as BoxMenuItemElement;
    element.label = "Rename";
    element.value = "rename";
    element.selected = true;

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement | null;
    expect(button?.getAttribute("role")).toBe("menuitemradio");
    expect(button?.getAttribute("aria-checked")).toBe("true");
  });

  it("preserves selected surface styles on hover and active", () => {
    const element = document.createElement("box-menu-item") as BoxMenuItemElement;
    element.label = "Rename";
    element.selected = true;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="item"][data-selected="true"]:hover:not(:disabled)');
    expect(styles).toContain('[part="item"][data-selected="true"]:active:not(:disabled)');
    expect(styles).toContain("--boe-token-surface-item-surface-selected");
  });
});
