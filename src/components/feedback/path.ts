import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-path";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** One point in a record's lifecycle. */
export interface PathStage {
  id: string;
  label: string;
  /** Optional detail shown under the label on the current stage. */
  description?: string;
}

export type StageState = "complete" | "current" | "upcoming" | "error";

/**
 * Shape of the path.
 *
 * `chevron` is the ribbon: every stage is a filled block carrying its own
 * label, and the notches make the sequence read as directed. `base` is the
 * marker rail — dots joined by a connector, with the label beneath — which is
 * the shape Salesforce's progress indicator calls its base type, and the one
 * that survives a long sequence without the labels colliding.
 */
export type PathVariant = "chevron" | "base";

const PATH_VARIANTS = new Set<PathVariant>(["chevron", "base"]);

/** Assistive text for each state; colour and glyph are not enough on their own. */
const STATE_LABELS: Record<StageState, string> = {
  complete: "Completed",
  current: "Current stage",
  upcoming: "Not started",
  error: "Error",
};

/** Non-colour glyph for the states that carry one. */
const STATE_MARKERS: Partial<Record<StageState, string>> = {
  complete: "✓",
  error: "!",
};

/**
 * Narrow an author-supplied variant, falling back to `chevron`.
 *
 * A typo should render the default shape rather than an unstyled row, which is
 * what an unrecognised `data-variant` would produce — every variant rule is
 * scoped to a known value.
 */
export const resolvePathVariant = (value: string | null | undefined): PathVariant =>
  PATH_VARIANTS.has(value as PathVariant) ? (value as PathVariant) : "chevron";

