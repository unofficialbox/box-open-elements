const DEFAULT_TAG_NAME = "box-toast";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxToastElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["message", "open", "tone"];
  }

  private openValue = false;

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

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

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }

    this.render();
  }

  show(message?: string, options?: { duration?: number; tone?: string }): void {
    if (typeof message === "string") {
      this.message = message;
    }
    if (options?.tone) {
      this.tone = options.tone;
    }

    this.open = true;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const duration = options?.duration ?? 2500;
    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  hide(): void {
    this.open = false;
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    if (!this.openValue || !this.message) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    this.shadowRoot.innerHTML = `
      <div part="toast" data-tone="${escapeHtml(this.tone)}" role="status" aria-live="polite">
        <span part="message">${escapeHtml(this.message)}</span>
        <button type="button" part="dismiss">Dismiss</button>
      </div>
    `;

    this.shadowRoot.querySelector('[part="dismiss"]')?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
      this.hide();
    });
  }
}

export const defineBoxToastElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxToastElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxToastElement;
  }

  customElements.define(tagName, BoxToastElement);
  return BoxToastElement;
};
