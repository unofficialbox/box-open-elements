import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-split-view";

const splitViewStyles = `
  :host {
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
    display: block;
  }

  [part="split-view"] {
    display: grid;
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

  [part="separator"][hidden] {
    display: none;
  }

  [part="separator"]::before {
    content: "";
    width: 1px;
    height: 100%;
    background: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
  }
`;

export class BoxSplitViewElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "ratio", "resizable"];
  }

  private isResizing = false;
  private splitViewEl!: HTMLElement;
  private separatorEl!: HTMLElement;

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

  private setRatioFromResize(nextRatio: number): void {
    const clamped = Math.max(0.2, Math.min(0.8, nextRatio));
    const previous = this.ratio;
    if (previous === clamped) {
      return;
    }

    this.setAttribute("ratio", String(clamped));
    this.dispatchEvent(
      new CustomEvent("ratio-changed", {
        bubbles: true,
        composed: true,
        detail: { ratio: clamped },
      }),
    );
    if (this.isRendered) {
      this.update();
    }
  }

  private stopResize(pointerId?: number): void {
    this.isResizing = false;
    if (typeof pointerId === "number") {
      (
        this.separatorEl as HTMLElement & {
          releasePointerCapture?: (nextPointerId: number) => void;
        }
      ).releasePointerCapture?.(pointerId);
    }
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${splitViewStyles}</style>
      <section part="split-view">
        <div part="primary">
          <slot name="primary"></slot>
        </div>
        <div part="separator" role="separator" aria-orientation="vertical" aria-label="Resize panels" hidden></div>
        <div part="secondary">
          <slot></slot>
        </div>
      </section>
    `;
    this.splitViewEl = this.shadowRoot.querySelector('[part="split-view"]')!;
    this.separatorEl = this.shadowRoot.querySelector('[part="separator"]')!;
  }

  protected setupListeners(): void {
    this.separatorEl.addEventListener("pointerdown", event => {
      const pointerEvent = event as PointerEvent;
      this.isResizing = true;
      (
        this.separatorEl as HTMLElement & {
          setPointerCapture?: (pointerId: number) => void;
        }
      ).setPointerCapture?.(pointerEvent.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    this.separatorEl.addEventListener("pointermove", event => {
      const pointerEvent = event as PointerEvent;
      if (!this.isResizing) {
        return;
      }

      const rect = this.getBoundingClientRect();
      if (!rect.width) {
        return;
      }

      const nextRatio = Math.max(0.2, Math.min(0.8, (pointerEvent.clientX - rect.left) / rect.width));
      this.setRatioFromResize(nextRatio);
    });

    this.separatorEl.addEventListener("pointerup", event => {
      this.stopResize((event as PointerEvent).pointerId);
    });

    this.separatorEl.addEventListener("pointercancel", event => {
      this.stopResize((event as PointerEvent).pointerId);
    });
  }

  protected update(): void {
    if (!this.splitViewEl || !this.separatorEl) {
      return;
    }

    const ratioPercent = `${Math.round(this.ratio * 100)}%`;
    const resizable = this.resizable;
    const splitColumns = resizable
      ? `minmax(180px, ${ratioPercent}) 12px minmax(0, 1fr)`
      : `minmax(180px, ${ratioPercent}) minmax(0, 1fr)`;

    this.splitViewEl.style.gridTemplateColumns = splitColumns;
    this.splitViewEl.setAttribute("aria-label", this.label);
    this.separatorEl.hidden = !resizable;
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
