import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-stage-path";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** One point in a record's lifecycle. */
export interface StagePathStage {
  id: string;
  label: string;
  /** Optional detail shown under the label on the current stage. */
  description?: string;
}

export type StageState = "complete" | "current" | "upcoming";

/** Shape of the path: a continuous directed ribbon, or separated pills. */
export type StagePathVariant = "chevron" | "rounded";

const STAGE_PATH_VARIANTS = new Set<StagePathVariant>(["chevron", "rounded"]);

/**
 * Narrow an author-supplied variant, falling back to `chevron`.
 *
 * A typo should render the default shape rather than an unstyled row, which is
 * what an unrecognised `data-variant` would produce — every variant rule is
 * scoped to a known value.
 */
export const resolveStagePathVariant = (value: string | null | undefined): StagePathVariant =>
  STAGE_PATH_VARIANTS.has(value as StagePathVariant) ? (value as StagePathVariant) : "chevron";

/** Attribute payloads are author input — validate every record. */
export const isStagePathStageRecord = (value: unknown): value is StagePathStage => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const stage = value as Record<string, unknown>;
  return (
    typeof stage.id === "string" &&
    stage.id.length > 0 &&
    typeof stage.label === "string" &&
    stage.label.length > 0
  );
};

/** State of each stage relative to the current one. */
export const resolveStageStates = (
  stages: readonly StagePathStage[],
  currentId: string,
): StageState[] => {
  const index = stages.findIndex(stage => stage.id === currentId);
  // An unknown current id means nothing is complete — better than silently
  // marking the whole path done because the host sent a stale value.
  return stages.map((_, position) =>
    index === -1
      ? "upcoming"
      : position < index
        ? "complete"
        : position === index
          ? "current"
          : "upcoming",
  );
};

const elementStyles = `
        :host {
          display: block;
        }

        [part="path"] {
          display: flex;
          flex-wrap: wrap;
          /* stretch, not start: every stage is the height of the tallest, so a
             stage carrying a description does not stand proud of its
             neighbours. The old rule let each stage size itself and the row
             came out ragged. */
          align-items: stretch;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        /* Sizing is taken from box-segmented-control, deliberately: both are a
           horizontal row of equal-weight labels, and they should read at the
           same density rather than each inventing a height. */
        [part="stage"] {
          position: relative;
          flex: 1 1 0;
          min-inline-size: 6rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.1rem;
          padding: 0.45em 1em;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.2;
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="stage"][data-state="complete"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 18%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 72%, black 28%);
        }

        [part="stage"][data-state="current"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font-weight: 700;
        }

        [part="stage-label"] {
          display: block;
        }

        [part="stage-description"] {
          display: block;
          font-size: 0.72rem;
          font-weight: 400;
          opacity: 0.85;
        }

        [part="stage-marker"] {
          margin-inline-end: 0.3rem;
          font-weight: 700;
        }

        /* ── variant: chevron (default) ──────────────────────────────────────
           A notch cut from the following stage plus an arrow on this one, so
           the path reads as a directed sequence rather than a row of pills.
           Drawn with clip-path so no extra elements are needed. The inline
           padding absorbs the arrow so centred text stays optically centred
           rather than drifting into the notch. */
        [part="path"][data-variant="chevron"] [part="stage"] {
          padding-inline: 1.35em;
        }

        [part="path"][data-variant="chevron"] [part="stage"]:first-child {
          border-start-start-radius: 999px;
          border-end-start-radius: 999px;
          padding-inline-start: 1em;
        }

        [part="path"][data-variant="chevron"] [part="stage"]:last-child {
          border-start-end-radius: 999px;
          border-end-end-radius: 999px;
          padding-inline-end: 1em;
        }

        [part="path"][data-variant="chevron"] [part="stage"]:not(:last-child) {
          clip-path: polygon(0 0, calc(100% - 0.7rem) 0, 100% 50%, calc(100% - 0.7rem) 100%, 0 100%, 0.7rem 50%);
          margin-inline-end: -0.55rem;
        }

        [part="path"][data-variant="chevron"] [part="stage"]:first-child:not(:last-child) {
          clip-path: polygon(0 0, calc(100% - 0.7rem) 0, 100% 50%, calc(100% - 0.7rem) 100%, 0 100%);
        }

        [part="path"][data-variant="chevron"] [part="stage"]:last-child:not(:first-child) {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0.7rem 50%);
        }

        /* ── variant: rounded ────────────────────────────────────────────────
           Separated pills rather than a continuous ribbon. The sequence still
           reads left to right, and the list semantics carry the order, so this
           loses decoration rather than meaning. */
        [part="path"][data-variant="rounded"] {
          gap: 0.25rem;
        }

        [part="path"][data-variant="rounded"] [part="stage"] {
          border-radius: ${boeRadius.control};
        }

        @media (prefers-reduced-motion: reduce) {
          [part="stage"] {
            transition: none;
          }
        }

        @media (max-width: 34rem) {
          /* Chevrons collapse below the width where they stop being legible;
             the states still read from tone and the completed marker. */
          [part="path"][data-variant="chevron"] [part="stage"],
          [part="path"][data-variant="chevron"] [part="stage"]:first-child:not(:last-child),
          [part="path"][data-variant="chevron"] [part="stage"]:last-child:not(:first-child) {
            clip-path: none;
            margin-inline-end: 0;
            padding-inline: 1em;
            border-radius: 0;
          }
        }
      `;

