const DEFAULT_TAG_NAME = "box-text-area";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxTextAreaElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "placeholder", "rows", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.render();
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
    return this.getAttribute("label") ?? "Details";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get rows(): number {
    const raw = this.getAttribute("rows");
    const parsed = raw ? Number.parseInt(raw, 10) : 4;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
  }

  set rows(value: number) {
    this.setAttribute("rows", String(value));
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }

    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="field"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="textarea"] {
          appearance: none;
          font: inherit;
          color: var(--boe-token-text-text, #101820);
          padding: 0.6rem 0.85rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
          border-radius: 0.7rem;
          background:
            linear-gradient(
              180deg,
              var(--boe-token-surface-surface, #ffffff) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #f7f9fc) 12%) 100%
            );
          resize: vertical;
          line-height: 1.5;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
        }

        [part="textarea"]::placeholder {
          color: var(--boe-token-text-text-placeholder, #748091);
        }

        [part="textarea"]:hover:not(:disabled) {
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
        }

        [part="textarea"]:focus-visible {
          outline: none;
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="textarea"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      </style>
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <textarea part="textarea" rows="${this.rows}" placeholder="${escapeHtml(this.placeholder)}" ${this.disabled ? "disabled" : ""}>${escapeHtml(this.valueInternal)}</textarea>
      </label>
    `;

    const textarea = this.shadowRoot.querySelector('[part="textarea"]') as HTMLTextAreaElement | null;
    textarea?.addEventListener("input", event => {
      const nextValue = (event.currentTarget as HTMLTextAreaElement).value;
      this.valueInternal = nextValue;
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: nextValue },
        }),
      );
    });
  }
}

export const defineBoxTextAreaElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTextAreaElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTextAreaElement;
  }

  customElements.define(tagName, BoxTextAreaElement);
  return BoxTextAreaElement;
};
