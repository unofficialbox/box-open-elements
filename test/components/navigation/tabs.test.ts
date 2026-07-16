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

  it("scopes hover/active to non-selected tabs and keeps focus-visible for all", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="tab"]:not([data-selected="true"]):hover:not(:disabled)');
    expect(styles).toContain('[part="tab"]:not([data-selected="true"]):active:not(:disabled)');
    expect(styles).toContain('[part="tab"]:focus-visible');
  });

  it("uses compact segmented-control tab styles", () => {
    const element = document.createElement("box-tabs") as BoxTabsElement;
    element.layout = "attached";
    element.options = [
      { label: "Overview", value: "overview" },
      { label: "Activity", value: "activity" },
    ];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("gap: 0.25rem;");
    expect(styles).toContain("border-radius: 0.7rem;");
    expect(styles).toContain("min-height: 1.9rem;");
    expect(styles).toContain("padding: 0.2rem 0.65rem;");
    expect(styles).toContain('background: var(--boe-token-surface-surface, #ffffff)');
    expect(styles).toContain('0 2px 6px rgba(15, 23, 42, 0.08)');
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
});

