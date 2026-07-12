const DEFAULT_TAG_NAME = "box-chip";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * A compact, labelled token. Unlike `box-badge` (a passive status marker) a chip
 * is interactive: it can be selected and it can be dismissed, emitting `remove`
 * with its `value` so a host list can drop it.
 */
export class BoxChipElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "removable", "selectable", "selected", "tone", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const label = this.label;
    const removeMarkup = this.removable
      ? `<button type="button" part="remove" aria-label="Remove ${escapeHtml(label)}" ${this.disabled ? "disabled" : ""}>
           <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
         </button>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
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
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, white 18%);
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 70%, white 30%);
          color: var(--boe-token-text-text, #101820);
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
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
        }

        [part="chip"][data-tone="brand"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, white 90%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #101820));
        }

        [part="chip"][data-selected="true"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, white 86%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 74%, var(--boe-token-text-text, #101820));
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
          color: var(--boe-token-text-text-secondary, #52606d);
          cursor: pointer;
          transition: background 140ms ease, color 140ms ease;
        }

        [part="remove"] svg {
          inline-size: 0.7rem;
          block-size: 0.7rem;
        }

        [part="remove"]:hover:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
          color: var(--boe-token-text-text, #101820);
        }

        [part="remove"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
        }

        [part="remove"]:disabled {
          cursor: not-allowed;
        }
      </style>
      <span
        part="chip"
        data-tone="${escapeHtml(this.tone)}"
        data-removable="${this.removable ? "true" : "false"}"
        data-selected="${this.selected ? "true" : "false"}"
        data-disabled="${this.disabled ? "true" : "false"}"
        data-interactive="${this.hasAttribute("selectable") && !this.disabled ? "true" : "false"}"
        role="${this.hasAttribute("selectable") ? "button" : "listitem"}"
        ${this.hasAttribute("selectable") ? `aria-pressed="${this.selected ? "true" : "false"}"` : ""}
        ${this.hasAttribute("selectable") && !this.disabled ? 'tabindex="0"' : ""}
      >
        <span part="label">${escapeHtml(label)}</span>
        ${removeMarkup}
      </span>
    `;

    const chip = this.shadowRoot.querySelector('[part="chip"]') as HTMLElement | null;
    const removeButton = this.shadowRoot.querySelector('[part="remove"]') as HTMLButtonElement | null;

    removeButton?.addEventListener("click", event => {
      event.stopPropagation();
      this.dismiss();
    });

    if (this.hasAttribute("selectable")) {
      chip?.addEventListener("click", () => this.toggleSelection());
      chip?.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.toggleSelection();
        }
      });
    }
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
