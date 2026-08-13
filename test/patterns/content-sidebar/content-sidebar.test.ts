import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentSidebar } from "../../../src/patterns/content-sidebar/content-sidebar.js";
import {
  DEFAULT_SIDEBAR_TABS,
  resolveSidebarTabs,
} from "../../../src/patterns/content-sidebar/types.js";

ContentSidebar.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const panel = (slot: string, text: string): HTMLElement => {
  const node = document.createElement("div");
  node.slot = slot;
  node.textContent = text;
  return node;
};

const mountSidebar = async (
  configure?: (element: ContentSidebar) => void,
): Promise<ContentSidebar> => {
  const element = document.createElement("box-content-sidebar") as ContentSidebar;
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("resolveSidebarTabs", () => {
  it("filters the default tabs to slots with content", () => {
    expect(resolveSidebarTabs(null, new Set(["details", "versions"]))).toEqual([
      { id: "details", label: "Details" },
      { id: "versions", label: "Versions" },
    ]);
    expect(resolveSidebarTabs(null, new Set())).toEqual([]);
  });

  it("keeps the canonical order regardless of slot order", () => {
    expect(resolveSidebarTabs(null, new Set(["metadata", "details"])).map(tab => tab.id)).toEqual([
      "details",
      "metadata",
    ]);
  });

  it("lets an explicit configuration win verbatim", () => {
    const configured = [{ id: "custom", label: "Custom" }];
    expect(resolveSidebarTabs(configured, new Set(["details"]))).toEqual(configured);
  });

  it("exposes the four upstream tabs as defaults", () => {
    expect(DEFAULT_SIDEBAR_TABS.map(tab => tab.id)).toEqual([
      "details",
      "activity",
      "metadata",
      "versions",
    ]);
  });
});

describe("box-content-sidebar", () => {
  it("shows only the tabs whose slots have content", async () => {
    const element = await mountSidebar(el => {
      el.append(panel("details", "Details body"), panel("metadata", "Metadata body"));
    });

    expect(element.resolvedTabs.map(tab => tab.id)).toEqual(["details", "metadata"]);
    const tabs = element.shadowRoot?.querySelector('[part="tabs"]');
    expect(tabs?.shadowRoot?.textContent).toContain("Details");
    expect(tabs?.shadowRoot?.textContent).toContain("Metadata");
    expect(tabs?.shadowRoot?.textContent).not.toContain("Activity");
  });

  it("renders the empty state when nothing is slotted", async () => {
    const element = await mountSidebar();

    expect(element.resolvedTabs).toEqual([]);
    expect((element.shadowRoot?.querySelector('[part="empty"]') as HTMLElement).hidden).toBe(false);
    expect((element.shadowRoot?.querySelector('[part="tabs"]') as HTMLElement).hidden).toBe(true);
  });

  it("picks up panels added after connection", async () => {
    const element = await mountSidebar();

    element.append(panel("activity", "Activity feed"));
    await flush();

    expect(element.resolvedTabs.map(tab => tab.id)).toEqual(["activity"]);
    expect((element.shadowRoot?.querySelector('[part="empty"]') as HTMLElement).hidden).toBe(true);
  });

  it("defaults the active tab to the first resolved tab and reflects it", async () => {
    const element = await mountSidebar(el => {
      el.append(panel("details", "D"), panel("activity", "A"));
    });

    expect(element.activeTab).toBe("details");
    const tabsHost = element.shadowRoot?.querySelector('[part="tabs"]') as HTMLElement & { value: string };
    expect(tabsHost.value).toBe("details");
  });

  it("emits tab-changed when a tab is clicked and reflects active-tab", async () => {
    const element = await mountSidebar(el => {
      el.append(panel("details", "D"), panel("activity", "A"));
    });
    const changed = vi.fn();
    element.addEventListener("tab-changed", changed);

    const tabsHost = element.shadowRoot?.querySelector('[part="tabs"]') as HTMLElement;
    const activityTab = tabsHost.shadowRoot?.querySelector('[data-value="activity"]') as HTMLButtonElement;
    activityTab.click();
    await flush();

    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0]?.[0]?.detail).toEqual({ tabId: "activity" });
    expect(element.activeTab).toBe("activity");
  });

  it("honours the active-tab attribute and falls back when it goes invalid", async () => {
    const element = await mountSidebar(el => {
      el.setAttribute("active-tab", "metadata");
      el.append(panel("details", "D"), panel("metadata", "M"));
    });

    expect(element.activeTab).toBe("metadata");

    element.activeTab = "nope";
    await flush();
    expect(element.activeTab).toBe("details");
  });

  it("supports explicit custom tabs with matching slots", async () => {
    const element = await mountSidebar(el => {
      el.tabs = [
        { id: "insights", label: "Insights" },
        { id: "details", label: "Details" },
      ];
      el.append(panel("insights", "Insights body"));
    });

    expect(element.resolvedTabs.map(tab => tab.id)).toEqual(["insights", "details"]);
    const tabsHost = element.shadowRoot?.querySelector('[part="tabs"]');
    expect(tabsHost?.shadowRoot?.textContent).toContain("Insights");
  });

  it("collapses and expands with the toggle, announcing state", async () => {
    const element = await mountSidebar(el => {
      el.collapsible = true;
      el.append(panel("details", "D"));
    });
    const collapsedChanged = vi.fn();
    element.addEventListener("collapsed-changed", collapsedChanged);

    const toggle = element.shadowRoot?.querySelector('[part="toggle"]') as HTMLButtonElement;
    expect(toggle.hidden).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    toggle.click();
    await flush();

    expect(element.collapsed).toBe(true);
    expect((element.shadowRoot?.querySelector('[part="body"]') as HTMLElement).hidden).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(collapsedChanged.mock.calls[0]?.[0]?.detail).toEqual({ collapsed: true });

    toggle.click();
    await flush();
    expect(element.collapsed).toBe(false);
    expect((element.shadowRoot?.querySelector('[part="body"]') as HTMLElement).hidden).toBe(false);
  });

  it("hides the toggle when not collapsible", async () => {
    const element = await mountSidebar(el => {
      el.append(panel("details", "D"));
    });

    expect((element.shadowRoot?.querySelector('[part="toggle"]') as HTMLButtonElement).hidden).toBe(true);
  });

  it("labels the region with the heading", async () => {
    const element = await mountSidebar(el => {
      el.heading = "report.pdf";
      el.append(panel("details", "D"));
    });

    const aside = element.shadowRoot?.querySelector('[part="sidebar"]');
    expect(aside?.getAttribute("role")).toBe("complementary");
    expect(aside?.getAttribute("aria-label")).toBe("report.pdf");
  });
});
