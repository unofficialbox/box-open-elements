const DEFAULT_TAG_NAME = "box-saved-view-picker";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type SavedView = {
  description?: string;
  id: string;
  label: string;
  resultCount?: number;
};

export class BoxSavedViewPickerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "value", "views"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Saved Views";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(value: string) {
    this.valueInternal = value;
    this.setAttribute("value", value);
    this.render();
  }

  get views(): SavedView[] {
    return this.parseJsonAttribute<SavedView[]>("views", []);
  }

  set views(value: SavedView[]) {
    this.setAttribute("views", JSON.stringify(value));
  }

  connectedCallback(): void {
    this.valueInternal = this.getAttribute("value") ?? "";
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    this.render();
  }

  private parseJsonAttribute<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private emitValueChanged(): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: this.valueInternal },
      }),
    );
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
          --_obp-surface: var(--boe-token-surface-surface, #ffffff);
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #f7f9fc);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 58%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #52606d);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, white 88%);
        }

        [part="picker"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem 1.1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--_obp-brand);
        }

        [part="views"] {
          display: grid;
          gap: 0.75rem;
        }

        [part="view"] {
          display: grid;
          gap: 0.3rem;
          width: 100%;
          text-align: left;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 0.9rem;
          padding: 0.85rem 0.95rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="view"][data-selected="true"] {
          border-color: color-mix(in srgb, var(--_obp-brand) 34%, transparent);
          background: var(--_obp-brand-soft);
        }

        [part="view"]:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        [part="view-label"] {
          font-weight: 700;
        }

        [part="view-description"] {
          color: var(--_obp-text-muted);
          line-height: 1.45;
        }

        [part="view-count"] {
          color: var(--_obp-text-muted);
          font-size: 0.88rem;
        }
      </style>
      <section part="picker" role="radiogroup" aria-label="${escapeHtml(this.label)}">
        <div part="label">${escapeHtml(this.label)}</div>
        <div part="views">
          ${this.views
            .map(
              view => `
                <button
                  type="button"
                  part="view"
                  role="radio"
                  aria-checked="${String(this.value === view.id)}"
                  data-view-id="${escapeHtml(view.id)}"
                  data-selected="${String(this.value === view.id)}"
                >
                  <div part="view-label">${escapeHtml(view.label)}</div>
                  ${view.description ? `<div part="view-description">${escapeHtml(view.description)}</div>` : ""}
                  ${typeof view.resultCount === "number" ? `<div part="view-count">${escapeHtml(`${view.resultCount} results`)}</div>` : ""}
                </button>
              `,
            )
            .join("")}
        </div>
      </section>
    `;

    this.shadowRoot.querySelectorAll<HTMLElement>('[part="view"]').forEach(button => {
      button.addEventListener("click", () => {
        const nextValue = button.getAttribute("data-view-id") ?? "";
        if (!nextValue || nextValue === this.valueInternal) {
          return;
        }

        this.valueInternal = nextValue;
        this.setAttribute("value", nextValue);
        this.emitValueChanged();
      });
    });
  }
}

export const defineBoxSavedViewPickerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSavedViewPickerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSavedViewPickerElement;
  }

  customElements.define(tagName, BoxSavedViewPickerElement);
  return BoxSavedViewPickerElement;
};
