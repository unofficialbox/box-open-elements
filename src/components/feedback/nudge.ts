const DEFAULT_TAG_NAME = "box-nudge";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * A compact inline nudge — a lightweight hint or promotion pointing at a nearby
 * feature, smaller than `box-alert`. It carries an optional primary action
 * (emits `action`) and can be dismissed (emits `dismiss` and hides). Announced
 * politely via `role="status"`; the host decides what the action does.
 */
export class BoxNudgeElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["action-label", "heading", "message", "open", "title"];
  }

  private openValue = true;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextValue = Boolean(value);
    if (this.openValue === nextValue) {
      return;
    }

    this.openValue = nextValue;
    if (nextValue) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
    this.render();
  }

  get heading(): string {
    return this.getAttribute("heading") ?? this.getAttribute("title") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get title(): string {
    return this.getAttribute("title") ?? this.getAttribute("heading") ?? "";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get actionLabel(): string {
    return this.getAttribute("action-label") ?? "";
  }

  set actionLabel(value: string) {
    this.setAttribute("action-label", value);
  }

  connectedCallback(): void {
    this.openValue = !this.hasAttribute("open") ? true : this.hasAttribute("open");
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }

    this.render();
  }

  dismiss(): void {
    if (!this.openValue) {
      return;
    }

    this.open = false;
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    if (!this.openValue) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    const heading = this.heading;
    const message = this.message;
    const headingMarkup = heading ? `<strong part="heading title">${escapeHtml(heading)}</strong>` : "";
    const messageMarkup = message ? `<span part="message">${escapeHtml(message)}</span>` : "";
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

        [part="nudge"] {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          padding: 0.7rem 0.8rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, white);
          border-radius: 0.8rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 7%, white);
          color: var(--boe-token-text-text, #101820);
        }

        [part="icon"] {
          flex: none;
          display: grid;
          place-items: center;
          inline-size: 1.5rem;
          block-size: 1.5rem;
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="icon"] svg {
          inline-size: 1.15rem;
          block-size: 1.15rem;
        }

        [part="content"] {
          display: grid;
          gap: 0.15rem;
          flex: 1 1 auto;
          line-height: 1.4;
          font-size: 0.88rem;
        }

        [part~="title"] {
          font-weight: 700;
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="action"] {
          appearance: none;
          justify-self: start;
          margin-top: 0.2rem;
          padding: 0;
          border: 0;
          background: none;
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        [part="action"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
          border-radius: 0.2rem;
        }

        [part="dismiss"] {
          appearance: none;
          flex: none;
          inline-size: 1.4rem;
          block-size: 1.4rem;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #52606d);
          cursor: pointer;
        }

        [part="dismiss"] svg {
          inline-size: 0.8rem;
          block-size: 0.8rem;
        }

        [part="dismiss"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
        }

        [part="dismiss"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <div part="nudge" role="status" aria-live="polite">
        <span part="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18h6"/>
            <path d="M10 22h4"/>
            <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1v.2h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/>
          </svg>
        </span>
        <div part="content">
          ${headingMarkup}
          ${messageMarkup}
          ${actionMarkup}
        </div>
        <button type="button" part="dismiss" aria-label="Dismiss">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;

    this.shadowRoot.querySelector('[part="action"]')?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("action", {
          bubbles: true,
          composed: true,
          detail: { label: this.actionLabel },
        }),
      );
    });

    this.shadowRoot.querySelector('[part="dismiss"]')?.addEventListener("click", () => {
      this.dismiss();
    });
  }
}

export const defineBoxNudgeElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxNudgeElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxNudgeElement;
  }

  customElements.define(tagName, BoxNudgeElement);
  return BoxNudgeElement;
};
