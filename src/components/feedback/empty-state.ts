const DEFAULT_TAG_NAME = "box-empty-state";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxEmptyStateElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["action-label", "description", "message", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get title(): string {
    return this.getAttribute("title") ?? "Nothing here yet";
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

    const actionMarkup = this.actionLabel
      ? `<button type="button" part="action">${escapeHtml(this.actionLabel)}</button>`
      : "";

    this.shadowRoot.innerHTML = `
      <section part="empty-state" role="status" aria-live="polite">
        <strong part="title">${escapeHtml(this.title)}</strong>
        <span part="message description">${escapeHtml(this.message)}</span>
        ${actionMarkup}
      </section>
    `;

    this.shadowRoot.querySelector('[part="action"]')?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("action", {
          bubbles: true,
          composed: true,
          detail: { action: "primary", label: this.actionLabel },
        }),
      );
    });
  }
}

export const defineBoxEmptyStateElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxEmptyStateElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxEmptyStateElement;
  }

  customElements.define(tagName, BoxEmptyStateElement);
  return BoxEmptyStateElement;
};
