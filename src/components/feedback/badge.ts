import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
} from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-badge";

const badgeStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="badge"] {
    display: inline-block;
    padding: 2px 4px 3px;
    border-radius: ${boeRadius.size};
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
    font-size: 10px;
    font-weight: 700;
    line-height: 12px;
    letter-spacing: 0;
    text-align: center;
    text-transform: none;
    text-decoration: none;
    white-space: nowrap;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="badge"][data-tone="neutral"] {
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
  }

  [part="badge"][data-tone="info"],
  [part="badge"][data-tone="brand"] {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 50%, #fff);
    color: #ffffff;
  }

  [part="badge"][data-tone="success"] {
    background: var(--boe-token-surface-status-surface-success, #26c281);
    color: #ffffff;
  }

  [part="badge"][data-tone="error"] {
    background: var(--boe-token-surface-status-surface-error, #ed3757);
    color: #ffffff;
  }

  [part="badge"][data-tone="warning"],
  [part="badge"][data-tone="inprogress"] {
    background: var(--boe-token-surface-status-surface-inprogress, #f5b31b);
    color: #ffffff;
  }

  /* Hidden when used as a count that is zero/empty with hide-when-zero. */
  :host([hidden]) {
    display: none;
  }

  /* Count "pop" when the value changes (opt-in via the animate attribute). */
  [part="badge"].boe-pop {
    animation: boe-badge-pop ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  @keyframes boe-badge-pop {
    0% { transform: scale(0.7); }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }

  ${boeReducedMotionStyles('[part="badge"].boe-pop', "animation: none;")}
`;

export class BoxBadgeElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "tone", "max", "hide-when-zero", "animate"];
  }

  private badgeEl!: HTMLElement;
  private lastText: string | null = null;

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "neutral";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  /** When the label is a count, cap the displayed number, e.g. max=99 → "99+". */
  get max(): number | null {
    const raw = this.getAttribute("max");
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  set max(value: number | null) {
    if (value === null) {
      this.removeAttribute("max");
    } else {
      this.setAttribute("max", String(value));
    }
  }

  /** Hide the badge entirely when the count is zero or the label is empty. */
  get hideWhenZero(): boolean {
    return this.hasAttribute("hide-when-zero");
  }

  set hideWhenZero(value: boolean) {
    this.toggleAttribute("hide-when-zero", value);
  }

  /** The label after applying the `max` cap (e.g. "128" with max=99 → "99+"). */
  private displayText(): string {
    const raw = this.label;
    const max = this.max;
    if (max !== null && /^\d+$/.test(raw.trim()) && Number(raw) > max) {
      return `${max}+`;
    }
    return raw;
  }

  private isEmptyCount(): boolean {
    const raw = this.label.trim();
    return raw === "" || raw === "0";
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${badgeStyles}</style>
      <span part="badge" role="status"></span>
    `;
    this.badgeEl = this.shadowRoot.querySelector('[part="badge"]')!;
  }

  protected update(): void {
    if (!this.badgeEl) {
      return;
    }

    // Hide when used as a count that is zero/empty and hide-when-zero is set.
    const shouldHide = this.hideWhenZero && this.isEmptyCount();
    this.toggleAttribute("hidden", shouldHide);

    const text = this.displayText();
    this.badgeEl.dataset.tone = this.tone;
    this.badgeEl.setAttribute("aria-label", text);
    this.badgeEl.textContent = text;

    // Re-trigger the pop animation when an animated count actually changes.
    if (this.hasAttribute("animate") && this.lastText !== null && this.lastText !== text) {
      this.badgeEl.classList.remove("boe-pop");
      void this.badgeEl.offsetWidth; // force reflow so the animation restarts
      this.badgeEl.classList.add("boe-pop");
    }
    this.lastText = text;
  }
}

export const defineBoxBadgeElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxBadgeElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxBadgeElement;
  }

  customElements.define(tagName, BoxBadgeElement);
  return BoxBadgeElement;
};
