import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

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


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
        }

        [part="builder"] {
          display: grid;
          gap: 0.6rem;
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="header"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.55;
        }

        [part="section-title"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="settings"],
        [part="fields"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="settings-list"],
        [part="field-list"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="setting"],
        [part="field"] {
          display: grid;
          gap: 0.35rem;
          padding: 0.65rem 0.75rem;
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
        }

        [part="setting"] {
          grid-template-columns: auto 1fr;
          gap: ${boePanel.gap};
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
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="field-header"] {
          display: flex;
          gap: ${boePanel.gap};
          align-items: center;
          justify-content: space-between;
        }

        [part="field-required"] {
          display: inline-flex;
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          font-weight: 600;
          padding: 0.4rem 0.7rem;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeFocusVisibleStyles('[part="checkbox"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: var(--boe-token-text-text, #1f1e1b);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class BoxFileRequestBuilderElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["fields", "heading", "message", "settings", "value"];
  }

  private valueInternal: FileRequestBuilderValues = {};
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

  get heading(): string {
    return this.getAttribute("heading") ?? "File Request";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get value(): FileRequestBuilderValues {
    return { ...this.valueInternal };
  }

  set value(value: FileRequestBuilderValues) {
    this.valueInternal = { ...value };
    this.setAttribute("value", JSON.stringify(value));
    if (this.isRendered) {
      this.update();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
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

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
  }

  protected update(): void {
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

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <section part="builder">
        <header part="header">
          <h2 part="title">${escapeHtml(this.heading)}</h2>
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
