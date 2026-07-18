import { BaseElement } from "../../core/index.js";
import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIllustration,
} from "../../foundations/tokens/registry.js";

const DEFAULT_TAG_NAME = "box-illustration";

const illustrationStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="illustration"] {
    display: grid;
    gap: 0.55rem;
    justify-items: center;
    margin: 0;
    text-align: center;
  }

  [part="art"] {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 100%;
    min-block-size: 10.5rem;
    isolation: isolate;
  }

  [part="art"]::before {
    content: "";
    position: absolute;
    inset: 18% 14%;
    border-radius: 0.75rem;
    background:
      radial-gradient(
        circle at 50% 50%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, transparent) 58%,
        transparent 100%
      );
    filter: blur(10px);
    z-index: 0;
  }

  [part="asset"] {
    display: grid;
    place-items: center;
    width: min(11rem, 72%);
    max-width: 100%;
    aspect-ratio: 1 / 1;
    z-index: 1;
  }

  [part="asset"] > svg {
    display: block;
    width: 100%;
    height: auto;
    max-width: 100%;
    overflow: visible;
    filter: drop-shadow(0 16px 28px rgba(15, 23, 42, 0.08));
  }

  [part="cloud"] {
    position: relative;
    inline-size: 10rem;
    block-size: 6.75rem;
    z-index: 1;
    filter: drop-shadow(0 18px 30px rgba(15, 23, 42, 0.08));
  }

  [part~="orb"] {
    position: absolute;
    display: block;
    border-radius: 999px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, var(--boe-token-surface-surface, #ffffff) 66%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-surface-surface-secondary, #fbfbfb) 84%) 100%
      );
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
    box-shadow: 0 14px 26px rgba(15, 23, 42, 0.1);
  }

  [part~="orb-a"] {
    inline-size: 4rem;
    block-size: 4rem;
    inset: 1.9rem auto auto 0.4rem;
  }

  [part~="orb-b"] {
    inline-size: 5rem;
    block-size: 5rem;
    inset: 0.35rem auto auto 2.55rem;
  }

  [part~="orb-c"] {
    inline-size: 3.85rem;
    block-size: 3.85rem;
    inset: 2.15rem auto auto 5.95rem;
  }

  [part="stack"] {
    position: relative;
    inline-size: 10rem;
    block-size: 7rem;
    z-index: 1;
    filter: drop-shadow(0 18px 30px rgba(15, 23, 42, 0.08));
  }

  [part~="stack-card"] {
    position: absolute;
    inset: 1rem auto auto 1.7rem;
    display: block;
    inline-size: 6.6rem;
    block-size: 4.8rem;
    border-radius: 0.75rem;
    background: var(--boe-token-surface-surface, #ffffff);
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.1);
  }

  [part~="stack-card-one"] {
    transform: rotate(-10deg);
  }

  [part~="stack-card-two"] {
    transform: rotate(0deg);
  }

  [part~="stack-card-three"] {
    transform: rotate(10deg);
  }

  [part="spark-cluster"] {
    position: relative;
    inline-size: 9rem;
    block-size: 7rem;
    z-index: 1;
  }

  [part~="spark"] {
    position: absolute;
    display: block;
    inline-size: 1rem;
    block-size: 1rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 52%, transparent);
    clip-path: polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%);
    filter: drop-shadow(0 8px 12px rgba(15, 23, 42, 0.12));
  }

  [part~="spark-a"] {
    inset: 3.2rem auto auto 1rem;
  }

  [part~="spark-b"] {
    inline-size: 1.6rem;
    block-size: 1.6rem;
    inset: 0.9rem auto auto 3.8rem;
  }

  [part~="spark-c"] {
    inset: 3.35rem auto auto 6.9rem;
  }

  [part="meta"] {
    display: grid;
    gap: 0.45rem;
    justify-items: center;
    max-inline-size: 28rem;
  }

  [part="title"] {
    font-weight: 700;
    font-size: 1rem;
    line-height: 1.2;
  }

  [part="title"][hidden] {
    display: none;
  }

  [part~="caption"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.5;
  }

  [part~="caption"][hidden] {
    display: none;
  }
