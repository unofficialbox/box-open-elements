import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-datalist-item";

const datalistItemStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="item"] {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.5rem 0.65rem;
    border-radius: 0.6rem;
    cursor: pointer;
    color: var(--boe-token-text-text, #222222);
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="item"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="item"][data-selected="true"] {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
  }

  [part="item"][data-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part="item"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
  }

  [part="thumb"] {
    flex: none;
    display: grid;
    place-items: center;
    inline-size: 1.9rem;
    block-size: 1.9rem;
    border-radius: 0.45rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-weight: 700;
    font-size: 0.85rem;
  }

  [part="body"] {
    min-inline-size: 0;
    display: grid;
    gap: 0.1rem;
  }

  [part="label"] {
    font-size: 0.9rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="meta"] {
    font-size: 0.78rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="meta"][hidden] {
    display: none;
  }
`;

/**
 * A single selectable row for a picker/typeahead list — a leading glyph, a
 * primary label, and optional secondary meta. It is a `role="option"` (meant to
 * sit inside a host listbox) and emits `select` with its `value` on click or
 * Enter/Space; `selected` reflects to `aria-selected`. The host owns the list
 * and its roving focus.
 */
export class BoxDatalistItemElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "icon", "label", "meta", "selected", "value"];
  }

  private itemEl!: HTMLElement;
  private thumbEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private metaEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get meta(): string {
    return this.getAttribute("meta") ?? "";
  }

  set meta(value: string) {
    this.setAttribute("meta", value);
  }

  get icon(): string {
    return this.getAttribute("icon") ?? "";
  }

  set icon(value: string) {
    this.setAttribute("icon", value);
  }

  get value(): string {
    return this.getAttribute("value") ?? this.label;
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get selected(): boolean {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    this.toggleAttribute("selected", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  private choose(): void {
    if (this.disabled) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("select", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${datalistItemStyles}</style>
      <div part="item" role="option">
        <span part="thumb" aria-hidden="true"></span>
        <span part="body">
          <span part="label"></span>
          <span part="meta" hidden></span>
        </span>
      </div>
    `;
    this.itemEl = this.shadowRoot.querySelector('[part="item"]')!;
    this.thumbEl = this.shadowRoot.querySelector('[part="thumb"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.metaEl = this.shadowRoot.querySelector('[part="meta"]')!;
  }

  protected setupListeners(): void {
    this.itemEl.addEventListener("click", () => this.choose());
    this.itemEl.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.choose();
      }
    });
  }

  protected update(): void {
    if (!this.itemEl || !this.thumbEl || !this.labelEl || !this.metaEl) {
      return;
    }

    const selected = this.selected;
    const disabled = this.disabled;
    const meta = this.meta;

    this.itemEl.setAttribute("aria-selected", selected ? "true" : "false");
    this.itemEl.dataset.selected = selected ? "true" : "false";
    this.itemEl.dataset.disabled = disabled ? "true" : "false";
    this.itemEl.tabIndex = disabled ? -1 : 0;

    if (disabled) {
      this.itemEl.setAttribute("aria-disabled", "true");
    } else {
      this.itemEl.removeAttribute("aria-disabled");
    }

    this.thumbEl.textContent = this.icon;
    this.labelEl.textContent = this.label;
    this.metaEl.textContent = meta;
    this.metaEl.hidden = !meta;
  }
}

export const defineBoxDatalistItemElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDatalistItemElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDatalistItemElement;
  }

  customElements.define(tagName, BoxDatalistItemElement);
  return BoxDatalistItemElement;
};
