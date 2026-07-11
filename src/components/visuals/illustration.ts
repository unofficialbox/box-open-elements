import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIllustration,
} from "../../foundations/tokens/registry.js";

const DEFAULT_TAG_NAME = "box-illustration";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxIllustrationElement extends HTMLElement {
  private readonly handleDesignSystemChange = (): void => {
    this.render();
  };

  static get observedAttributes(): string[] {
    return ["asset", "caption", "message", "shape", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

  get title(): string {
    return this.getAttribute("title") ?? "";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  connectedCallback(): void {
    globalThis.addEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
    this.render();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
  }

  attributeChangedCallback(): void {
    this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const titleMarkup = this.title ? `<strong part="title">${escapeHtml(this.title)}</strong>` : "";
    const message = this.message;
    const captionMarkup = message ? `<span part="message caption">${escapeHtml(message)}</span>` : "";
    const illustrationMarkup = this.asset ? resolveDesignIllustration(this.asset) : null;
    const artMarkup = illustrationMarkup ? `<div part="asset">${illustrationMarkup}</div>` : this.renderShape();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="illustration"] {
          display: grid;
          gap: 1rem;
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
          border-radius: 2rem;
          background:
            radial-gradient(
              circle at 50% 50%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, white 90%) 0%,
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
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, white 66%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-surface-surface-secondary, #f7f9fc) 84%) 100%
            );
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 14px 26px rgba(15, 23, 42, 0.1);
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
          border-radius: 1rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 90%, white 10%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface-secondary, #f7f9fc) 90%) 100%
            );
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 14px 28px rgba(15, 23, 42, 0.1);
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

        [part~="caption"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.5;
        }
      </style>
      <figure part="illustration" data-shape="${escapeHtml(this.shape)}" role="img" aria-label="${escapeHtml(this.title || this.message || "Illustration")}">
        <div part="art" aria-hidden="true" data-asset-source="${illustrationMarkup ? "design-system" : "shape"}">${artMarkup}</div>
        <figcaption part="meta">
          ${titleMarkup}
          ${captionMarkup}
        </figcaption>
      </figure>
    `;
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
