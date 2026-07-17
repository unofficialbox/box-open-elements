import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

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

const builderStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  [part="builder"] {
    display: grid;
    gap: ${boePanel.gap};
    padding: ${boePanel.padding};
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: ${boePanel.radius};
    background: ${boePanel.background};
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
    gap: ${boePanel.gap};
  }

  [part="rule"] {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) minmax(8rem, 0.8fr) minmax(12rem, 1.2fr) auto;
    gap: ${boePanel.gap};
    align-items: center;
  }

  [part="select"],
  [part="input"] {
    width: 100%;
    min-width: 0;
    padding: 0.45rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
    border-radius: 0.55rem;
    background: var(--boe-token-surface-surface, #ffffff);
    color: inherit;
    font: inherit;
    box-sizing: border-box;
  }

  [part="add"],
  [part="remove"] {
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
    border-radius: 999px;
    padding: 0.4rem 0.7rem;
    background: var(--boe-token-surface-surface, #ffffff);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  [part="empty"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.5;
  }

  ${boeNeutralInteractiveStyles('[part="select"]')}
  ${boeNeutralInteractiveStyles('[part="input"]')}
  ${boeNeutralInteractiveStyles('[part="add"]')}
  ${boeNeutralInteractiveStyles('[part="remove"]')}

  [part="add"],
  [part="add"]:hover:not(:disabled) {
    width: fit-content;
    border-color: rgba(0, 97, 213, 0.28);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  @media (max-width: 860px) {
    [part="rule"] {
      grid-template-columns: 1fr;
    }
  }
`;

export class BoxMetadataFilterBuilderElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["fields", "label", "rules"];
  }

  private rulesInternal: MetadataFilterRule[] = [];
  private syncingFromUi = false;
  private labelEl!: HTMLElement;
  private rulesEl!: HTMLElement;
  private structureSignature = "";

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
    if (this.isRendered) {
      this.update();
    }
  }

  connectedCallback(): void {
    this.syncRulesFromAttributes();
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "rules" && !this.syncingFromUi) {
      this.syncRulesFromAttributes();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
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

  private writeRulesAttribute(): void {
    this.syncingFromUi = true;
    this.setAttribute("rules", JSON.stringify(this.rulesInternal));
    this.syncingFromUi = false;
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
    this.writeRulesAttribute();
    this.emitValueChanged();
    // Structure-only changes go through add/remove. Field/operator/value edits are
    // patched in place by update() so the focused control is not remounted.
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
    this.writeRulesAttribute();
    this.dispatchEvent(new CustomEvent("rule-added", { bubbles: true, composed: true, detail: { count: this.rulesInternal.length } }));
    this.emitValueChanged();
    this.update();
  }

  private removeRule(index: number): void {
    const removedRule = this.rulesInternal[index];
    this.rulesInternal = this.rulesInternal.filter((_, ruleIndex) => ruleIndex !== index);
    this.writeRulesAttribute();
    this.dispatchEvent(
      new CustomEvent("rule-removed", {
        bubbles: true,
        composed: true,
        detail: { index, rule: removedRule },
      }),
    );
    this.emitValueChanged();
    this.update();
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

  private renderRulesMarkup(): string {
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

  private structureKey(): string {
    // Field/operator values are patched in place so select changes keep focus.
    // Only add/remove (and fields catalog changes) are structural rebuilds.
    return JSON.stringify({
      fields: this.fields,
      count: this.rulesInternal.length,
    });
  }

  private patchRuleControls(index: number, active: HTMLElement | null): void {
    const rule = this.rulesInternal[index];
    if (!rule) {
      return;
    }

    const fieldSelect = this.rulesEl.querySelector<HTMLSelectElement>(
      `[data-control="field"][data-rule-index="${index}"]`,
    );
    const operatorSelect = this.rulesEl.querySelector<HTMLSelectElement>(
      `[data-control="operator"][data-rule-index="${index}"]`,
    );
    // Set values in place — never rebuild option lists here (fields catalog changes
    // already trigger a structural rebuild via structureKey).
    if (fieldSelect && fieldSelect !== active && fieldSelect.value !== rule.field) {
      fieldSelect.value = rule.field;
    }
    if (operatorSelect && operatorSelect !== active && operatorSelect.value !== rule.operator) {
      operatorSelect.value = rule.operator;
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${builderStyles}</style>
      <section part="builder">
        <div part="label"></div>
        <div part="rules"></div>
        <button type="button" part="add">Add rule</button>
      </section>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.rulesEl = this.shadowRoot.querySelector('[part="rules"]')!;
  }

  protected setupListeners(): void {
    this.shadowRoot?.querySelector('[part="add"]')?.addEventListener("click", () => {
      this.addRule();
    });

    this.rulesEl.addEventListener("change", event => {
      const target = event.target as HTMLSelectElement;
      if (target.getAttribute("part") !== "select") {
        return;
      }
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

    this.rulesEl.addEventListener("input", event => {
      const target = event.target as HTMLInputElement;
      if (target.getAttribute("part") !== "input") {
        return;
      }
      const index = Number.parseInt(target.dataset.ruleIndex ?? "-1", 10);
      if (index < 0) {
        return;
      }

      this.updateRule(index, { value: target.value });
    });

    this.rulesEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="remove"]') as HTMLButtonElement | null;
      if (!button || !this.rulesEl.contains(button)) {
        return;
      }
      const index = Number.parseInt(button.dataset.ruleIndex ?? "-1", 10);
      if (index < 0) {
        return;
      }

      this.removeRule(index);
    });
  }

  protected update(): void {
    if (!this.labelEl || !this.rulesEl) {
      return;
    }

    this.labelEl.textContent = this.label;

    const nextSignature = this.structureKey();
    if (nextSignature === this.structureSignature && this.rulesEl.childElementCount > 0) {
      // Structure unchanged: patch unfocused controls only (external rules setter).
      const active = this.shadowRoot?.activeElement as HTMLElement | null;
      this.rulesInternal.forEach((rule, index) => {
        const input = this.rulesEl.querySelector<HTMLInputElement>(
          `[part="input"][data-rule-index="${index}"]`,
        );
        if (input && input !== active) {
          input.value = rule.value;
        }
        this.patchRuleControls(index, active);
      });
      return;
    }

    this.structureSignature = nextSignature;
    this.rulesEl.innerHTML = this.renderRulesMarkup();
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
