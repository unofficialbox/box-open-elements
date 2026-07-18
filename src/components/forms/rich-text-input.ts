import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../foundations/a11y/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

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

/** Tags produced by the toolbar / common rich-text formatting. Everything else is unwrapped or dropped. */
const ALLOWED_RICH_TEXT_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "p",
  "br",
  "div",
  "span",
]);

const DROP_RICH_TEXT_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "img",
  "svg",
  "math",
  "video",
  "audio",
  "source",
  "track",
]);

const sanitizeRichTextHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const sanitizeNode = (node: Node): void => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tag = element.tagName.toLowerCase();

        if (DROP_RICH_TEXT_TAGS.has(tag)) {
          element.remove();
          continue;
        }

        sanitizeNode(element);

        if (!ALLOWED_RICH_TEXT_TAGS.has(tag)) {
          while (element.firstChild) {
            element.parentNode?.insertBefore(element.firstChild, element);
          }
          element.remove();
          continue;
        }

        // Allowlist: keep the tag, drop every attribute (no href/src/on* vectors).
        for (const attr of Array.from(element.attributes)) {
          element.removeAttribute(attr.name);
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  };

  sanitizeNode(doc.body);
  return doc.body.innerHTML;
};

const richTextStyles = `
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
    margin: 0 0 0.55rem;
    padding: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [part="surface"] {
    display: grid;
    gap: 0.45rem;
    padding: 0.5rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface-secondary, #fbfbfb);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.04);
  }

  [part="toolbar"] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.2rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-stroke-stroke, #e8e8e8) 92%);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
  }

  [part="tool-button"] {
    min-inline-size: 2rem;
    block-size: 2rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 74%, transparent);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    color: inherit;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      transform ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="tool-button"]:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 72%, var(--boe-token-surface-surface, #ffffff) 28%);
  }

  [part="editor"] {
    min-block-size: 8.5rem;
    padding: 0.5rem 0.55rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    line-height: 1.5;
    outline: none;
    overflow: auto;
    white-space: normal;
  }

  [part="editor"]:empty::before {
    content: attr(data-placeholder);
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  [part="editor"]:focus-visible,
  [part="tool-button"]:focus-visible {
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
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

  ${boeFormFieldErrorStyles}
`;

export class BoxRichTextInputElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "placeholder",
      "value",
    ];
  }

  private editor!: HTMLDivElement;
  private labelElement!: HTMLLegendElement;
  private toolbarEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private toolbarButtons: HTMLButtonElement[] = [];
  private valueInternal = "";

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
    this.valueInternal = sanitizeRichTextHtml(value);
    this.setAttribute("value", this.valueInternal);
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = sanitizeRichTextHtml(newValue ?? "");
      this.syncFormAssociation();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return this.valueInternal;
  }

  protected restoreFormValue(value: FormValue): void {
    const next = typeof value === "string" ? sanitizeRichTextHtml(value) : "";
    this.valueInternal = next;
    this.setAttribute("value", next);
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
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
    const cleaned = sanitizeRichTextHtml(this.editor.innerHTML);
    if (cleaned !== this.editor.innerHTML) {
      this.editor.innerHTML = cleaned;
    }
    this.valueInternal = cleaned;
    this.setAttribute("value", this.valueInternal);
    this.syncFormAssociation();
    this.emitValueChanged();
  };

  private insertSanitizedHtml(html: string, plainTextFallback: string): void {
    const plainTextHtml = sanitizeRichTextHtml(
      escapeHtml(plainTextFallback).replaceAll("\n", "<br>"),
    );
    const cleaned = html ? sanitizeRichTextHtml(html) : plainTextHtml;
    const payload = cleaned || plainTextHtml;
    this.editor.focus();
    const inserted = document.execCommand?.("insertHTML", false, payload) ?? false;
    if (!inserted) {
      // jsdom and other hosts may stub execCommand; append the sanitized payload directly.
      this.editor.innerHTML = sanitizeRichTextHtml(`${this.editor.innerHTML}${payload}`);
    }
    this.handleEditorInput();
  }

  private handlePaste = (event: ClipboardEvent): void => {
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    const html = event.clipboardData?.getData("text/html") ?? "";
    const text = event.clipboardData?.getData("text/plain") ?? "";
    this.insertSanitizedHtml(html, text);
  };

  private handleDrop = (event: DragEvent): void => {
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    const html = event.dataTransfer?.getData("text/html") ?? "";
    const text = event.dataTransfer?.getData("text/plain") ?? "";
    this.insertSanitizedHtml(html, text);
  };

  private applyCommand(command: ToolbarAction["command"]): void {
    if (this.disabled) {
      return;
    }

    this.editor.focus();
    document.execCommand?.(command, false);
    this.handleEditorInput();
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${richTextStyles}</style>
      <fieldset part="field">
        <legend part="label"></legend>
        <div part="surface">
          <div part="toolbar" role="toolbar">
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
          ></div>
        </div>
        ${formErrorMessageMarkup()}
      </fieldset>
    `;

    this.labelElement = this.shadowRoot.querySelector('[part="label"]')!;
    this.editor = this.shadowRoot.querySelector('[part="editor"]')!;
    this.toolbarEl = this.shadowRoot.querySelector('[part="toolbar"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
    this.toolbarButtons = Array.from(
      this.shadowRoot.querySelectorAll('[part="tool-button"]'),
    ) as HTMLButtonElement[];
  }

  protected setupListeners(): void {
    this.editor.addEventListener("input", this.handleEditorInput);
    this.editor.addEventListener("paste", this.handlePaste);
    this.editor.addEventListener("drop", this.handleDrop);
    this.toolbarButtons.forEach(button => {
      button.addEventListener("click", () => {
        const command = button.dataset.command as ToolbarAction["command"] | undefined;
        if (command) {
          this.applyCommand(command);
        }
      });
    });
    this.toolbarEl.addEventListener("keydown", event => {
      handleRovingKeydown(event as KeyboardEvent, this.toolbarButtons, {
        orientation: "horizontal",
      });
    });
  }

  protected update(): void {
    if (!this.editor || !this.labelElement || !this.errorEl) {
      return;
    }

    this.labelElement.textContent = this.label;
    this.toolbarEl.setAttribute("aria-label", `${this.label} formatting toolbar`);
    this.editor.setAttribute("aria-label", this.label);
    this.editor.setAttribute("data-placeholder", this.placeholder);
    this.editor.contentEditable = this.disabled ? "false" : "true";
    this.editor.setAttribute("aria-disabled", String(this.disabled));

    this.toolbarButtons.forEach(button => {
      button.disabled = this.disabled;
    });
    applyRovingTabindex(this.toolbarButtons, 0);

    // Only patch editor HTML when not focused to avoid cursor-jump
    if (this.shadowRoot?.activeElement !== this.editor && this.editor.innerHTML !== this.valueInternal) {
      this.editor.innerHTML = sanitizeRichTextHtml(this.valueInternal);
    }

    this.applyInvalidState(this.editor, this.errorEl);
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
