export interface WizardStepConfig {
  /** Step id — doubles as the slot name feeding the step's panel. */
  id: string;
  label: string;
  description?: string;
  /** Optional steps can be skipped by Next without passing validation. */
  optional?: boolean;
}

/** Result of validating one step against the current values. */
export interface WizardStepValidation {
  valid: boolean;
  /** Human-readable summary shown by the shell when the step blocks. */
  message?: string;
  /** Field-level errors for hosts that render per-field messaging. */
  fieldErrors?: Record<string, string>;
}

export type WizardStepValidator = (values: Readonly<Record<string, unknown>>) => WizardStepValidation;

export interface WizardSessionConfig {
  steps: WizardStepConfig[];
  /** Per-step gate, keyed by step id. Steps without a validator always pass. */
  validators?: Record<string, WizardStepValidator>;
  /** Seed values (e.g. a restored draft). */
  initialValues?: Record<string, unknown>;
}

export interface WizardState {
  steps: WizardStepConfig[];
  currentStepId: string;
  currentStepIndex: number;
  values: Record<string, unknown>;
  /** Ids the user has reached — the rail lets them jump back to any of these. */
  visitedStepIds: string[];
  /** Last validation failure for the current step; null once it passes or changes. */
  stepError: WizardStepValidation | null;
  /** True after a successful submit(). */
  submitted: boolean;
}

export interface WizardEvents {
  stepChanged: { stepId: string; stepIndex: number };
  valuesChanged: { values: Record<string, unknown> };
  /** The current step blocked navigation or submission. */
  stepInvalid: { stepId: string; validation: WizardStepValidation };
  draftSaved: { values: Record<string, unknown> };
  submitted: { values: Record<string, unknown> };
}

/**
 * One collected value to show on the review step. `stepId` is what makes the
 * Edit link possible: the summary knows which step to send the user back to.
 */
export interface WizardSummaryField {
  /** Key into the wizard's `values`. */
  key: string;
  label: string;
  /** Step this field was collected on. */
  stepId: string;
  /** Display override. Return an empty string to render the not-provided state. */
  format?: (value: unknown) => string;
}

export interface WizardSummaryRow {
  key: string;
  label: string;
  /** Already formatted for display; empty string when nothing was collected. */
  value: string;
  /** Nothing was collected — rendered as a placeholder rather than a blank line. */
  empty: boolean;
}

export interface WizardSummarySection {
  stepId: string;
  label: string;
  rows: WizardSummaryRow[];
  /**
   * The field named a step that is not in `steps`. Surfaced rather than
   * dropped — see `summarizeWizardValues`.
   */
  unknownStep: boolean;
}

const WIZARD_SUMMARY_UNKNOWN_LABEL = "Other answers";

/**
 * Default rendering for a collected value. Deliberately conservative: a
 * boolean reads as Yes/No because `false` is a real answer that must not look
 * like an unanswered question, and an empty array counts as nothing collected.
 */
export const formatWizardValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (Array.isArray(value)) {
    return value.map(entry => formatWizardValue(entry)).filter(Boolean).join(", ");
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    return "";
  }
  return String(value);
};

/**
 * Group collected values into per-step sections for a review card.
 *
 * Sections follow **step order**, not field order, so the summary reads back
 * in the sequence the user filled it in.
 *
 * A field naming a step that does not exist is collected into a trailing
 * section rather than dropped. Dropping would be the dangerous behaviour: the
 * review step exists so someone can confirm what they are about to submit, and
 * a mistyped `stepId` silently hiding an answer would let them confirm a value
 * they never saw. A visibly odd extra section is a bug someone reports; a
 * missing row is a bug nobody notices.
 */
export const summarizeWizardValues = (
  fields: readonly WizardSummaryField[],
  values: Readonly<Record<string, unknown>>,
  steps: readonly WizardStepConfig[],
): WizardSummarySection[] => {
  const order = new Map(steps.map((step, index) => [step.id, index]));
  const sections = new Map<string, WizardSummarySection>();

  for (const field of fields) {
    const known = order.has(field.stepId);
    let section = sections.get(field.stepId);
    if (!section) {
      section = {
        stepId: field.stepId,
        label: known
          ? (steps[order.get(field.stepId)!]?.label ?? field.stepId)
          : WIZARD_SUMMARY_UNKNOWN_LABEL,
        rows: [],
        unknownStep: !known,
      };
      sections.set(field.stepId, section);
    }
    const raw = values[field.key];
    const formatted = field.format ? field.format(raw) : formatWizardValue(raw);
    section.rows.push({
      key: field.key,
      label: field.label,
      value: formatted,
      empty: formatted.length === 0,
    });
  }

  const known = [...sections.values()].filter(section => !section.unknownStep);
  known.sort((left, right) => (order.get(left.stepId) ?? 0) - (order.get(right.stepId) ?? 0));
  return [...known, ...[...sections.values()].filter(section => section.unknownStep)];
};

/** Attribute payloads are author input — validate every record. */
export const isWizardSummaryFieldRecord = (value: unknown): value is WizardSummaryField => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const field = value as Record<string, unknown>;
  return (
    typeof field.key === "string" &&
    field.key.length > 0 &&
    typeof field.label === "string" &&
    field.label.length > 0 &&
    typeof field.stepId === "string" &&
    field.stepId.length > 0
  );
};
