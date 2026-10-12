// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DatalistItem,
} from "../../../src/components/collections/datalist-item.js";

describe("DatalistItem", () => {
  beforeEach(() => {
    DatalistItem.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled option row with optional meta", () => {
    const element = document.createElement("box-datalist-item") as DatalistItem;
    element.label = "Quarterly Plan.pdf";
    element.meta = "PDF · 2.1 MB";
    document.body.append(element);

    const item = element.shadowRoot?.querySelector('[part="item"]');
    expect(item?.getAttribute("role")).toBe("option");
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toContain("Quarterly Plan.pdf");
    expect(element.shadowRoot?.querySelector('[part="meta"]')?.textContent).toContain("PDF · 2.1 MB");
  });

  it("reflects selected onto aria-selected", () => {
    const element = document.createElement("box-datalist-item") as DatalistItem;
    element.label = "Item";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="item"]')?.getAttribute("aria-selected")).toBe("false");
    element.selected = true;
    expect(element.shadowRoot?.querySelector('[part="item"]')?.getAttribute("aria-selected")).toBe("true");
  });

  it("defaults value to the label and emits select on click", () => {
    const element = document.createElement("box-datalist-item") as DatalistItem;
    element.label = "Marketing";
    document.body.append(element);

    const onSelect = vi.fn();
    element.addEventListener("select", onSelect);
    (element.shadowRoot?.querySelector('[part="item"]') as HTMLElement).click();

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: "Marketing" } }));
  });

  it("emits select on Enter and Space", () => {
    const element = document.createElement("box-datalist-item") as DatalistItem;
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
    const element = document.createElement("box-datalist-item") as DatalistItem;
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
    const element = document.createElement("box-datalist-item") as DatalistItem;
    element.label = "Morgan";
    document.body.append(element);

    const item = element.shadowRoot?.querySelector('[part="item"]') as HTMLElement;
    expect(item.dataset.active).toBe("false");

    element.active = true;
    expect(item.dataset.active).toBe("true");
  });

  it("replaces the default body with arbitrary slotted content", () => {
    const element = document.createElement("box-datalist-item") as DatalistItem;
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

describe("DatalistItem real slotted content", () => {
  afterEach(() => { document.body.innerHTML = ""; });
  const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));
  it("ignores formatting whitespace/comments and restores fallback for a changed direct text node", async () => {
    const el = new DatalistItem(); el.label = "Invoice.pdf"; el.meta = "PDF";
    const text = document.createTextNode("\n \t "); el.append(text, document.createComment("formatted")); document.body.append(el); await flush();
    const body = el.shadowRoot!.querySelector('[part="body"]')!, slot = el.shadowRoot!.querySelector('[part="content"]')!;
    expect(body.classList.contains("has-slotted")).toBe(false); expect(slot.classList.contains("has-content")).toBe(false);
    text.data = "Current authored content"; await flush(); expect(body.classList.contains("has-slotted")).toBe(true);
    text.data = "\n   "; await flush(); expect(body.classList.contains("has-slotted")).toBe(false);
    expect(el.shadowRoot!.querySelector('[part="label"]')?.textContent).toBe("Invoice.pdf");
  });
  it("retains actual host elements and reconnects observation using current content", async () => {
    const el = new DatalistItem(); el.label = "Fallback"; const custom = document.createElement("span"); custom.textContent = "Custom"; el.append(custom); document.body.append(el); await flush();
    expect(el.shadowRoot!.querySelector('[part="body"]')?.classList.contains("has-slotted")).toBe(true);
    el.remove(); custom.remove(); const text = document.createTextNode("   "); el.append(text); document.body.append(el); await flush();
    expect(el.shadowRoot!.querySelector('[part="body"]')?.classList.contains("has-slotted")).toBe(false);
    text.data = "Reconnect current"; await flush(); expect(el.shadowRoot!.querySelector('[part="body"]')?.classList.contains("has-slotted")).toBe(true);
    const selected = vi.fn(); el.addEventListener("select", selected); (el.shadowRoot!.querySelector('[part="item"]') as HTMLElement).click();
    expect(selected).toHaveBeenCalledTimes(1); expect(selected.mock.calls[0][0].detail.value).toBe("Fallback");
  });
});
