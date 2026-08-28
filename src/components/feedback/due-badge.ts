import { DUE_BUCKET_LABELS, formatDueLabel, resolveDueBucket } from "./due-types.js";
import type { DueBucket } from "./due-types.js";
import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-due-badge";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const elementStyles = `
        :host {
          display: inline-block;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="badge"] {
          display: inline-flex;
          align-items: center;
          gap: 0.28rem;
          padding: 0.14rem 0.45rem;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 0.74rem;
          font-weight: 600;
          white-space: nowrap;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 80%, transparent);
        }

        [part="badge"][data-bucket="overdue"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 14%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 76%, black 24%);
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 32%, transparent);
        }

        [part="badge"][data-bucket="today"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 18%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 46%, black 54%);
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 38%, transparent);
        }

        [part="badge"][data-bucket="this-week"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 78%, black 22%);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
        }

        [part="marker"] {
          inline-size: 0.42rem;
          block-size: 0.42rem;
          border-radius: 999px;
          background: currentColor;
        }

        /* Tone is never the only signal: the label always states the urgency
           in words, so the dot is decoration and stays out of the a11y tree. */
        [part="badge"][data-bucket="later"] [part="marker"],
        [part="badge"][data-bucket="none"] [part="marker"] {
          background: color-mix(in srgb, currentColor 45%, transparent);
        }

        [part="badge"][data-compact="true"] {
          padding: 0.1rem 0.35rem;
          font-size: 0.7rem;
        }
      `;

/**
 * SLA / aging urgency for a due date — the badge the work-queue rows and
 * record headers were specified to share.
 *
 * The label states the urgency in words ("Overdue by 3 days"), so colour is
 * never the only signal, and the day count answers the question a due badge
 * exists for: *how late is this?* A bare date makes the reader do that
 * arithmetic themselves.
 *
 * `reference-time` pins "now" so rendering is deterministic — the same
 * inputs always produce the same badge, in tests and in screenshots.
 */
export class DueBadge extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["compact", "due-at", "label", "reference-time"];
  }

  private badgeEl!: HTMLElement;

  private textEl!: HTMLElement;

  /** ISO timestamp the badge describes. Absent renders the no-due-date state. */
  get dueAt(): string {
    return this.getAttribute("due-at") ?? "";
  }

  set dueAt(value: string) {
    this.setAttribute("due-at", value);
  }

  /** Overrides the derived wording; the bucket still drives the tone. */
  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get compact(): boolean {
    return this.hasAttribute("compact");
  }

  set compact(value: boolean) {
    this.toggleAttribute("compact", value);
  }

  get referenceTime(): string {
    return this.getAttribute("reference-time") ?? "";
  }

  set referenceTime(value: string) {
    this.setAttribute("reference-time", value);
  }

  private now(): Date {
    const raw = this.referenceTime;
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }

  /** The urgency bucket currently rendered. */
  get bucket(): DueBucket {
    return resolveDueBucket(this.dueAt || undefined, this.now());
  }

  /** The rendered wording, derived unless `label` overrides it. */
  get resolvedLabel(): string {
    return this.label || formatDueLabel(this.dueAt || undefined, this.now());
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <span part="badge">
        <span part="marker" aria-hidden="true"></span>
        <span part="text"></span>
      </span>
    `;
    this.badgeEl = this.shadowRoot.querySelector('[part="badge"]')!;
    this.textEl = this.shadowRoot.querySelector('[part="text"]')!;
  }

  protected setupListeners(): void {
    // Presentational: no interaction to wire.
  }

  protected update(): void {
    if (!this.badgeEl) {
      return;
    }

    const bucket = this.bucket;
    const label = this.resolvedLabel;

    this.badgeEl.setAttribute("data-bucket", bucket);
    this.badgeEl.setAttribute("data-compact", String(this.compact));
    this.textEl.textContent = label;

    // A machine-readable date for anything consuming the DOM, and a title so
    // the exact timestamp stays reachable when the label is relative.
    if (this.dueAt && bucket !== "none") {
      this.badgeEl.setAttribute("title", this.dueAt);
      this.setAttribute("datetime", this.dueAt);
    } else {
      this.badgeEl.removeAttribute("title");
      this.removeAttribute("datetime");
    }

    this.badgeEl.setAttribute(
      "aria-label",
      bucket === "none" ? escapeHtml(DUE_BUCKET_LABELS.none) : escapeHtml(label),
    );
  }
}

DueBadge.register();
