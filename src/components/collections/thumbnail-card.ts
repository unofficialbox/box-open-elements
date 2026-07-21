import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-thumbnail-card";

/** Rich file/grid card — box-ui-elements `ThumbnailCard`. */
const thumbnailCardStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="card"] {
    display: grid;
    grid-template-rows: auto auto;
    width: 100%;
    min-width: 160px;
    border: ${boePanel.border};
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface, #ffffff);
    overflow: hidden;
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  :host([interactive]) [part="card"] {
    cursor: pointer;
  }

  :host([highlight-on-hover]) [part="card"]:hover,
  :host([interactive]) [part="card"]:hover {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  }

  [part="card"]:focus-visible {
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
    outline-offset: 2px;
  }

  [part="thumbnail"] {
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 10;
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    overflow: hidden;
  }

  [part="thumbnail"] ::slotted(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  [part="details"] {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: ${boeSpace[2]};
    padding: ${boeSpace[3]};
  }

  [part="icon"] {
    display: inline-flex;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="icon"]:not(:has(*)) {
    display: none;
  }

  [part="text"] {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  [part="title"] {
    font-size: ${boeSpace[3]};
    font-weight: 600;
    color: var(--boe-token-text-text, #222222);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="subtitle"] {
    font-size: 12px;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part="subtitle"][hidden] {
    display: none;
  }

  [part="action"] {
    display: inline-flex;
  }

  [part="action"]:not(:has(*)) {
    display: none;
  }
`;

export class BoxThumbnailCardElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["title", "subtitle", "interactive", "highlight-on-hover"];
  }

  private cardEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private subtitleEl!: HTMLElement;

  get cardTitle(): string {
    return this.getAttribute("title") ?? "";
  }

  set cardTitle(value: string) {
    this.setAttribute("title", value);
  }

  get subtitle(): string {
    return this.getAttribute("subtitle") ?? "";
  }

  set subtitle(value: string) {
    if (value) {
      this.setAttribute("subtitle", value);
    } else {
      this.removeAttribute("subtitle");
    }
  }

  /** When set, the card is a button: focusable, keyboard-activated, emits `activate`. */
  get interactive(): boolean {
    return this.hasAttribute("interactive");
  }

  set interactive(value: boolean) {
    this.toggleAttribute("interactive", Boolean(value));
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${thumbnailCardStyles}</style>
      <div part="card">
        <div part="thumbnail"><slot name="thumbnail"></slot></div>
        <div part="details">
          <span part="icon"><slot name="icon"></slot></span>
          <div part="text">
            <div part="title"></div>
            <div part="subtitle"></div>
          </div>
          <span part="action"><slot name="action"></slot></span>
        </div>
      </div>
    `;
    this.cardEl = this.shadowRoot.querySelector('[part="card"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.subtitleEl = this.shadowRoot.querySelector('[part="subtitle"]')!;
  }

  protected setupListeners(): void {
    this.cardEl.addEventListener("click", () => this.activate());
    this.cardEl.addEventListener("keydown", event => {
      if (!this.interactive) {
        return;
      }
      const key = (event as KeyboardEvent).key;
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        this.activate();
      }
    });
  }

  private activate(): void {
    if (!this.interactive) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("activate", {
        bubbles: true,
        composed: true,
        detail: { title: this.cardTitle },
      }),
    );
  }

  protected update(): void {
    if (!this.cardEl || !this.titleEl || !this.subtitleEl) {
      return;
    }

    this.titleEl.textContent = this.cardTitle;
    this.subtitleEl.textContent = this.subtitle;
    this.subtitleEl.hidden = this.subtitle.length === 0;

    if (this.interactive) {
      this.cardEl.setAttribute("role", "button");
      this.cardEl.setAttribute("tabindex", "0");
      this.cardEl.setAttribute("aria-label", this.cardTitle);
    } else {
      this.cardEl.removeAttribute("role");
      this.cardEl.removeAttribute("tabindex");
      this.cardEl.removeAttribute("aria-label");
    }
  }
}

export const defineBoxThumbnailCardElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxThumbnailCardElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxThumbnailCardElement;
  }

  customElements.define(tagName, BoxThumbnailCardElement);
  return BoxThumbnailCardElement;
};
