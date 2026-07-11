const DEFAULT_TAG_NAME = "box-search-field";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSearchFieldElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "placeholder", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
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
    return this.getAttribute("label") ?? "Search";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Search";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }

    this.render();
  }

  clear(): void {
    if (this.disabled || !this.valueInternal) {
      return;
    }

    this.value = "";
    this.dispatchEvent(new CustomEvent("clear", { bubbles: true, composed: true, detail: { value: "" } }));
    this.dispatchEvent(new CustomEvent("value-changed", { bubbles: true, composed: true, detail: { value: "" } }));
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <div part="input-shell">
          <input
            type="search"
            part="input"
            value="${escapeHtml(this.valueInternal)}"
            placeholder="${escapeHtml(this.placeholder)}"
            ${this.disabled ? "disabled" : ""}
          />
          <button type="button" part="submit" ${this.disabled ? "disabled" : ""}>Search</button>
          <button type="button" part="clear" ${this.disabled || !this.valueInternal ? "disabled" : ""}>Clear</button>
        </div>
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    const clearButton = this.shadowRoot.querySelector('[part="clear"]') as HTMLButtonElement | null;
    input?.addEventListener("input", event => {
      if (this.disabled) {
        return;
      }
      const nextValue = (event.currentTarget as HTMLInputElement).value;
      this.valueInternal = nextValue;
      if (clearButton) {
        clearButton.disabled = this.disabled || nextValue.length === 0;
      }
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: nextValue },
        }),
      );
    });
    input?.addEventListener("keydown", event => {
      if (this.disabled) {
        return;
      }
      if (event.key === "Enter") {
        this.dispatchEvent(
          new CustomEvent("search", {
            bubbles: true,
            composed: true,
            detail: { value: this.valueInternal },
          }),
        );
      }
    });
    this.shadowRoot.querySelector('[part="submit"]')?.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent("search", {
          bubbles: true,
          composed: true,
          detail: { value: this.valueInternal },
        }),
      );
    });
    this.shadowRoot.querySelector('[part="clear"]')?.addEventListener("click", () => {
      this.clear();
    });
  }
}

export const defineBoxSearchFieldElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSearchFieldElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSearchFieldElement;
  }

  customElements.define(tagName, BoxSearchFieldElement);
  return BoxSearchFieldElement;
};
