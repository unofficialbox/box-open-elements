import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formDataFromNamedValues,
  formErrorMessageMarkup,
  stringValuesFromFormValue,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-tag-input";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const parseList = (value: string): string[] =>
  value
    .split(",")
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);

const tagInputStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: grid;
    gap: 0.45rem;
  }

  [part="label"] {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="control"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.7rem;
    background: var(--boe-token-surface-surface, #ffffff);
    transition: border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="control"]:focus-within {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="control"][data-disabled="true"] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  [part="tag"] {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.3rem 0.2rem 0.55rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #222222));
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  [part="tag-remove"] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.05rem;
    block-size: 1.05rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="tag-remove"] svg {
    inline-size: 0.65rem;
    block-size: 0.65rem;
  }

  [part="tag-remove"]:hover:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
  }

  [part="tag-remove"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 32%, transparent);
  }

  [part="tag-remove"]:disabled {
    cursor: not-allowed;
  }

  [part="input"] {
    appearance: none;
    flex: 1 1 6rem;
    min-inline-size: 4rem;
    border: none;
    background: transparent;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    padding: 0.25rem 0;
  }

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  [part="input"]:focus {
    outline: none;
  }

  [part="input"]:disabled {
    cursor: not-allowed;
  }

  [part="hint"] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  ${boeFormFieldErrorStyles}
