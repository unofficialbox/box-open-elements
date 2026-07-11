const DEFAULT_TAG_NAME = "box-metadata-inspector";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type MetadataInspectorField = {
  description?: string;
  label: string;
  tone?: string;
  value: string;
};

type MetadataInspectorSection = {
  fields: MetadataInspectorField[];
  title: string;
};

export class BoxMetadataInspectorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["eyebrow", "message", "sections", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    this.setAttribute("eyebrow", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get sections(): MetadataInspectorSection[] {
    return this.parseJsonAttribute<MetadataInspectorSection[]>("sections", []);
  }

  set sections(value: MetadataInspectorSection[]) {
    this.setAttribute("sections", JSON.stringify(value));
  }

  get title(): string {
    return this.getAttribute("title") ?? "Metadata Inspector";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
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

  private emitFieldSelected(label: string, value: string, section: string): void {
    this.dispatchEvent(
      new CustomEvent("field-selected", {
        bubbles: true,
        composed: true,
        detail: { label, section, value },
      }),
    );
  }

  private renderSections(): string {
    return this.sections
      .map(
        section => `
          <section part="section">
            <div part="section-title">${escapeHtml(section.title)}</div>
            <dl part="section-fields">
              ${section.fields
                .map(
                  field => `
                    <button
                      type="button"
                      part="field"
                      data-field-label="${escapeHtml(field.label)}"
                      data-field-value="${escapeHtml(field.value)}"
                      data-field-section="${escapeHtml(section.title)}"
                    >
                      <div part="field-header">
                        <dt part="field-label">${escapeHtml(field.label)}</dt>
                        <dd part="field-value" data-tone="${escapeHtml(field.tone ?? "neutral")}">${escapeHtml(field.value)}</dd>
                      </div>
                      ${field.description ? `<div part="field-description">${escapeHtml(field.description)}</div>` : ""}
                    </button>
                  `,
                )
                .join("")}
            </dl>
          </section>
        `,
      )
      .join("");
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const eyebrowMarkup = this.eyebrow ? `<div part="eyebrow">${escapeHtml(this.eyebrow)}</div>` : "";
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="inspector"] {
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

        [part="eyebrow"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-surface-surface-brand, #0061d5);
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

        [part="section"] {
          display: grid;
          gap: 0.7rem;
        }

        [part="section-title"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="section-fields"] {
          display: grid;
          gap: 0.75rem;
          margin: 0;
        }

        [part="field"] {
          display: grid;
          gap: 0.4rem;
          width: 100%;
          text-align: left;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 56%, transparent);
          border-radius: 0.9rem;
          padding: 0.8rem 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="field"]:hover {
          border-color: rgba(0, 97, 213, 0.22);
          transform: translateY(-1px);
        }

        [part="field"]:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        [part="field-header"] {
          display: flex;
          gap: 0.8rem;
          align-items: start;
          justify-content: space-between;
        }

        [part="field-label"] {
          margin: 0;
          font-size: 0.84rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="field-value"] {
          margin: 0;
          font-weight: 600;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="field-value"][data-tone="accent"] {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="field-value"][data-tone="success"] {
          color: #1d6a43;
        }

        [part="field-description"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.5;
        }
      </style>
      <section part="inspector">
        <header part="header">
          ${eyebrowMarkup}
          <div part="title">${escapeHtml(this.title)}</div>
          ${messageMarkup}
        </header>
        ${this.renderSections()}
      </section>
    `;

    this.shadowRoot.querySelectorAll<HTMLElement>('[part="field"]').forEach(field => {
      field.addEventListener("click", () => {
        this.emitFieldSelected(
          field.dataset.fieldLabel ?? "",
          field.dataset.fieldValue ?? "",
          field.dataset.fieldSection ?? "",
        );
      });
    });
  }
}

export const defineBoxMetadataInspectorElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMetadataInspectorElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMetadataInspectorElement;
  }

  customElements.define(tagName, BoxMetadataInspectorElement);
  return BoxMetadataInspectorElement;
};

