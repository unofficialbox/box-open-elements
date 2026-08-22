import { isTimelineEventRecord, resolveTimelineTone } from "./types.js";
import type { TimelineEntrySubmittedDetail, TimelineEvent } from "./types.js";
import { formatItemDate } from "../content-explorer/adapters/item-summary.js";
import { isSafeHref } from "../internal/safe-href.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-timeline";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toneColor = (tone: string): string => {
  switch (tone) {
    case "brand":
      return "var(--boe-token-surface-surface-brand, #0061d5)";
    case "success":
      return "var(--boe-token-surface-status-surface-success, #26a27b)";
    case "warning":
      return "var(--boe-token-surface-status-surface-warning, #f5b31b)";
    case "error":
      return "var(--boe-token-surface-status-surface-error, #ed3757)";
    default:
      return "var(--boe-token-text-text-secondary, #6f6f6f)";
  }
};


const elementStyles = `
        /* Author display rules on parts would otherwise defeat the UA's
           [hidden] rule — state toggling relies on the hidden attribute. */
        [hidden] {
          display: none !important;
        }

        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="events"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
        }

        [part="event"] {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.65rem;
          padding: 0.55rem 0 0.55rem 0.15rem;
        }

        /* The connecting spine between markers. */
        [part="event"]:not(:last-child)::after {
          content: "";
          position: absolute;
          left: calc(0.15rem + 0.55rem - 1px);
          top: 1.9rem;
          bottom: -0.35rem;
          width: 2px;
          background: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 72%, transparent);
        }

        [part="marker"] {
          inline-size: 1.1rem;
          block-size: 1.1rem;
          margin-top: 0.3rem;
          border-radius: 999px;
          border: 2px solid var(--timeline-tone, var(--boe-token-text-text-secondary, #6f6f6f));
          background: color-mix(in srgb, var(--timeline-tone, var(--boe-token-text-text-secondary, #6f6f6f)) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
        }

        [part="event-body"] {
          display: grid;
          gap: 0.25rem;
        }

        [part="event-topline"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
        }

        [part="actor"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="action"] {
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="badge"] {
          display: inline-flex;
          padding: 0.16rem 0.45rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--timeline-tone, var(--boe-token-surface-surface-brand, #0061d5)) 12%, transparent);
          color: color-mix(in srgb, var(--timeline-tone, var(--boe-token-surface-surface-brand, #0061d5)) 74%, black 26%);
          font-size: 0.75rem;
          font-weight: 600;
        }

        [part="timestamp"] {
          margin-left: auto;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.78rem;
          white-space: nowrap;
        }

        [part="summary"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        [part="evidence"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        [part="evidence-link"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          padding: 0.22rem 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 6%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="evidence-link"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, transparent);
        }

        [part="evidence-link"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="correlation"] {
          font-family: ui-monospace, monospace;
          font-size: 0.72rem;
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 84%, transparent);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="load-more-region"] {
          display: flex;
          justify-content: center;
        }

        [part="load-more"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.4rem 0.7rem;
          border-radius: ${boeRadius.control};
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
        }

        [part="load-more"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="composer"] {
          display: grid;
          gap: 0.5rem;
        }

        [part="composer-label"] {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="composer-input"] {
          min-height: 3.4rem;
          padding: 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          line-height: 1.5;
          resize: vertical;
        }

        [part="composer-submit"] {
          appearance: none;
          justify-self: start;
          min-height: 2rem;
          padding: 0.4rem 0.7rem;
          border: 1px solid transparent;
          border-radius: 999px;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font: inherit;
          cursor: pointer;
        }

        [part="composer-submit"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, black 12%);
        }

        [part="composer-submit"]:focus-visible,
        [part="composer-input"]:focus-visible,
        [part="load-more"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }
      `;

