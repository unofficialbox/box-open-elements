// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTabsElement, defineBoxTabsElement } from "../../../src/components/navigation/tabs.js";

describe("BoxTabsElement", () => {
  beforeEach(() => {
    defineBoxTabsElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("selects the first option by default", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];

    document.body.append(element);

    expect(element.value).toBe("overview");
  });

  it("emits value changes when a tab is clicked", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    const changed = vi.fn();
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const tabs = element.shadowRoot?.querySelectorAll('[part="tab"]') ?? [];
    (tabs[1] as HTMLButtonElement | undefined)?.click();

    expect(element.value).toBe("activity");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "activity" },
      }),
    );
  });

  it("uses tab semantics and supports arrow key navigation", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];

    document.body.append(element);

    const tabs = element.shadowRoot?.querySelectorAll('[part="tab"]') ?? [];
    const firstTab = tabs[0] as HTMLButtonElement | undefined;
    const secondTab = tabs[1] as HTMLButtonElement | undefined;

    expect(firstTab?.getAttribute("role")).toBe("tab");
    expect(firstTab?.getAttribute("aria-selected")).toBe("true");
    expect(secondTab?.getAttribute("aria-selected")).toBe("false");

    firstTab?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(element.value).toBe("activity");
  });

  it("supports attached layout metadata for grouped styling", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.layout = "attached";
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
      { label: "Sharing", value: "sharing" },
    ];

    document.body.append(element);

    const tabs = element.shadowRoot?.querySelectorAll('[part="tab"]') ?? [];
    const tablist = element.shadowRoot?.querySelector('[part="tabs"]') as HTMLElement | null;

    expect(tablist?.dataset.layout).toBe("attached");
    expect((tabs[0] as HTMLElement | undefined)?.dataset.position).toBe("first");
    expect((tabs[1] as HTMLElement | undefined)?.dataset.position).toBe("middle");
    expect((tabs[2] as HTMLElement | undefined)?.dataset.position).toBe("last");
  });

  it("keeps transparent hover chrome and focus-visible for tabs", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("[part=\"tab\"]:hover");
    expect(styles).toContain('[part="tab"]:focus-visible');
    expect(styles).toContain("background: transparent");
  });

  it("uses BUE underline tab styles", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.layout = "attached";
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("line-height: 40px;");
    expect(styles).toContain("font-size: 13px;");
    expect(styles).toContain("border-radius: 0;");
    expect(styles).toContain("height: 2px;");
    expect(styles).toContain("background: var(--boe-token-surface-surface-brand, #0061d5)");
    expect(styles).toContain('[part="tab"][data-selected="true"]::after');
  });

  it("preserves focus on a tab when an attribute changes", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];
    document.body.append(element);

    const tab = element.shadowRoot?.querySelector('[part="tab"]') as HTMLButtonElement | null;
    tab?.focus();
    expect(element.shadowRoot?.activeElement).toBe(tab);

    element.label = "Workspace tabs";

    expect(element.shadowRoot?.querySelector('[part="tab"]')).toBe(tab);
    expect(element.shadowRoot?.activeElement).toBe(tab);
  });

  it("renders a tabpanel per option, linked to its tab and showing the selected one", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [
      { label: "All", value: "all" },
      { label: "Recents", value: "recents" },
    ] as never;
    element.value = "all";
    document.body.append(element);

    const panels = element.shadowRoot?.querySelectorAll('[part="panel"]');
    expect(panels?.length).toBe(2);
    const first = panels?.[0] as HTMLElement;
    const second = panels?.[1] as HTMLElement;
    expect(first.getAttribute("role")).toBe("tabpanel");
    expect(first.hidden).toBe(false);
    expect(second.hidden).toBe(true);

    // Tab <-> panel ARIA association.
    const firstTab = element.shadowRoot?.querySelector('[part="tab"]') as HTMLElement;
    expect(firstTab.getAttribute("aria-controls")).toBe(first.id);
    expect(first.getAttribute("aria-labelledby")).toBe(firstTab.id);
  });

  it("switches the visible panel when the selection changes", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [
      { label: "All", value: "all" },
      { label: "Recents", value: "recents" },
    ] as never;
    element.value = "all";
    document.body.append(element);

    element.value = "recents";
    const panels = element.shadowRoot?.querySelectorAll('[part="panel"]');
    expect((panels?.[0] as HTMLElement).hidden).toBe(true);
    expect((panels?.[1] as HTMLElement).hidden).toBe(false);
  });

  it("routes slotted content into the matching panel", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [{ label: "All", value: "all" }] as never;
    element.innerHTML = '<div slot="all">Panel body</div>';
    element.value = "all";
    document.body.append(element);
    const slot = element.shadowRoot?.querySelector('[part="panel"] slot') as HTMLSlotElement;
    expect(slot.getAttribute("name")).toBe("all");
    expect(slot.assignedNodes()[0]?.textContent).toBe("Panel body");
  });

});

