const DEFAULT_TAG_NAME = "box-drop-zone";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxDropZoneElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["description", "label", "message"];
  }

  private dragging = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Upload files";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? this.description ?? "Drag files here or click to browse.";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? this.getAttribute("message") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
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

        [part="zone"] {
          position: relative;
          display: grid;
          gap: 0.55rem;
          justify-items: start;
          padding: 1.35rem 1.4rem;
          border: 1.5px dashed color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-stroke-stroke, #d6e0ea) 84%);
          border-radius: 1.2rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 86%, white 14%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #f7f9fc) 8%) 100%
            );
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
        }

        [part="zone"][data-dragging="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #e8f1ff) 76%, white 24%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-item-surface-selected, #e8f1ff) 72%, white 18%) 100%
            );
          box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent),
            0 14px 28px rgba(15, 23, 42, 0.05);
        }

        [part="input"] {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }

        [part="label"] {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.25;
        }

        [part~="description"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.5;
          max-width: 34ch;
        }
      </style>
      <label part="zone" data-dragging="${String(this.dragging)}">
        <input type="file" part="input" multiple />
        <strong part="label">${escapeHtml(this.label)}</strong>
        <span part="description message">${escapeHtml(this.message)}</span>
      </label>
    `;

    const zone = this.shadowRoot.querySelector('[part="zone"]') as HTMLLabelElement | null;
    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;

    zone?.addEventListener("dragenter", event => {
      event.preventDefault();
      this.dragging = true;
      this.render();
    });
    zone?.addEventListener("dragover", event => {
      event.preventDefault();
    });
    zone?.addEventListener("dragleave", event => {
      event.preventDefault();
      if (event.target === zone) {
        this.dragging = false;
        this.render();
      }
    });
    zone?.addEventListener("drop", event => {
      event.preventDefault();
      this.dragging = false;
      const files = Array.from(event.dataTransfer?.files ?? []);
      this.dispatchEvent(
        new CustomEvent("files-selected", {
          bubbles: true,
          composed: true,
          detail: { files },
        }),
      );
      this.render();
    });
    input?.addEventListener("change", () => {
      const files = Array.from(input.files ?? []);
      this.dispatchEvent(
        new CustomEvent("files-selected", {
          bubbles: true,
          composed: true,
          detail: { files },
        }),
      );
    });
  }
}

export const defineBoxDropZoneElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDropZoneElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDropZoneElement;
  }

  customElements.define(tagName, BoxDropZoneElement);
  return BoxDropZoneElement;
};
