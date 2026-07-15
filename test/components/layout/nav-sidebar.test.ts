// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxNavSidebarElement, defineBoxNavSidebarElement } from "../../../src/components/layout/nav-sidebar.js";

describe("BoxNavSidebarElement", () => {
  beforeEach(() => {
    defineBoxNavSidebarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled nav with header, body, and footer slots", () => {
    const element = document.createElement("box-nav-sidebar") as BoxNavSidebarElement;
    document.body.append(element);

    const nav = element.shadowRoot?.querySelector('[part="sidebar"]');
    expect(nav?.tagName).toBe("NAV");
    // Defaults to a generic accessible name so the region is announced.
    expect(nav?.getAttribute("aria-label")).toBe("Sidebar");
    expect(element.shadowRoot?.querySelector('[part="header"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="body"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="footer"]')).toBeTruthy();
  });

  it("reflects a custom label onto the nav aria-label", () => {
    const element = document.createElement("box-nav-sidebar") as BoxNavSidebarElement;
    element.label = "Workspace navigation";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="sidebar"]')?.getAttribute("aria-label")).toBe(
      "Workspace navigation",
    );
  });

  it("is expanded by default and reflects the collapsed state", () => {
    const element = document.createElement("box-nav-sidebar") as BoxNavSidebarElement;
    document.body.append(element);

    expect(element.collapsed).toBe(false);
    expect(element.shadowRoot?.querySelector('[part="sidebar"]')?.getAttribute("data-collapsed")).toBe("false");

    element.collapsed = true;
    expect(element.hasAttribute("collapsed")).toBe(true);
    expect(element.shadowRoot?.querySelector('[part="sidebar"]')?.getAttribute("data-collapsed")).toBe("true");

    element.collapsed = false;
    expect(element.hasAttribute("collapsed")).toBe(false);
    expect(element.shadowRoot?.querySelector('[part="sidebar"]')?.getAttribute("data-collapsed")).toBe("false");
  });

  it("collapses when the collapsed attribute is set declaratively", () => {
    const element = document.createElement("box-nav-sidebar") as BoxNavSidebarElement;
    element.setAttribute("collapsed", "");
    document.body.append(element);

    expect(element.collapsed).toBe(true);
    expect(element.shadowRoot?.querySelector('[part="sidebar"]')?.getAttribute("data-collapsed")).toBe("true");
  });

  it("exposes a collapsed icon-strip CSS contract for slotted nav rows", () => {
    const element = document.createElement("box-nav-sidebar") as BoxNavSidebarElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--boe-nav-label-display: inline");
    expect(styles).toContain(":host([collapsed])");
    expect(styles).toContain("--boe-nav-label-display: none");
    expect(styles).toContain("::slotted(a)");
    expect(styles).toContain("::slotted(button)");
    expect(styles).toContain('[data-collapsed="true"] ::slotted(a)');
    expect(styles).toContain('[data-collapsed="true"] ::slotted(button)');
    expect(styles).toContain("appearance: none");
  });
});
