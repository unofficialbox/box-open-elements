// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxDatalistItemElement,
  defineBoxDatalistItemElement,
} from "../../../src/components/collections/datalist-item.js";

describe("BoxDatalistItemElement", () => {
  beforeEach(() => {
    defineBoxDatalistItemElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled option row with optional meta", () => {
    const element = document.createElement("box-datalist-item") as BoxDatalistItemElement;
    element.label = "Quarterly Plan.pdf";
    element.meta = "PDF · 2.1 MB";
    document.body.append(element);

    const item = element.shadowRoot?.querySelector('[part="item"]');
    expect(item?.getAttribute("role")).toBe("option");
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toContain("Quarterly Plan.pdf");
    expect(element.shadowRoot?.querySelector('[part="meta"]')?.textContent).toContain("PDF · 2.1 MB");
  });

  it("reflects selected onto aria-selected", () => {
    const element = document.createElement("box-datalist-item") as BoxDatalistItemElement;
    element.label = "Item";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="item"]')?.getAttribute("aria-selected")).toBe("false");
    element.selected = true;
    expect(element.shadowRoot?.querySelector('[part="item"]')?.getAttribute("aria-selected")).toBe("true");
  });

  it("defaults value to the label and emits select on click", () => {
    const element = document.createElement("box-datalist-item") as BoxDatalistItemElement;
    element.label = "Marketing";
    document.body.append(element);

    const onSelect = vi.fn();
    element.addEventListener("select", onSelect);
    (element.shadowRoot?.querySelector('[part="item"]') as HTMLElement).click();

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "Marketing" } }));
  });

  it("emits select on Enter and Space", () => {
    const element = document.createElement("box-datalist-item") as BoxDatalistItemElement;
    element.label = "Legal";
    element.value = "42";
    document.body.append(element);

    const onSelect = vi.fn();
    element.addEventListener("select", onSelect);
    const item = element.shadowRoot?.querySelector('[part="item"]') as HTMLElement;
    item.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    item.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { value: "42" } }));
  });

  it("does not emit or focus when disabled", () => {
    const element = document.createElement("box-datalist-item") as BoxDatalistItemElement;
    element.label = "Disabled";
    element.disabled = true;
    document.body.append(element);

    const onSelect = vi.fn();
    element.addEventListener("select", onSelect);
    const item = element.shadowRoot?.querySelector('[part="item"]') as HTMLElement;
    expect(item.getAttribute("tabindex")).toBe("-1");
    item.click();

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("reflects the active-descendant highlight via data-active", () => {
    const element = document.createElement("box-datalist-item") as BoxDatalistItemElement;
    element.label = "Morgan";
    document.body.append(element);

    const item = element.shadowRoot?.querySelector('[part="item"]') as HTMLElement;
    expect(item.dataset.active).toBe("false");

    element.active = true;
    expect(item.dataset.active).toBe("true");
  });

  it("replaces the default body with arbitrary slotted content", () => {
    const element = document.createElement("box-datalist-item") as BoxDatalistItemElement;
    element.label = "Morgan";
    element.meta = "morgan@box.com";
    const custom = document.createElement("div");
    custom.textContent = "Custom row";
    element.append(custom);
    document.body.append(element);

    const body = element.shadowRoot?.querySelector('[part="body"]') as HTMLElement;
    const slot = element.shadowRoot?.querySelector('slot[part="content"]') as HTMLSlotElement;
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(slot.assignedElements()[0]).toBe(custom);
        expect(body.classList.contains("has-slotted")).toBe(true);
        resolve();
      }, 0);
    });
  });
});
