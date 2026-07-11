const DEFAULT_TAG_NAME = "box-file-request-builder";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type FileRequestBuilderField = {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
};

type FileRequestBuilderSetting = {
  id: string;
  label: string;
  description?: string;
};

type FileRequestBuilderValues = Record<string, boolean | string>;

export class BoxFileRequestBuilderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["fields", "message", "settings", "title", "value"];
  }

  private valueInternal: FileRequestBuilderValues = {};

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get fields(): FileRequestBuilderField[] {
    return this.parseJsonAttribute<FileRequestBuilderField[]>("fields", []);
  }

  set fields(value: FileRequestBuilderField[]) {
    this.setAttribute("fields", JSON.stringify(value));
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get settings(): FileRequestBuilderSetting[] {
    return this.parseJsonAttribute<FileRequestBuilderSetting[]>("settings", []);
  }

  set settings(value: FileRequestBuilderSetting[]) {
    this.setAttribute("settings", JSON.stringify(value));
  }

  get title(): string {
    return this.getAttribute("title") ?? "File Request";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get value(): FileRequestBuilderValues {
    return { ...this.valueInternal };
  }

  set value(value: FileRequestBuilderValues) {
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
          const parsed = JSON.parse(raw) as FileRequestBuilderValues;
          this.valueInternal = parsed && typeof parsed === "object" ? parsed : {};
        } catch {
          this.valueInternal = {};
        }
      }
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
        detail: { value: { ...this.valueInternal } },
      }),
    );
  }

  private updateValue(key: string, nextValue: boolean | string): void {
    this.valueInternal = {
      ...this.valueInternal,
      [key]: nextValue,
    };
    this.setAttribute("value", JSON.stringify(this.valueInternal));
    this.emitValueChanged();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const settingsMarkup = this.settings.length
      ? `
          <section part="settings">
            <div part="section-title">Request settings</div>
            <div part="settings-list">
              ${this.settings
                .map(
                  setting => `
                    <label part="setting">
                      <input
                        type="checkbox"
                        part="checkbox"
                        data-setting-id="${escapeHtml(setting.id)}"
                        ${this.valueInternal[setting.id] ? "checked" : ""}
                      />
                      <span part="setting-content">
                        <span part="setting-label">${escapeHtml(setting.label)}</span>
                        ${setting.description ? `<span part="setting-description">${escapeHtml(setting.description)}</span>` : ""}
                      </span>
                    </label>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
      : "";
    const fieldsMarkup = this.fields.length
      ? `
          <section part="fields">
            <div part="section-title">Upload form fields</div>
            <div part="field-list">
              ${this.fields
                .map(
                  field => `
                    <div part="field">
                      <div part="field-header">
                        <span part="field-label">${escapeHtml(field.label)}</span>
                        ${field.required ? `<span part="field-required">Required</span>` : ""}
                      </div>
                      ${field.description ? `<div part="field-description">${escapeHtml(field.description)}</div>` : ""}
                    </div>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="builder"] {
          display: grid;
          gap: 1rem;
          padding: 1.1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 94%, white 6%);
        }

        [part="header"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="title"] {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.55;
        }

        [part="section-title"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="settings"],
        [part="fields"] {
          display: grid;
          gap: 0.7rem;
        }

        [part="settings-list"],
        [part="field-list"] {
          display: grid;
          gap: 0.75rem;
        }

        [part="setting"],
        [part="field"] {
          display: grid;
          gap: 0.35rem;
          padding: 0.85rem 0.9rem;
          border-radius: 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 48%, transparent);
        }

        [part="setting"] {
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          align-items: start;
        }

        [part="checkbox"] {
          margin-top: 0.15rem;
          accent-color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="setting-content"] {
          display: grid;
          gap: 0.2rem;
        }

        [part="setting-label"],
        [part="field-label"] {
          font-weight: 600;
        }

        [part="setting-description"],
        [part="field-description"] {
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="field-header"] {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          justify-content: space-between;
        }

        [part="field-required"] {
          display: inline-flex;
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 64%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          font-weight: 600;
          padding: 0.72rem 1rem;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: var(--boe-token-text-text, #1f1e1b);
          color: white;
        }
      </style>
      <section part="builder">
        <header part="header">
          <div part="title">${escapeHtml(this.title)}</div>
          ${messageMarkup}
        </header>
        ${settingsMarkup}
        ${fieldsMarkup}
        <div part="actions">
          <button type="button" part="action" data-action-id="copy-link">Copy upload link</button>
          <button type="button" part="action" data-action-id="preview">Preview request</button>
          <button type="button" part="action" data-action-id="save" data-tone="primary">Save request</button>
        </div>
      </section>
    `;

    this.shadowRoot.querySelectorAll<HTMLInputElement>("[data-setting-id]").forEach(input => {
      input.addEventListener("change", () => {
        const settingId = input.dataset.settingId;
        if (!settingId) {
          return;
        }

        this.updateValue(settingId, input.checked);
      });
    });

    this.shadowRoot.querySelectorAll<HTMLElement>("[data-action-id]").forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.dataset.actionId;
        if (!actionId) {
          return;
        }

        this.dispatchEvent(
          new CustomEvent("action", {
            bubbles: true,
            composed: true,
            detail: { action: actionId, value: { ...this.valueInternal } },
          }),
        );
      });
    });
  }
}

export const defineBoxFileRequestBuilderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxFileRequestBuilderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxFileRequestBuilderElement;
  }

  customElements.define(tagName, BoxFileRequestBuilderElement);
  return BoxFileRequestBuilderElement;
};
