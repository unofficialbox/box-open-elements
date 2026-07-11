const DEFAULT_TAG_NAME = "box-checkbox";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxCheckboxElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["checked", "disabled", "label"];
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
    return this.getAttribute("label") ?? "Checkbox";
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <label part="field">
        <input
          type="checkbox"
          part="input"
          aria-label="${escapeHtml(this.label)}"
          ${this.checkedInternal ? "checked" : ""}
          ${this.disabled ? "disabled" : ""}
        />
        <span part="label">${escapeHtml(this.label)}</span>
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.addEventListener("change", event => {
      if (this.disabled) {
        return;
      }
      const nextValue = (event.currentTarget as HTMLInputElement).checked;
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
    });
  }
}

export const defineBoxCheckboxElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCheckboxElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCheckboxElement;
  }

  customElements.define(tagName, BoxCheckboxElement);
  return BoxCheckboxElement;
};
