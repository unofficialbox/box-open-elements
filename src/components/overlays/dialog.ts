const DEFAULT_TAG_NAME = "box-dialog";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxDialogElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["confirm-label", "description", "heading", "open"];
  }

  private openValue = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextOpen = Boolean(value);
    if (this.openValue === nextOpen) {
      return;
    }

    this.openValue = nextOpen;

    if (nextOpen) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }

    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextOpen } }));
    this.render();
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Dialog";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get confirmLabel(): string {
    return this.getAttribute("confirm-label") ?? "Confirm";
  }

  set confirmLabel(value: string) {
    this.setAttribute("confirm-label", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }

    this.render();
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    if (!this.openValue) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          color: inherit;
          font: inherit;
        }

        [part="backdrop"] {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(15, 23, 42, 0.34);
          backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          padding: 1.5rem;
        }

        [part="dialog"] {
          width: min(30rem, calc(100vw - 3rem));
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 78%, var(--boe-token-surface-surface-secondary, #fbfbfb) 22%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 100%
            );
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1.35rem;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 24px 48px rgba(15, 23, 42, 0.16);
          padding: 1.35rem;
          display: grid;
          gap: 1rem;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="header"] h2 {
          margin: 0;
          font: inherit;
          font-size: 1.2rem;
          font-weight: 700;
        }

        [part="description"] {
          margin: 0;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        [part="body"] {
          color: var(--boe-token-text-text, #1f1e1b);
          line-height: 1.55;
        }

        [part="footer"] {
          display: flex;
          justify-content: end;
          gap: 0.65rem;
          padding-top: 0.15rem;
          border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
        }

        [part="cancel"],
        [part="confirm"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 999px;
          font: inherit;
          min-height: 2rem;
          padding: 0.35rem 0.75rem;
          cursor: pointer;
        }

        [part="cancel"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="confirm"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="cancel"]:focus-visible,
        [part="confirm"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <div part="backdrop">
        <section part="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <header part="header">
            <h2 id="dialog-title">${escapeHtml(this.heading)}</h2>
          </header>
          ${
            this.description
              ? `<p part="description">${escapeHtml(this.description)}</p>`
              : ""
          }
          <div part="body"><slot></slot></div>
          <footer part="footer">
            <button type="button" part="cancel">Cancel</button>
            <button type="button" part="confirm">${escapeHtml(this.confirmLabel)}</button>
          </footer>
        </section>
      </div>
    `;

    this.shadowRoot.querySelector('[part="backdrop"]')?.addEventListener("click", event => {
      if (event.target === event.currentTarget) {
        this.close();
      }
    });
    this.shadowRoot.querySelector('[part="cancel"]')?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
      this.close();
    });
    this.shadowRoot.querySelector('[part="confirm"]')?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("confirm", { bubbles: true, composed: true }));
      this.close();
    });
    this.shadowRoot.querySelector('[part="dialog"]')?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
        this.close();
      }
    });
  }
}

export const defineBoxDialogElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDialogElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDialogElement;
  }

  customElements.define(tagName, BoxDialogElement);
  return BoxDialogElement;
};
