const DEFAULT_TAG_NAME = "box-metadata-filter-builder";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type MetadataFilterField = {
  id: string;
  label: string;
};

type MetadataFilterRule = {
  field: string;
  operator: string;
  value: string;
};

const DEFAULT_OPERATORS = [
  { label: "is", value: "is" },
  { label: "is not", value: "is-not" },
  { label: "contains", value: "contains" },
];

export class BoxMetadataFilterBuilderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["fields", "label", "rules"];
  }

  private rulesInternal: MetadataFilterRule[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get fields(): MetadataFilterField[] {
    return this.parseJsonAttribute<MetadataFilterField[]>("fields", []);
  }

  set fields(value: MetadataFilterField[]) {
    this.setAttribute("fields", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Metadata Filters";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get rules(): MetadataFilterRule[] {
    return [...this.rulesInternal];
  }

  set rules(value: MetadataFilterRule[]) {
    this.rulesInternal = [...value];
    this.setAttribute("rules", JSON.stringify(value));
    this.render();
  }

  connectedCallback(): void {
    this.syncRulesFromAttributes();
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "rules") {
      this.syncRulesFromAttributes();
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

  private syncRulesFromAttributes(): void {
    this.rulesInternal = this.parseJsonAttribute<MetadataFilterRule[]>("rules", []);
  }

  private emitValueChanged(): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: [...this.rulesInternal] },
      }),
    );
  }

  private updateRule(index: number, patch: Partial<MetadataFilterRule>): void {
    this.rulesInternal = this.rulesInternal.map((rule, ruleIndex) =>
      ruleIndex === index
        ? {
            ...rule,
            ...patch,
          }
        : rule,
    );
    this.setAttribute("rules", JSON.stringify(this.rulesInternal));
    this.emitValueChanged();
  }

  private addRule(): void {
    const defaultField = this.fields[0]?.id ?? "";
    this.rulesInternal = [
      ...this.rulesInternal,
      {
        field: defaultField,
        operator: DEFAULT_OPERATORS[0].value,
        value: "",
      },
    ];
    this.setAttribute("rules", JSON.stringify(this.rulesInternal));
    this.dispatchEvent(new CustomEvent("rule-added", { bubbles: true, composed: true, detail: { count: this.rulesInternal.length } }));
    this.emitValueChanged();
  }

  private removeRule(index: number): void {
    const removedRule = this.rulesInternal[index];
    this.rulesInternal = this.rulesInternal.filter((_, ruleIndex) => ruleIndex !== index);
    this.setAttribute("rules", JSON.stringify(this.rulesInternal));
    this.dispatchEvent(
      new CustomEvent("rule-removed", {
        bubbles: true,
        composed: true,
        detail: { index, rule: removedRule },
      }),
    );
    this.emitValueChanged();
  }

  private renderFieldOptions(selectedValue: string): string {
    return this.fields
      .map(
        field => `
          <option value="${escapeHtml(field.id)}" ${field.id === selectedValue ? "selected" : ""}>
            ${escapeHtml(field.label)}
          </option>
        `,
      )
      .join("");
  }

  private renderOperatorOptions(selectedValue: string): string {
    return DEFAULT_OPERATORS
      .map(
        operator => `
          <option value="${escapeHtml(operator.value)}" ${operator.value === selectedValue ? "selected" : ""}>
            ${escapeHtml(operator.label)}
          </option>
        `,
      )
      .join("");
  }

  private renderRules(): string {
    if (!this.rulesInternal.length) {
      return `<div part="empty">No metadata rules yet.</div>`;
    }

    return this.rulesInternal
      .map(
        (rule, index) => `
          <div part="rule" data-rule-index="${index}">
            <select part="select" data-rule-index="${index}" data-control="field">
              ${this.renderFieldOptions(rule.field)}
            </select>
            <select part="select" data-rule-index="${index}" data-control="operator">
              ${this.renderOperatorOptions(rule.operator)}
            </select>
            <input
              type="text"
              part="input"
              data-rule-index="${index}"
              value="${escapeHtml(rule.value)}"
              placeholder="Enter metadata value"
            />
            <button type="button" part="remove" data-rule-index="${index}">Remove</button>
          </div>
        `,
      )
      .join("");
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

        [part="builder"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem 1.1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, white 6%);
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="rules"] {
          display: grid;
          gap: 0.75rem;
        }

        [part="rule"] {
          display: grid;
          grid-template-columns: minmax(10rem, 1fr) minmax(8rem, 0.8fr) minmax(12rem, 1.2fr) auto;
          gap: 0.65rem;
          align-items: center;
        }

        [part="select"],
        [part="input"] {
          width: 100%;
          min-width: 0;
          padding: 0.75rem 0.85rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 0.85rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          box-sizing: border-box;
        }

        [part="add"],
        [part="remove"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 999px;
          padding: 0.65rem 0.95rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="add"] {
          width: fit-content;
          border-color: rgba(0, 97, 213, 0.28);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="empty"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        @media (max-width: 860px) {
          [part="rule"] {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <section part="builder">
        <div part="label">${escapeHtml(this.label)}</div>
        <div part="rules">
          ${this.renderRules()}
        </div>
        <button type="button" part="add">Add rule</button>
      </section>
    `;

    this.shadowRoot.querySelector('[part="add"]')?.addEventListener("click", () => {
      this.addRule();
    });

    this.shadowRoot.querySelectorAll<HTMLSelectElement>('[part="select"]').forEach(select => {
      select.addEventListener("change", event => {
        const target = event.currentTarget as HTMLSelectElement;
        const index = Number.parseInt(target.dataset.ruleIndex ?? "-1", 10);
        const control = target.dataset.control;
        if (index < 0) {
          return;
        }

        if (control === "field") {
          this.updateRule(index, { field: target.value });
        } else if (control === "operator") {
          this.updateRule(index, { operator: target.value });
        }
      });
    });

    this.shadowRoot.querySelectorAll<HTMLInputElement>('[part="input"]').forEach(input => {
      input.addEventListener("input", event => {
        const target = event.currentTarget as HTMLInputElement;
        const index = Number.parseInt(target.dataset.ruleIndex ?? "-1", 10);
        if (index < 0) {
          return;
        }

        this.updateRule(index, { value: target.value });
      });
    });

    this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="remove"]').forEach(button => {
      button.addEventListener("click", () => {
        const index = Number.parseInt(button.dataset.ruleIndex ?? "-1", 10);
        if (index < 0) {
          return;
        }

        this.removeRule(index);
      });
    });
  }
}

export const defineBoxMetadataFilterBuilderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMetadataFilterBuilderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMetadataFilterBuilderElement;
  }

  customElements.define(tagName, BoxMetadataFilterBuilderElement);
  return BoxMetadataFilterBuilderElement;
};

