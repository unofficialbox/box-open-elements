import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-avatar";

const initialsFromName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(segment => segment[0] ?? "")
    .join("")
    .toUpperCase();

const avatarStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
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
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 84%, var(--boe-token-surface-surface-secondary, #fbfbfb) 16%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 10px 20px rgba(15, 23, 42, 0.05);
  }

  [part="avatar"][data-tone="informative"] {
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, var(--boe-token-surface-surface, #ffffff) 82%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface-secondary, #fbfbfb) 92%) 100%
      );
  }

  [part="avatar"][data-tone="success"] {
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 18%, var(--boe-token-surface-surface, #ffffff) 82%) 0%,
        color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 8%, var(--boe-token-surface-surface-secondary, #fbfbfb) 92%) 100%
      );
  }

  [part="image"] {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  [part="fallback"] {
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
    letter-spacing: 0.02em;
  }
`;

export class BoxAvatarElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["alt", "initials", "name", "size", "src", "tone"];
  }

  private avatarEl!: HTMLElement;

  get alt(): string {
    return this.getAttribute("alt") ?? this.name;
  }

  set alt(value: string) {
    this.setAttribute("alt", value);
  }

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
    return Number(this.getAttribute("size") ?? "52");
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
      <style>${avatarStyles}</style>
      <div part="avatar"></div>
    `;
    this.avatarEl = this.shadowRoot.querySelector('[part="avatar"]')!;
  }

  protected update(): void {
    if (!this.avatarEl) {
      return;
    }

    const size = Math.max(24, this.size);
    const fallback = this.initials || "?";

    this.avatarEl.dataset.tone = this.tone;
    this.avatarEl.setAttribute("aria-label", this.alt || fallback);
    this.avatarEl.style.width = `${size}px`;
    this.avatarEl.style.height = `${size}px`;

    const existingImage = this.avatarEl.querySelector('[part="image"]') as HTMLImageElement | null;
    const existingFallback = this.avatarEl.querySelector('[part="fallback"]') as HTMLElement | null;

    if (this.src) {
      if (existingFallback) {
        existingFallback.remove();
      }
      const image = existingImage ?? document.createElement("img");
      image.setAttribute("part", "image");
      image.src = this.src;
      image.alt = this.alt;
      if (!existingImage) {
        this.avatarEl.append(image);
      }
    } else {
      if (existingImage) {
        existingImage.remove();
      }
      const fallbackEl = existingFallback ?? document.createElement("span");
      fallbackEl.setAttribute("part", "fallback");
      fallbackEl.textContent = fallback;
      if (!existingFallback) {
        this.avatarEl.append(fallbackEl);
      }
    }
  }
}

export const defineBoxAvatarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAvatarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAvatarElement;
  }

  customElements.define(tagName, BoxAvatarElement);
  return BoxAvatarElement;
};
