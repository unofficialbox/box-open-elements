import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-avatar";
/** BUE default avatar size (`Avatar.scss` `.avatar`). */
const DEFAULT_SIZE = 32;

/** BUE `$avatar-colors` / `avatarColors` from box-ui-elements variables. */
const AVATAR_COLORS = [
  "#0061d5",
  "#003c84",
  "#6f6f6f",
  "#222222",
  "#4826c2",
  "#9f3fed",
] as const;

const resolveSize = (raw: string | null, fallback = DEFAULT_SIZE): number => {
  const parsed = Number(raw ?? String(fallback));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const initialsFromName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(segment => segment[0] ?? "")
    .join("")
    .toUpperCase();

const avatarColorFor = (seed: string): string => {
  if (!seed) {
    return AVATAR_COLORS[0];
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0];
};

const avatarStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="avatar"] {
    position: relative;
    display: inline-grid;
    place-items: center;
    overflow: hidden;
    flex-grow: 0;
    flex-shrink: 0;
    border-radius: 100%;
    border: 0;
    background: var(--avatar-bg, #0061d5);
    box-shadow: none;
    user-select: none;
  }

  [part="image"] {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    border-radius: 100%;
  }

  [part="fallback"] {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    letter-spacing: 0;
    font-size: calc(var(--avatar-size, ${DEFAULT_SIZE}px) * 0.375);
  }

  [part="image"][hidden] {
    display: none;
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
    return resolveSize(this.getAttribute("size"));
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

    const size = this.size;
    const fallback = this.initials || "?";
    const colorSeed = this.name || this.initials || this.alt || fallback;

    this.avatarEl.dataset.tone = this.tone;
    this.avatarEl.setAttribute("aria-label", this.alt || fallback);
    this.avatarEl.style.setProperty("--avatar-size", `${size}px`);
    this.avatarEl.style.setProperty("--avatar-bg", avatarColorFor(colorSeed));
    this.avatarEl.style.width = `${size}px`;
    this.avatarEl.style.height = `${size}px`;

    const existingImage = this.avatarEl.querySelector('[part="image"]') as HTMLImageElement | null;
    const existingFallback = this.avatarEl.querySelector('[part="fallback"]') as HTMLElement | null;
    const nextSrc = this.src;

    if (nextSrc) {
      const image = existingImage ?? document.createElement("img");
      image.setAttribute("part", "image");
      image.alt = this.alt;

      const currentSrc = image.getAttribute("src");
      if (currentSrc !== nextSrc) {
        image.src = nextSrc;
        image.hidden = false;
        image.onerror = () => {
          image.hidden = true;
          this.showAvatarFallback(existingFallback, fallback);
        };
        image.onload = () => {
          image.hidden = false;
          this.avatarEl.querySelector('[part="fallback"]')?.remove();
        };
      }

      if (!existingImage) {
        this.avatarEl.append(image);
      }
    } else {
      if (existingImage) {
        existingImage.remove();
      }
      this.showAvatarFallback(existingFallback, fallback);
    }
  }

  private showAvatarFallback(existingFallback: HTMLElement | null, fallback: string): void {
    const fallbackEl = existingFallback ?? document.createElement("span");
    fallbackEl.setAttribute("part", "fallback");
    fallbackEl.textContent = fallback;
    if (!existingFallback) {
      this.avatarEl.append(fallbackEl);
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
