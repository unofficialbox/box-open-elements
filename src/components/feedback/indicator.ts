import { BaseElement } from "../../core/index.js";
import { toneAccessibleLabel } from "./tone.js";

const DEFAULT_TAG_NAME = "box-indicator";

/**
 * Indicator shapes, one per tone.
 *
 * The shape is the point. A row of coloured dots is unreadable to anyone who
 * cannot separate the colours, and status is exactly the information a reader
 * most needs from a dense list. Carbon ships both an icon and a shape
 * indicator for this reason; here the shape *is* the indicator, and colour is
 * the redundant channel rather than the only one.
 */
const INDICATOR_SHAPES: Record<string, string> = {
  // A filled disc: the neutral resting state.
  info: `<svg viewBox="0 0 12 12" fill="currentColor" focusable="false"><circle cx="6" cy="6" r="5"/></svg>`,
  // A disc with a tick cut into it, matching the success glyph on alert/toast.
  success: `<svg viewBox="0 0 12 12" fill="currentColor" focusable="false"><path d="M6 1a5 5 0 100 10A5 5 0 006 1zm2.5 3.6L5.6 8a.7.7 0 01-1 0L3.5 6.8a.7.7 0 111-1l.6.7 2.4-2.8a.7.7 0 011 .9z"/></svg>`,
  // A triangle, distinguishable from a disc at a glance and at small sizes.
  warning: `<svg viewBox="0 0 12 12" fill="currentColor" focusable="false"><path d="M5.5 1.4 0.5 10a.6.6 0 00.5.9h10a.6.6 0 00.5-.9l-5-8.6a.6.6 0 00-1 0z"/></svg>`,
  // A diamond: a square is too close to a disc once antialiased at 10px.
  error: `<svg viewBox="0 0 12 12" fill="currentColor" focusable="false"><path d="M6 0.6 11.4 6 6 11.4.6 6z"/></svg>`,
  // A hollow ring: nothing has happened yet, so nothing is filled in.
  pending: `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" focusable="false"><circle cx="6" cy="6" r="4"/></svg>`,
};

/** The shape for a tone, falling back to the neutral disc. */
const indicatorShape = (tone: string): string =>
  INDICATOR_SHAPES[tone] ?? INDICATOR_SHAPES.info!;

const indicatorStyles = `
  :host {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: inherit;
    font: inherit;
  }

  :host([hidden]) {
    display: none !important;
  }

  [part="shape"] {
    flex: 0 0 auto;
    inline-size: 0.62rem;
    block-size: 0.62rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="shape"] svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  :host([tone="info"]) [part="shape"] {
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  :host([tone="success"]) [part="shape"] {
    color: var(--boe-token-surface-status-surface-success, #26c281);
  }

  :host([tone="error"]) [part="shape"] {
    color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  :host([tone="warning"]) [part="shape"] {
    color: var(--boe-token-surface-status-surface-inprogress, #f5b31b);
  }

  [part="label"] {
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  /* With no label the dot stands alone, and an empty span would still take a
     line box and the flex gap beside it. */
  [part="label"]:empty {
    display: none;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
`;

/**
 * A status mark, for dense lists where a full badge would not fit.
 *
 * ```html
 * <box-indicator tone="success" label="Signed"></box-indicator>
 * ```
 *
 * Distinct in shape as well as colour, so a status column survives being read
 * by someone who cannot separate green from amber — the same rule the alert and
 * toast glyphs follow.
 *
 * When there is no visible `label` the tone is still stated for assistive
 * technology, because a bare dot otherwise announces nothing at all. A host
 * whose surrounding text already says "Signed" should pass that as the label
 * rather than leaving a reader to infer it from a colour.
 */
export class Indicator extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["label", "tone"];
  }

  private shapeEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private toneLabelEl!: HTMLElement;
  private renderedTone: string | null = null;

  /** The status. Unknown tones render the neutral disc. */
  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  /** Visible text beside the mark. Optional. */
  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    if (!value) {
      this.removeAttribute("label");
      return;
    }
    this.setAttribute("label", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>${indicatorStyles}</style>
      <span part="shape" aria-hidden="true"></span>
      <span part="tone-label" class="sr-only"></span>
      <span part="label"></span>
    `;
    this.shapeEl = this.shadowRoot.querySelector('[part="shape"]')!;
    this.toneLabelEl = this.shadowRoot.querySelector('[part="tone-label"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
  }

  protected setupListeners(): void {
    // Display only.
  }

  protected update(): void {
    if (!this.shapeEl) {
      return;
    }

    const tone = this.tone;
    if (tone !== this.renderedTone) {
      this.renderedTone = tone;
      this.shapeEl.innerHTML = indicatorShape(tone);
    }

    this.labelEl.textContent = this.label;
    // Only speak the tone when no visible label carries it; otherwise a reader
    // hears "Success Signed" where the screen says "Signed".
    this.toneLabelEl.textContent = this.label ? "" : toneAccessibleLabel(tone);
  }
}

Indicator.register();
