import { BaseElement } from "../../core/index.js";
import { toneAccessibleLabel, toneIcon } from "./tone.js";
import { boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-toast";

/**
 * Whether the toast clears itself.
 *
 * `dismissible` auto-dismisses after `duration` and can also be closed by hand;
 * `sticky` stays until the reader closes it, whatever `duration` says. Both
 * carry the close control — a toast the reader cannot get rid of is a trap.
 */
export type ToastMode = "dismissible" | "sticky";

const TOAST_MODES = new Set<ToastMode>(["dismissible", "sticky"]);

/** Narrow an author-supplied mode, falling back to `dismissible`. */
export const resolveToastMode = (value: string | null | undefined): ToastMode =>
  TOAST_MODES.has(value as ToastMode) ? (value as ToastMode) : "dismissible";

const DISMISS_ICON = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" focusable="false"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/></svg>`;

const toastStyles = `
  :host {
    display: block;
    inline-size: fit-content;
    max-inline-size: 100%;
    color: inherit;
    font: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  /* Fill, text colour and shadow track box-ui-elements' .notification and are
     pinned by the colour conformance manifest — they are deliberately not
     derived from the tone accent. The --toast-accent property exists only to
     colour the status glyph, which upstream has no equivalent for, so adding it
     costs no conformance.

     There is no border. Upstream .notification has one, and box-open-elements
     matched it until the outline was judged too heavy; the claim that pinned it
     was retired rather than left describing something no longer painted. Tone
     survives that in three places — the tinted fill, the full-strength glyph,
     and the visually-hidden tone label — so it was never carried by the border
     alone. */
  [part="toast"] {
    --toast-accent: var(--boe-token-text-text, #222222);

    display: inline-flex;
    /* Top, not centre: with a heading above the message the glyph belongs on
       the heading's line, and centring floats it into the gap between them. */
    align-items: flex-start;
    gap: ${boeSpace[3]};
    min-height: 48px;
    max-inline-size: min(100%, 572px);
    padding: 10px 10px 10px 20px;
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
    box-shadow: 0 2px 6px rgb(0 0 0 / 15%);
  }

  /* The neutral toast keeps upstream's grey fill, so the glyph is the only
     place the "this is information" signal can live. */
  [part="toast"][data-tone="info"] {
    --toast-accent: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="toast"][data-tone="success"] {
    --toast-accent: var(--boe-token-surface-status-surface-success, #26c281);
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 20%, #fff);
  }

  [part="toast"][data-tone="error"] {
    --toast-accent: var(--boe-token-surface-status-surface-error, #ed3757);
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 20%, #fff);
  }

  [part="toast"][data-tone="warning"],
  [part="toast"][data-tone="inprogress"] {
    --toast-accent: var(--boe-token-surface-status-surface-inprogress, #f5b31b);
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 20%, #fff);
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

  [part="icon"] {
    flex: 0 0 auto;
    inline-size: 20px;
    block-size: 20px;
    /* The accent at full strength: the glyph is the one element that should
       read as the status colour rather than a darkened version of it. */
    color: var(--toast-accent);
  }

  [part="icon"] svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  [part="content"] {
    flex: 1 1 auto;
    min-inline-size: 0;
    padding-inline-end: ${boeSpace[2]};
  }

  [part="heading"] {
    display: block;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  /* Optional: with no heading the message stands alone, and an empty element
     would still contribute its line box. */
  [part="heading"]:empty {
    display: none;
  }

  [part="message"] {
    display: block;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
    /* Long unbroken tokens (URLs, filenames) wrap instead of overflowing. */
    overflow-wrap: anywhere;
  }

  /* Without a heading the message is the toast's only line, so it carries the
     weight the heading would have had. */
  [part="heading"]:empty + [part="message"] {
    font-size: 15px;
    font-weight: 700;
  }

  /* Optional action affordance (e.g. "Undo") before the dismiss button.
     Hidden — taking no flex gap — until content is assigned. */
  [part="action"] {
    display: inline-flex;
    align-items: center;
    flex: none;
  }

  [part="action"]:not(.has-content) {
    display: none;
  }

  [part="action"]::slotted(*) {
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    color: var(--boe-token-surface-surface-brand, #0061d5);
    cursor: pointer;
  }

  /* An icon button rather than a "Dismiss" label: the toast is chrome over the
     reader's work, and a word-width button competes with the message it sits
     beside. The accessible name is on the button, so nothing is lost. */
  [part="dismiss"] {
    appearance: none;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 24px;
    block-size: 24px;
    padding: 4px;
    border: 0;
    border-radius: ${boeRadius.med};
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="dismiss"] svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  [part="dismiss"]:hover:not(:disabled) {
    background: rgb(0 0 0 / 6%);
  }

  [part="dismiss"]:active:not(:disabled) {
    background: rgb(0 0 0 / 10%);
  }

  ${boeFocusVisibleStyles('[part="dismiss"]')}

  [part="dismiss"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }
`;

export class Toast extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["duration", "heading", "message", "mode", "open", "tone"];
  }

  private openValue = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private toastEl!: HTMLElement;
  private iconEl!: HTMLElement;
  private headingEl!: HTMLElement;
  private toneLabelEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private renderedTone: string | null = null;
  private actionSlot!: HTMLSlotElement;
  private dismissEl!: HTMLButtonElement;

  /** Auto-dismiss delay in ms for the declarative `open` path. 0 = sticky. */
  get duration(): number {
    const raw = Number(this.getAttribute("duration"));
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  }

  set duration(value: number) {
    this.setAttribute("duration", String(value));
  }

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextOpen = Boolean(value);
    if (this.openValue === nextOpen) {
      return;
    }

    this.openValue = nextOpen;

    if (nextOpen) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }

    if (nextOpen) {
      // Declarative open (attribute/property) auto-dismisses per `duration`;
      // show() reschedules afterwards with its own option when provided.
      this.scheduleAutoDismiss(this.duration);
    } else if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextOpen } }));
    if (this.isRendered) {
      this.update();
    }
  }

  private scheduleAutoDismiss(duration: number): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    // Sticky wins over any duration, including one passed to show().
    if (duration > 0 && this.mode !== "sticky") {
      this.timeoutId = setTimeout(() => this.hide(), duration);
    }
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  /**
   * Optional bold line above the message — "Upload failed" over "3 of 12 files
   * could not be read". Named to match `box-alert`, which established the
   * heading-plus-message shape in this family. Salesforce calls it `label`.
   */
  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /**
   * @deprecated Every toast is borderless now, so this does nothing.
   *
   * Kept because it shipped in 0.11.0 and removing it would break hosts that
   * set it for no benefit — what they asked for is what they already get. The
   * attribute is still reflected so those hosts read back what they wrote.
   */
  get borderless(): boolean {
    return this.hasAttribute("borderless");
  }

  set borderless(value: boolean) {
    this.toggleAttribute("borderless", value);
  }

  /**
   * Whether the toast clears itself. `sticky` overrides any `duration`: a
   * caller that has said "this one stays" should not have it taken away by a
   * duration set elsewhere.
   */
  get mode(): ToastMode {
    return resolveToastMode(this.getAttribute("mode"));
  }

  set mode(value: ToastMode) {
    this.setAttribute("mode", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  disconnectedCallback(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(message?: string, options?: { duration?: number; tone?: string }): void {
    if (typeof message === "string") {
      this.message = message;
    }
    if (options?.tone) {
      this.tone = options.tone;
    }

    this.open = true;

    // options.duration wins; else a declarative `duration` attribute; else 2500.
    const duration = options?.duration ?? (this.duration || 2500);
    this.scheduleAutoDismiss(duration);
  }

  hide(): void {
    this.open = false;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${toastStyles}</style>
      <div part="toast" role="status" aria-live="polite">
        <span part="icon" aria-hidden="true"></span>
        <div part="content">
          <span part="tone-label" class="sr-only"></span>
          <span part="heading"></span>
          <span part="message"></span>
        </div>
        <slot name="action" part="action"></slot>
        <button type="button" part="dismiss" aria-label="Dismiss">${DISMISS_ICON}</button>
      </div>
    `;
    this.toastEl = this.shadowRoot.querySelector('[part="toast"]')!;
    this.iconEl = this.shadowRoot.querySelector('[part="icon"]')!;
    this.headingEl = this.shadowRoot.querySelector('[part="heading"]')!;
    this.toneLabelEl = this.shadowRoot.querySelector('[part="tone-label"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part="message"]')!;
    this.actionSlot = this.shadowRoot.querySelector('slot[name="action"]')!;
    this.dismissEl = this.shadowRoot.querySelector('[part="dismiss"]')!;
  }

  protected setupListeners(): void {
    this.dismissEl.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
      this.hide();
    });
    this.actionSlot.addEventListener("slotchange", () => {
      const hasContent = this.actionSlot.assignedNodes({ flatten: true }).length > 0;
      this.actionSlot.classList.toggle("has-content", hasContent);
    });
  }

  protected update(): void {
    if (!this.toastEl) {
      return;
    }

    const visible = this.openValue && Boolean(this.message);
    this.hidden = !visible;
    if (!visible) {
      return;
    }

    const tone = this.tone;
    this.toastEl.dataset.tone = tone;
    // Only when it actually changes: this re-parses SVG markup, and update()
    // runs on every attribute write.
    if (tone !== this.renderedTone) {
      this.iconEl.innerHTML = toneIcon(tone);
      this.renderedTone = tone;
    }
    // The glyph is aria-hidden and the fill is colour, so without this the
    // tone reaches a screen reader not at all.
    this.toneLabelEl.textContent = toneAccessibleLabel(tone);
    this.headingEl.textContent = this.heading;
    this.messageEl.textContent = this.message;
  }
}

Toast.register();
