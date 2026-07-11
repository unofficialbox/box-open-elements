const DEFAULT_TAG_NAME = "box-menu";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxMenuItem = {
  disabled?: boolean;
  id: string;
  label: string;
};

export class BoxMenuElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "items", "label"];
  }

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
    return this.getAttribute("label") ?? "Menu";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxMenuItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxMenuItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxMenuItem[]) {
    this.setAttribute("items", JSON.stringify(value));
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

    const itemsMarkup = this.items
      .map(
        item => `
          <button type="button" part="menu-item" role="menuitem" data-item-id="${escapeHtml(item.id)}" ${this.disabled || item.disabled ? "disabled" : ""}>
            ${escapeHtml(item.label)}
          </button>
        `,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <div part="menu" role="menu" aria-label="${escapeHtml(this.label)}">
        ${itemsMarkup}
      </div>
    `;

    this.shadowRoot.querySelectorAll('[part="menu-item"]').forEach(node => {
      node.addEventListener("click", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id");
        const item = this.items.find(entry => entry.id === itemId);
        if (!item || this.disabled || item.disabled) {
          return;
        }

        this.dispatchEvent(
          new CustomEvent("item-selected", {
            bubbles: true,
            composed: true,
            detail: item,
          }),
        );
      });
    });
  }
}

export const defineBoxMenuElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMenuElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMenuElement;
  }

  customElements.define(tagName, BoxMenuElement);
  return BoxMenuElement;
};
