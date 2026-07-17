import { BaseElement } from "../../core/index.js";
import {
  applyRovingTabindex,
  focusRovingItem,
  nextRovingIndex,
} from "../../foundations/a11y/index.js";
import { boeControl, boeOverlay } from "../../foundations/geometry/index.js";
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
};

const menuStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
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
      const button = (event.target as HTMLElement | null)?.closest(
        '[part="menu-item"]',
      ) as HTMLButtonElement | null;
      if (!button || !this.menuEl.contains(button) || button.disabled) {
        return;
      }

      const itemId = button.getAttribute("data-item-id");
      const item = this.items.find(entry => entry.id === itemId);
      if (!item || this.disabled || item.disabled) {
        return;
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
    this.menuEl.innerHTML = this.items
      .map(
        item => `
          <button type="button" part="menu-item" role="menuitem" data-item-id="${escapeHtml(item.id)}" ${this.disabled || item.disabled ? "disabled" : ""}>
            ${escapeHtml(item.label)}
          </button>
        `,
      )
      .join("");

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
