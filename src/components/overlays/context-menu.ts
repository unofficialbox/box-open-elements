import { BaseElement } from "../../core/index.js";
import { FocusRestore, nextRovingIndex } from "../../foundations/a11y/index.js";
import { boeOverlay, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { resolvePosition } from "../../foundations/overlay/index.js";

const DEFAULT_TAG_NAME = "box-context-menu";

export interface ContextMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  /** Render a divider *before* this item. */
  separator?: boolean;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const contextMenuStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="target"] {
    display: contents;
  }

  [part="surface"] {
    position: fixed;
    z-index: 40;
    inset-block-start: 0;
    inset-inline-start: 0;
    min-width: 180px;
    max-width: min(320px, 90vw);
    margin: 0;
    padding: ${boeSpace[1]};
    border: ${boeOverlay.border};
    border-radius: ${boeOverlay.radius};
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: ${boeOverlay.shadow};
    display: grid;
    gap: 1px;
  }

  [part="surface"][hidden] {
    display: none;
  }

  [part="item"] {
    appearance: none;
    border: none;
    background: none;
    font: inherit;
    text-align: start;
    width: 100%;
    min-height: ${boeOverlay.itemMinHeight};
    padding: ${boeSpace[1]} ${boeSpace[3]};
    border-radius: ${boeOverlay.itemRadius};
    color: var(--boe-token-text-text, #222222);
    cursor: pointer;
  }

  [part="item"]:hover:not(:disabled),
  [part="item"]:focus-visible {
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    outline: none;
  }

  [part="item"]:focus-visible {
    box-shadow: inset 0 0 0 2px var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="item"]:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  [part="divider"] {
    height: 1px;
    margin: ${boeSpace[1]} 0;
    background: var(--boe-token-stroke-stroke, #e8e8e8);
    border-radius: ${boeRadius.size};
  }
`;

/**
 * Right-click context menu — box-ui-elements `ContextMenu`. The default slot is
 * the target area; right-clicking (or Shift+F10 / the ContextMenu key) opens a
 * menu at the pointer, positioned with `foundations/overlay` so it stays in the
 * viewport. Full keyboard menu: arrows, Home/End, Enter/Space, Escape.
 */
export class BoxContextMenuElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["items", "disabled"];
  }

  private openValue = false;
  private targetEl!: HTMLElement;
  private surfaceEl!: HTMLElement;
  private readonly focusRestore = new FocusRestore();
  private documentBound = false;

  private readonly onOutside = (event: Event): void => {
    if (!this.openValue) return;
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (!path.some(node => node === this.surfaceEl)) this.close();
  };

  private readonly onReposition = (): void => {
    if (this.openValue) this.close();
  };

  get items(): ContextMenuItem[] {
    const raw = this.getAttribute("items");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ContextMenuItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: ContextMenuItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  get open(): boolean {
    return this.openValue;
  }

  disconnectedCallback(): void {
    this.unbindDocument();
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>${contextMenuStyles}</style>
      <div part="target"><slot></slot></div>
      <div part="surface" role="menu" hidden></div>
    `;
    this.targetEl = this.shadowRoot.querySelector('[part="target"]')!;
    this.surfaceEl = this.shadowRoot.querySelector('[part="surface"]')!;
  }

  protected setupListeners(): void {
    this.addEventListener("contextmenu", event => {
      if (this.disabled || this.items.length === 0) return;
      event.preventDefault();
      this.openAt(event.clientX, event.clientY);
    });

    // Keyboard opener: Shift+F10 or the ContextMenu key on the focused target.
    this.addEventListener("keydown", event => {
      if (this.disabled) return;
      const isOpener = event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
      if (isOpener && this.items.length) {
        event.preventDefault();
        const rect = this.getBoundingClientRect();
        this.openAt(rect.left, rect.bottom);
      }
    });

    this.surfaceEl.addEventListener("click", event => {
      const item = (event.target as HTMLElement).closest<HTMLButtonElement>('[part="item"]');
      if (!item || item.disabled) return;
      this.selectItem(item.dataset.id ?? "");
    });

    this.surfaceEl.addEventListener("keydown", event => this.onMenuKeydown(event));
  }

  private enabledItems(): HTMLButtonElement[] {
    return Array.from(this.surfaceEl.querySelectorAll<HTMLButtonElement>('[part="item"]:not(:disabled)'));
  }

  private onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    const items = this.enabledItems();
    if (items.length === 0) return;
    const current = items.indexOf(event.target as HTMLButtonElement);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      (event.target as HTMLButtonElement).click();
      return;
    }
    const next = nextRovingIndex(event.key, Math.max(current, 0), items.length, { orientation: "vertical" });
    if (next !== null && next !== current) {
      event.preventDefault();
      items[next].focus();
    }
  }

  private openAt(clientX: number, clientY: number): void {
    this.renderItems();
    this.surfaceEl.hidden = false;

    const { width, height } = this.surfaceEl.getBoundingClientRect();
    const { x, y } = resolvePosition(
      { top: clientY, left: clientX, width: 0, height: 0 },
      { width, height },
      { width: window.innerWidth, height: window.innerHeight },
      { placement: { side: "bottom", align: "start" }, offset: 0 },
    );
    this.surfaceEl.style.left = `${Math.round(x)}px`;
    this.surfaceEl.style.top = `${Math.round(y)}px`;

    this.openValue = true;
    this.bindDocument();
    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: true } }));

    this.focusRestore.capture(document.activeElement as HTMLElement | null);
    queueMicrotask(() => this.enabledItems()[0]?.focus());
  }

  close(): void {
    if (!this.openValue) return;
    this.openValue = false;
    this.surfaceEl.hidden = true;
    this.unbindDocument();
    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: false } }));
    this.focusRestore.restore();
  }

  private selectItem(id: string): void {
    const item = this.items.find(entry => entry.id === id);
    if (!item || item.disabled) return;
    this.dispatchEvent(new CustomEvent("item-selected", { bubbles: true, composed: true, detail: item }));
    this.close();
  }

  private renderItems(): void {
    this.surfaceEl.innerHTML = this.items
      .map(item => {
        const divider = item.separator ? `<div part="divider" role="separator"></div>` : "";
        const disabled = item.disabled ? " disabled" : "";
        return `${divider}<button type="button" part="item" role="menuitem" data-id="${escapeHtml(item.id)}"${disabled}>${escapeHtml(item.label)}</button>`;
      })
      .join("");
  }

  private bindDocument(): void {
    if (this.documentBound) return;
    document.addEventListener("pointerdown", this.onOutside, true);
    document.addEventListener("scroll", this.onReposition, true);
    window.addEventListener("resize", this.onReposition);
    this.documentBound = true;
  }

  private unbindDocument(): void {
    if (!this.documentBound) return;
    document.removeEventListener("pointerdown", this.onOutside, true);
    document.removeEventListener("scroll", this.onReposition, true);
    window.removeEventListener("resize", this.onReposition);
    this.documentBound = false;
  }

  protected update(): void {
    // The menu content is rendered on open; nothing to sync while closed.
    if (this.openValue) this.renderItems();
  }
}

export const defineBoxContextMenuElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxContextMenuElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxContextMenuElement;
  }

  customElements.define(tagName, BoxContextMenuElement);
  return BoxContextMenuElement;
};
