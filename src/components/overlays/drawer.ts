import { BaseElement } from "../../core/index.js";
import { FocusRestore, trapTabKey } from "../../foundations/a11y/index.js";
import {
  boeControl,
  boeOverlay,
  boePanel,
  boeRadius,
  boeSpace,
} from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-drawer";

const drawerStyles = `
  :host {
    color: inherit;
    font: inherit;
  }

  [part="backdrop"] {
    position: fixed;
    inset: 0;
    display: grid;
    z-index: 1200;
    background: ${boeOverlay.modalBackdrop};
  }

  [part="drawer"] {
    width: min(var(--drawer-size, ${boePanel.drawerWidth}), calc(100vw - 2rem));
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: ${boePanel.background};
    color: var(--boe-token-text-text, #222222);
    border: ${boePanel.border};
    box-shadow: ${boeOverlay.modalShadow};
  }

  /* Size presets scale the travel axis: width for side drawers, height for
     the bottom sheet. */
  [part="drawer"][data-size="small"] { --drawer-size: 320px; --drawer-block-size: 220px; }
  [part="drawer"][data-size="medium"] { --drawer-size: ${boePanel.drawerWidth}; --drawer-block-size: 320px; }
  [part="drawer"][data-size="large"] { --drawer-size: 640px; --drawer-block-size: 480px; }
  [part="drawer"][data-size="full"] { --drawer-size: 100vw; --drawer-block-size: calc(100vh - 3rem); }

  [part="drawer"][data-position="left"] {
    border-left: 0;
    border-top-right-radius: ${boeOverlay.modalRadius};
    border-bottom-right-radius: ${boeOverlay.modalRadius};
  }

  [part="drawer"][data-position="right"] {
    border-right: 0;
    border-top-left-radius: ${boeOverlay.modalRadius};
    border-bottom-left-radius: ${boeOverlay.modalRadius};
  }

  [part="drawer"][data-position="bottom"] {
    width: 100%;
    max-width: none;
    height: min(var(--drawer-block-size, 320px), calc(100vh - 3rem));
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    border-top-left-radius: ${boeOverlay.modalRadius};
    border-top-right-radius: ${boeOverlay.modalRadius};
  }

  /* On a phone every drawer is the screen: partial overlays waste the one
     dimension the device is short of. */
  @media (max-width: 640px) {
    [part="drawer"],
    [part="drawer"][data-position="bottom"] {
      width: 100vw;
      max-width: none;
      height: 100%;
      border: 0;
      border-radius: 0;
    }
  }

  [part="header"] {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: ${boeSpace[3]};
    padding: ${boeSpace[4]};
    border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
  }

  [part="meta"] {
    display: grid;
    gap: ${boeSpace[1]};
  }

  [part="meta"] h2 {
    margin: 0;
    font: inherit;
    font-size: ${boeOverlay.modalTitleSize};
    font-weight: 700;
    line-height: 24px;
  }

  [part="description"] {
    margin: 0;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 14px;
    line-height: 20px;
  }

  [part="description"][hidden] {
    display: none;
  }

  [part="close"] {
    appearance: none;
    box-sizing: border-box;
    border: 1px solid ${boeControl.buttonBorder};
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: ${boeControl.fontSize};
    font-weight: 700;
    letter-spacing: ${boeControl.letterSpacing};
    min-height: ${boeControl.height};
    padding: 0 ${boeSpace[3]};
    cursor: pointer;
    box-shadow: none;
  }

  ${boeNeutralInteractiveStyles('[part="close"]')}

  [part="body"] {
    position: relative;
    padding: ${boeSpace[4]};
    overflow: auto;
  }

  /* Footer is the third grid row: it stays put while the body scrolls. */
  [part="footer"] {
    padding: ${boeSpace[3]} ${boeSpace[4]};
    border-top: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    background: ${boePanel.background};
  }

  [part="footer"][hidden] {
    display: none;
  }

  [part="busy"] {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 65%, transparent);
  }

  [part="busy"][hidden] {
    display: none;
  }

  [part="busy-spinner"] {
    inline-size: 1.6rem;
    block-size: 1.6rem;
    border-radius: 999px;
    border: 3px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 20%, transparent);
    border-top-color: var(--boe-token-surface-surface-brand, #0061d5);
    animation: boe-drawer-spin 0.9s linear infinite;
  }

  @keyframes boe-drawer-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    [part="busy-spinner"] { animation-duration: 1.6s; }
  }
`;

