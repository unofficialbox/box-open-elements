// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxAppShellElement, defineBoxAppShellElement } from "../../../src/components/layout/app-shell.js";

describe("BoxAppShellElement", () => {
  beforeEach(() => {
    defineBoxAppShellElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders named layout regions", () => {
    const element = document.createElement("box-app-shell") as BoxAppShellElement;
    element.heading = "Workspace";

    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="header"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="nav"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="main"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="aside"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="footer"]')).toBeTruthy();
    expect(element.shadowRoot?.textContent).toContain("Workspace");
  });

  it("hides empty nav/aside/footer landmarks and accepts custom labels", () => {
    const element = document.createElement("box-app-shell") as BoxAppShellElement;
    element.heading = "Workspace";
    element.navLabel = "Browse";
    element.asideLabel = "Details";
    document.body.append(element);

    const nav = element.shadowRoot?.querySelector('[part="nav"]') as HTMLElement;
    const aside = element.shadowRoot?.querySelector('[part="aside"]') as HTMLElement;
    const footer = element.shadowRoot?.querySelector('[part="footer"]') as HTMLElement;

    expect(nav.hidden).toBe(true);
    expect(aside.hidden).toBe(true);
    expect(footer.hidden).toBe(true);
    expect(nav.getAttribute("aria-label")).toBe("Browse");
    expect(aside.getAttribute("aria-label")).toBe("Details");

    const navContent = document.createElement("div");
    navContent.slot = "nav";
    navContent.textContent = "Nav";
    element.append(navContent);
    // Force an update pass (same heading string would not re-enter attributeChanged).
    element.heading = "Workspace updated";

    expect(nav.hidden).toBe(false);
    expect(aside.hidden).toBe(true);
  });

  it("disconnects the slot observer when removed from the document", () => {
    const element = document.createElement("box-app-shell") as BoxAppShellElement;
    document.body.append(element);

    const observer = (element as unknown as { slotObserver: MutationObserver | null }).slotObserver;
    const disconnect = vi.spyOn(observer!, "disconnect");

    element.remove();

    expect(disconnect).toHaveBeenCalled();
    expect((element as unknown as { slotObserver: MutationObserver | null }).slotObserver).toBeNull();
  });

  it("stacks the frame at narrow container widths", () => {
    const element = document.createElement("box-app-shell") as BoxAppShellElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("container-type: inline-size");
    expect(styles).toContain("container-name: boe-app-shell");

    const containerRule = styles.match(
      /@container boe-app-shell \(max-width: 48rem\) \{([\s\S]*?)\n  \}/,
    )?.[1] ?? "";
    expect(containerRule).toContain("grid-template-columns: 1fr");
    expect(containerRule).toContain("border-right: 0");
    expect(containerRule).toContain("border-left: 0");
    expect(containerRule).toContain("border-bottom:");
    expect(containerRule).toContain("border-top:");
  });

  it("uses compact app-shell region padding", () => {
    const element = document.createElement("box-app-shell") as BoxAppShellElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 0.65rem 0.75rem;");
    expect(styles).toContain("padding: 0.65rem;");
    expect(styles).toContain("padding: 0.7rem;");
    expect(styles).toContain("padding: 0.55rem 0.75rem;");
  });
});
