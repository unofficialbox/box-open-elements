import {
  formatRunDuration,
  formatRunSummary,
  isRunStepRecord,
  resolveRunSteps,
} from "./types.js";
import type { RunResolution, RunStep, RunStepStatus } from "./types.js";
import { ProgressBar } from "../../components/feedback/progress-bar.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-run-trace";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Every status in words — colour never carries the meaning alone. */
export const RUN_STEP_STATUS_LABEL: Record<RunStepStatus, string> = {
  pending: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  warning: "Completed with warnings",
  failed: "Failed",
  skipped: "Skipped",
};

const STATUS_TONE: Record<RunStepStatus, string> = {
  pending: "var(--boe-token-text-text-secondary, #6f6f6f)",
  running: "var(--boe-token-surface-surface-brand, #0061d5)",
  succeeded: "var(--boe-token-surface-status-surface-success, #26a27b)",
  warning: "var(--boe-token-surface-status-surface-warning, #f5b31b)",
  failed: "var(--boe-token-surface-status-surface-error, #ed3757)",
  skipped: "var(--boe-token-text-text-secondary, #6f6f6f)",
};

const elementStyles = `
        :host {
          display: block;
        }

        [part="panel"] {
          border: ${boePanel.border};
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
          padding: 0.8rem 1rem;
        }

        [part="header"] {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
          margin-block-end: 0.4rem;
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

        [part="summary"][data-status="failed"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 14%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 76%, black 24%);
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 32%, transparent);
        }

        [part="summary"][data-status="running"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 80%, black 20%);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
        }

        [part="steps"] {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        /* Marker column + body; the spine hangs off the marker column so the
           nodes stay aligned at every width — long titles wrap in the body. */
        [part="step"] {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.65rem;
          padding: 0.55rem 0 0.55rem 0.15rem;
        }

        [part="step"]:not(:last-child)::after {
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
          margin-top: 0.2rem;
          border-radius: 999px;
          border: 2px solid var(--run-tone, var(--boe-token-text-text-secondary, #6f6f6f));
          background: color-mix(in srgb, var(--run-tone, var(--boe-token-text-text-secondary, #6f6f6f)) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
        }

        [part="step"][data-status="running"] [part="marker"] {
          background: var(--run-tone, var(--boe-token-surface-surface-brand, #0061d5));
        }

        [part="step"][data-status="pending"] [part="marker"],
        [part="step"][data-status="skipped"] [part="marker"] {
          border-style: dashed;
          background: transparent;
        }

        [part="step-body"] {
          display: grid;
          gap: 0.25rem;
          min-inline-size: 0;
        }

        [part="topline"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
        }

        [part="step-title"] {
          font-weight: 700;
          font-size: 0.88rem;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="step"][data-status="pending"] [part="step-title"],
        [part="step"][data-status="skipped"] [part="step-title"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-weight: 600;
        }

        [part="status"] {
          font-size: 0.76rem;
          font-weight: 700;
          color: color-mix(in srgb, var(--run-tone, var(--boe-token-text-text-secondary, #6f6f6f)) 78%, black 22%);
        }

        [part="timestamp"],
        [part="duration"] {
          font-size: 0.76rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="duration"] {
          font-variant-numeric: tabular-nums;
        }

        [part="toggle"] {
          appearance: none;
          border: 0;
          background: transparent;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font: inherit;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--boe-token-surface-surface-brand, #0061d5);
          cursor: pointer;
        }

        [part="toggle"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, transparent);
        }

        [part="toggle"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 1px;
        }

        [part="detail"] {
          display: grid;
          gap: 0.45rem;
          font-size: 0.82rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          padding: 0.2rem 0 0.1rem;
        }

        [part="detail"][hidden] {
          display: none;
        }

        [part="children"] {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.4rem;
        }

        [part="child"] {
          display: grid;
          grid-template-columns: minmax(7rem, auto) 1fr auto;
          align-items: center;
          gap: 0.55rem;
        }

        [part="child-label"] {
          font-size: 0.8rem;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        /* The row already carries the label and status in words; the bar's
           own meta line would say it twice in half the space. */
        [part="child"] box-progress-bar::part(meta) {
          display: none;
        }

        [part="child-status"] {
          font-size: 0.74rem;
          font-weight: 700;
          color: color-mix(in srgb, var(--run-tone, var(--boe-token-text-text-secondary, #6f6f6f)) 78%, black 22%);
        }

        [part="empty"] {
          padding: 0.8rem 0;
          text-align: center;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        .boe-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          border: 0;
          clip: rect(0, 0, 0, 0);
          overflow: hidden;
          white-space: nowrap;
        }
      `;

/**
 * Machine execution trace: a job, pipeline, or agent run, top-down. The
 * rules live in `resolveRunSteps` (pure), the same way `resolveCeremony`
 * backs the signature card: an explicit status wins, a failure shadows the
 * queue behind it as skipped, timestamps derive running/succeeded, and the
 * host can drive its notifications from the identical function.
 *
 * Deliberately not `box-timeline` (the human activity feed): a run reads
 * forward, has one step in flight, and takes no comments.
 *
 * The summary chip doubles as a polite status region, so a run driven by
 * attribute updates announces "Running Deploy — step 3 of 5" → "Completed"
 * without extra wiring. Per-step detail expands in place: `description`
 * plus a `detail-<id>` slot for rich host content, plus child tasks with
 * live `box-progress-bar` rows.
 */
