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