const DRAWER_SIZES = new Set(["small", "medium", "large", "full"]);

/** Detail of the cancelable `dismiss` event: what asked the drawer to close. */
export interface DrawerDismissDetail {
  source: "close-button" | "backdrop" | "escape";
}

export class Drawer extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["busy", "description", "heading", "open", "position", "size"];
  }

  private openValue = false;
  private wasOpen = false;
  private readonly focusRestore = new FocusRestore();
  private placeholder: Comment | null = null;
  private portaled = false;
  private hostEl!: HTMLElement;
  private backdropEl: HTMLElement | null = null;
  private drawerEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private descriptionEl: HTMLElement | null = null;

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextOpen = Boolean(value);
    if (this.openValue === nextOpen) {
      return;
    }

    this.openValue = nextOpen;
    if (nextOpen) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }

    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextOpen } }));
  }

  get position(): string {
    return this.getAttribute("position") ?? "right";
  }

  set position(value: string) {
    this.setAttribute("position", value);
  }

  /** Width preset for side drawers, height for the bottom sheet. */
  get size(): string {
    const value = this.getAttribute("size");
    return value && DRAWER_SIZES.has(value) ? value : "medium";
  }

  set size(value: string) {
    this.setAttribute("size", value);
  }

  /** Busy: a saving/loading veil over the body; Close stays reachable. */
  get busy(): boolean {
    return this.hasAttribute("busy");
  }

  set busy(value: boolean) {
    this.toggleAttribute("busy", Boolean(value));
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Drawer";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  connectedCallback(): void {
    if (this.openValue) {
      this.portalToBody();
    }
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
      if (this.openValue) {
        this.portalToBody();
      } else {
        this.restoreFromPortal();
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
    this.restoreFromPortal();
  }

  private portalToBody(): void {
    if (this.portaled || !this.isConnected || !this.ownerDocument?.body) {
      return;
    }

    const parent = this.parentNode;
    if (!parent || parent === this.ownerDocument.body) {
      return;
    }

    this.placeholder = this.ownerDocument.createComment("box-drawer-placeholder");
    parent.insertBefore(this.placeholder, this);
    this.ownerDocument.body.append(this);
    this.portaled = true;
  }

  private restoreFromPortal(): void {
    if (!this.portaled || !this.placeholder?.parentNode) {
      return;
    }

    this.placeholder.parentNode.insertBefore(this, this.placeholder);
    this.placeholder.remove();
    this.placeholder = null;
    this.portaled = false;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Keep styles inside the host so a closed drawer has empty textContent.
    this.shadowRoot.innerHTML = `<div part="host"></div>`;
    this.hostEl = this.shadowRoot.querySelector('[part="host"]')!;
  }

  /**
   * The unsaved-changes guard, host-owned: `dismiss` is cancelable, and a
   * host that calls `preventDefault()` keeps the drawer open — the drawer
   * learns nothing about forms. Programmatic `close()` is not guarded; the
   * host asked for it.
   */
  private requestDismiss(source: DrawerDismissDetail["source"]): void {
    const proceed = this.dispatchEvent(
      new CustomEvent<DrawerDismissDetail>("dismiss", {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { source },
      }),
    );
    if (proceed) {
      this.close();
    }
  }

  protected setupListeners(): void {
    this.hostEl.addEventListener("click", event => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.getAttribute("part") === "backdrop") {
        this.requestDismiss("backdrop");
        return;
      }

      if (target.closest('[part="close"]')) {
        this.requestDismiss("close-button");
      }
    });

    this.hostEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const drawer = (keyboardEvent.target as HTMLElement | null)?.closest(
        '[part="drawer"]',
      ) as HTMLElement | null;
      if (!drawer || !this.hostEl.contains(drawer)) {
        return;
      }

      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.requestDismiss("escape");
        return;
      }

      if (keyboardEvent.key === "Tab") {
        trapTabKey(keyboardEvent, drawer);
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    if (!this.openValue) {
      const wasOpen = this.wasOpen;
      this.hostEl.innerHTML = "";
      this.backdropEl = null;
      this.drawerEl = null;
      this.titleEl = null;
      this.descriptionEl = null;
      this.wasOpen = false;
      if (wasOpen) {
        this.focusRestore.restore();
      }
      return;
    }

    const justOpened = !this.wasOpen;
    this.wasOpen = true;
    if (justOpened) {
      this.focusRestore.capture();
    }

    if (!this.hostEl.querySelector('[part="drawer"]')) {
      this.hostEl.innerHTML = `
        <style>${drawerStyles}</style>
        <div part="backdrop">
          <aside part="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <header part="header">
              <div part="meta">
                <h2 id="drawer-title"></h2>
                <p part="description" hidden></p>
                <slot name="header"></slot>
              </div>
              <button type="button" part="close" aria-label="Close drawer">Close</button>
            </header>
            <div part="body">
              <slot></slot>
              <div part="busy" hidden><span part="busy-spinner" aria-hidden="true"></span></div>
            </div>
            <footer part="footer" hidden>
              <slot name="footer"></slot>
            </footer>
          </aside>
        </div>
      `;
      // The footer row only exists when the host slots one: an empty sticky
      // bar would just eat drawer height.
      const footerSlot = this.hostEl.querySelector('slot[name="footer"]') as HTMLSlotElement | null;
      footerSlot?.addEventListener("slotchange", () => {
        this.syncFooter();
      });
    }

    this.backdropEl = this.hostEl.querySelector('[part="backdrop"]');
    this.drawerEl = this.hostEl.querySelector('[part="drawer"]');
    this.titleEl = this.hostEl.querySelector("#drawer-title");
    this.descriptionEl = this.hostEl.querySelector('[part="description"]');

    const isLeft = this.position === "left";
    const isBottom = this.position === "bottom";
    if (this.backdropEl) {
      this.backdropEl.style.alignItems = isBottom ? "end" : "";
      this.backdropEl.style.justifyItems = isBottom ? "stretch" : isLeft ? "start" : "end";
    }
    if (this.drawerEl) {
      this.drawerEl.dataset.position = this.position;
      this.drawerEl.dataset.size = this.size;
      if (this.busy) {
        this.drawerEl.setAttribute("aria-busy", "true");
      } else {
        this.drawerEl.removeAttribute("aria-busy");
      }
    }
    const busyEl = this.hostEl.querySelector('[part="busy"]') as HTMLElement | null;
    if (busyEl) {
      busyEl.hidden = !this.busy;
    }
    this.syncFooter();
    if (this.titleEl) {
      this.titleEl.textContent = this.heading;
    }
    if (this.descriptionEl) {
      const description = this.description;
      this.descriptionEl.textContent = description;
      this.descriptionEl.hidden = !description;
    }

    if (justOpened) {
      queueMicrotask(() => {
        (this.hostEl.querySelector('[part="close"]') as HTMLButtonElement | null)?.focus();
      });
    }
  }

  private syncFooter(): void {
    const footerEl = this.hostEl.querySelector('[part="footer"]') as HTMLElement | null;
    const footerSlot = this.hostEl.querySelector('slot[name="footer"]') as HTMLSlotElement | null;
    if (footerEl && footerSlot) {
      footerEl.hidden = footerSlot.assignedNodes({ flatten: true }).length === 0;
    }
  }
}

Drawer.register();
