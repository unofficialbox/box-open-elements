import { BaseElement } from "../../core/index.js";
import { boeControl, boeOverlay } from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-menu-item";

const menuItemStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="item"] {
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

  [part="item"][data-selected="true"] {
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
    color: var(--boe-token-text-text, #222222);
    font-weight: 600;
  }

  ${boeNeutralInteractiveStyles('[part="item"]')}

  [part="item"][data-selected="true"]:hover:not(:disabled),
  [part="item"][data-selected="true"]:active:not(:disabled) {
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
  }

  [part="item"]:hover:not(:disabled),
  [part="item"]:focus-visible:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
  }

  [part="item"]:disabled {
    opacity: ${boeControl.disabledOpacity};
  }
`;

export class BoxMenuItemElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "selected", "value"];
  }

  private itemEl!: HTMLButtonElement;

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
    return this.getAttribute("label") ?? "Menu Item";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get selected(): boolean {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    if (value) {
      this.setAttribute("selected", "");
    } else {
      this.removeAttribute("selected");
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${menuItemStyles}</style>
      <button type="button" part="item" role="menuitemradio"></button>
    `;
    this.itemEl = this.shadowRoot.querySelector('[part="item"]')!;
  }

  protected setupListeners(): void {
    this.itemEl.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent("selected", {
          bubbles: true,
          composed: true,
          detail: { value: this.value, label: this.label },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.itemEl) {
      return;
    }

    this.itemEl.dataset.selected = String(this.selected);
    this.itemEl.setAttribute("aria-checked", String(this.selected));
    this.itemEl.setAttribute("aria-disabled", String(this.disabled));
    this.itemEl.disabled = this.disabled;
    this.itemEl.textContent = this.label;
  }
}

export const defineBoxMenuItemElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMenuItemElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMenuItemElement;
  }

  customElements.define(tagName, BoxMenuItemElement);
  return BoxMenuItemElement;
};
