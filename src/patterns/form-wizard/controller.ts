import { Controller } from "../../core/controller.js";
import type {
  WizardEvents,
  WizardSessionConfig,
  WizardState,
  WizardStepValidation,
} from "./types.js";

const createInitialState = (config: WizardSessionConfig): WizardState => ({
  steps: config.steps,
  currentStepId: config.steps[0]?.id ?? "",
  currentStepIndex: 0,
  values: { ...(config.initialValues ?? {}) },
  visitedStepIds: config.steps[0] ? [config.steps[0].id] : [],
  stepError: null,
  submitted: false,
});

/**
 * Headless multi-step form session: owns the step sequence, a value store,
 * and per-step validation gating. Forward navigation and submission run the
 * step's validator; backward navigation and jumps to already-visited steps
 * never re-validate — a reviewer can always go back. The host owns the
 * fields and persistence; the controller owns the choreography.
 */
export class FormWizardController extends Controller<WizardState, WizardEvents> {
  readonly config: WizardSessionConfig;

  constructor(config: WizardSessionConfig) {
    if (!config.steps.length) {
      throw new Error("FormWizardController requires at least one step");
    }
    super(createInitialState(config));
    this.config = config;
  }

  get isFirstStep(): boolean {
    return this.state.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.state.currentStepIndex === this.state.steps.length - 1;
  }

  setValue(field: string, value: unknown): void {
    this.setValues({ [field]: value });
  }

  setValues(patch: Record<string, unknown>): void {
    const values = { ...this.state.values, ...patch };
    this.setState({
      ...this.state,
      values,
      // Editing clears the stale failure — it re-runs on the next gate.
      stepError: null,
    });
    this.emit("valuesChanged", { values });
  }

  /** Validate a step (default: the current one) without navigating. */
  validateStep(stepId: string = this.state.currentStepId): WizardStepValidation {
    const validator = this.config.validators?.[stepId];
    return validator ? validator(this.state.values) : { valid: true };
  }

  /** Advance if the current step passes (or is optional and untouched by a validator). */
  next(): boolean {
    if (this.isLastStep) {
      return false;
    }

    if (!this.gateCurrentStep()) {
      return false;
    }

    this.moveTo(this.state.currentStepIndex + 1);
    return true;
  }

  /** Backward navigation never validates. */
  previous(): boolean {
    if (this.isFirstStep) {
      return false;
    }

    this.moveTo(this.state.currentStepIndex - 1);
    return true;
  }

  /**
   * Jump to a step. Earlier and already-visited steps are always reachable;
   * jumping forward gates every intermediate step in order, stopping (and
   * reporting) on the first failure.
   */
  goTo(stepId: string): boolean {
    const targetIndex = this.state.steps.findIndex(step => step.id === stepId);
    if (targetIndex < 0 || targetIndex === this.state.currentStepIndex) {
      return false;
    }

    if (targetIndex < this.state.currentStepIndex || this.state.visitedStepIds.includes(stepId)) {
      this.moveTo(targetIndex);
      return true;
    }

    for (let index = this.state.currentStepIndex; index < targetIndex; index += 1) {
      if (!this.gateCurrentStep()) {
        return false;
      }
      this.moveTo(index + 1);
    }
    return true;
  }

  /** Emit the values for the host to persist. Never validates — drafts may be incomplete. */
  saveDraft(): void {
    this.emit("draftSaved", { values: this.state.values });
  }

  /**
   * Validate every non-optional step (in order); emit `submitted` when all
   * pass, otherwise navigate to the first failing step and report it.
   */
  submit(): boolean {
    for (const [index, step] of this.state.steps.entries()) {
      if (step.optional) {
        continue;
      }
      const validation = this.validateStep(step.id);
      if (!validation.valid) {
        this.moveTo(index);
        this.setState({ ...this.state, stepError: validation });
        this.emit("stepInvalid", { stepId: step.id, validation });
        return false;
      }
    }

    this.setState({ ...this.state, stepError: null, submitted: true });
    this.emit("submitted", { values: this.state.values });
    return true;
  }

  reset(): void {
    this.setState(createInitialState(this.config));
    this.emit("stepChanged", {
      stepId: this.state.currentStepId,
      stepIndex: this.state.currentStepIndex,
    });
    this.emit("valuesChanged", { values: this.state.values });
  }

  private gateCurrentStep(): boolean {
    const step = this.state.steps[this.state.currentStepIndex];
    if (!step || step.optional) {
      return true;
    }

    const validation = this.validateStep(step.id);
    if (validation.valid) {
      if (this.state.stepError) {
        this.setState({ ...this.state, stepError: null });
      }
      return true;
    }

    this.setState({ ...this.state, stepError: validation });
    this.emit("stepInvalid", { stepId: step.id, validation });
    return false;
  }

  private moveTo(index: number): void {
    const step = this.state.steps[index];
    if (!step) {
      return;
    }

    this.setState({
      ...this.state,
      currentStepId: step.id,
      currentStepIndex: index,
      stepError: null,
      visitedStepIds: this.state.visitedStepIds.includes(step.id)
        ? this.state.visitedStepIds
        : [...this.state.visitedStepIds, step.id],
    });
    this.emit("stepChanged", { stepId: step.id, stepIndex: index });
  }
}
