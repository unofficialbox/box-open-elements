import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-link-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * Reject dangerous URL schemes (javascript:, data:, vbscript:) before the href
 * reaches the DOM. `escapeHtml` prevents attribute breakout but does NOT stop a
 * scheme from executing on click, so navigable URLs must be scheme-validated.
 * Relative URLs, fragments, and query strings have no scheme and are allowed.
 */
const safeHref = (value: string): string => {
  // Strip tab/newline/CR first: browsers ignore them in URLs, so "java\nscript:"
  // normalizes back to the javascript: scheme on navigation and must not slip past.
  const trimmed = value.replace(/[\t\n\r]/g, "").trim();
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed);
  if (!scheme) return trimmed; // relative / fragment / query — no scheme to abuse
  return ["http", "https", "mailto", "tel"].includes(scheme[1].toLowerCase()) ? trimmed : "#";
};

const linkButtonStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="link"] {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    font: inherit;
    font-weight: 600;
    line-height: 1.2;
    padding: 0.35em 0.6em;
    margin: -0.35em -0.6em;
    border-radius: ${boeRadius.control};
    color: var(--boe-token-surface-surface-brand, #0061d5);
    text-decoration: none;
    text-underline-offset: 0.2em;
    cursor: pointer;
    transition:
      background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="link"]:hover {
    text-decoration: underline;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, transparent);
    color: var(--boe-token-surface-surface-brand-hover, #006ae9);
  }

  [part="link"]:active {
    color: var(--boe-token-surface-surface-brand-pressed, #004eac);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
  }

  [part="link"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="link"][data-tone="neutral"] {
    color: var(--boe-token-text-text, #222222);
  }

  [part="link"][data-tone="neutral"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
  }

  [part="link"][data-tone="danger"] {
    color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  [part="link"][data-tone="danger"]:hover {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 8%, transparent);
    color: var(--boe-token-surface-status-surface-error, #ed3757);
  }
`;

export class BoxLinkButtonElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["href", "label", "tone", "target", "rel"];
  }

  private linkEl!: HTMLAnchorElement;
  private labelEl!: HTMLElement;
  private contentSlot!: HTMLSlotElement;

  /** Anchor target (e.g. `_blank`). Opening a new tab auto-adds a safe rel. */
  get target(): string {
    return this.getAttribute("target") ?? "";
  }

  set target(value: string) {
    this.setAttribute("target", value);
  }

  /** Explicit rel; defaults to `noopener noreferrer` when target is `_blank`. */
  get rel(): string {
    return this.getAttribute("rel") ?? "";
  }

  set rel(value: string) {
    this.setAttribute("rel", value);
  }

  get href(): string {
    return this.getAttribute("href") ?? "#";
  }

  set href(value: string) {
    this.setAttribute("href", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Learn more";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "primary";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${linkButtonStyles}</style>
      <a part="link"><slot><span part="label"></span></slot></a>
    `;
    this.linkEl = this.shadowRoot.querySelector('[part="link"]')!;
    this.contentSlot = this.shadowRoot.querySelector("slot")!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
  }

  protected setupListeners(): void {
    this.contentSlot.addEventListener("slotchange", () => {
      if (this.isRendered) {
        this.update();
      }
    });
  }

  protected update(): void {
    if (!this.linkEl) {
      return;
    }

    this.linkEl.dataset.tone = this.tone;
    this.linkEl.setAttribute("href", escapeHtml(safeHref(this.href)));

    // Rich children (slotted) replace the `label` text; keep the fallback in
    // sync. Detect real host content only — assignedNodes() without flatten
    // excludes the fallback span; ignore whitespace-only text nodes.
    const hasSlotted = this.contentSlot
      .assignedNodes()
      .some(node => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? "").trim() !== "");
    this.labelEl.textContent = this.label;
    if (hasSlotted) {
      this.linkEl.removeAttribute("aria-label");
    } else {
      this.linkEl.setAttribute("aria-label", this.label);
    }

    const target = this.target;
    if (target) {
      this.linkEl.setAttribute("target", target);
    } else {
      this.linkEl.removeAttribute("target");
    }

    // Explicit rel wins; opening a new tab defaults to a safe rel.
    const rel = this.rel || (target === "_blank" ? "noopener noreferrer" : "");
    if (rel) {
      this.linkEl.setAttribute("rel", rel);
    } else {
      this.linkEl.removeAttribute("rel");
    }
  }
}

export const defineBoxLinkButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxLinkButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxLinkButtonElement;
  }

  customElements.define(tagName, BoxLinkButtonElement);
  return BoxLinkButtonElement;
};
