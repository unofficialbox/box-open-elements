import { BaseElement } from "../../core/index.js";
import {
  applyRovingTabindex,
  focusRovingItem,
  nextRovingIndex,
} from "../../foundations/a11y/index.js";
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
  }

  [part="menu"] {
    min-width: 11rem;
    margin: 0;
    padding: 0.4rem;
    display: grid;
    gap: 0.2rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: 0.7rem;
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: 0 12px 30px color-mix(in srgb, #0b1e33 14%, transparent);
  }

  [part="menu-item"] {
    width: 100%;
    appearance: none;
    text-align: left;
    border: 0;
    border-radius: 0.55rem;
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 0.92rem;
    padding: 0.5rem 0.7rem;
    cursor: pointer;
    transition:
      background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeNeutralInteractiveStyles('[part="menu-item"]')}

  [part="menu-item"]:hover:not(:disabled) {
    color: var(--boe-token-surface-surface-brand, #0061d5);
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
