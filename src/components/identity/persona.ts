import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-persona";
const DEFAULT_SIZE = 40;

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
    gap: 0.6rem;
    padding: 0.55rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, var(--boe-token-surface-surface, #ffffff) 20%);
    border-radius: 0.7rem;
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
    font-size: calc(var(--avatar-size, ${DEFAULT_SIZE}px) * 0.4);
  }

  [part="image"][hidden] {
    display: none;
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

  [part="meta"] {
    min-inline-size: 0;
    display: grid;
    gap: 0.12rem;
  }

  [part="name"] {
    font-size: 0.94rem;
    line-height: 1.25;
  }

  [part~="description"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.35;
  }

  [part~="description"][hidden] {
    display: none;
  }

  [part="status"] {
    padding: 0.16rem 0.45rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.75rem;
    font-weight: 700;
  }

  [part="status"][hidden] {
    display: none;
  }

  [part="status"][data-tone="info"],
  [part="status"][data-tone="informative"] {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="status"][data-tone="success"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 72%, var(--boe-token-text-text, #222222) 28%);
  }

  [part="status"][data-tone="error"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 72%, var(--boe-token-text-text, #222222) 28%);
  }

  [part="status"][data-tone="warning"],
  [part="status"][data-tone="inprogress"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 58%, var(--boe-token-text-text, #222222) 42%);
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

    const size = this.size;
    const fallback = this.initials || "?";
    this.avatarEl.dataset.tone = this.tone;
    this.avatarEl.style.setProperty("--avatar-size", `${size}px`);
    this.avatarEl.style.width = `${size}px`;
    this.avatarEl.style.height = `${size}px`;

    const existingImage = this.avatarEl.querySelector('[part="image"]') as HTMLImageElement | null;
    const existingFallback = this.avatarEl.querySelector('[part="fallback"]') as HTMLElement | null;
    const nextSrc = this.src;

    if (nextSrc) {
      const image = existingImage ?? document.createElement("img");
      image.setAttribute("part", "image");
      image.alt = this.name;

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
      existingImage?.remove();
      this.showAvatarFallback(existingFallback, fallback);
    }

    this.nameEl.textContent = this.name;

    if (this.description) {
      this.descriptionEl.hidden = false;
      this.descriptionEl.textContent = this.description;
    } else {
      this.descriptionEl.hidden = true;
      this.descriptionEl.textContent = "";
    }

    this.statusEl.dataset.tone = this.tone;

    if (this.status) {
      this.statusEl.hidden = false;
      this.statusEl.textContent = this.status;
    } else {
      this.statusEl.hidden = true;
      this.statusEl.textContent = "";
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
