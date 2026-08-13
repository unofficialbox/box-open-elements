import { DEFAULT_SIDEBAR_TABS, resolveSidebarTabs } from "./types.js";
import type { SidebarTab } from "./types.js";
import { Tabs } from "../../components/navigation/tabs.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-content-sidebar";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="sidebar"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="header"] {
          display: flex;
          align-items: center;
          gap: ${boePanel.gap};
        }

        [part="title"] {
          flex: 1;
          margin: 0;
          font: inherit;
          font-size: 1.05rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="toggle"] {
          appearance: none;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="toggle"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="toggle"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="body"][hidden] {
          display: none;
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"][hidden] {
          display: none;
        }
      `;

export class ContentSidebar extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["active-tab", "collapsed", "collapsible", "heading", "tabs"];
  }

  private asideEl!: HTMLElement;

  private titleEl!: HTMLElement;

  private toggleEl!: HTMLButtonElement;

  private bodyEl!: HTMLElement;

  private emptyEl!: HTMLElement;

  private tabsHost!: Tabs;

  private readonly presentSlots = new Set<string>();

  private forwardedSlotsSignature = "";

  private suppressTabsEvent = false;

  get heading(): string {
    return this.getAttribute("heading") ?? "Sidebar";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /** Explicit tab configuration; JSON `[{"id","label"}]`. Overrides slot detection. */
  get tabs(): SidebarTab[] | null {
    const raw = this.getAttribute("tabs");
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as SidebarTab[];
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  set tabs(value: SidebarTab[] | null) {
    if (value?.length) {
      this.setAttribute("tabs", JSON.stringify(value));
      return;
    }

    this.removeAttribute("tabs");
  }

  get activeTab(): string {
    return this.getAttribute("active-tab") ?? "";
  }

  set activeTab(value: string) {
    if (!value) {
      this.removeAttribute("active-tab");
      return;
    }

    this.setAttribute("active-tab", value);
  }

  get collapsible(): boolean {
    return this.hasAttribute("collapsible");
  }

  set collapsible(value: boolean) {
    this.toggleAttribute("collapsible", value);
  }

  get collapsed(): boolean {
    return this.hasAttribute("collapsed");
  }

  set collapsed(value: boolean) {
    this.toggleAttribute("collapsed", value);
  }

  /** The tabs the sidebar is currently showing. */
  get resolvedTabs(): SidebarTab[] {
    return resolveSidebarTabs(this.tabs, this.presentSlots);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <aside part="sidebar">
        <header part="header">
          <h2 part="title"></h2>
          <button type="button" part="toggle" hidden></button>
        </header>
        <div part="body">
          <box-tabs part="tabs"></box-tabs>
          <div part="empty" hidden>No sidebar panels provided.</div>
        </div>
      </aside>
    `;
    this.asideEl = this.shadowRoot.querySelector('[part="sidebar"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.toggleEl = this.shadowRoot.querySelector('[part="toggle"]')!;
    this.bodyEl = this.shadowRoot.querySelector('[part="body"]')!;
    this.emptyEl = this.shadowRoot.querySelector('[part="empty"]')!;
    this.tabsHost = this.shadowRoot.querySelector('[part="tabs"]') as Tabs;
  }

  protected setupListeners(): void {
    this.toggleEl.addEventListener("click", () => {
      this.collapsed = !this.collapsed;
      this.dispatchEvent(
        new CustomEvent("collapsed-changed", {
          bubbles: true,
          composed: true,
          detail: { collapsed: this.collapsed },
        }),
      );
    });

    this.tabsHost.addEventListener("value-changed", event => {
      // box-tabs re-emits when we push a value into it; only user-driven
      // changes should surface as tab-changed.
      event.stopPropagation();
      const tabId = (event as CustomEvent<{ value?: string }>).detail?.value ?? "";
      if (this.suppressTabsEvent || !tabId || tabId === this.activeTab) {
        return;
      }
      this.activeTab = tabId;
      this.dispatchEvent(
        new CustomEvent("tab-changed", {
          bubbles: true,
          composed: true,
          detail: { tabId },
        }),
      );
    });
  }

  /**
   * The forwarded slots live inside box-tabs: host content slotted as
   * `slot="details"` chains through `<slot name="details" slot="details">`
   * into the matching tabpanel. One forwarded slot exists per known tab id
   * (defaults + configured), so presence detection works before tabs render.
   */
  private syncForwardedSlots(): void {
    const ids = new Set<string>(DEFAULT_SIDEBAR_TABS.map(tab => tab.id));
    for (const tab of this.tabs ?? []) {
      ids.add(tab.id);
    }

    const signature = JSON.stringify([...ids].sort());
    if (signature === this.forwardedSlotsSignature) {
      return;
    }
    this.forwardedSlotsSignature = signature;

    this.tabsHost.innerHTML = [...ids]
      .map(id => `<slot name="${escapeHtml(id)}" slot="${escapeHtml(id)}"></slot>`)
      .join("");

    this.tabsHost.querySelectorAll("slot").forEach(slot => {
      slot.addEventListener("slotchange", () => {
        this.refreshSlotPresence();
        if (this.isRendered) {
          this.update();
        }
      });
    });
    this.refreshSlotPresence();
  }

  private refreshSlotPresence(): void {
    this.presentSlots.clear();
    this.tabsHost.querySelectorAll("slot").forEach(slot => {
      if (slot.assignedNodes().length > 0) {
        this.presentSlots.add(slot.name);
      }
    });
  }

  protected update(): void {
    if (!this.tabsHost) {
      return;
    }

    this.syncForwardedSlots();

    this.titleEl.textContent = this.heading;
    this.asideEl.setAttribute("role", "complementary");
    this.asideEl.setAttribute("aria-label", this.heading);

    const collapsible = this.collapsible;
    const collapsed = this.collapsed;
    this.toggleEl.hidden = !collapsible;
    this.toggleEl.textContent = collapsed ? "Expand" : "Collapse";
    this.toggleEl.setAttribute("aria-expanded", collapsed ? "false" : "true");
    this.bodyEl.hidden = collapsible && collapsed;
    this.asideEl.setAttribute("data-collapsed", collapsed ? "true" : "false");

    const tabs = this.resolvedTabs;
    this.emptyEl.hidden = tabs.length > 0;
    this.tabsHost.hidden = tabs.length === 0;
    this.tabsHost.label = `${this.heading} tabs`;

    this.suppressTabsEvent = true;
    try {
      this.tabsHost.options = tabs.map(tab => ({ label: tab.label, value: tab.id }));
      const active = this.activeTab;
      const validActive = tabs.some(tab => tab.id === active) ? active : (tabs[0]?.id ?? "");
      if (validActive && this.tabsHost.value !== validActive) {
        this.tabsHost.value = validActive;
      }
      if (validActive !== active) {
        if (validActive) {
          this.setAttribute("active-tab", validActive);
        } else {
          this.removeAttribute("active-tab");
        }
      }
    } finally {
      this.suppressTabsEvent = false;
    }
  }
}

Tabs.register();
ContentSidebar.register();
