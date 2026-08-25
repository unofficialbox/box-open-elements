import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-code-block";

const COPY_ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" focusable="false"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-1a1 1 0 00-1-1h-7a1 1 0 00-1 1v7a1 1 0 001 1h1"/></svg>`;
const COPIED_ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M3 8.5l3.2 3.2L13 5"/></svg>`;

/** How long the button stays in its confirmed state. */
const COPIED_RESET_MS = 1600;

const codeStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  [part="block"] {
    position: relative;
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
  }

  [part="pre"] {
    margin: 0;
    padding: 0.85rem 3rem 0.85rem 0.95rem;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 0.82rem;
    line-height: 1.55;
    /* Code is read as written: wrapping a long line silently changes what the
       reader believes the source says, so it scrolls instead. The container is
       what scrolls, never the page. */
    white-space: pre;
    tab-size: 2;
  }

  /* Opt-in wrapping for prose-like content — a long URL or a shell command that
     has no meaningful column structure. */
  :host([wrap]) [part="pre"] {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  :host([inline]) {
    display: inline-block;
  }

  :host([inline]) [part="pre"] {
    padding: 0.1rem 0.4rem;
  }

  :host([inline]) [part="copy"] {
    display: none;
  }

  [part="copy"] {
    appearance: none;
    position: absolute;
    inset-block-start: 0.45rem;
    inset-inline-end: 0.45rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    padding: 0.35rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
  }

  [part="copy"] svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  [part="copy"]:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="copy"][data-copied="true"] {
    color: var(--boe-token-surface-status-surface-success, #26c281);
  }

  ${boeFocusVisibleStyles('[part="copy"]')}
`;

/**
 * A block of code, rendered as written.
 *
 * ```html
 * <box-code-block code="npm i @unofficialbox/box-open-elements"></box-code-block>
 * ```
 *
 * The code is set as `textContent`, never as markup — a snippet is the most
 * likely string on any page to contain angle brackets, and rendering it as HTML
 * would both corrupt what the reader sees and hand an injection point to
 * whatever produced the snippet.
 *
 * There is no syntax highlighting, deliberately. Doing it properly means
 * shipping a grammar per language, and doing it improperly means mis-colouring
 * code that a reader is trying to trust. A host that needs highlighting can
 * slot pre-rendered markup into the default slot instead.
 *
 * Long lines scroll rather than wrap: a wrapped line silently changes what the
 * reader believes the source says. `wrap` opts into wrapping where the content
 * has no meaningful column structure.
 */
export class CodeBlock extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["code", "copy-label", "language"];
  }

  private preEl!: HTMLElement;
  private codeEl!: HTMLElement;
  private copyEl!: HTMLButtonElement;
  private slotEl!: HTMLSlotElement;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  /** The source to render. */
  get code(): string {
    return this.getAttribute("code") ?? "";
  }

  set code(value: string) {
    this.setAttribute("code", value);
  }

  /**
   * The language, surfaced as a `data-language` hook and in the code element's
   * class the way `highlight.js` and friends expect. Nothing here reads it.
   */
  get language(): string {
    return this.getAttribute("language") ?? "";
  }

  set language(value: string) {
    this.setAttribute("language", value);
  }

  /** Accessible name for the copy button. */
  get copyLabel(): string {
    return this.getAttribute("copy-label") ?? "Copy code";
  }

  set copyLabel(value: string) {
    this.setAttribute("copy-label", value);
  }

  private async copy(): Promise<void> {
    const text = this.code || this.textContent?.trim() || "";
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.markCopied(true);
    } catch {
      // Clipboard access is refused in plenty of ordinary situations — an
      // insecure origin, a denied permission, a browser that gates it behind a
      // user gesture it did not see. The button reports failure by simply not
      // confirming, rather than throwing into the host's console.
      this.markCopied(false);
    }
  }

  private markCopied(copied: boolean): void {
    this.copyEl.dataset.copied = copied ? "true" : "false";
    this.copyEl.innerHTML = copied ? COPIED_ICON : COPY_ICON;
    this.dispatchEvent(
      new CustomEvent("code-copied", { bubbles: true, composed: true, detail: { copied } }),
    );

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    if (copied) {
      this.resetTimer = setTimeout(() => {
        this.copyEl.dataset.copied = "false";
        this.copyEl.innerHTML = COPY_ICON;
        this.resetTimer = null;
      }, COPIED_RESET_MS);
    }
  }

  disconnectedCallback(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>${codeStyles}</style>
      <div part="block">
        <pre part="pre"><code part="code"><slot></slot></code></pre>
        <button type="button" part="copy" data-copied="false"></button>
      </div>
    `;
    this.preEl = this.shadowRoot.querySelector('[part="pre"]')!;
    this.codeEl = this.shadowRoot.querySelector('[part="code"]')!;
    this.copyEl = this.shadowRoot.querySelector('[part="copy"]')!;
    this.slotEl = this.shadowRoot.querySelector("slot")!;
    this.copyEl.innerHTML = COPY_ICON;
  }

  protected setupListeners(): void {
    this.copyEl.addEventListener("click", () => {
      void this.copy();
    });
  }

  protected update(): void {
    if (!this.preEl) {
      return;
    }

    const code = this.code;
    if (code) {
      // textContent, never innerHTML: a snippet is the string most likely on
      // any page to contain angle brackets.
      this.slotEl.textContent = code;
    } else {
      this.slotEl.textContent = "";
    }

    const language = this.language;
    if (language) {
      this.codeEl.setAttribute("data-language", language);
      this.codeEl.setAttribute("class", `language-${language}`);
    } else {
      this.codeEl.removeAttribute("data-language");
      this.codeEl.removeAttribute("class");
    }

    this.copyEl.setAttribute("aria-label", this.copyLabel);
    this.copyEl.title = this.copyLabel;
  }
}

CodeBlock.register();