/** Attribute payloads are author input — validate every record. */
export const isPathStageRecord = (value: unknown): value is PathStage => {
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

/**
 * State of each stage relative to the current one.
 *
 * `hasError` reports a failure at the stage the record is currently sitting
 * at — the shape Salesforce's progress indicator uses, and the right one here:
 * a lifecycle fails where it stopped, so an error is a property of the current
 * position rather than of an arbitrary stage. Stages behind it stay complete;
 * the work up to the failure did happen.
 */
export const resolveStageStates = (
  stages: readonly PathStage[],
  currentId: string,
  hasError = false,
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
          ? hasError
            ? "error"
            : "current"
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
          /* A row, so a stage carrying a description stays one line tall.
             Stacking it doubled the height of every stage in the row —
             align-items: stretch means the tallest stage sets the rest — for a
             detail that belongs beside the label, not under it. The base
             variant, which has the vertical room, stacks instead. */
          flex-direction: row;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.4rem;
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

        [part="stage"][data-state="error"] {
          background: var(--boe-token-surface-status-surface-error, #ed3757);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font-weight: 700;
        }

        /* Assistive-only: the state is otherwise carried by fill and a glyph,
           neither of which reaches a screen reader. aria-current covers the
           current stage but has nothing to say about complete or error. */
        [part="stage-state"] {
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

        /* Marker and label together. A row in the ribbon shapes, where the
           check reads as a prefix to the label; a column in the base rail,
           where the marker is the rail itself and the label hangs beneath it.
           One structure, one axis to flip — no per-variant markup. */
        [part="stage-heading"] {
          display: flex;
          align-items: center;
          justify-content: center;
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

        /* A chevron is too narrow to carry the description: at four stages in a
           760px header each one gets ~190px, and "In Review · With Morgan Lee"
           wrapped to a second line, which — with align-items: stretch — took
           the whole row from 27.5px to 43.3px. Salesforce's path type shows
           labels only for the same reason. The detail stays in the DOM and is
           still reachable via ::part for a host that has the width for it.
           The base rail, which stacks, shows it by default. */
        [part="path"][data-variant="chevron"] [part="stage-description"] {
          display: none;
        }

        [part="stage-marker"] {
          margin-inline-end: 0.3rem;
          font-weight: 700;
        }

        /* Current and upcoming stages carry no glyph. In the ribbon shapes that
           marker would only contribute stray margin; the base variant re-shows
           it, because there the marker *is* the rail. */
        [part="stage-marker"]:empty {
          display: none;
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

        /* ── variant: base ───────────────────────────────────────────────────
           A marker rail: a dot per stage on a connector line, label beneath.
           Unlike the ribbon shapes this keeps its labels out of the fill, so a
           long sequence stays readable where chevrons would crush the text.

           The markers all occupy the same 1.25rem box whatever their state —
           upcoming ones are shrunk with a transform, which is purely visual —
           so the connector can sit at one fixed offset instead of chasing a
           per-state centre. */
        [part="path"][data-variant="base"] [part="stage"] {
          flex-direction: column;
          background: none;
          color: var(--boe-token-text-text, #1a1a1a);
          /* Top-aligned, not centred: the connector is drawn at one fixed
             offset from the stage's top edge, so every marker has to sit at
             that same offset. Centring moved the current stage's marker up by
             the height of its description and left the line joining nothing. */
          justify-content: flex-start;
          padding: 0 0.5rem;
          gap: 0.4rem;
          font-weight: 500;
        }

        /* The segment joining this stage back to the previous one. Painted from
           the previous marker's centre (-50%) to this one's, which lands
           correctly because every stage is an equal flex share. */
        [part="path"][data-variant="base"] [part="stage"]:not(:first-child)::before {
          content: "";
          position: absolute;
          inset-block-start: calc(0.625rem - 1px);
          inset-inline-end: 50%;
          inline-size: 100%;
          block-size: 2px;
          background: var(--boe-token-stroke-stroke, #e8e8e8);
        }

        /* Reached stages pull the line in behind them: the connector is blue up
           to wherever the record got to, grey from there on. */
        /* The failed stage counts as reached, so its incoming segment stays
           brand-coloured: the record did travel that far, and only the marker
           reports the failure. */
        [part="path"][data-variant="base"] [part="stage"]:not([data-state="upcoming"])::before {
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="path"][data-variant="base"] [part="stage-heading"] {
          flex-direction: column;
          gap: 0.4rem;
          inline-size: 100%;
        }

        [part="path"][data-variant="base"] [part="stage-marker"] {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          inline-size: 1.25rem;
          block-size: 1.25rem;
          margin-inline-end: 0;
          border-radius: 999px;
          font-size: 0.68rem;
          line-height: 1;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          transition: transform ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="path"][data-variant="base"] [part="stage"][data-state="upcoming"] [part="stage-marker"] {
          background: var(--boe-token-stroke-stroke, #e8e8e8);
          transform: scale(0.45);
        }

        [part="path"][data-variant="base"] [part="stage"][data-state="error"] [part="stage-marker"] {
          background: var(--boe-token-surface-status-surface-error, #ed3757);
        }

        [part="path"][data-variant="base"] [part="stage"][data-state="current"] [part="stage-label"],
        [part="path"][data-variant="base"] [part="stage"][data-state="error"] [part="stage-label"] {
          font-weight: 700;
        }

        @media (prefers-reduced-motion: reduce) {
          [part="stage"],
          [part="path"][data-variant="base"] [part="stage-marker"] {
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
export class Path extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["current", "has-error", "label", "stages", "variant"];
  }

  private pathEl!: HTMLElement;

  private stagesRaw: string | null = null;

  private stagesCache: PathStage[] = [];

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
  get variant(): PathVariant {
    return resolvePathVariant(this.getAttribute("variant"));
  }

  set variant(value: PathVariant) {
    this.setAttribute("variant", value);
  }

  /** Id of the stage the record is at. An unknown id leaves every stage upcoming. */
  get current(): string {
    return this.getAttribute("current") ?? "";
  }

  set current(value: string) {
    this.setAttribute("current", value);
  }

  /**
   * The record failed at the stage it is currently on — approval rejected, a
   * signature declined. Earlier stages stay complete: the failure is where the
   * lifecycle stopped, not a reset of everything behind it.
   */
  get hasError(): boolean {
    return this.hasAttribute("has-error");
  }

  set hasError(value: boolean) {
    this.toggleAttribute("has-error", value);
  }

  get stages(): PathStage[] {
    const raw = this.getAttribute("stages");
    if (!raw) {
      return [];
    }
    if (raw !== this.stagesRaw) {
      this.stagesRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.stagesCache =
          Array.isArray(parsed) && parsed.every(isPathStageRecord)
            ? (parsed as PathStage[])
            : [];
      } catch {
        this.stagesCache = [];
      }
    }
    return [...this.stagesCache];
  }

  set stages(value: PathStage[]) {
    if (value.length) {
      this.setAttribute("stages", JSON.stringify(value));
      return;
    }
    this.removeAttribute("stages");
  }

  /** State of each stage, in order. */
  get states(): StageState[] {
    return resolveStageStates(this.stages, this.current, this.hasError);
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
    const variant = this.variant;
    const states = resolveStageStates(stages, this.current, this.hasError);

    this.pathEl.setAttribute("aria-label", this.label);
    this.pathEl.dataset.variant = variant;
    this.pathEl.innerHTML = stages
      .map((stage, index) => {
        const state = states[index]!;
        // A second, non-colour signal for the states that have one. Always
        // emitted: the base variant styles this into the rail's marker, and an
        // empty one is hidden by CSS rather than by a branch here.
        const marker = `<span part="stage-marker" aria-hidden="true">${STATE_MARKERS[state] ?? ""}</span>`;
        const isCurrentPosition = state === "current" || state === "error";
        return `
          <li
            part="stage"
            data-stage-id="${escapeHtml(stage.id)}"
            data-state="${state}"
            ${isCurrentPosition ? 'aria-current="step"' : ""}
            ${state === "error" ? 'aria-invalid="true"' : ""}
          >
            <span part="stage-state">${STATE_LABELS[state]}</span>
            <span part="stage-heading">${marker}<span part="stage-label">${escapeHtml(stage.label)}</span></span>
            ${
              isCurrentPosition && stage.description
                ? `<span part="stage-description">${escapeHtml(stage.description)}</span>`
                : ""
            }
          </li>
        `;
      })
      .join("");
  }
}

Path.register();
