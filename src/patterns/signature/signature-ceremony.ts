import {
  formatCeremonySummary,
  isSignatoryRecord,
  resolveCeremony,
} from "./types.js";
import type { CeremonyResolution, Signatory, SignatureMode } from "./types.js";
import { formatUtcDay } from "../audit/types.js";
import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-signature-ceremony";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join("");

/**
 * `formatUtcDay` takes a date-only string or a `Date`; handing it a full ISO
 * timestamp makes it concatenate a second time component and fall back to
 * echoing the raw input. Signing timestamps carry a time, so parse first.
 * Returns an empty string for an unparseable value, so callers can fall back.
 */
const signedOnDay = (iso: string): string => formatUtcDay(new Date(iso));

const STATE_LABEL: Record<string, string> = {
  signed: "Signed",
  declined: "Declined",
  awaiting: "Awaiting signature",
  waiting: "Not yet their turn",
};

const elementStyles = `
        :host {
          display: block;
        }

        [part="card"] {
          border: ${boePanel.border};
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
          overflow: hidden;
        }

        [part="header"] {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
          padding: 0.8rem 1rem;
          border-block-end: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
        }

        [part="heading"] {
          margin: 0;
          font: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="summary"] {
          margin-inline-start: auto;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.14rem 0.5rem;
          border-radius: 999px;
          border: 1px solid transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 80%, transparent);
        }

        [part="summary"][data-status="completed"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 14%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 74%, black 26%);
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 32%, transparent);
        }

        [part="summary"][data-status="declined"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 14%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 76%, black 24%);
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 32%, transparent);
        }

        [part="parties"] {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        [part="party"] {
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          align-items: center;
          gap: 0.7rem;
          padding: 0.65rem 1rem;
        }

        [part="party"] + [part="party"] {
          border-block-start: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 45%, transparent);
        }

        [part="order"] {
          inline-size: 1.35rem;
          block-size: 1.35rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="party"][data-state="signed"] [part="order"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 18%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 74%, black 26%);
        }

        [part="party"][data-state="declined"] [part="order"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 16%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 76%, black 24%);
        }

        [part="party"][data-state="awaiting"] [part="order"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 80%, black 20%);
        }

        [part="avatar"] {
          inline-size: 1.7rem;
          block-size: 1.7rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="identity"] {
          min-inline-size: 0;
        }

        [part="name"] {
          display: block;
          font-size: 0.88rem;
          color: var(--boe-token-text-text, #1f1e1b);
          overflow-wrap: anywhere;
        }

        [part="role"] {
          display: block;
          font-size: 0.76rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="state"] {
          text-align: end;
          font-size: 0.76rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          white-space: nowrap;
        }

        [part="party"][data-state="awaiting"] [part="state"] {
          font-weight: 700;
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 80%, black 20%);
        }

        [part="party"][data-state="declined"] [part="state"] {
          font-weight: 700;
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 76%, black 24%);
        }

        [part="reason"] {
          grid-column: 3 / -1;
          font-size: 0.76rem;
          font-style: italic;
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 70%, black 30%);
        }

        [part="empty"] {
          padding: 1.2rem 1rem;
          text-align: center;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

/**
 * Party-oriented signing progress: who signs, in what order, and — the part
 * that matters — who can act *right now*.
 *
 * The rules live in `resolveCeremony`, which is pure, so a host can drive its
 * own surface or its reminder emails from the same function rather than
 * reimplementing the ordering logic and drifting from what the UI shows.
 *
 * Read-only by design. Signing happens in the signature provider's own flow,
 * so this states position rather than offering a button that would have to
 * duplicate that flow's authority.
 */
export class SignatureCeremony extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["heading", "mode", "signatories"];
  }

  private hostEl!: HTMLElement;

  private signatoriesRaw: string | null = null;

  private signatoriesCache: Signatory[] = [];

  get heading(): string {
    return this.getAttribute("heading") ?? "Signatures";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /** `sequential` (default) routes one party at a time; `parallel` sends to all. */
  get mode(): SignatureMode {
    return this.getAttribute("mode") === "parallel" ? "parallel" : "sequential";
  }

  set mode(value: SignatureMode) {
    this.setAttribute("mode", value);
  }

  get signatories(): Signatory[] {
    const raw = this.getAttribute("signatories");
    if (!raw) {
      return [...this.signatoriesCache];
    }
    if (raw !== this.signatoriesRaw) {
      this.signatoriesRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.signatoriesCache =
          Array.isArray(parsed) && parsed.every(isSignatoryRecord)
            ? (parsed as Signatory[])
            : [];
      } catch {
        this.signatoriesCache = [];
      }
    }
    return [...this.signatoriesCache];
  }

  set signatories(value: Signatory[]) {
    if (value.length) {
      this.setAttribute("signatories", JSON.stringify(value));
      return;
    }
    this.removeAttribute("signatories");
  }

  /** The resolved ceremony — same object the render uses. */
  get resolution(): CeremonyResolution {
    return resolveCeremony(this.signatories, this.mode);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `<style>${elementStyles}</style><div part="host"></div>`;
    this.hostEl = this.shadowRoot.querySelector('[part="host"]')!;
  }

  protected setupListeners(): void {
    // Read-only: signing is the provider's flow, not this component's.
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    const resolution = this.resolution;
    const rows = resolution.statuses
      .map(entry => {
        const { signatory, state, order } = entry;
        // An unparseable timestamp falls back to the bare state rather than
        // rendering "Signed " with nothing after it.
        const signedDay = signatory.signedAt ? signedOnDay(signatory.signedAt) : "";
        const declinedDay = signatory.declinedAt ? signedOnDay(signatory.declinedAt) : "";
        // "Not yet their turn" would be a lie once someone has refused: their
        // turn is not coming. A stopped ceremony says so.
        const waitingLabel =
          resolution.status === "declined" ? "Ceremony stopped" : STATE_LABEL.waiting!;
        const detail =
          state === "signed" && signedDay
            ? `Signed ${signedDay}`
            : state === "declined" && declinedDay
              ? `Declined ${declinedDay}`
              : state === "waiting"
                ? waitingLabel
                : STATE_LABEL[state]!;
        const reason =
          state === "declined" && signatory.declineReason
            ? `<span part="reason">${escapeHtml(signatory.declineReason)}</span>`
            : "";
        return `
          <li part="party" data-state="${state}" data-signatory-id="${escapeHtml(signatory.id)}">
            <span part="order" aria-hidden="true">${String(order)}</span>
            <span part="avatar" aria-hidden="true">${escapeHtml(initialsOf(signatory.name))}</span>
            <span part="identity">
              <span part="name">${escapeHtml(signatory.name)}</span>
              ${signatory.role ? `<span part="role">${escapeHtml(signatory.role)}</span>` : ""}
            </span>
            <span part="state">${escapeHtml(detail)}</span>
            ${reason}
          </li>
        `;
      })
      .join("");

    const summary = formatCeremonySummary(resolution);
    this.hostEl.innerHTML = `
      <section part="card" aria-label="${escapeHtml(this.heading)}">
        <div part="header">
          <h3 part="heading">${escapeHtml(this.heading)}</h3>
          <span part="summary" data-status="${resolution.status}">${escapeHtml(summary)}</span>
        </div>
        ${
          resolution.total
            ? `<ol part="parties">${rows}</ol>`
            : `<div part="empty">No signatories yet.</div>`
        }
      </section>
    `;
  }
}

SignatureCeremony.register();
