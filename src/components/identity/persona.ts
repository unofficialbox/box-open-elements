import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-persona";

const initialsFromName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(segment => segment[0] ?? "")
    .join("")
    .toUpperCase();

const personaStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="persona"] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.85rem;
    padding: 0.8rem 0.9rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, var(--boe-token-surface-surface, #ffffff) 20%);
    border-radius: 1rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%) 100%
      );
  }

  [part="avatar"] {
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 76%, var(--boe-token-surface-surface, #ffffff) 24%);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%) 100%
      );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  [part="image"] {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  [part="fallback"] {
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="meta"] {
    min-inline-size: 0;
    display: grid;
    gap: 0.2rem;
  }

  [part="name"] {
    font-size: 0.98rem;
    line-height: 1.25;
  }

  [part~="description"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.45;
  }

  [part~="description"][hidden] {
    display: none;
  }

  [part="status"] {
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.8rem;
    font-weight: 700;
  }

  [part="status"][hidden] {
    display: none;
  }
`;

export class BoxPersonaElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["description", "initials", "name", "size", "src", "status", "subtitle", "tone"];
  }

  private avatarEl!: HTMLElement;
  private nameEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private statusEl!: HTMLElement;

  get initials(): string {
    return this.getAttribute("initials") ?? initialsFromName(this.name);
  }

  set initials(value: string) {
    this.setAttribute("initials", value);
  }

  get name(): string {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get size(): number {
    return Number(this.getAttribute("size") ?? "48");
  }

  set size(value: number) {
    this.setAttribute("size", String(value));
  }

  get src(): string {
    return this.getAttribute("src") ?? "";
  }

  set src(value: string) {
    this.setAttribute("src", value);
  }

  get status(): string {
    return this.getAttribute("status") ?? "";
  }

  set status(value: string) {
    this.setAttribute("status", value);
  }

  get subtitle(): string {
    return this.getAttribute("subtitle") ?? this.description;
  }

  set subtitle(value: string) {
    this.setAttribute("subtitle", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? this.getAttribute("subtitle") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "neutral";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${personaStyles}</style>
      <div part="persona">
        <div part="avatar"></div>
        <div part="meta">
          <strong part="name"></strong>
          <span part="description subtitle" hidden></span>
        </div>
        <span part="status" hidden></span>
      </div>
    `;
    this.avatarEl = this.shadowRoot.querySelector('[part="avatar"]')!;
    this.nameEl = this.shadowRoot.querySelector('[part="name"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part~="description"]')!;
    this.statusEl = this.shadowRoot.querySelector('[part="status"]')!;
  }

  protected update(): void {
    if (!this.avatarEl) {
      return;
    }

    const size = Math.max(32, this.size);
    this.avatarEl.dataset.tone = this.tone;
    this.avatarEl.style.width = `${size}px`;
    this.avatarEl.style.height = `${size}px`;

    const existingImage = this.avatarEl.querySelector('[part="image"]') as HTMLImageElement | null;
    const existingFallback = this.avatarEl.querySelector('[part="fallback"]') as HTMLElement | null;

    if (this.src) {
      existingFallback?.remove();
      const image = existingImage ?? document.createElement("img");
      image.setAttribute("part", "image");
      image.src = this.src;
      image.alt = this.name;
      if (!existingImage) {
        this.avatarEl.append(image);
      }
    } else {
      existingImage?.remove();
      const fallbackEl = existingFallback ?? document.createElement("span");
      fallbackEl.setAttribute("part", "fallback");
      fallbackEl.textContent = this.initials || "?";
      if (!existingFallback) {
        this.avatarEl.append(fallbackEl);
      }
    }

    this.nameEl.textContent = this.name;

    if (this.description) {
      this.descriptionEl.hidden = false;
      this.descriptionEl.textContent = this.description;
    } else {
      this.descriptionEl.hidden = true;
      this.descriptionEl.textContent = "";
    }

    if (this.status) {
      this.statusEl.hidden = false;
      this.statusEl.textContent = this.status;
    } else {
      this.statusEl.hidden = true;
      this.statusEl.textContent = "";
    }
  }
}

export const defineBoxPersonaElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPersonaElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPersonaElement;
  }

  customElements.define(tagName, BoxPersonaElement);
  return BoxPersonaElement;
};
