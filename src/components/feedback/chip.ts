import { BaseElement } from "../../core/index.js";
import {
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

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
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="chip"]:not([data-removable="true"]) {
    padding-inline-end: 0.7rem;
  }

  [part="chip"][data-interactive="true"] {
    cursor: pointer;
  }

  [part="chip"][data-interactive="true"]:hover:not([data-disabled="true"]) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="chip"][data-interactive="true"]:active:not([data-disabled="true"]) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
  }

  [part="chip"][data-tone="brand"],
  [part="chip"][data-tone="info"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #222222));
  }

  [part="chip"][data-tone="success"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 32%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 60%, var(--boe-token-text-text, #222222));
  }

  [part="chip"][data-tone="warning"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 40%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 58%, var(--boe-token-text-text, #222222));
  }

  [part="chip"][data-tone="error"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 30%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 70%, var(--boe-token-text-text, #222222));
  }

  /* Compact size. */
  [part="chip"][data-size="small"] {
    gap: 0.25rem;
    padding: 0.14rem 0.28rem 0.14rem 0.55rem;
    font-size: 0.74rem;
  }

  [part="chip"][data-size="small"]:not([data-removable="true"]) {
    padding-inline-end: 0.55rem;
  }

  /* Leading icon slot — hidden (and taking no gap) until content is assigned. */
  [part="icon"] {
    display: inline-flex;
    align-items: center;
    flex: none;
  }

  [part="icon"]:not(.has-content) {
    display: none;
  }

  [part="icon"]::slotted(*) {
    inline-size: 0.95rem;
    block-size: 0.95rem;
    display: block;
  }

  [part="chip"][data-selected="true"],
  [part="chip"][data-selected="true"]:hover:not([data-disabled="true"]),
  [part="chip"][data-selected="true"]:active:not([data-disabled="true"]) {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 74%, var(--boe-token-text-text, #222222));
  }

  [part="chip"][data-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  ${boeFocusVisibleStyles('[part="chip"]')}

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
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="remove"] svg {
    inline-size: 0.7rem;
    block-size: 0.7rem;
  }

  ${boeNeutralInteractiveStyles('[part="remove"]')}
`;

/**
 * A compact, labelled token. Unlike `box-badge` (a passive status marker) a chip
 * is interactive: it can be selected and it can be dismissed, emitting `remove`
 * with its `value` so a host list can drop it.
 */
export class BoxChipElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "removable", "selectable", "selected", "size", "tone", "value"];
  }

  private chipEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private iconSlot!: HTMLSlotElement;
  private removeEl: HTMLButtonElement | null = null;

  /** Chip size: `medium` (default) or `small`. */
  get size(): string {
    return this.getAttribute("size") === "small" ? "small" : "medium";
  }

  set size(value: string) {
    this.setAttribute("size", value);
  }

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
        <slot name="icon" part="icon"></slot>
        <span part="label"></span>
      </span>
    `;
    this.chipEl = this.shadowRoot.querySelector('[part="chip"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.iconSlot = this.shadowRoot.querySelector('slot[name="icon"]')!;
  }

  protected setupListeners(): void {
    this.iconSlot.addEventListener("slotchange", () => this.syncIconSlot());

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

  private syncIconSlot(): void {
    if (!this.iconSlot) {
      return;
    }
    const hasContent = this.iconSlot.assignedNodes({ flatten: true }).length > 0;
    this.iconSlot.classList.toggle("has-content", hasContent);
  }

  protected update(): void {
    if (!this.chipEl) {
      return;
    }

    this.chipEl.dataset.tone = this.tone;
    if (this.size === "medium") {
      this.chipEl.removeAttribute("data-size");
    } else {
      this.chipEl.dataset.size = this.size;
    }
    this.syncIconSlot();
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
