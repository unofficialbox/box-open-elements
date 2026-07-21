import { BaseElement } from "../../core/index.js";
import { boeControl, boeOverlay, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import {
  parsePlacement,
  trackAnchor,
  type OverlayPlacement,
} from "../../foundations/overlay/index.js";

const DEFAULT_TAG_NAME = "box-guide-tooltip";

const guideTooltipStyles = `
  :host {
    display: contents;
    color: inherit;
    font: inherit;
  }

  /* Positioned by JS (foundations/overlay) as a viewport-fixed callout, so it
     escapes ancestor overflow and flips/shifts to stay on-screen. */
  [part="callout"] {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 60;
    inline-size: max-content;
    max-inline-size: min(20rem, calc(100vw - 2rem));
    padding: ${boeSpace[4]};
    border-radius: ${boeOverlay.radius};
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, transparent);
    background: var(--boe-token-surface-tooltip-surface, #4e4e4e);
    color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 18px 40px rgba(16, 24, 32, 0.28);
    line-height: 1.5;
  }

  [part="callout"][hidden] {
    display: none;
  }

  [part="close"] {
    position: absolute;
    inset-block-start: ${boeSpace[2]};
    inset-inline-end: ${boeSpace[2]};
    inline-size: 1.5rem;
    block-size: 1.5rem;
    display: inline-grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: ${boeRadius.med};
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font: inherit;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="close"]:hover {
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
  }

  [part="close"]:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 1px;
  }

  [part="heading"] {
    margin: 0 1.5rem 0.35rem 0;
    font-size: 0.95rem;
    font-weight: 700;
  }

  [part="heading"][hidden] {
    display: none;
  }

  [part="body"] {
    font-size: 0.86rem;
  }

  [part="footer"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${boeSpace[3]};
    margin-block-start: ${boeSpace[4]};
  }

  [part="step"] {
    font-size: 0.76rem;
    color: rgba(255, 255, 255, 0.7);
  }

  [part="step"][hidden] {
    display: none;
  }

  [part="actions"] {
    display: inline-flex;
    gap: ${boeSpace[2]};
    margin-inline-start: auto;
  }

  [part="back"],
  [part="next"] {
    appearance: none;
    min-height: 1.9rem;
    padding: 0 ${boeSpace[3]};
    border-radius: ${boeRadius.control};
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: ${boeControl.letterSpacing};
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="back"] {
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: transparent;
    color: rgba(255, 255, 255, 0.92);
  }

  [part="back"]:hover:not(:disabled) {
    border-color: #ffffff;
  }

  [part="back"][hidden] {
    display: none;
  }

  [part="next"] {
    border: 1px solid transparent;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="next"]:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #006ae9);
  }

  [part="back"]:disabled,
  [part="next"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${boeNeutralInteractiveStyles('[part="close"]')}
`;

/**
 * A guided-tour callout that points at a target element and walks a user through
 * a sequence of steps. Anchor it with `for` (the id of a target) or a slotted
 * `anchor` element; it self-anchors to the host otherwise. It renders a
 * `heading`, a body (default slot), a `step`/`total` indicator, and Back/Next/
 * Close controls, emitting `next`, `back`, and `close` (each with `detail.step`)
 * so the host can advance the tour (moving `for`/`step`). Positioned as a
 * viewport-fixed overlay via `foundations/overlay`.
 */
export class BoxGuideTooltipElement extends BaseElement {
  static get observedAttributes(): string[] {
    return [
      "open",
      "heading",
      "placement",
      "step",
      "total",
      "for",
      "next-label",
      "back-label",
      "close-label",
    ];
  }

  private openValue = false;
  private positionCleanup: (() => void) | null = null;
  private headingId = `box-guide-heading-${Math.random().toString(36).slice(2, 10)}`;

  private calloutEl!: HTMLElement;
  private closeEl!: HTMLButtonElement;
  private headingEl!: HTMLElement;
  private stepEl!: HTMLElement;
  private backEl!: HTMLButtonElement;
  private nextEl!: HTMLButtonElement;
  private anchorSlot!: HTMLSlotElement;

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const next = Boolean(value);
    if (this.openValue === next) {
      return;
    }
    this.openValue = next;
    this.toggleAttribute("open", next);
    this.dispatchEvent(
      new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: next } }),
    );
    if (this.isRendered) {
      this.update();
    }
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get placement(): string {
    return this.getAttribute("placement") ?? "bottom-center";
  }

  set placement(value: string) {
    this.setAttribute("placement", value);
  }

  private resolvedPlacement(): OverlayPlacement {
    return parsePlacement(this.getAttribute("placement")) ?? { side: "bottom", align: "center" };
  }

  /** 1-based current step; paired with `total` for the "n of m" indicator. */
  get step(): number {
    const raw = Number(this.getAttribute("step"));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }

  set step(value: number) {
    this.setAttribute("step", String(value));
  }

  get total(): number {
    const raw = Number(this.getAttribute("total"));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }

  set total(value: number) {
    this.setAttribute("total", String(value));
  }

  get htmlFor(): string {
    return this.getAttribute("for") ?? "";
  }

  set htmlFor(value: string) {
    this.setAttribute("for", value);
  }

  private get nextLabel(): string {
    const explicit = this.getAttribute("next-label");
    if (explicit) {
      return explicit;
    }
    // On the final step Next becomes a finish action.
    return this.total > 0 && this.step >= this.total ? "Done" : "Next";
  }

  private get backLabel(): string {
    return this.getAttribute("back-label") ?? "Back";
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(): void {
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  /** Resolve the element the callout points at. */
  private resolveAnchor(): HTMLElement {
    const forId = this.htmlFor;
    if (forId) {
      const root = this.getRootNode() as Document | ShadowRoot;
      const found =
        (root as ShadowRoot).getElementById?.(forId) ??
        (this.ownerDocument ?? document).getElementById(forId);
      if (found) {
        return found;
      }
    }
    const slotted = this.anchorSlot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    return slotted ?? this;
  }

  private stopTracking(): void {
    this.positionCleanup?.();
    this.positionCleanup = null;
  }

  disconnectedCallback(): void {
    this.stopTracking();
    super.disconnectedCallback?.();
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${guideTooltipStyles}</style>
      <slot name="anchor"></slot>
      <div part="callout" role="dialog" aria-labelledby="${this.headingId}" hidden>
        <button type="button" part="close" aria-label="Close">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
        <h2 part="heading" id="${this.headingId}" hidden></h2>
        <div part="body"><slot></slot></div>
        <div part="footer">
          <span part="step" hidden></span>
          <div part="actions">
            <button type="button" part="back">Back</button>
            <button type="button" part="next">Next</button>
          </div>
        </div>
      </div>
    `;
    this.calloutEl = this.shadowRoot.querySelector('[part="callout"]')!;
    this.closeEl = this.shadowRoot.querySelector('[part="close"]')!;
    this.headingEl = this.shadowRoot.querySelector('[part="heading"]')!;
    this.stepEl = this.shadowRoot.querySelector('[part="step"]')!;
    this.backEl = this.shadowRoot.querySelector('[part="back"]')!;
    this.nextEl = this.shadowRoot.querySelector('[part="next"]')!;
    this.anchorSlot = this.shadowRoot.querySelector('slot[name="anchor"]')!;
  }

  private emit(type: "next" | "back" | "close"): void {
    this.dispatchEvent(
      new CustomEvent(type, { bubbles: true, composed: true, detail: { step: this.step } }),
    );
  }

  protected setupListeners(): void {
    this.closeEl.addEventListener("click", () => {
      this.emit("close");
      this.hide();
    });
    this.backEl.addEventListener("click", () => this.emit("back"));
    this.nextEl.addEventListener("click", () => this.emit("next"));
    this.calloutEl.addEventListener("keydown", event => {
      if ((event as KeyboardEvent).key === "Escape") {
        event.preventDefault();
        this.emit("close");
        this.hide();
      }
    });
  }

  protected update(): void {
    if (!this.calloutEl) {
      return;
    }

    this.calloutEl.hidden = !this.openValue;

    const heading = this.heading;
    this.headingEl.hidden = !heading;
    this.headingEl.textContent = heading;

    const step = this.step;
    const total = this.total;
    const showStep = step > 0 && total > 0;
    this.stepEl.hidden = !showStep;
    this.stepEl.textContent = showStep ? `${step} of ${total}` : "";

    // Back hides on the first step; Next label finishes on the last.
    this.backEl.hidden = showStep && step <= 1;
    this.backEl.textContent = this.backLabel;
    this.nextEl.textContent = this.nextLabel;

    this.stopTracking();
    if (this.openValue) {
      this.positionCleanup = trackAnchor(this.resolveAnchor(), this.calloutEl, {
        placement: this.resolvedPlacement(),
        offset: 10,
      });
      // Move focus into the callout for keyboard users.
      queueMicrotask(() => this.nextEl?.focus());
    }
  }
}

export const defineBoxGuideTooltipElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxGuideTooltipElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxGuideTooltipElement;
  }

  customElements.define(tagName, BoxGuideTooltipElement);
  return BoxGuideTooltipElement;
};
