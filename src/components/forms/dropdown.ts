const DEFAULT_TAG_NAME = "box-dropdown";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxDropdownItem = {
  id: string;
  label: string;
};

export class BoxDropdownElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "items", "label", "value"];
  }

  private open = false;
  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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
    return this.getAttribute("label") ?? "Dropdown";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxDropdownItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxDropdownItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxDropdownItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const selectedItem = this.items.find(item => item.id === this.valueInternal) ?? null;
    const triggerLabel = selectedItem?.label ?? this.label;
    const itemsMarkup = this.open
      ? `<div part="menu">${this.items
          .map(
            item => `
              <button
                type="button"
                part="item"
                data-item-id="${escapeHtml(item.id)}"
                data-selected="${String(item.id === this.valueInternal)}"
              >
                ${escapeHtml(item.label)}
              </button>
            `,
          )
          .join("")}</div>`
      : "";

    this.shadowRoot.innerHTML = `
      <div part="dropdown">
        <button
          type="button"
          part="trigger"
          aria-expanded="${String(this.open)}"
          aria-haspopup="menu"
          ${this.disabled ? "disabled" : ""}
        >
          ${escapeHtml(triggerLabel)}
        </button>
        ${itemsMarkup}
      </div>
    `;

    this.shadowRoot.querySelector('[part="trigger"]')?.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }

      this.open = !this.open;
      this.render();
    });

    this.shadowRoot.querySelector('[part="trigger"]')?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (this.disabled) {
        return;
      }

      if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        this.open = true;
        this.render();
      }
    });

    this.shadowRoot.querySelectorAll('[part="item"]').forEach(node => {
      node.addEventListener("click", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id") ?? "";
        const item = this.items.find(entry => entry.id === itemId);
        if (!item || this.disabled) {
          return;
        }

        this.valueInternal = item.id;
        this.setAttribute("value", item.id);
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: item.id, item },
          }),
        );
        this.open = false;
        this.render();
      });
    });
  }
}

export const defineBoxDropdownElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDropdownElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDropdownElement;
  }

  customElements.define(tagName, BoxDropdownElement);
  return BoxDropdownElement;
};
