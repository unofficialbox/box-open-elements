const DEFAULT_TAG_NAME = "box-rating";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxRatingElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "value"];
  }

  private valueInternal = 0;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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
    return this.getAttribute("label") ?? "Rating";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    const raw = Number(this.getAttribute("max") ?? "5");
    return Number.isFinite(raw) && raw > 0 ? Math.max(1, Math.round(raw)) : 5;
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get value(): number {
    return this.valueInternal;
  }

  set value(value: number) {
    const nextValue = this.normalizeValue(value);
    this.valueInternal = nextValue;
    this.setAttribute("value", String(nextValue));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = this.normalizeValue(Number(this.getAttribute("value") ?? "0"));
    }

    if (name === "max" && this.valueInternal > this.max) {
      this.valueInternal = this.max;
      this.setAttribute("value", String(this.valueInternal));
    }

    this.render();
  }

  private normalizeValue(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(this.max, Math.max(0, Math.round(value)));
  }

  private emitValueChanged(nextValue: number): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
  }

  private updateValue(nextValue: number): void {
    if (this.disabled) {
      return;
    }

    const normalized = this.normalizeValue(nextValue);
    this.valueInternal = normalized;
    this.setAttribute("value", String(normalized));
    this.emitValueChanged(normalized);
    this.render();
  }

  private handleKeydown = (rawEvent: Event): void => {
    const event = rawEvent as KeyboardEvent;

    if (this.disabled) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      this.updateValue(this.valueInternal >= this.max ? this.max : this.valueInternal + 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      this.updateValue(this.valueInternal <= 1 ? 0 : this.valueInternal - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      this.updateValue(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      this.updateValue(this.max);
    }
  };

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const stars = Array.from({ length: this.max }, (_, index) => {
      const ratingValue = index + 1;
      const selected = this.valueInternal === ratingValue;
      const filled = this.valueInternal >= ratingValue;

      return `
        <button
          type="button"
          part="star"
          role="radio"
          aria-checked="${String(selected)}"
          aria-label="${ratingValue} ${ratingValue === 1 ? "star" : "stars"}"
          data-value="${ratingValue}"
          data-filled="${String(filled)}"
          tabindex="${selected || (this.valueInternal === 0 && ratingValue === 1) ? "0" : "-1"}"
          ${this.disabled ? "disabled" : ""}
        >
          <span part="icon" aria-hidden="true">★</span>
        </button>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="field"] {
          display: grid;
          gap: 0.8rem;
        }

        [part="label"] {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        [part="control"] {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.85rem 0.95rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 90%, white 10%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface, #ffffff) 84%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
            );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 12px 24px rgba(15, 23, 42, 0.04);
        }

        [part="star"] {
          inline-size: 2.35rem;
          block-size: 2.35rem;
          display: grid;
          place-items: center;
          border: 1px solid transparent;
          border-radius: 0.95rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 82%, transparent) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 16%, transparent) 100%
            );
          color: rgba(82, 96, 109, 0.45);
          cursor: pointer;
          transition:
            color 140ms ease,
            background 140ms ease,
            transform 140ms ease;
        }

        [part="star"][data-filled="true"] {
          color: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, white 86%) 0%,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 74%, white 26%) 100%
            );
        }

        [part="star"]:hover:not(:disabled) {
          color: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 74%, white 26%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 5%, var(--boe-token-surface-item-surface-hover, #eef4fb) 69%, white 26%) 100%
            );
        }

        [part="star"]:focus-visible {
          outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
          outline-offset: 2px;
        }

        [part="star"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        [part="icon"] {
          font-size: 1.3rem;
          line-height: 1;
        }

        [part="value"] {
          font-size: 0.95rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      </style>
      <div part="field">
        <div part="label">${escapeHtml(this.label)}</div>
        <div
          part="control"
          role="radiogroup"
          aria-label="${escapeHtml(this.label)}"
          aria-disabled="${String(this.disabled)}"
        >
          ${stars}
          <span part="value">${this.valueInternal}/${this.max}</span>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('[part="control"]')?.addEventListener("keydown", this.handleKeydown);
    this.shadowRoot.querySelectorAll('[part="star"]').forEach(button => {
      button.addEventListener("click", () => {
        const value = Number((button as HTMLButtonElement).dataset.value ?? "0");
        this.updateValue(value);
      });
    });
  }
}

export const defineBoxRatingElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxRatingElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxRatingElement;
  }

  customElements.define(tagName, BoxRatingElement);
  return BoxRatingElement;
};
