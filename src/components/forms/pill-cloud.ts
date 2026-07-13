const DEFAULT_TAG_NAME = "box-pill-cloud";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type PillCloudOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/**
 * A cloud of toggle pills for multi-select filtering — think facet chips. Data
 * arrives via `options`; the selected set is exposed as `value` (a string[]) and
 * announced with `value-changed`. Each pill is a toggle button with
 * `aria-pressed`; the group is a labelled `role="group"`.
 */
export class BoxPillCloudElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "value"];
  }

  private valueInternal: string[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Filters";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): PillCloudOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as PillCloudOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: PillCloudOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get value(): string[] {
    return [...this.valueInternal];
  }

  set value(nextValue: string[]) {
    this.valueInternal = [...nextValue];
    this.setAttribute("value", JSON.stringify(nextValue));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      const raw = this.getAttribute("value");
      if (!raw) {
        this.valueInternal = [];
      } else {
        try {
          const parsed = JSON.parse(raw) as string[];
          this.valueInternal = Array.isArray(parsed) ? parsed : [];
        } catch {
          this.valueInternal = [];
        }
      }
    }

    this.render();
  }

  private toggle(value: string): void {
    const next = this.valueInternal.includes(value)
      ? this.valueInternal.filter(item => item !== value)
      : [...this.valueInternal, value];

    this.valueInternal = next;
    this.setAttribute("value", JSON.stringify(next));
    this.render();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: [...next] },
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const pills = this.options
      .map(option => {
        const isSelected = this.valueInternal.includes(option.value);
        const pillPart = isSelected ? "pill pill-selected" : "pill";
        return `
          <button
            type="button"
            part="${pillPart}"
            data-value="${escapeHtml(option.value)}"
            aria-pressed="${String(isSelected)}"
            ${option.disabled ? "disabled" : ""}
          >${escapeHtml(option.label)}</button>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="cloud"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        [part~="pill"] {
          appearance: none;
          padding: 0.35rem 0.75rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
        }

        [part~="pill"]:hover:not(:disabled) {
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part~="pill-selected"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 74%, var(--boe-token-text-text, #222222));
        }

        [part~="pill"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part~="pill"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        [part="empty"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.86rem;
        }
      </style>
      ${
        this.options.length
          ? `<div part="cloud" role="group" aria-label="${escapeHtml(this.label)}">${pills}</div>`
          : `<div part="empty">No options</div>`
      }
    `;

    for (const pill of Array.from(this.shadowRoot.querySelectorAll('[part~="pill"]'))) {
      pill.addEventListener("click", () => {
        this.toggle((pill as HTMLButtonElement).dataset.value ?? "");
      });
    }
  }
}

export const defineBoxPillCloudElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPillCloudElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPillCloudElement;
  }

  customElements.define(tagName, BoxPillCloudElement);
  return BoxPillCloudElement;
};