`;

/**
 * A token/tag entry field: type a value and commit it with Enter or comma to add
 * a removable chip; Backspace on an empty field removes the last tag. Tags are
 * available as the `tags` array property and mirrored to the `value` attribute
 * as a comma-separated list.
 */
export class BoxTagInputElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "max",
      "placeholder",
      "value",
    ];
  }

  private tagsInternal: string[] = [];
  private draft = "";
  private lastTagsJson = "";
  private labelEl!: HTMLElement;
  private controlEl!: HTMLElement;
  private tagsEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private errorEl!: HTMLElement;

  get tags(): string[] {
    return [...this.tagsInternal];
  }

  set tags(next: string[]) {
    this.tagsInternal = this.dedupe(next);
    this.reflectValue();
    if (this.isRendered) {
      this.update();
    }
  }

  get value(): string {
    return this.tagsInternal.join(", ");
  }

  set value(next: string) {
    this.tagsInternal = this.dedupe(parseList(next));
    this.reflectValue();
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Tags";
  }

  set label(next: string) {
    this.setAttribute("label", next);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Add a tag";
  }

  set placeholder(next: string) {
    this.setAttribute("placeholder", next);
  }

  get max(): number {
    const raw = Number(this.getAttribute("max"));
    return Number.isFinite(raw) && raw > 0 ? raw : Infinity;
  }

  set max(next: number) {
    this.setAttribute("max", String(next));
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(next: boolean) {
    this.toggleAttribute("disabled", next);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "value" && newValue !== null && newValue !== this.value) {
      this.tagsInternal = this.dedupe(parseList(newValue));
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return formDataFromNamedValues(this.name, this.tagsInternal);
  }

  protected restoreFormValue(value: FormValue): void {
    const next = stringValuesFromFormValue(value, this.name);
    this.tagsInternal = this.dedupe(next);
    this.reflectValue();
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  private dedupe(list: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const entry of list) {
      const trimmed = entry.trim();
      const key = trimmed.toLowerCase();
      if (trimmed && !seen.has(key)) {
        seen.add(key);
        result.push(trimmed);
      }
    }
    return result;
  }

  private reflectValue(): void {
    const serialized = this.tagsInternal.join(", ");
    if (this.getAttribute("value") !== serialized) {
      this.setAttribute("value", serialized);
    }
    this.syncFormAssociation();
  }

  addTag(rawTag: string): boolean {
    const tag = rawTag.trim();
    if (this.disabled || !tag) {
      return false;
    }
    if (this.tagsInternal.length >= this.max) {
      return false;
    }
    if (this.tagsInternal.some(existing => existing.toLowerCase() === tag.toLowerCase())) {
      return false;
    }
    this.tagsInternal = [...this.tagsInternal, tag];
    this.reflectValue();
    this.emit("tag-added", { tag });
    this.emit("tags-changed", { tags: this.tags });
    return true;
  }

  removeTag(tag: string): boolean {
    if (this.disabled) {
      return false;
    }
    const index = this.tagsInternal.findIndex(existing => existing === tag);
    if (index === -1) {
      return false;
    }
    this.tagsInternal = this.tagsInternal.filter((_, i) => i !== index);
    this.reflectValue();
    this.emit("tag-removed", { tag });
    this.emit("tags-changed", { tags: this.tags });
    return true;
  }

  private emit(type: string, detail: Record<string, unknown>): void {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
  }

  // Clear the draft *before* addTag: it re-renders synchronously and the fresh
  // <input> is seeded from this.draft, so a stale value would linger. Restore the
  // draft if the tag was rejected so the user doesn't lose what they typed.
  private commitDraft(candidate: string): boolean {
    if (!candidate.trim()) {
      return false;
    }
    this.draft = "";
    if (this.addTag(candidate)) {
      return true;
    }
    this.draft = candidate;
    if (this.isRendered) {
      this.update();
    }
    return false;
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (this.commitDraft(this.inputEl.value)) {
        this.restoreFocus();
      }
      return;
    }
    if (event.key === "Backspace" && this.inputEl.value.length === 0 && this.tagsInternal.length > 0) {
      event.preventDefault();
      this.removeTag(this.tagsInternal[this.tagsInternal.length - 1]);
      this.restoreFocus();
    }
  }

  private restoreFocus(): void {
    this.inputEl?.focus();
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    if (!this.tagsInternal.length && this.hasAttribute("value")) {
      this.tagsInternal = this.dedupe(parseList(this.getAttribute("value") ?? ""));
    }

    this.shadowRoot.innerHTML = `
      <style>${tagInputStyles}</style>
      <div part="field">
        <span part="label" id="tag-input-label"></span>
        <div part="control">
          <span part="tags" role="list" aria-label="Selected tags"></span>
          <input
            part="input"
            type="text"
            aria-labelledby="tag-input-label"
            aria-describedby="tag-input-hint"
          />
        </div>
        <span part="hint" id="tag-input-hint">Press Enter or comma to add a tag; Backspace removes the last tag.</span>
        ${formErrorMessageMarkup()}
      </div>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.controlEl = this.shadowRoot.querySelector('[part="control"]')!;
    this.tagsEl = this.shadowRoot.querySelector('[part="tags"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      this.draft = (event.currentTarget as HTMLInputElement).value;
    });
    this.inputEl.addEventListener("keydown", event => this.handleKeydown(event));
    this.inputEl.addEventListener("blur", () => {
      this.commitDraft(this.draft);
    });
    this.tagsEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest(
        '[part="tag-remove"]',
      ) as HTMLButtonElement | null;
      if (!button || !this.tagsEl.contains(button)) {
        return;
      }
      this.removeTag(button.dataset.tag ?? "");
      this.restoreFocus();
    });
  }

  protected update(): void {
    if (!this.labelEl || !this.controlEl || !this.tagsEl || !this.inputEl || !this.errorEl) {
      return;
    }

    const atMax = this.tagsInternal.length >= this.max;
    this.labelEl.textContent = this.label;
    this.controlEl.dataset.disabled = this.disabled ? "true" : "false";

    const tagsJson = JSON.stringify(this.tagsInternal);
    if (tagsJson !== this.lastTagsJson) {
      this.tagsEl.innerHTML = this.tagsInternal
        .map(
          tag => `
          <span part="tag" role="listitem">
            <span part="tag-label">${escapeHtml(tag)}</span>
            <button
              type="button"
              part="tag-remove"
              data-tag="${escapeHtml(tag)}"
              aria-label="Remove ${escapeHtml(tag)}"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </span>`,
        )
        .join("");
      this.lastTagsJson = tagsJson;
    }

    this.tagsEl.querySelectorAll('[part="tag-remove"]').forEach(node => {
      const button = node as HTMLButtonElement;
      if (this.disabled) {
        button.setAttribute("disabled", "");
      } else {
        button.removeAttribute("disabled");
      }
    });

    this.inputEl.placeholder = atMax ? "" : this.placeholder;
    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.draft;
    }

    if (this.disabled || atMax) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxTagInputElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTagInputElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTagInputElement;
  }

  customElements.define(tagName, BoxTagInputElement);
  return BoxTagInputElement;
};
