const DEFAULT_TAG_NAME = "box-alert";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxAlertElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["description", "message", "open", "title", "tone"];
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
    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextValue } }));
    this.render();
  }

  get title(): string {
    return this.getAttribute("title") ?? "";
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

  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  connectedCallback(): void {
    this.openValue = this.hasAttribute("open") || !this.hasAttribute("open");
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

    if (!this.openValue || (!this.title && !this.message)) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    const titleMarkup = this.title ? `<strong part="title">${escapeHtml(this.title)}</strong>` : "";
    const messageMarkup = this.message ? `<span part="description message">${escapeHtml(this.message)}</span>` : "";

    this.shadowRoot.innerHTML = `
      <div part="alert" data-tone="${escapeHtml(this.tone)}" role="status" aria-live="polite" aria-label="${escapeHtml(this.title || this.message)}">
        <div part="content">
          ${titleMarkup}
          ${messageMarkup}
        </div>
        <button type="button" part="dismiss" aria-label="Dismiss alert">Dismiss</button>
      </div>
    `;

    this.shadowRoot.querySelector('[part="dismiss"]')?.addEventListener("click", () => {
      this.dismiss();
    });
  }
}

export const defineBoxAlertElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAlertElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAlertElement;
  }

  customElements.define(tagName, BoxAlertElement);
  return BoxAlertElement;
};
