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
    // The BUE drawer width token stays the medium default, now behind the
    // size-preset custom property.
    expect(styles).toContain("width: min(var(--drawer-size, var(--boe-profile-drawer-width, 340px)), calc(100vw - 2rem))");
    expect(styles).toContain("border-top-right-radius: var(--boe-profile-radius-field, 24px);");
    expect(styles).toContain("padding: var(--boe-profile-space-4, 16px);");
    expect(styles).toContain("font-size: var(--boe-profile-modal-title-size, 16px);");
    expect(styles).toContain("min-height: var(--boe-profile-control-height, 32px);");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-medium, 12px);");
  });
});

describe("Drawer slots, sizes, busy, and cancelable dismiss (dispatch intake round 6)", () => {
  beforeEach(() => {
    Drawer.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const createOpen = (attrs: Record<string, string> = {}): Drawer => {
    const element = document.createElement("box-drawer") as Drawer;
    element.heading = "Edit request";
    for (const [name, value] of Object.entries(attrs)) {
      element.setAttribute(name, value);
    }
    document.body.append(element);
    element.open = true;
    element.setAttribute("open", "");
    return element;
  };

  it("cancelable dismiss: preventDefault keeps the drawer open — the unsaved-changes guard", () => {
    const element = createOpen();
    element.addEventListener("dismiss", event => {
      event.preventDefault();
    });

    (element.shadowRoot?.querySelector('[part="close"]') as HTMLButtonElement).click();
    expect(element.open).toBe(true);
  });

  it("dismiss names its source, and an unguarded dismiss closes", () => {
    const element = createOpen();
    const sources: string[] = [];
    element.addEventListener("dismiss", event => {
      sources.push((event as CustomEvent<{ source: string }>).detail.source);
    });

    // Backdrop now asks before closing too (it used to close silently).
    (element.shadowRoot?.querySelector('[part="backdrop"]') as HTMLElement).click();
    expect(sources).toEqual(["backdrop"]);
    expect(element.open).toBe(false);
  });

  it("programmatic close() is not guarded — the host asked for it", () => {
    const element = createOpen();
    const dismissed = vi.fn();
    element.addEventListener("dismiss", dismissed);
    element.close();
    expect(element.open).toBe(false);
    expect(dismissed).not.toHaveBeenCalled();
  });

  it("renders the footer row only when the host slots one", () => {
    const element = createOpen();
    const footer = (): HTMLElement | null | undefined =>
      element.shadowRoot?.querySelector<HTMLElement>('[part="footer"]');
    expect(footer()?.hidden).toBe(true);

    const actions = document.createElement("div");
    actions.slot = "footer";
    actions.textContent = "Save";
    element.append(actions);
    // slotchange delivers asynchronously in jsdom.
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(footer()?.hidden).toBe(false);
        resolve();
      }, 0);
    });
  });

  it("offers a header slot under the heading", () => {
    const element = createOpen();
    expect(element.shadowRoot?.querySelector('slot[name="header"]')).not.toBeNull();
  });

  it("applies size presets and defaults invalid sizes to medium", () => {
    const element = createOpen({ size: "large" });
    const drawer = (): HTMLElement | null | undefined =>
      element.shadowRoot?.querySelector<HTMLElement>('[part="drawer"]');
    expect(drawer()?.dataset.size).toBe("large");

    element.setAttribute("size", "bogus");
    expect(drawer()?.dataset.size).toBe("medium");

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="drawer"][data-size="small"]');
    expect(styles).toContain('[part="drawer"][data-size="full"]');
    // Phones get the whole screen, whatever the preset.
    expect(styles).toContain("@media (max-width: 640px)");
  });

  it("busy veils the body and sets aria-busy, keeping Close reachable", () => {
    const element = createOpen({ busy: "" });
    expect(
      element.shadowRoot?.querySelector('[part="drawer"]')?.getAttribute("aria-busy"),
    ).toBe("true");
    expect(
      element.shadowRoot?.querySelector<HTMLElement>('[part="busy"]')?.hidden,
    ).toBe(false);
    // Close is outside the veil: a stuck save must never trap the user.
    expect(element.shadowRoot?.querySelector('[part="close"]')).not.toBeNull();

    element.removeAttribute("busy");
    expect(
      element.shadowRoot?.querySelector<HTMLElement>('[part="busy"]')?.hidden,
    ).toBe(true);
    expect(
      element.shadowRoot?.querySelector('[part="drawer"]')?.hasAttribute("aria-busy"),
    ).toBe(false);
  });
});