export class Timeline extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["composable", "events", "has-more", "heading"];
  }

  private titleEl!: HTMLElement;

  private eventsEl!: HTMLElement;

  private emptyEl!: HTMLElement;

  private loadMoreRegionEl!: HTMLElement;

  private composerEl!: HTMLElement;

  private composerInputEl!: HTMLTextAreaElement;

  private eventsSignature = "";

  get heading(): string {
    return this.getAttribute("heading") ?? "Activity";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /** Append-only event list; JSON records validated before rendering. */
  get events(): TimelineEvent[] {
    const raw = this.getAttribute("events");
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.every(isTimelineEventRecord) ? parsed : [];
    } catch {
      return [];
    }
  }

  set events(value: TimelineEvent[]) {
    if (value.length) {
      this.setAttribute("events", JSON.stringify(value));
      return;
    }

    this.removeAttribute("events");
  }

  get composable(): boolean {
    return this.hasAttribute("composable");
  }

  set composable(value: boolean) {
    this.toggleAttribute("composable", value);
  }

  get hasMore(): boolean {
    return this.hasAttribute("has-more");
  }

  set hasMore(value: boolean) {
    this.toggleAttribute("has-more", value);
  }

  private emitEntrySubmitted(): void {
    const body = this.composerInputEl.value.trim();
    if (!this.composable || !body) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<TimelineEntrySubmittedDetail>("entry-submitted", {
        bubbles: true,
        composed: true,
        detail: { body },
      }),
    );
    this.composerInputEl.value = "";
  }

  private rebuildEvents(events: TimelineEvent[]): void {
    this.eventsEl.innerHTML = events
      .map(event => {
        const tone = resolveTimelineTone(event.tone);
        const evidence = (event.evidence ?? [])
          .map(entry => {
            const attrs = `part="evidence-link" data-event-id="${escapeHtml(event.id)}" data-evidence-id="${escapeHtml(entry.id)}"`;
            return entry.href && isSafeHref(entry.href)
              ? `<a ${attrs} href="${escapeHtml(entry.href)}">${escapeHtml(entry.label)}</a>`
              : `<button type="button" ${attrs}>${escapeHtml(entry.label)}</button>`;
          })
          .join("");
        const timestamp = event.timestamp ? formatItemDate(event.timestamp) : "";

        return `
          <li part="event" data-event-id="${escapeHtml(event.id)}" style="--timeline-tone:${toneColor(tone)};">
            <span part="marker" aria-hidden="true"></span>
            <div part="event-body">
              <div part="event-topline">
                ${event.actor ? `<span part="actor">${escapeHtml(event.actor.name)}</span>` : ""}
                <span part="action">${escapeHtml(event.action)}</span>
                ${event.badge ? `<span part="badge">${escapeHtml(event.badge)}</span>` : ""}
                ${timestamp ? `<time part="timestamp" datetime="${escapeHtml(event.timestamp ?? "")}">${escapeHtml(timestamp)}</time>` : ""}
              </div>
              ${event.summary ? `<p part="summary">${escapeHtml(event.summary)}</p>` : ""}
              ${evidence ? `<div part="evidence">${evidence}</div>` : ""}
              ${event.correlationId ? `<span part="correlation">${escapeHtml(event.correlationId)}</span>` : ""}
            </div>
          </li>
        `;
      })
      .join("");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="panel">
        <h2 part="title"></h2>
        <ol part="events" role="list" reversed hidden></ol>
        <div part="empty" hidden>No activity yet.</div>
        <div part="load-more-region" hidden>
          <button type="button" part="load-more">Load earlier activity</button>
        </div>
        <div part="composer" hidden>
          <label part="composer-label" for="timeline-composer-input">Add a comment</label>
          <textarea part="composer-input" id="timeline-composer-input" placeholder="Add a comment"></textarea>
          <button type="button" part="composer-submit">Comment</button>
        </div>
      </section>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.eventsEl = this.shadowRoot.querySelector('[part="events"]')!;
    this.emptyEl = this.shadowRoot.querySelector('[part="empty"]')!;
    this.loadMoreRegionEl = this.shadowRoot.querySelector('[part="load-more-region"]')!;
    this.composerEl = this.shadowRoot.querySelector('[part="composer"]')!;
    this.composerInputEl = this.shadowRoot.querySelector('[part="composer-input"]')!;
  }

  protected setupListeners(): void {
    this.eventsEl.addEventListener("click", event => {
      const link = (event.target as HTMLElement).closest('[part="evidence-link"]') as HTMLElement | null;
      if (!link || !this.eventsEl.contains(link)) {
        return;
      }

      const eventId = link.getAttribute("data-event-id") ?? "";
      const evidenceId = link.getAttribute("data-evidence-id") ?? "";
      const source = this.events.find(entry => entry.id === eventId);
      const evidence = source?.evidence?.find(entry => entry.id === evidenceId);
      if (evidence) {
        this.dispatchEvent(
          new CustomEvent("evidence-selected", {
            bubbles: true,
            composed: true,
            detail: { event: source, evidence },
          }),
        );
      }
    });

    this.loadMoreRegionEl.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part="load-more"]')) {
        this.dispatchEvent(
          new CustomEvent("load-more", { bubbles: true, composed: true }),
        );
      }
    });

    this.composerEl.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part="composer-submit"]')) {
        this.emitEntrySubmitted();
      }
    });

    this.composerInputEl.addEventListener("keydown", event => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        this.emitEntrySubmitted();
      }
    });
  }

  protected update(): void {
    if (!this.eventsEl) {
      return;
    }

    this.titleEl.textContent = this.heading;
    this.eventsEl.setAttribute("aria-label", this.heading);

    const events = this.events;
    this.eventsEl.hidden = events.length === 0;
    this.emptyEl.hidden = events.length > 0;

    const signature = this.getAttribute("events") ?? "";
    if (signature !== this.eventsSignature) {
      this.eventsSignature = signature;
      this.rebuildEvents(events);
    }

    this.loadMoreRegionEl.hidden = !this.hasMore;
    const composable = this.composable;
    this.composerEl.hidden = !composable;
    this.composerInputEl.disabled = !composable;
  }
}

Timeline.register();
