const DEFAULT_TAG_NAME = "box-switch";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSwitchElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["checked", "description", "disabled", "label"];
  }

  private checkedInternal = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get checked(): boolean {
    return this.checkedInternal;
  }

  set checked(value: boolean) {
    const nextValue = Boolean(value);
    this.checkedInternal = nextValue;
    if (nextValue) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }
    this.render();
  }

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Switch";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "checked") {
      this.checkedInternal = this.hasAttribute("checked");
    }

    this.render();
  }

  private toggleChecked(): void {
    if (this.disabled) {
      return;
    }

    const nextValue = !this.checkedInternal;
    this.checkedInternal = nextValue;
    if (nextValue) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }

    this.dispatchEvent(
      new CustomEvent("checked-changed", {
        bubbles: true,
        composed: true,
        detail: { checked: nextValue },
      }),
    );

    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const descriptionMarkup = this.description
      ? `<span part="description">${escapeHtml(this.description)}</span>`
      : "";

    const trackPart = this.checkedInternal ? "track track-checked" : "track";
    const thumbPart = this.checkedInternal ? "thumb thumb-checked" : "thumb";

    this.shadowRoot.innerHTML = `
      <button
        type="button"
        part="switch"
        role="switch"
        aria-label="${escapeHtml(this.label)}"
        aria-checked="${String(this.checkedInternal)}"
        aria-disabled="${String(this.disabled)}"
        ${this.disabled ? "disabled" : ""}
      >
        <span part="${trackPart}" data-checked="${String(this.checkedInternal)}">
          <span part="${thumbPart}" data-checked="${String(this.checkedInternal)}"></span>
        </span>
        <span part="content">
          <span part="label">${escapeHtml(this.label)}</span>
          ${descriptionMarkup}
        </span>
      </button>
    `;

    this.shadowRoot.querySelector('[part="switch"]')?.addEventListener("click", () => {
      this.toggleChecked();
    });
  }
}

export const defineBoxSwitchElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSwitchElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSwitchElement;
  }

  customElements.define(tagName, BoxSwitchElement);
  return BoxSwitchElement;
};
