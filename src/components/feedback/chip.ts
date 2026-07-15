import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-chip";

const chipStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="chip"] {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.35rem 0.28rem 0.7rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
    color: var(--boe-token-text-text, #222222);
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  }

  [part="chip"]:not([data-removable="true"]) {
    padding-inline-end: 0.7rem;
  }

  [part="chip"][data-interactive="true"] {
    cursor: pointer;
  }

  [part="chip"][data-interactive="true"]:hover {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="chip"][data-tone="brand"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #222222));
  }

  [part="chip"][data-selected="true"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 74%, var(--boe-token-text-text, #222222));
  }

  [part="chip"][data-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part="chip"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
  }

  [part="remove"] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.15rem;
    block-size: 1.15rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
    transition: background 140ms ease, color 140ms ease;
  }

  [part="remove"] svg {
    inline-size: 0.7rem;
    block-size: 0.7rem;
  }

  [part="remove"]:hover:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
    color: var(--boe-token-text-text, #222222);
  }

  [part="remove"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
  }

  [part="remove"]:disabled {
    cursor: not-allowed;
  }
`;

/**
 * A compact, labelled token. Unlike `box-badge` (a passive status marker) a chip
 * is interactive: it can be selected and it can be dismissed, emitting `remove`
 * with its `value` so a host list can drop it.
 */
export class BoxChipElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "removable", "selectable", "selected", "tone", "value"];
  }

  private chipEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private removeEl: HTMLButtonElement | null = null;

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.getAttribute("value") ?? this.label;
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "neutral";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  get removable(): boolean {
    return this.hasAttribute("removable");
  }

  set removable(value: boolean) {
    this.toggleAttribute("removable", value);
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

  get selectable(): boolean {
    return this.hasAttribute("selectable");
  }

  set selectable(value: boolean) {
    this.toggleAttribute("selectable", value);
  }

  dismiss(): void {
    if (this.disabled || !this.removable) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("remove", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private toggleSelection(): void {
    if (this.disabled) {
      return;
    }
    this.selected = !this.selected;
    this.dispatchEvent(
      new CustomEvent("select", {
        bubbles: true,
        composed: true,
        detail: { value: this.value, selected: this.selected },
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${chipStyles}</style>
      <span part="chip">
        <span part="label"></span>
      </span>
    `;
    this.chipEl = this.shadowRoot.querySelector('[part="chip"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
  }

  protected setupListeners(): void {
    this.chipEl.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part="remove"]')) {
        return;
      }
      if (this.selectable) {
        this.toggleSelection();
      }
    });

    this.chipEl.addEventListener("keydown", event => {
      if (!this.selectable) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.toggleSelection();
      }
    });
  }

  private syncRemoveButton(): void {
    if (this.removable) {
      if (!this.removeEl) {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("part", "remove");
        button.innerHTML =
          '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
        button.addEventListener("click", event => {
          event.stopPropagation();
          this.dismiss();
        });
        this.chipEl.append(button);
        this.removeEl = button;
      }
      this.removeEl.setAttribute("aria-label", `Remove ${this.label}`);
      this.removeEl.disabled = this.disabled;
    } else if (this.removeEl) {
      this.removeEl.remove();
      this.removeEl = null;
    }
  }

  protected update(): void {
    if (!this.chipEl) {
      return;
    }

    this.chipEl.dataset.tone = this.tone;
    this.chipEl.dataset.removable = this.removable ? "true" : "false";
    this.chipEl.dataset.selected = this.selected ? "true" : "false";
    this.chipEl.dataset.disabled = this.disabled ? "true" : "false";
    this.chipEl.dataset.interactive = this.selectable && !this.disabled ? "true" : "false";
    this.chipEl.setAttribute("role", this.selectable ? "button" : "listitem");

    if (this.selectable) {
      this.chipEl.setAttribute("aria-pressed", this.selected ? "true" : "false");
      if (this.disabled) {
        this.chipEl.setAttribute("aria-disabled", "true");
      } else {
        this.chipEl.removeAttribute("aria-disabled");
      }
      if (!this.disabled) {
        this.chipEl.tabIndex = 0;
      } else {
        this.chipEl.removeAttribute("tabindex");
      }
    } else {
      this.chipEl.removeAttribute("aria-pressed");
      this.chipEl.removeAttribute("aria-disabled");
      this.chipEl.removeAttribute("tabindex");
    }

    this.labelEl.textContent = this.label;
    this.syncRemoveButton();
  }
}

export const defineBoxChipElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxChipElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxChipElement;
  }

  customElements.define(tagName, BoxChipElement);
  return BoxChipElement;
};
