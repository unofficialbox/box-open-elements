// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  IconButton,
} from "../../../src/components/actions/icon-button.js";
import { preloadBoxDefaultIcons, registerBoxDefaultDesignSystem, setActiveDesignSystem } from "../../../src/index.js";

import { iconXBatsu } from "../../../src/foundations/icons/glyphs/index.js";

describe("IconButton", () => {
  beforeEach(() => {
    IconButton.register();
    registerBoxDefaultDesignSystem({ setActive: true });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    setActiveDesignSystem(null);
  });

  it("renders a registered Box svg icon for aliased icon names and preserves the label", async () => {
    const element = document.createElement("box-icon-button") as IconButton;
    element.icon = "+";
    element.label = "Add item";

    document.body.append(element);
    await preloadBoxDefaultIcons();

    const button = element.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement | null;
    const icon = element.shadowRoot?.querySelector('[part="icon"]') as HTMLElement | null;
    expect(button?.getAttribute("aria-label")).toBe("Add item");
    expect(icon?.dataset.iconSource).toBe("design-system");
    expect(icon?.innerHTML).toContain("<svg");
  });

  it("renders a registered Box svg icon when the icon name matches the active design system", () => {
    const element = document.createElement("box-icon-button") as IconButton;
    element.icon = "search";
    element.label = "Search";

    document.body.append(element);

    const icon = element.shadowRoot?.querySelector('[part="icon"]') as HTMLElement | null;
    expect(icon?.dataset.iconSource).toBe("design-system");
    expect(icon?.innerHTML).toContain("<svg");
  });
  it("accepts a glyph export in the icon slot without registering a design system", async () => {
    setActiveDesignSystem(null);
    const element = document.createElement("box-icon-button") as IconButton;
    element.label = "Remove variable";
    element.innerHTML = `<span slot="icon">${iconXBatsu}</span>`;
    document.body.append(element);
    await new Promise(resolve => setTimeout(resolve, 0));

    const slot = element.shadowRoot!.querySelector("slot")!;
    expect(slot.assignedElements()[0]).toBe(element.querySelector('[slot="icon"]'));
    expect(element.shadowRoot!.querySelector<HTMLElement>('[part="icon"]')!.dataset.iconSource).toBe("slot");
    expect(element.shadowRoot!.querySelector("button")!.getAttribute("aria-label")).toBe("Remove variable");
  });

  it("keeps a supplied glyph through reactive updates and falls back after its removal", async () => {
    const element = document.createElement("box-icon-button") as IconButton;
    element.icon = "search";
    element.innerHTML = iconXBatsu;
    const glyph = element.querySelector("svg")!;
    glyph.setAttribute("slot", "icon");
    document.body.append(element);
    element.size = "small";
    element.variant = "quiet";
    element.tone = "danger";
    element.label = "Remove connection";
    element.disabled = true;
    await new Promise(resolve => setTimeout(resolve, 0));

    const button = element.shadowRoot!.querySelector("button")!;
    expect(button.dataset).toMatchObject({ size: "small", variant: "quiet", tone: "danger" });
    expect(button.disabled).toBe(true);
    expect(element.querySelector("svg")).toBe(glyph);
    glyph.remove();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(element.shadowRoot!.querySelector<HTMLElement>('[part="icon"]')!.dataset.iconSource).toBe("design-system");
    expect(element.shadowRoot!.querySelector('[data-icon-fallback] svg')).not.toBeNull();
    element.disabled = false;
    expect(button.disabled).toBe(false);
  });

  it("escapes unregistered icon text instead of interpreting markup", () => {
    setActiveDesignSystem(null);
    const element = document.createElement("box-icon-button") as IconButton;
    element.icon = '<img src=x onerror="alert(1)">';
    document.body.append(element);
    const fallback = element.shadowRoot!.querySelector('[data-icon-fallback]')!;
    expect(fallback.textContent).toBe(element.icon);
    expect(fallback.querySelector("img")).toBeNull();
  });

  it("preserves defaults and the internal button across appearance changes", () => {
    const element = document.createElement("box-icon-button") as IconButton;
    document.body.append(element);
    const button = element.shadowRoot!.querySelector("button")!;
    expect(element.size).toBe("medium");
    expect(element.variant).toBe("default");
    expect(element.tone).toBe("secondary");
    button.focus();
    element.size = "small";
    element.variant = "quiet";
    expect(element.shadowRoot!.activeElement).toBe(button);
    element.removeAttribute("size");
    element.removeAttribute("variant");
    expect(button.dataset.size).toBe("medium");
    expect(button.dataset.variant).toBe("default");
  });

});
