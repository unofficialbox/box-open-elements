const DEFAULT_TAG_NAME = "box-item-form";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type ItemFormFieldOption = {
  label: string;
  value: string;
};

type ItemFormField = {
  id: string;
  label: string;
  section?: string;
  type?: "text" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  options?: ItemFormFieldOption[];
};

type ItemFormValues = Record<string, boolean | string>;

export class BoxItemFormElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "fields", "label", "mode", "submit-label", "value"];
  }

  private valueInternal: ItemFormValues = {};

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

  get fields(): ItemFormField[] {
    const raw = this.getAttribute("fields");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as ItemFormField[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set fields(value: ItemFormField[]) {
    this.setAttribute("fields", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Item Form";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get mode(): "edit" | "read" {
    return this.getAttribute("mode") === "read" ? "read" : "edit";
  }

  set mode(value: "edit" | "read") {
    this.setAttribute("mode", value);
  }

  get submitLabel(): string {
    return this.getAttribute("submit-label") ?? "Save Item";
  }

  set submitLabel(value: string) {
    this.setAttribute("submit-label", value);
  }

  get value(): ItemFormValues {
    return { ...this.valueInternal };
  }

  set value(value: ItemFormValues) {
    this.valueInternal = { ...value };
    this.setAttribute("value", JSON.stringify(value));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      const raw = this.getAttribute("value");
      if (!raw) {
        this.valueInternal = {};
      } else {
        try {
          const parsed = JSON.parse(raw) as ItemFormValues;
          this.valueInternal = parsed && typeof parsed === "object" ? parsed : {};
        } catch {
          this.valueInternal = {};
        }
      }
    }

    this.render();
  }

  private emitValueChanged(): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: { ...this.valueInternal } },
      }),
    );
  }

  private setFieldValue(fieldId: string, nextValue: boolean | string): void {
    this.valueInternal = {
      ...this.valueInternal,
      [fieldId]: nextValue,
    };
    this.setAttribute("value", JSON.stringify(this.valueInternal));
    this.emitValueChanged();
  }

  private getFieldValue(field: ItemFormField): boolean | string {
    const type = field.type ?? "text";
    const currentValue = this.valueInternal[field.id];

    if (type === "checkbox") {
      return typeof currentValue === "boolean" ? currentValue : false;
    }

    return typeof currentValue === "string" ? currentValue : "";
  }

  private getFieldSections(): Array<{ name: string; fields: ItemFormField[] }> {
    const sections = new Map<string, ItemFormField[]>();

    this.fields.forEach(field => {
      const sectionName = field.section?.trim() || "Details";
      const sectionFields = sections.get(sectionName) ?? [];
      sectionFields.push(field);
      sections.set(sectionName, sectionFields);
    });

    return Array.from(sections.entries()).map(([name, fields]) => ({ name, fields }));
  }

  private renderReadValue(field: ItemFormField): string {
    const type = field.type ?? "text";
    const value = this.getFieldValue(field);

    if (type === "checkbox") {
      return value ? "Yes" : "No";
    }

    if (type === "select") {
      const selectedOption = (field.options ?? []).find(option => option.value === value);
      return selectedOption?.label ?? String(value || "Empty");
    }

    return String(value || "Empty");
  }

  private renderField(field: ItemFormField): string {
    const type = field.type ?? "text";
    const value = this.getFieldValue(field);
    const descriptionMarkup = field.description
      ? `<div part="field-description">${escapeHtml(field.description)}</div>`
      : "";
    const disabled = this.disabled || field.disabled;

    if (this.mode === "read") {
      return `
        <div part="field" data-mode="read">
          <span part="field-label">${escapeHtml(field.label)}</span>
          ${descriptionMarkup}
          <div part="field-value">${escapeHtml(this.renderReadValue(field))}</div>
        </div>
      `;
    }

    if (type === "textarea") {
      return `
        <label part="field">
          <span part="field-label">${escapeHtml(field.label)}</span>
          ${descriptionMarkup}
          <textarea
            part="input"
            data-field-id="${escapeHtml(field.id)}"
            placeholder="${escapeHtml(field.placeholder ?? "")}"
            ${disabled ? "disabled" : ""}
          >${escapeHtml(String(value))}</textarea>
        </label>
      `;
    }

    if (type === "select") {
      const optionsMarkup = (field.options ?? [])
        .map(
          option => `
            <option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>
              ${escapeHtml(option.label)}
            </option>
          `,
        )
        .join("");

      return `
        <label part="field">
          <span part="field-label">${escapeHtml(field.label)}</span>
          ${descriptionMarkup}
          <select part="input" data-field-id="${escapeHtml(field.id)}" ${disabled ? "disabled" : ""}>
            ${optionsMarkup}
          </select>
        </label>
      `;
    }

    if (type === "checkbox") {
      return `
        <label part="checkbox-field">
          <input
            type="checkbox"
            part="checkbox"
            data-field-id="${escapeHtml(field.id)}"
            ${value ? "checked" : ""}
            ${disabled ? "disabled" : ""}
          />
          <span part="checkbox-content">
            <span part="field-label">${escapeHtml(field.label)}</span>
            ${descriptionMarkup}
          </span>
        </label>
      `;
    }

    return `
      <label part="field">
        <span part="field-label">${escapeHtml(field.label)}</span>
        ${descriptionMarkup}
        <input
          type="text"
          part="input"
          data-field-id="${escapeHtml(field.id)}"
          value="${escapeHtml(String(value))}"
          placeholder="${escapeHtml(field.placeholder ?? "")}"
          ${disabled ? "disabled" : ""}
        />
      </label>
    `;
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

        [part="form"] {
          display: grid;
          gap: 1rem;
          padding: 1.1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 92%, var(--boe-token-surface-surface, #ffffff) 8%);
        }

        [part="label"] {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        [part="fields"] {
          display: grid;
          gap: 0.9rem;
        }

        [part="section"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 68%, transparent);
        }

        [part="section-label"] {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="field"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="checkbox-field"] {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          align-items: start;
        }

        [part="checkbox-content"] {
          display: grid;
          gap: 0.35rem;
        }

        [part="field-label"] {
          font-weight: 700;
        }

        [part="field-description"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.95rem;
        }

        [part="field-value"] {
          padding: 0.8rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: 0.85rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 82%, transparent);
          color: rgba(35, 32, 28, 0.94);
          min-block-size: 1.25rem;
          white-space: pre-wrap;
        }

        [part="input"],
        [part="checkbox"] {
          font: inherit;
        }

        [part="input"] {
          width: 100%;
          min-width: 0;
          padding: 0.8rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 0.85rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          box-sizing: border-box;
        }

        textarea[part="input"] {
          min-block-size: 6.5rem;
          resize: vertical;
        }

        [part="input"]:focus-visible,
        [part="submit"]:focus-visible,
        [part="cancel"]:focus-visible,
        [part="checkbox"]:focus-visible {
          outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
          outline-offset: 2px;
        }

        [part="actions"] {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        [part="submit"],
        [part="cancel"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 999px;
          padding: 0.75rem 1.1rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        [part="submit"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="submit"]:disabled,
        [part="cancel"]:disabled,
        [part="input"]:disabled,
        [part="checkbox"]:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      </style>
      <form part="form" novalidate>
        <div part="label">${escapeHtml(this.label)}</div>
        <div part="fields">
          ${this.getFieldSections()
            .map(
              section => `
                <section part="section">
                  <div part="section-label">${escapeHtml(section.name)}</div>
                  ${section.fields.map(field => this.renderField(field)).join("")}
                </section>
              `,
            )
            .join("")}
        </div>
        ${
          this.mode === "edit"
            ? `
              <div part="actions">
                <button type="button" part="cancel" ${this.disabled ? "disabled" : ""}>Cancel</button>
                <button type="submit" part="submit" ${this.disabled ? "disabled" : ""}>${escapeHtml(this.submitLabel)}</button>
              </div>
            `
            : ""
        }
      </form>
    `;

    const form = this.shadowRoot.querySelector('[part="form"]') as HTMLFormElement | null;
    if (this.mode !== "edit") {
      return;
    }

    form?.addEventListener("input", event => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const fieldId = target.dataset.fieldId ?? "";
      if (!fieldId) {
        return;
      }

      if (target instanceof HTMLInputElement && target.type === "checkbox") {
        this.setFieldValue(fieldId, target.checked);
        return;
      }

      this.setFieldValue(fieldId, target.value);
    });

    form?.addEventListener("submit", event => {
      event.preventDefault();
      if (this.disabled) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent("submit", {
          bubbles: true,
          composed: true,
          detail: { value: { ...this.valueInternal } },
        }),
      );
    });

    this.shadowRoot.querySelector('[part="cancel"]')?.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent("cancel", {
          bubbles: true,
          composed: true,
          detail: { value: { ...this.valueInternal } },
        }),
      );
    });
  }
}

export const defineBoxItemFormElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxItemFormElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxItemFormElement;
  }

  customElements.define(tagName, BoxItemFormElement);
  return BoxItemFormElement;
};
