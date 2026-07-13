const DEFAULT_TAG_NAME = "box-pill-selector-dropdown";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type PillOption = {
  value: string;
  label: string;
};

/**
 * A multi-select pill field: the current selection shows as removable pills, and
 * an "Add" dropdown offers the remaining options. Data arrives via `options`;
 * the selection is exposed as `value` (a string[]) and every add/remove emits
 * `value-changed`. The menu is a `role="listbox"` toggled from an
 * `aria-haspopup` trigger.
 */
export class BoxPillSelectorDropdownElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "placeholder", "value"];
  }

  private valueInternal: string[] = [];
  private open = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Selection";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Add";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get options(): PillOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as PillOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: PillOption[]) {
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

  private labelFor(value: string): string {
    return this.options.find(option => option.value === value)?.label ?? value;
  }

  private commit(next: string[]): void {
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

  private addValue(value: string): void {
    if (!value || this.valueInternal.includes(value)) {
      return;
    }
    // Keep the menu open so several options can be added in a row.
    this.commit([...this.valueInternal, value]);
  }

  private removeValue(value: string): void {
    if (!this.valueInternal.includes(value)) {
      return;
    }
    this.commit(this.valueInternal.filter(item => item !== value));
  }

  private toggleOpen(force?: boolean): void {
    this.open = force ?? !this.open;
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const available = this.options.filter(option => !this.valueInternal.includes(option.value));

    const pillsMarkup = this.valueInternal
      .map(
        value => `
          <span part="pill" data-value="${escapeHtml(value)}">
            <span part="pill-label">${escapeHtml(this.labelFor(value))}</span>
            <button type="button" part="pill-remove" data-value="${escapeHtml(value)}" aria-label="Remove ${escapeHtml(this.labelFor(value))}">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </span>
        `,
      )
      .join("");

    const optionsMarkup = available.length
      ? available
          .map(
            option => `
              <li part="option-row" role="option" aria-selected="false">
                <button type="button" part="option" data-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button>
              </li>
            `,
          )
          .join("")
      : `<li part="option-empty" role="presentation">No more options</li>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="field"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="pill"] {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.3rem 0.2rem 0.6rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 70%, white 30%);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          font-size: 0.82rem;
          font-weight: 600;
        }

        [part="pill-remove"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          inline-size: 1.1rem;
          block-size: 1.1rem;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #52606d);
          cursor: pointer;
        }

        [part="pill-remove"] svg {
          inline-size: 0.65rem;
          block-size: 0.65rem;
        }

        [part="pill-remove"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
          color: var(--boe-token-text-text, #101820);
        }

        [part="dropdown"] {
          position: relative;
          display: inline-block;
        }

        [part="trigger"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.6rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #52606d);
          font: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }

        [part="trigger"]:hover {
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
          color: var(--boe-token-text-text, #101820);
        }

        [part="trigger"]:focus-visible,
        [part="option"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="menu"] {
          position: absolute;
          z-index: 10;
          inset-block-start: calc(100% + 0.25rem);
          inset-inline-start: 0;
          min-inline-size: 11rem;
          margin: 0;
          padding: 0.3rem;
          list-style: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 0.6rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
        }

        [part="option"] {
          appearance: none;
          display: block;
          inline-size: 100%;
          text-align: start;
          padding: 0.4rem 0.55rem;
          border: 0;
          border-radius: 0.4rem;
          background: transparent;
          color: var(--boe-token-text-text, #101820);
          font: inherit;
          font-size: 0.85rem;
          cursor: pointer;
        }

        [part="option"]:hover {
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
        }

        [part="option-empty"] {
          padding: 0.4rem 0.55rem;
          color: var(--boe-token-text-text-secondary, #52606d);
          font-size: 0.82rem;
        }
      </style>
      <div part="field" role="group" aria-label="${escapeHtml(this.label)}">
        ${pillsMarkup}
        <div part="dropdown">
          <button
            type="button"
            part="trigger"
            aria-haspopup="listbox"
            aria-expanded="${String(this.open)}"
          >+ ${escapeHtml(this.placeholder)}</button>
          ${
            this.open
              ? `<ul part="menu" role="listbox" aria-label="${escapeHtml(this.label)} options">${optionsMarkup}</ul>`
              : ""
          }
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('[part="trigger"]')?.addEventListener("click", () => {
      this.toggleOpen();
    });

    for (const remove of Array.from(this.shadowRoot.querySelectorAll('[part="pill-remove"]'))) {
      remove.addEventListener("click", () => {
        this.removeValue((remove as HTMLButtonElement).dataset.value ?? "");
      });
    }

    for (const option of Array.from(this.shadowRoot.querySelectorAll('[part="option"]'))) {
      option.addEventListener("click", () => {
        this.addValue((option as HTMLButtonElement).dataset.value ?? "");
      });
    }
  }
}

export const defineBoxPillSelectorDropdownElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPillSelectorDropdownElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPillSelectorDropdownElement;
  }

  customElements.define(tagName, BoxPillSelectorDropdownElement);
  return BoxPillSelectorDropdownElement;
};
