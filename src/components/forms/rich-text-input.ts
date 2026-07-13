const DEFAULT_TAG_NAME = "box-rich-text-input";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type ToolbarAction = {
  command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList";
  label: string;
  text: string;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { command: "bold", label: "Bold", text: "B" },
  { command: "italic", label: "Italic", text: "I" },
  { command: "insertUnorderedList", label: "Bulleted list", text: "•" },
  { command: "insertOrderedList", label: "Numbered list", text: "1." },
];

export class BoxRichTextInputElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "placeholder", "value"];
  }

  private editor: HTMLDivElement | null = null;
  private labelElement: HTMLLegendElement | null = null;
  private toolbarButtons: HTMLButtonElement[] = [];
  private valueInternal = "";

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

  get label(): string {
    return this.getAttribute("label") ?? "Rich Text";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Start writing...";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(value: string) {
    this.valueInternal = value;
    this.setAttribute("value", value);
    this.syncValue();
  }

  connectedCallback(): void {
    this.render();
    this.syncState();
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = newValue ?? "";
      this.syncValue();
      return;
    }

    this.syncState();
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

  private handleEditorInput = (): void => {
    if (!this.editor) {
      return;
    }

    this.valueInternal = this.editor.innerHTML;
    this.setAttribute("value", this.valueInternal);
    this.emitValueChanged();
  };

  private applyCommand(command: ToolbarAction["command"]): void {
    if (this.disabled || !this.editor) {
      return;
    }

    this.editor.focus();
    document.execCommand?.(command, false);
    this.handleEditorInput();
  }

  private syncValue(): void {
    if (!this.editor) {
      return;
    }

    if (this.editor.innerHTML !== this.valueInternal) {
      this.editor.innerHTML = this.valueInternal;
    }
  }

  private syncState(): void {
    if (this.labelElement) {
      this.labelElement.textContent = this.label;
    }

    if (this.editor) {
      this.editor.setAttribute("aria-label", this.label);
      this.editor.setAttribute("data-placeholder", this.placeholder);
      this.editor.contentEditable = this.disabled ? "false" : "true";
      this.editor.setAttribute("aria-disabled", String(this.disabled));
    }

    this.toolbarButtons.forEach(button => {
      button.disabled = this.disabled;
    });
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

        [part="field"] {
          margin: 0;
          padding: 0;
          border: none;
          min-inline-size: 0;
        }

        [part="label"] {
          margin: 0 0 0.9rem;
          padding: 0;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        [part="surface"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1.05rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 90%, white 10%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface, #ffffff) 82%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%) 100%
            );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 14px 28px rgba(15, 23, 42, 0.04);
        }

        [part="toolbar"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          padding: 0.25rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-stroke-stroke, #e8e8e8) 92%);
          border-radius: 1rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, white 6%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
            );
        }

        [part="tool-button"] {
          min-inline-size: 2.6rem;
          block-size: 2.6rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 74%, transparent);
          border-radius: 0.9rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, white 8%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
            );
          color: inherit;
          font: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            transform 140ms ease;
        }

        [part="tool-button"]:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 72%, white 28%);
        }

        [part="editor"] {
          min-block-size: 12rem;
          padding: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 0.95rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 97%, white 3%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 2%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%, var(--boe-token-surface-surface, #ffffff) 90%) 100%
            );
          line-height: 1.6;
          outline: none;
          overflow: auto;
          white-space: normal;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
        }

        [part="editor"]:empty::before {
          content: attr(data-placeholder);
          color: var(--boe-token-text-text-placeholder, #909090);
        }

        [part="editor"]:focus-visible,
        [part="tool-button"]:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        [part="editor"][aria-disabled="true"],
        [part="tool-button"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        [part="editor"] p:first-child,
        [part="editor"] ul:first-child,
        [part="editor"] ol:first-child {
          margin-top: 0;
        }

        [part="editor"] p:last-child,
        [part="editor"] ul:last-child,
        [part="editor"] ol:last-child {
          margin-bottom: 0;
        }
      </style>
      <fieldset part="field">
        <legend part="label">${escapeHtml(this.label)}</legend>
        <div part="surface">
          <div part="toolbar" role="toolbar" aria-label="${escapeHtml(this.label)} formatting toolbar">
            ${TOOLBAR_ACTIONS.map(
              action => `
                <button
                  type="button"
                  part="tool-button"
                  data-command="${action.command}"
                  aria-label="${escapeHtml(action.label)}"
                  title="${escapeHtml(action.label)}"
                >
                  ${escapeHtml(action.text)}
                </button>
              `,
            ).join("")}
          </div>
          <div
            part="editor"
            role="textbox"
            aria-multiline="true"
            aria-label="${escapeHtml(this.label)}"
            data-placeholder="${escapeHtml(this.placeholder)}"
          ></div>
        </div>
      </fieldset>
    `;

    this.labelElement = this.shadowRoot.querySelector('[part="label"]');
    this.editor = this.shadowRoot.querySelector('[part="editor"]');
    this.toolbarButtons = Array.from(
      this.shadowRoot.querySelectorAll('[part="tool-button"]'),
    ) as HTMLButtonElement[];

    this.editor?.addEventListener("input", this.handleEditorInput);
    this.toolbarButtons.forEach(button => {
      button.addEventListener("click", () => {
        const command = button.dataset.command as ToolbarAction["command"] | undefined;
        if (command) {
          this.applyCommand(command);
        }
      });
    });

    this.syncValue();
  }
}

export const defineBoxRichTextInputElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxRichTextInputElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxRichTextInputElement;
  }

  customElements.define(tagName, BoxRichTextInputElement);
  return BoxRichTextInputElement;
};