/**
 * Horizontal chevron lifecycle tracker for record headers — Draft → In
 * Review → Approved → Executed.
 *
 * Distinct from `box-progress-steps`, which is a vertical setup rail for a
 * task the reader is working through: this states where a *record* sits in
 * its lifecycle, is read-only, and belongs in a header rather than a form.
 *
 * Rendered as an ordered list with the current stage marked `aria-current`,
 * so the sequence and the position are both available without relying on the
 * chevron geometry — which is decoration, and collapses on narrow viewports.
 */
export class StagePath extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["current", "label", "stages", "variant"];
  }

  private pathEl!: HTMLElement;

  private stagesRaw: string | null = null;

  private stagesCache: StagePathStage[] = [];

  get label(): string {
    return this.getAttribute("label") ?? "Lifecycle";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  /**
   * Shape of the path: `chevron` (default) draws a continuous directed ribbon;
   * `rounded` draws separated pills. An unknown value falls back to `chevron`
   * rather than rendering an unstyled row.
   */
  get variant(): StagePathVariant {
    return resolveStagePathVariant(this.getAttribute("variant"));
  }

  set variant(value: StagePathVariant) {
    this.setAttribute("variant", value);
  }

  /** Id of the stage the record is at. An unknown id leaves every stage upcoming. */
  get current(): string {
    return this.getAttribute("current") ?? "";
  }

  set current(value: string) {
    this.setAttribute("current", value);
  }

  get stages(): StagePathStage[] {
    const raw = this.getAttribute("stages");
    if (!raw) {
      return [];
    }
    if (raw !== this.stagesRaw) {
      this.stagesRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.stagesCache =
          Array.isArray(parsed) && parsed.every(isStagePathStageRecord)
            ? (parsed as StagePathStage[])
            : [];
      } catch {
        this.stagesCache = [];
      }
    }
    return [...this.stagesCache];
  }

  set stages(value: StagePathStage[]) {
    if (value.length) {
      this.setAttribute("stages", JSON.stringify(value));
      return;
    }
    this.removeAttribute("stages");
  }

  /** State of each stage, in order. */
  get states(): StageState[] {
    return resolveStageStates(this.stages, this.current);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `<style>${elementStyles}</style><ol part="path"></ol>`;
    this.pathEl = this.shadowRoot.querySelector('[part="path"]')!;
  }

  protected setupListeners(): void {
    // Read-only: a record's lifecycle position is not something a header edits.
  }

  protected update(): void {
    if (!this.pathEl) {
      return;
    }

    const stages = this.stages;
    const states = resolveStageStates(stages, this.current);

    this.pathEl.setAttribute("aria-label", this.label);
    this.pathEl.dataset.variant = this.variant;
    this.pathEl.innerHTML = stages
      .map((stage, index) => {
        const state = states[index]!;
        // The completed marker is a second, non-colour signal for "done".
        const marker = state === "complete" ? `<span part="stage-marker" aria-hidden="true">✓</span>` : "";
        return `
          <li
            part="stage"
            data-stage-id="${escapeHtml(stage.id)}"
            data-state="${state}"
            ${state === "current" ? 'aria-current="step"' : ""}
          >
            <span part="stage-label">${marker}${escapeHtml(stage.label)}</span>
            ${
              state === "current" && stage.description
                ? `<span part="stage-description">${escapeHtml(stage.description)}</span>`
                : ""
            }
          </li>
        `;
      })
      .join("");
  }
}

StagePath.register();
