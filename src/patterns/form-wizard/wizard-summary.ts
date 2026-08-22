import {
  isWizardSummaryFieldRecord,
  summarizeWizardValues,
} from "./types.js";
import type { WizardStepConfig, WizardSummaryField } from "./types.js";
import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-wizard-summary";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

        [part="heading"] {
          margin: 0;
          padding: 0.85rem 1rem;
          font: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
          border-block-end: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
        }

        [part="sections"] {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        [part="section"] + [part="section"] {
          border-block-start: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 55%, transparent);
        }

        [part="section-header"] {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          padding: 0.7rem 1rem 0.3rem;
        }

        [part="section-label"] {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="edit"] {
          margin-inline-start: auto;
          appearance: none;
          font: inherit;
          font-size: 0.78rem;
          padding: 0.15rem 0.5rem;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: ${boeRadius.control};
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          cursor: pointer;
        }

        [part="edit"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="edit"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="rows"] {
          margin: 0;
          padding: 0 1rem 0.8rem;
          display: grid;
          grid-template-columns: minmax(8rem, 14rem) 1fr;
          gap: 0.3rem 1rem;
        }

        [part="row-label"] {
          margin: 0;
          font-size: 0.85rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="row-value"] {
          margin: 0;
          font-size: 0.85rem;
          color: var(--boe-token-text-text, #1f1e1b);
          overflow-wrap: anywhere;
        }

        [part="row-value"][data-empty="true"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-style: italic;
        }

        [part="empty"] {
          padding: 1.2rem 1rem;
          text-align: center;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

/**
 * The review step of a `box-form-wizard`: everything collected so far, grouped
 * by the step that collected it, with an Edit link per group.
 *
 * The card is read-only and emits `edit-requested` rather than navigating
 * itself, so the host stays in charge of the wizard — the same intent contract
 * the rest of the patterns use.
 *
 * Two details carry the weight:
 *
 * - Sections follow **step order**, so the summary reads back in the sequence
 *   the user filled it in rather than in whatever order the fields were
 *   declared.
 * - A field naming a step that does not exist lands in a trailing section
 *   instead of vanishing. A review card exists so someone can confirm what
 *   they are submitting; silently dropping a row would let them confirm a
 *   value they were never shown.
 */
export class WizardSummary extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["edit-label", "empty-text", "fields", "heading", "steps", "values"];
  }

  private hostEl!: HTMLElement;

  private fieldsRaw: string | null = null;

  private fieldsCache: WizardSummaryField[] = [];

  private stepsRaw: string | null = null;

  private stepsCache: WizardStepConfig[] = [];

  private valuesRaw: string | null = null;

  private valuesCache: Record<string, unknown> = {};

  get heading(): string {
    return this.getAttribute("heading") ?? "Review your answers";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /** Verb on the per-section control. The step label is appended for its accessible name. */
  get editLabel(): string {
    return this.getAttribute("edit-label") ?? "Edit";
  }

  set editLabel(value: string) {
    this.setAttribute("edit-label", value);
  }

  /** Placeholder for a field with nothing collected. */
  get emptyText(): string {
    return this.getAttribute("empty-text") ?? "Not provided";
  }

  set emptyText(value: string) {
    this.setAttribute("empty-text", value);
  }

  /**
   * Fields to summarise. Note that `format` cannot survive the attribute
   * round-trip — set the property directly when a field needs one.
   */
  get fields(): WizardSummaryField[] {
    const raw = this.getAttribute("fields");
    if (!raw) {
      return [...this.fieldsCache];
    }
    if (raw !== this.fieldsRaw) {
      this.fieldsRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.fieldsCache =
          Array.isArray(parsed) && parsed.every(isWizardSummaryFieldRecord)
            ? (parsed as WizardSummaryField[])
            : [];
      } catch {
        this.fieldsCache = [];
      }
    }
    return [...this.fieldsCache];
  }

  /**
   * Setting any of `fields`, `steps`, or `values` as a **property** stores the
   * value as-is and re-renders. It is not mirrored to the attribute, because
   * these carry things a JSON round-trip destroys — a field's `format`
   * function, a `Date` in the collected values. The attributes remain the
   * declarative path for plain records; whichever is set last wins.
   */
  set fields(value: WizardSummaryField[]) {
    this.fieldsCache = [...value];
    this.fieldsRaw = null;
    this.removeAttribute("fields");
    this.update();
  }

  get steps(): WizardStepConfig[] {
    const raw = this.getAttribute("steps");
    if (!raw) {
      return [...this.stepsCache];
    }
    if (raw !== this.stepsRaw) {
      this.stepsRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.stepsCache = Array.isArray(parsed)
          ? (parsed.filter(
              step =>
                typeof step === "object" &&
                step !== null &&
                typeof (step as Record<string, unknown>).id === "string" &&
                typeof (step as Record<string, unknown>).label === "string",
            ) as WizardStepConfig[])
          : [];
      } catch {
        this.stepsCache = [];
      }
    }
    return [...this.stepsCache];
  }

  set steps(value: WizardStepConfig[]) {
    this.stepsCache = [...value];
    this.stepsRaw = null;
    this.removeAttribute("steps");
    this.update();
  }

  get values(): Record<string, unknown> {
    const raw = this.getAttribute("values");
    if (!raw) {
      return { ...this.valuesCache };
    }
    if (raw !== this.valuesRaw) {
      this.valuesRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.valuesCache =
          typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : {};
      } catch {
        this.valuesCache = {};
      }
    }
    return { ...this.valuesCache };
  }

  set values(value: Record<string, unknown>) {
    this.valuesCache = { ...value };
    this.valuesRaw = null;
    this.removeAttribute("values");
    this.update();
  }

  /** The sections as rendered — same order, so a host can mirror the card. */
  get sections(): ReturnType<typeof summarizeWizardValues> {
    return summarizeWizardValues(this.fields, this.values, this.steps);
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
      const trigger = (event.target as HTMLElement).closest('[part="edit"]');
      if (!trigger) {
        return;
      }
      const stepId = trigger.getAttribute("data-step-id");
      if (stepId === null) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent("edit-requested", {
          detail: { stepId },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    const sections = this.sections;
    const body = sections.length
      ? `<ul part="sections" role="list">${sections
          .map(section => {
            const rows = section.rows
              .map(row => {
                const shown = row.empty ? this.emptyText : row.value;
                return `
                  <dt part="row-label">${escapeHtml(row.label)}</dt>
                  <dd part="row-value" data-empty="${String(row.empty)}" data-key="${escapeHtml(row.key)}">${escapeHtml(shown)}</dd>
                `;
              })
              .join("");
            // The accessible name carries the step, because a screen-reader
            // user hearing five buttons all called "Edit" learns nothing about
            // which one goes where.
            const edit = section.unknownStep
              ? ""
              : `<button type="button" part="edit" data-step-id="${escapeHtml(section.stepId)}" aria-label="${escapeHtml(`${this.editLabel} ${section.label}`)}">${escapeHtml(this.editLabel)}</button>`;
            return `
              <li part="section" data-step-id="${escapeHtml(section.stepId)}" data-unknown-step="${String(section.unknownStep)}">
                <div part="section-header">
                  <span part="section-label">${escapeHtml(section.label)}</span>
                  ${edit}
                </div>
                <dl part="rows">${rows}</dl>
              </li>
            `;
          })
          .join("")}</ul>`
      : `<div part="empty">Nothing to review yet.</div>`;

    this.hostEl.innerHTML = `
      <section part="card" aria-label="${escapeHtml(this.heading)}">
        <h3 part="heading">${escapeHtml(this.heading)}</h3>
        ${body}
      </section>
    `;
  }
}

WizardSummary.register();
