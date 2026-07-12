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

/**
 * A token/tag entry field: type a value and commit it with Enter or comma to add
 * a removable chip; Backspace on an empty field removes the last tag. Tags are
 * available as the `tags` array property and mirrored to the `value` attribute
 * as a comma-separated list.
 */
export class BoxTagInputElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "placeholder", "value"];
  }

  private tagsInternal: string[] = [];
  private draft = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get tags(): string[] {
    return [...this.tagsInternal];
  }

  set tags(next: string[]) {
    this.tagsInternal = this.dedupe(next);
    this.reflectValue();
    this.render();
  }

  get value(): string {
    return this.tagsInternal.join(", ");
  }

  set value(next: string) {
    this.tagsInternal = this.dedupe(parseList(next));
    this.reflectValue();
    this.render();
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

  connectedCallback(): void {
    if (!this.tagsInternal.length && this.hasAttribute("value")) {
      this.tagsInternal = this.dedupe(parseList(this.getAttribute("value") ?? ""));
    }
    this.render();
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
    if (name === "value" && next !== null && next !== this.value) {
      this.tagsInternal = this.dedupe(parseList(next));
    }
    this.render();
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
    // reflectValue() mutates the `value` attribute, which drives a render via
    // attributeChangedCallback — no explicit render() needed here.
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
    // reflectValue() drives the render through attributeChangedCallback.
    this.reflectValue();
    this.emit("tag-removed", { tag });
    this.emit("tags-changed", { tags: this.tags });
    return true;
  }

  private emit(type: string, detail: Record<string, unknown>): void {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const atMax = this.tagsInternal.length >= this.max;
    const chips = this.tagsInternal
      .map(
        tag => `
        <span part="tag" role="listitem">
          <span part="tag-label">${escapeHtml(tag)}</span>
          <button
            type="button"
            part="tag-remove"
            data-tag="${escapeHtml(tag)}"
            aria-label="Remove ${escapeHtml(tag)}"
            ${this.disabled ? "disabled" : ""}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </span>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
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
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="control"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.5rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
          border-radius: 0.7rem;
          background:
            linear-gradient(
              180deg,
              var(--boe-token-surface-surface, #ffffff) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #f7f9fc) 12%) 100%
            );
          transition: border-color 140ms ease, box-shadow 140ms ease;
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
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, white 90%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #101820));
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
          transition: background 140ms ease;
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
          color: var(--boe-token-text-text, #101820);
          padding: 0.25rem 0;
        }

        [part="input"]::placeholder {
          color: var(--boe-token-text-text-placeholder, #748091);
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
      </style>
      <div part="field">
        <span part="label" id="tag-input-label">${escapeHtml(this.label)}</span>
        <div part="control" data-disabled="${this.disabled ? "true" : "false"}">
          <span part="tags" role="list" aria-label="Selected tags">${chips}</span>
          <input
            part="input"
            type="text"
            value="${escapeHtml(this.draft)}"
            placeholder="${atMax ? "" : escapeHtml(this.placeholder)}"
            aria-labelledby="tag-input-label"
            aria-describedby="tag-input-hint"
            ${this.disabled || atMax ? "disabled" : ""}
          />
        </div>
        <span part="hint" id="tag-input-hint">Press Enter or comma to add a tag; Backspace removes the last tag.</span>
      </div>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    if (input) {
      input.addEventListener("input", event => {
        this.draft = (event.currentTarget as HTMLInputElement).value;
      });
      input.addEventListener("keydown", event => this.handleKeydown(event, input));
      input.addEventListener("blur", () => {
        this.commitDraft(this.draft);
      });
    }

    for (const button of Array.from(this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="tag-remove"]'))) {
      button.addEventListener("click", () => this.removeTag(button.dataset.tag ?? ""));
    }
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
    return false;
  }

  private handleKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (this.commitDraft(input.value)) {
        this.restoreFocus();
      }
      return;
    }
    if (event.key === "Backspace" && input.value.length === 0 && this.tagsInternal.length > 0) {
      event.preventDefault();
      this.removeTag(this.tagsInternal[this.tagsInternal.length - 1]);
      this.restoreFocus();
    }
  }

  private restoreFocus(): void {
    const input = this.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();
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