`;

export class BoxIllustrationElement extends BaseElement {
  private readonly handleDesignSystemChange = (): void => {
    this.update();
  };

  static get observedAttributes(): string[] {
    return ["asset", "caption", "message", "shape", "heading"];
  }

  private figureEl!: HTMLElement;
  private artEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private captionEl!: HTMLElement;
  private artSignature = "";

  get caption(): string {
    return this.getAttribute("caption") ?? this.message;
  }

  set caption(value: string) {
    this.setAttribute("caption", value);
  }

  get asset(): string {
    return this.getAttribute("asset") ?? "";
  }

  set asset(value: string) {
    this.setAttribute("asset", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? this.getAttribute("caption") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get shape(): string {
    return this.getAttribute("shape") ?? "cloud";
  }

  set shape(value: string) {
    this.setAttribute("shape", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  connectedCallback(): void {
    globalThis.addEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
  }

  private renderShape(): string {
    switch (this.shape) {
      case "spark":
        return `<div part="spark-cluster"><span part="spark spark-a"></span><span part="spark spark-b"></span><span part="spark spark-c"></span></div>`;
      case "stack":
        return `<div part="stack"><span part="stack-card stack-card-one"></span><span part="stack-card stack-card-two"></span><span part="stack-card stack-card-three"></span></div>`;
      default:
        return `<div part="cloud"><span part="orb orb-a"></span><span part="orb orb-b"></span><span part="orb orb-c"></span></div>`;
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${illustrationStyles}</style>
      <figure part="illustration">
        <div part="art"></div>
        <figcaption part="meta">
          <h2 part="title" hidden></h2>
          <span part="message caption" hidden></span>
        </figcaption>
      </figure>
    `;
    this.figureEl = this.shadowRoot.querySelector('[part="illustration"]')!;
    this.artEl = this.shadowRoot.querySelector('[part="art"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.captionEl = this.shadowRoot.querySelector('[part~="caption"]')!;
  }

  protected update(): void {
    if (!this.figureEl) {
      return;
    }

    const illustrationMarkup = this.asset ? resolveDesignIllustration(this.asset) : null;
    const artMarkup = illustrationMarkup ? `<div part="asset">${illustrationMarkup}</div>` : this.renderShape();
    const signature = `${this.asset}|${this.shape}|${illustrationMarkup ?? ""}`;

    this.figureEl.dataset.shape = this.shape;
    this.artEl.dataset.assetSource = illustrationMarkup ? "design-system" : "shape";

    if (signature !== this.artSignature) {
      this.artSignature = signature;
      this.artEl.innerHTML = artMarkup;
    }

    if (this.heading) {
      this.titleEl.hidden = false;
      this.titleEl.textContent = this.heading;
    } else {
      this.titleEl.hidden = true;
      this.titleEl.textContent = "";
    }

    if (this.message) {
      this.captionEl.hidden = false;
      this.captionEl.textContent = this.message;
    } else {
      this.captionEl.hidden = true;
      this.captionEl.textContent = "";
    }

    // Keep image role on the art node only when there is no visible text alternative,
    // so a heading in figcaption is not swallowed by presentational descendants.
    if (this.heading || this.message) {
      this.artEl.setAttribute("aria-hidden", "true");
      this.artEl.removeAttribute("role");
      this.artEl.removeAttribute("aria-label");
    } else {
      this.artEl.removeAttribute("aria-hidden");
      this.artEl.setAttribute("role", "img");
      this.artEl.setAttribute("aria-label", "Illustration");
    }
  }
}

export const defineBoxIllustrationElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxIllustrationElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxIllustrationElement;
  }

  customElements.define(tagName, BoxIllustrationElement);
  return BoxIllustrationElement;
};
