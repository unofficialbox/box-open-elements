// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxDrawerElement, defineBoxDrawerElement } from "../../../src/components/overlays/drawer.js";

describe("BoxDrawerElement", () => {
  beforeEach(() => {
    defineBoxDrawerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens and closes through the public API", () => {
    const element = document.createElement("box-drawer") as BoxDrawerElement;

    document.body.append(element);
    element.show();

    expect(element.open).toBe(true);
    expect(element.shadowRoot?.textContent).toContain("Drawer");

    element.close();

    expect(element.open).toBe(false);
    expect(element.shadowRoot?.textContent ?? "").toBe("");
  });

  it("focuses the close button when it opens", async () => {
    const element = document.createElement("box-drawer") as BoxDrawerElement;
    document.body.append(element);
    element.show();
    await Promise.resolve();

    const closeButton = element.shadowRoot?.querySelector('[part="close"]') as HTMLButtonElement | null;
    expect(closeButton).not.toBeNull();
    expect(element.shadowRoot?.activeElement).toBe(closeButton);
  });

  it("emits dismiss and open-changed when closed from the button", () => {
    const element = document.createElement("box-drawer") as BoxDrawerElement;
    const dismissed = vi.fn();
    const openChanged = vi.fn();
    element.heading = "Share Settings";
    element.addEventListener("dismiss", dismissed);
    element.addEventListener("open-changed", openChanged);

    document.body.append(element);
    element.show();

    expect(element.shadowRoot?.textContent).toContain("Share Settings");

    const closeButton = element.shadowRoot?.querySelector('[part="close"]') as HTMLButtonElement | null;
    closeButton?.click();

    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(openChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { open: false },
      }),
    );
    expect(element.open).toBe(false);
  });

  it("closes on Escape and emits dismiss", () => {
    const element = document.createElement("box-drawer") as BoxDrawerElement;
    const dismissed = vi.fn();
    element.addEventListener("dismiss", dismissed);

    document.body.append(element);
    element.show();

    const drawer = element.shadowRoot?.querySelector('[part="drawer"]') as HTMLElement | null;
    drawer?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(dismissed).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it("supports bottom positioning", () => {
    const element = document.createElement("box-drawer") as BoxDrawerElement;
    element.position = "bottom";

    document.body.append(element);
    element.show();

    const drawer = element.shadowRoot?.querySelector('[part="drawer"]') as HTMLElement | null;

    expect(drawer?.dataset.position).toBe("bottom");
    expect(drawer?.outerHTML).toContain('data-position="bottom"');
  });

  it("portals to document.body while open and restores on close", () => {
    const wrapper = document.createElement("div");
    const element = document.createElement("box-drawer") as BoxDrawerElement;

    wrapper.append(element);
    document.body.append(wrapper);

    element.show();

    expect(element.parentNode).toBe(document.body);

    element.close();

    expect(element.parentNode).toBe(wrapper);
  });

  it("uses BUE drawer / sidebar shell styles", () => {
    const element = document.createElement("box-drawer") as BoxDrawerElement;
    document.body.append(element);
    element.show();

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("background: rgba(0, 0, 0, 0.75)");
    expect(styles).toContain("width: min(340px, calc(100vw - 2rem))");
    expect(styles).toContain("border-top-right-radius: 24px;");
    expect(styles).toContain("padding: 16px;");
    expect(styles).toContain("font-size: 16px;");
    expect(styles).toContain("min-height: 32px;");
    expect(styles).toContain("border-radius: 12px;");
  });
});
