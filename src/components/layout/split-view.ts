const DEFAULT_TAG_NAME = "box-split-view";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSplitViewElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "ratio", "resizable"];
  }

  private isResizing = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Split View";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get ratio(): number {
    const raw = Number(this.getAttribute("ratio") ?? "0.38");
    if (!Number.isFinite(raw)) {
      return 0.38;
    }
    return Math.max(0.2, Math.min(0.8, raw));
  }

  set ratio(value: number) {
    this.setAttribute("ratio", String(value));
  }

  get resizable(): boolean {
    return this.hasAttribute("resizable");
  }

  set resizable(value: boolean) {
    this.toggleAttribute("resizable", value);
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

    const ratioPercent = `${Math.round(this.ratio * 100)}%`;
    const splitColumns = this.resizable
      ? `minmax(180px, ${ratioPercent}) 12px minmax(0, 1fr)`
      : `minmax(180px, ${ratioPercent}) minmax(0, 1fr)`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        [part="split-view"] {
          display: grid;
          grid-template-columns: ${splitColumns};
          align-items: stretch;
        }

        [part="primary"],
        [part="secondary"] {
          min-width: 0;
        }

        [part="separator"] {
          position: relative;
          display: grid;
          place-items: center;
          cursor: col-resize;
          touch-action: none;
        }

        [part="separator"]::before {
          content: "";
          width: 1px;
          height: 100%;
          background: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
        }
      </style>
      <section part="split-view" aria-label="${escapeHtml(this.label)}">
        <div part="primary">
          <slot name="primary"></slot>
        </div>
        ${this.resizable ? `<div part="separator" role="separator" aria-orientation="vertical" aria-label="Resize panels"></div>` : ""}
        <div part="secondary">
          <slot></slot>
        </div>
      </section>
    `;

    this.shadowRoot.querySelector('[part="separator"]')?.addEventListener("pointerdown", event => {
      const pointerEvent = event as PointerEvent;
      this.isResizing = true;
      const target = event.currentTarget as HTMLElement & {
        setPointerCapture?: (pointerId: number) => void;
      };
      target.setPointerCapture?.(pointerEvent.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    this.shadowRoot.querySelector('[part="separator"]')?.addEventListener("pointermove", event => {
      const pointerEvent = event as PointerEvent;
      if (!this.isResizing) {
        return;
      }

      const rect = this.getBoundingClientRect();
      if (!rect.width) {
        return;
      }

      const nextRatio = Math.max(0.2, Math.min(0.8, (pointerEvent.clientX - rect.left) / rect.width));
      this.ratio = nextRatio;
    });

    const stopResize = (pointerId?: number) => {
      this.isResizing = false;
      const separator = this.shadowRoot?.querySelector('[part="separator"]') as HTMLElement | null;
      if (separator && typeof pointerId === "number") {
        (separator as HTMLElement & {
          releasePointerCapture?: (nextPointerId: number) => void;
        }).releasePointerCapture?.(pointerId);
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    this.shadowRoot.querySelector('[part="separator"]')?.addEventListener("pointerup", event => {
      stopResize((event as PointerEvent).pointerId);
    });

    this.shadowRoot.querySelector('[part="separator"]')?.addEventListener("pointercancel", event => {
      stopResize((event as PointerEvent).pointerId);
    });
  }
}

export const defineBoxSplitViewElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSplitViewElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSplitViewElement;
  }

  customElements.define(tagName, BoxSplitViewElement);
  return BoxSplitViewElement;
};
