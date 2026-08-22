import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-split-view";

const splitViewStyles = `
  :host {
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

  :host {
    container-type: inline-size;
  }

  /* Master-detail collapse (opt-in via collapse="auto"): when the container
     narrows, the primary pane takes the full width and the secondary pane
     becomes a slide-over that the host opens with detail-open — typically on
     selection — and closes by clearing it (Escape asks via detail-dismissed).
     The slotted content never moves; only the shadow wrapper changes shape. */
  @container (max-width: 640px) {
    :host([collapse="auto"]) [part="split-view"] {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    :host([collapse="auto"]) [part="separator"] {
      display: none;
    }

    :host([collapse="auto"]) [part="secondary"] {
      display: none;
    }

    :host([collapse="auto"][detail-open]) [part="secondary"] {
      display: block;
      position: fixed;
      inset-block: 0;
      inset-inline-end: 0;
      z-index: 1100;
      width: min(90vw, 26rem);
      overflow: auto;
      background: var(--boe-token-surface-surface, #ffffff);
      border-inline-start: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
      box-shadow: -12px 0 32px rgb(0 0 0 / 18%);
    }
  }
`;

/** Detail of `detail-dismissed`: what asked the slide-over to close. */
export interface SplitViewDetailDismissedDetail {
  source: "escape";
}

export class SplitView extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["collapse", "detail-open", "label", "ratio", "resizable"];
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

  /** "auto" collapses to master-detail when the container narrows. */
  get collapse(): string {
    return this.getAttribute("collapse") ?? "";
  }

  set collapse(value: string) {
    if (value) {
      this.setAttribute("collapse", value);
    } else {
      this.removeAttribute("collapse");
    }
  }

  /**
   * Host-controlled: whether the secondary pane shows as a slide-over while
   * collapsed. The host sets it on selection and clears it on
   * `detail-dismissed` — selection state stays where it lives, in the list.
   */
  get detailOpen(): boolean {
    return this.hasAttribute("detail-open");
  }

  set detailOpen(value: boolean) {
    this.toggleAttribute("detail-open", Boolean(value));
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
    // Escape inside the collapsed slide-over asks the host to close it; the
    // host owns detail-open, so this only asks.
    this.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== "Escape" || !this.detailOpen || this.collapse !== "auto") {
        return;
      }
      // The slide-over only exists under the 640px container query; on a wide
      // container the secondary pane is an ordinary pane and Escape means
      // nothing. Mirror the CSS condition rather than emitting a phantom ask.
      if (this.offsetWidth > 640) {
        return;
      }
      keyboardEvent.preventDefault();
      this.dispatchEvent(
        new CustomEvent<SplitViewDetailDismissedDetail>("detail-dismissed", {
          bubbles: true,
          composed: true,
          detail: { source: "escape" },
        }),
      );
    });

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

SplitView.register();
