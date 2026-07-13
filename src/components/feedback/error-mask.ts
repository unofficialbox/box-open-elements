const DEFAULT_TAG_NAME = "box-error-mask";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * A full-section error state that masks a region that failed to load — distinct
 * from `box-empty-state` (a "nothing here yet" affordance). It announces
 * assertively via `role="alert"` and offers an optional retry action that emits
 * a `retry` event; the host owns the actual reload.
 */
export class BoxErrorMaskElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["action-label", "description", "heading", "message", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get heading(): string {
    return this.getAttribute("heading") ?? this.getAttribute("title") ?? "Something went wrong";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get title(): string {
    return this.getAttribute("title") ?? this.getAttribute("heading") ?? "Something went wrong";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? this.description;
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

  get actionLabel(): string {
    return this.getAttribute("action-label") ?? "";
  }

  set actionLabel(value: string) {
    this.setAttribute("action-label", value);
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

    const message = this.message;
    const messageMarkup = message ? `<span part="message description">${escapeHtml(message)}</span>` : "";
    const actionMarkup = this.actionLabel
      ? `<button type="button" part="action">${escapeHtml(this.actionLabel)}</button>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="error-mask"] {
          display: grid;
          justify-items: center;
          gap: 0.55rem;
          padding: 2rem 1.5rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke-danger, #f0b7b2) 82%, transparent);
          border-radius: 0.95rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-danger, #fdecea) 60%, white 40%);
          text-align: center;
        }

        [part="icon"] {
          display: grid;
          place-items: center;
          inline-size: 2.75rem;
          block-size: 2.75rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-danger, #fdecea) 55%, white 45%);
          color: var(--boe-token-text-text-danger, #b3261e);
        }

        [part="icon"] svg {
          inline-size: 1.5rem;
          block-size: 1.5rem;
        }

        [part="title"] {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #101820);
        }

        [part~="message"] {
          max-width: 32rem;
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.5;
        }

        [part="action"] {
          appearance: none;
          margin-top: 0.4rem;
          border: 1px solid transparent;
          border-radius: 999px;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font: inherit;
          font-weight: 600;
          padding: 0.58rem 1.05rem;
          cursor: pointer;
          transition: background 140ms ease, transform 140ms ease;
        }

        [part="action"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, black 12%);
        }

        [part="action"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <section part="error-mask" role="alert" aria-live="assertive">
        <span part="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </span>
        <strong part="title">${escapeHtml(this.heading)}</strong>
        ${messageMarkup}
        ${actionMarkup}
      </section>
    `;

    this.shadowRoot.querySelector('[part="action"]')?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("retry", {
          bubbles: true,
          composed: true,
          detail: { label: this.actionLabel },
        }),
      );
    });
  }
}

export const defineBoxErrorMaskElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxErrorMaskElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxErrorMaskElement;
  }

  customElements.define(tagName, BoxErrorMaskElement);
  return BoxErrorMaskElement;
};
