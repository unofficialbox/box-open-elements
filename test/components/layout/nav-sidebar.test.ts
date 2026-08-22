// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NavSidebar } from "../../../src/components/layout/nav-sidebar.js";

describe("NavSidebar", () => {
  beforeEach(() => {
    NavSidebar.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled nav with header, body, and footer slots", () => {
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
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
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
    element.label = "Workspace navigation";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="sidebar"]')?.getAttribute("aria-label")).toBe(
      "Workspace navigation",
    );
  });

  it("is expanded by default and reflects the collapsed state", () => {
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
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
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
    element.setAttribute("collapsed", "");
    document.body.append(element);

    expect(element.collapsed).toBe(true);
    expect(element.shadowRoot?.querySelector('[part="sidebar"]')?.getAttribute("data-collapsed")).toBe("true");
  });

  it("exposes a collapsed icon-strip CSS contract for slotted nav rows", () => {
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
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

  it("mirrors label text onto aria-label and title while collapsed", () => {
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
    element.innerHTML = `
      <a href="/files"><span data-nav-icon>📁</span><span data-nav-label>All Files</span></a>
      <button type="button"><span data-nav-icon>⚙️</span><span data-nav-label>Settings</span></button>
    `;
    document.body.append(element);

    const link = element.querySelector("a")!;
    const button = element.querySelector("button")!;

    // Expanded: the visible label is the name; nothing is mirrored.
    expect(link.hasAttribute("aria-label")).toBe(false);

    // Collapsed hides [data-nav-label] — the row's only accessible name — so
    // the name must survive as aria-label, and title gives the hover tooltip.
    element.collapsed = true;
    expect(link.getAttribute("aria-label")).toBe("All Files");
    expect(link.getAttribute("title")).toBe("All Files");
    expect(button.getAttribute("aria-label")).toBe("Settings");
    expect(button.getAttribute("title")).toBe("Settings");

    // Expanding removes exactly what collapsing added.
    element.collapsed = false;
    expect(link.hasAttribute("aria-label")).toBe(false);
    expect(link.hasAttribute("title")).toBe(false);
    expect(button.hasAttribute("aria-label")).toBe(false);
    expect(button.hasAttribute("title")).toBe(false);
  });

  it("never overwrites a host-authored aria-label or title", () => {
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
    element.innerHTML = `
      <a href="/inbox" aria-label="Inbox, 3 unread" title="Open inbox"><span data-nav-label>Inbox</span></a>
    `;
    document.body.append(element);

    const link = element.querySelector("a")!;
    element.collapsed = true;
    expect(link.getAttribute("aria-label")).toBe("Inbox, 3 unread");
    expect(link.getAttribute("title")).toBe("Open inbox");

    // And expand leaves the host's attributes alone.
    element.collapsed = false;
    expect(link.getAttribute("aria-label")).toBe("Inbox, 3 unread");
    expect(link.getAttribute("title")).toBe("Open inbox");
  });

  it("names rows slotted in while already collapsed", async () => {
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
    element.setAttribute("collapsed", "");
    document.body.append(element);

    const late = document.createElement("a");
    late.href = "/recents";
    late.innerHTML = `<span data-nav-label>Recents</span>`;
    element.append(late);
    // slotchange delivers asynchronously.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(late.getAttribute("aria-label")).toBe("Recents");
  });

  it("provides styling hooks for grouped nav sections and dividers", () => {
    const element = document.createElement("box-nav-sidebar") as NavSidebar;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    // Group headers via [data-nav-group]; hidden in the collapsed icon strip.
    expect(styles).toContain("::slotted([data-nav-group])");
    expect(styles).toContain('[data-collapsed="true"] ::slotted([data-nav-group])');
    // <hr> dividers.
    expect(styles).toContain("::slotted(hr)");
  });
});
