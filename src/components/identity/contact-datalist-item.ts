import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-contact-datalist-item";

const initialsFromName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(segment => segment[0] ?? "")
    .join("")
    .toUpperCase();

const contactStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="item"] {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem 0.65rem;
    border-radius: 0.6rem;
    cursor: pointer;
    color: var(--boe-token-text-text, #222222);
    transition: background 140ms ease;
  }

  [part="item"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="item"][data-selected="true"] {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
  }

  [part="item"][data-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part="item"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
  }

  [part="avatar"] {
    flex: none;
    display: grid;
    place-items: center;
    overflow: hidden;
    inline-size: 2.1rem;
    block-size: 2.1rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #222222));
    font-weight: 700;
    font-size: 0.82rem;
  }

  [part="avatar-image"] {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  [part="body"] {
    min-inline-size: 0;
    display: grid;
    gap: 0.1rem;
  }

  [part="name"] {
    font-size: 0.9rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="email"] {
    font-size: 0.78rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="email"][hidden] {
    display: none;
  }
`;

/**
 * A selectable contact row for a people picker — an avatar (image or initials),
 * a name, and a secondary email/handle. Like `box-datalist-item` it is a
 * `role="option"` that emits `select` with its `value` on click or Enter/Space
 * and reflects `selected` to `aria-selected`; the host owns the list.
 */
export class BoxContactDatalistItemElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "email", "name", "selected", "src", "value"];
  }

  private itemEl!: HTMLElement;
  private avatarEl!: HTMLElement;
  private nameEl!: HTMLElement;
  private emailEl!: HTMLElement;

  get name(): string {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get email(): string {
    return this.getAttribute("email") ?? "";
  }

  set email(value: string) {
    this.setAttribute("email", value);
  }

  get src(): string {
    return this.getAttribute("src") ?? "";
  }

  set src(value: string) {
    this.setAttribute("src", value);
  }

  get value(): string {
    return this.getAttribute("value") ?? this.email ?? this.name;
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get selected(): boolean {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    this.toggleAttribute("selected", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  private choose(): void {
    if (this.disabled) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("select", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${contactStyles}</style>
      <div part="item" role="option">
        <span part="avatar" aria-hidden="true"></span>
        <span part="body">
          <span part="name"></span>
          <span part="email" hidden></span>
        </span>
      </div>
    `;
    this.itemEl = this.shadowRoot.querySelector('[part="item"]')!;
    this.avatarEl = this.shadowRoot.querySelector('[part="avatar"]')!;
    this.nameEl = this.shadowRoot.querySelector('[part="name"]')!;
    this.emailEl = this.shadowRoot.querySelector('[part="email"]')!;
  }

  protected setupListeners(): void {
    this.itemEl.addEventListener("click", () => this.choose());
    this.itemEl.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.choose();
      }
    });
  }

  protected update(): void {
    if (!this.itemEl) {
      return;
    }

    this.itemEl.setAttribute("aria-selected", this.selected ? "true" : "false");
    if (this.disabled) {
      this.itemEl.setAttribute("aria-disabled", "true");
    } else {
      this.itemEl.removeAttribute("aria-disabled");
    }
    this.itemEl.dataset.selected = this.selected ? "true" : "false";
    this.itemEl.dataset.disabled = this.disabled ? "true" : "false";
    this.itemEl.tabIndex = this.disabled ? -1 : 0;

    const existingImage = this.avatarEl.querySelector('[part="avatar-image"]') as HTMLImageElement | null;
    const existingFallback = this.avatarEl.querySelector('[part="avatar-fallback"]') as HTMLElement | null;

    if (this.src) {
      existingFallback?.remove();
      const image = existingImage ?? document.createElement("img");
      image.setAttribute("part", "avatar-image");
      image.src = this.src;
      image.alt = "";
      if (!existingImage) {
        this.avatarEl.append(image);
      }
    } else {
      existingImage?.remove();
      const fallbackEl = existingFallback ?? document.createElement("span");
      fallbackEl.setAttribute("part", "avatar-fallback");
      fallbackEl.textContent = initialsFromName(this.name) || "?";
      if (!existingFallback) {
        this.avatarEl.append(fallbackEl);
      }
    }

    this.nameEl.textContent = this.name;

    if (this.email) {
      this.emailEl.hidden = false;
      this.emailEl.textContent = this.email;
    } else {
      this.emailEl.hidden = true;
      this.emailEl.textContent = "";
    }
  }
}

export const defineBoxContactDatalistItemElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxContactDatalistItemElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxContactDatalistItemElement;
  }

  customElements.define(tagName, BoxContactDatalistItemElement);
  return BoxContactDatalistItemElement;
};
