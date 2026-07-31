// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Drawer } from "../../../src/components/overlays/drawer.js";

describe("Drawer", () => {
  beforeEach(() => {
    Drawer.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens and closes through the public API", () => {
    const element = document.createElement("box-drawer") as Drawer;

    document.body.append(element);
    element.show();

    expect(element.open).toBe(true);
    expect(element.shadowRoot?.textContent).toContain("Drawer");

    element.close();

    expect(element.open).toBe(false);
    expect(element.shadowRoot?.textContent ?? "").toBe("");
  });

  it("focuses the close button when it opens", async () => {
    const element = document.createElement("box-drawer") as Drawer;
    document.body.append(element);
    element.show();
    await Promise.resolve();

    const closeButton = element.shadowRoot?.querySelector('[part="close"]') as HTMLButtonElement | null;
    expect(closeButton).not.toBeNull();
    expect(element.shadowRoot?.activeElement).toBe(closeButton);
  });

  it("emits dismiss and open-changed when closed from the button", () => {
    const element = document.createElement("box-drawer") as Drawer;
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
    const element = document.createElement("box-drawer") as Drawer;
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
    const element = document.createElement("box-drawer") as Drawer;
    element.position = "bottom";

    document.body.append(element);
    element.show();

    const drawer = element.shadowRoot?.querySelector('[part="drawer"]') as HTMLElement | null;

    expect(drawer?.dataset.position).toBe("bottom");
    expect(drawer?.outerHTML).toContain('data-position="bottom"');
  });

  it("portals to document.body while open and restores on close", () => {
    const wrapper = document.createElement("div");
    const element = document.createElement("box-drawer") as Drawer;

    wrapper.append(element);
    document.body.append(wrapper);

    element.show();

    expect(element.parentNode).toBe(document.body);

    element.close();

    expect(element.parentNode).toBe(wrapper);
  });

  it("uses BUE drawer / sidebar shell styles", () => {
    const element = document.createElement("box-drawer") as Drawer;
    document.body.append(element);
    element.show();

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("background: rgba(0, 0, 0, 0.75)");
    expect(styles).toContain("width: min(var(--boe-profile-drawer-width, 340px), calc(100vw - 2rem))");
    expect(styles).toContain("border-top-right-radius: var(--boe-profile-radius-field, 24px);");
    expect(styles).toContain("padding: var(--boe-profile-space-4, 16px);");
    expect(styles).toContain("font-size: var(--boe-profile-modal-title-size, 16px);");
    expect(styles).toContain("min-height: var(--boe-profile-control-height, 32px);");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-medium, 12px);");
  });
});
