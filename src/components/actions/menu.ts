import { BaseElement } from "../../core/index.js";
import {
  applyRovingTabindex,
  focusRovingItem,
  nextRovingIndex,
} from "../../foundations/a11y/index.js";
import { boeControl, boeOverlay, boeSpace } from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-menu";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxMenuItem = {
  disabled?: boolean;
  id: string;
  label: string;
  /** Render a divider before this item. */
  separator?: boolean;
  /** Render a non-interactive section header instead of a menuitem. */
  header?: boolean;
  /** Render as a link (navigates on activate). */
  href?: string;
  /** Checkable item — renders menuitemcheckbox with aria-checked. */
  checked?: boolean;
};

const menuStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="menu"] {
    min-width: 11rem;
    margin: 0;
    padding: ${boeOverlay.padding};
    display: grid;
    gap: 0;
    border: ${boeOverlay.border};
    border-radius: ${boeOverlay.radius};
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: ${boeOverlay.shadow};
  }

  [part="menu-item"] {
    width: 100%;
    appearance: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-height: ${boeOverlay.itemMinHeight};
    text-align: left;
    border: 0;
    border-radius: ${boeOverlay.itemRadius};
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: ${boeControl.fontSize};
    padding: ${boeOverlay.itemPadding};
    cursor: pointer;
    transition:
      background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeNeutralInteractiveStyles('[part="menu-item"]')}

  [part="menu-item"]:hover:not(:disabled),
  [part="menu-item"]:focus-visible:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
  }

  [part="menu-item"]:disabled {
    opacity: ${boeControl.disabledOpacity};
  }

  /* Link items keep the menu-item chrome but render as anchors. */
  a[part="menu-item"] {
    display: flex;
    align-items: center;
    text-decoration: none;
  }

  [part="menu-separator"] {
    height: 1px;
    margin: ${boeSpace[1]} 0;
    background: var(--boe-token-stroke-stroke, #e8e8e8);
  }

  [part="menu-header"] {
    padding: ${boeSpace[1]} ${boeSpace[2]};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  /* Check indicator for checkable items. */
  [part="menu-item"][role="menuitemcheckbox"]::before {
    content: "";
    display: inline-block;
    width: 1em;
    margin-inline-end: ${boeSpace[1]};
    flex-shrink: 0;
  }

  [part="menu-item"][aria-checked="true"]::before {
    content: "✓";
  }
`;

export class BoxMenuElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "items", "label"];
  }

  private menuEl!: HTMLElement;

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Menu";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxMenuItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxMenuItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxMenuItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  /** Render one item: header, separator + item, link, checkable, or plain. */
  private renderItem(item: BoxMenuItem): string {
    const separator = item.separator ? `<div part="menu-separator" role="separator"></div>` : "";

    if (item.header) {
      return `${separator}<div part="menu-header" role="presentation">${escapeHtml(item.label)}</div>`;
    }

    const disabled = this.disabled || item.disabled;
    const id = escapeHtml(item.id);
    const label = escapeHtml(item.label);

    // Checkable item — role=menuitemcheckbox with aria-checked.
    if (typeof item.checked === "boolean") {
      const checkedAttr = item.checked ? ' aria-checked="true"' : ' aria-checked="false"';
      return `${separator}<button type="button" part="menu-item" role="menuitemcheckbox" data-item-id="${id}"${checkedAttr} ${disabled ? "disabled" : ""}>${label}</button>`;
    }

    // Link item — an anchor styled as a menuitem.
    if (item.href) {
      const aria = disabled ? ' aria-disabled="true"' : "";
      return `${separator}<a part="menu-item" role="menuitem" data-item-id="${id}" href="${escapeHtml(item.href)}" tabindex="-1"${aria}>${label}</a>`;
    }

    return `${separator}<button type="button" part="menu-item" role="menuitem" data-item-id="${id}" ${disabled ? "disabled" : ""}>${label}</button>`;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${menuStyles}</style>
      <div part="menu" role="menu"></div>
    `;
    this.menuEl = this.shadowRoot.querySelector('[part="menu"]')!;
  }

  protected setupListeners(): void {
    this.menuEl.addEventListener("click", event => {
      const el = (event.target as HTMLElement | null)?.closest('[part="menu-item"]') as HTMLElement | null;
      // Anchors have no `.disabled`; both use aria-disabled / native disabled.
      const isDisabled = el?.hasAttribute("disabled") || el?.getAttribute("aria-disabled") === "true";
      if (!el || !this.menuEl.contains(el) || isDisabled) {
        return;
      }

      const itemId = el.getAttribute("data-item-id");
      const item = this.items.find(entry => entry.id === itemId);
      if (!item || this.disabled || item.disabled) {
        return;
      }

      // Checkable items toggle their aria-checked optimistically; the host owns
      // the source of truth and can re-render from the event.
      if (typeof item.checked === "boolean") {
        el.setAttribute("aria-checked", String(!item.checked));
      }

      this.dispatchEvent(
        new CustomEvent("item-selected", {
          bubbles: true,
          composed: true,
          detail: item,
        }),
      );
    });

    this.menuEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const buttons = this.enabledMenuItems();
      if (buttons.length === 0) {
        return;
      }

      const active = keyboardEvent.target as HTMLElement | null;
      const currentIndex = buttons.indexOf(active as HTMLButtonElement);
      if (currentIndex < 0) {
        return;
      }

      const nextIndex = nextRovingIndex(keyboardEvent.key, currentIndex, buttons.length, {
        orientation: "vertical",
      });
      if (nextIndex == null) {
        return;
      }

      keyboardEvent.preventDefault();
      focusRovingItem(buttons, nextIndex);
    });
  }

  private enabledMenuItems(): HTMLButtonElement[] {
    return Array.from(this.menuEl.querySelectorAll<HTMLButtonElement>('[part="menu-item"]')).filter(
      button => !button.disabled,
    );
  }

  protected update(): void {
    if (!this.menuEl) {
      return;
    }

    this.menuEl.setAttribute("aria-label", this.label);
    this.menuEl.innerHTML = this.items.map(item => this.renderItem(item)).join("");

    const buttons = this.enabledMenuItems();
    applyRovingTabindex(buttons, 0);
  }
}

export const defineBoxMenuElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMenuElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMenuElement;
  }

  customElements.define(tagName, BoxMenuElement);
  return BoxMenuElement;
};