export class RunTrace extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["heading", "steps"];
  }

  private hostEl!: HTMLElement;

  private stepsRaw: string | null = null;

  private stepsCache: RunStep[] = [];

  private readonly expandedIds = new Set<string>();

  get heading(): string {
    return this.getAttribute("heading") ?? "Run";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get steps(): RunStep[] {
    const raw = this.getAttribute("steps");
    if (!raw) {
      return [...this.stepsCache];
    }
    if (raw !== this.stepsRaw) {
      this.stepsRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.stepsCache =
          Array.isArray(parsed) && parsed.every(isRunStepRecord) ? (parsed as RunStep[]) : [];
      } catch {
        this.stepsCache = [];
      }
    }
    return [...this.stepsCache];
  }

  set steps(value: RunStep[]) {
    if (value.length) {
      this.setAttribute("steps", JSON.stringify(value));
      return;
    }
    this.removeAttribute("steps");
  }

  /** The resolved run — same object the render uses. */
  get resolution(): RunResolution {
    return resolveRunSteps(this.steps);
  }

  /** Ids of the steps whose detail is expanded (host-readable). */
  get expandedSteps(): string[] {
    return [...this.expandedIds];
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `<style>${elementStyles}</style><div part="host"></div>`;
    this.hostEl = this.shadowRoot.querySelector('[part="host"]')!;
  }

  protected setupListeners(): void {
    this.hostEl.addEventListener("click", event => {
      const toggle = (event.target as HTMLElement).closest('[part="toggle"]') as HTMLElement | null;
      if (!toggle || !this.hostEl.contains(toggle)) {
        return;
      }
      const stepId = toggle.getAttribute("data-step-id") ?? "";
      if (!stepId) {
        return;
      }
      const expanded = !this.expandedIds.has(stepId);
      if (expanded) {
        this.expandedIds.add(stepId);
      } else {
        this.expandedIds.delete(stepId);
      }
      this.dispatchEvent(
        new CustomEvent("step-toggled", {
          bubbles: true,
          composed: true,
          detail: { stepId, expanded },
        }),
      );
      this.update();
    });
  }

  private childrenMarkup(step: RunStep): string {
    if (!step.children?.length) {
      return "";
    }
    const rows = step.children
      .map(child => {
        const status = child.status ?? "pending";
        const clamped =
          child.progress === undefined ? null : Math.max(0, Math.min(100, child.progress));
        return `
          <li part="child" style="--run-tone:${STATUS_TONE[status]};">
            <span part="child-label">${escapeHtml(child.label)}</span>
            ${
              clamped === null
                ? "<span></span>"
                : `<box-progress-bar label="${escapeHtml(child.label)} progress" value="${String(clamped)}"></box-progress-bar>`
            }
            <span part="child-status">${RUN_STEP_STATUS_LABEL[status]}</span>
          </li>
        `;
      })
      .join("");
    return `<ul part="children">${rows}</ul>`;
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    const resolution = this.resolution;
    const rows = resolution.steps
      .map(entry => {
        const { step, status, position } = entry;
        const duration = formatRunDuration(step.startedAt, step.finishedAt);
        const hasDetail = Boolean(step.description) || Boolean(step.children?.length);
        const expanded = this.expandedIds.has(step.id);
        // The detail slot renders even without JSON detail so a host can
        // project rich content (logs, links) for any step by id.
        const detail = `
          <div part="detail" data-step-id="${escapeHtml(step.id)}" ${expanded ? "" : "hidden"}>
            ${step.description ? `<p part="description">${escapeHtml(step.description)}</p>` : ""}
            ${this.childrenMarkup(step)}
            <slot name="detail-${escapeHtml(step.id)}"></slot>
          </div>
        `;
        return `
          <li part="step" data-status="${status}" data-step-id="${escapeHtml(step.id)}" style="--run-tone:${STATUS_TONE[status]};">
            <span part="marker" aria-hidden="true"></span>
            <div part="step-body">
              <div part="topline">
                <span part="step-title">${escapeHtml(step.title)}</span>
                <span part="status">${RUN_STEP_STATUS_LABEL[status]}</span>
                <span class="boe-sr-only">, step ${String(position)} of ${String(resolution.total)}</span>
                ${duration ? `<span part="duration">${duration}</span>` : ""}
                ${
                  hasDetail
                    ? `<button type="button" part="toggle" data-step-id="${escapeHtml(step.id)}" aria-expanded="${String(expanded)}">${expanded ? "Hide details" : "Details"}</button>`
                    : ""
                }
              </div>
              ${detail}
            </div>
          </li>
        `;
      })
      .join("");

    const summary = formatRunSummary(resolution);
    this.hostEl.innerHTML = `
      <section part="panel" aria-label="${escapeHtml(this.heading)}">
        <div part="header">
          <h3 part="heading">${escapeHtml(this.heading)}</h3>
          <span part="summary" role="status" data-status="${resolution.status}">${escapeHtml(summary)}</span>
        </div>
        ${
          resolution.total
            ? `<ol part="steps">${rows}</ol>`
            : `<div part="empty">No steps yet.</div>`
        }
      </section>
    `;
  }
}

ProgressBar.register();
RunTrace.register();
