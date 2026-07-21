// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxContextMenuElement,
  defineBoxContextMenuElement,
} from "../../../src/components/overlays/context-menu.js";

const ITEMS = [
  { id: "open", label: "Open" },
  { id: "rename", label: "Rename" },
  { id: "delete", label: "Delete", separator: true },
  { id: "locked", label: "Locked", disabled: true },
];

const create = (): BoxContextMenuElement => {
  const el = document.createElement("box-context-menu") as BoxContextMenuElement;
  el.items = ITEMS as never;
  el.innerHTML = "<div>target</div>";
  document.body.append(el);
  return el;
};

const rightClick = (el: HTMLElement): void => {
  el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 40, clientY: 40, cancelable: true }));
};

describe("BoxContextMenuElement", () => {
  beforeEach(() => {
    defineBoxContextMenuElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens a menu on right-click and renders the items", () => {
    const el = create();
    rightClick(el);
    expect(el.open).toBe(true);
    const surface = el.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    expect(surface.hidden).toBe(false);
    expect(surface.getAttribute("role")).toBe("menu");
    expect(surface.querySelectorAll('[part="item"]').length).toBe(4);
    expect(surface.querySelector('[part="divider"]')).not.toBeNull();
  });

  it("prevents the browser context menu", () => {
    const el = create();
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("emits item-selected and closes when an item is chosen", () => {
    const el = create();
    const selected = vi.fn();
    el.addEventListener("item-selected", selected);
    rightClick(el);

    const rename = el.shadowRoot?.querySelector('[data-id="rename"]') as HTMLButtonElement;
    rename.click();
    expect(selected).toHaveBeenCalledTimes(1);
    expect(selected.mock.calls[0][0].detail.id).toBe("rename");
    expect(el.open).toBe(false);
  });

  it("ignores disabled items", () => {
    const el = create();
    const selected = vi.fn();
    el.addEventListener("item-selected", selected);
    rightClick(el);
    const locked = el.shadowRoot?.querySelector('[data-id="locked"]') as HTMLButtonElement;
    expect(locked.disabled).toBe(true);
    locked.click();
    expect(selected).not.toHaveBeenCalled();
    expect(el.open).toBe(true);
  });

  it("closes on Escape from the menu", () => {
    const el = create();
    rightClick(el);
    const surface = el.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    surface.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(el.open).toBe(false);
  });

  it("closes on outside pointerdown", () => {
    const el = create();
    rightClick(el);
    expect(el.open).toBe(true);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(el.open).toBe(false);
  });

  it("does not open when disabled or itemless", () => {
    const el = create();
    el.disabled = true;
    rightClick(el);
    expect(el.open).toBe(false);

    el.disabled = false;
    el.items = [] as never;
    rightClick(el);
    expect(el.open).toBe(false);
  });
});
