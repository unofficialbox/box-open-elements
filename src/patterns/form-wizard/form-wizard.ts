import { FormWizardController } from "./controller.js";
import type {
  WizardEvents,
  WizardStepConfig,
  WizardStepValidator,
} from "./types.js";
import { ProgressSteps } from "../../components/feedback/progress-steps.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-form-wizard";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Attribute payloads are author input — validate every record. */
const isWizardStepRecord = (value: unknown): value is WizardStepConfig => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const step = value as Record<string, unknown>;
  return typeof step.id === "string" && step.id.length > 0 && typeof step.label === "string";
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="wizard"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="layout"] {
          display: grid;
          grid-template-columns: minmax(180px, 260px) 1fr;
          gap: ${boePanel.gap};
          align-items: start;
        }

        @media (max-width: 720px) {
          [part="layout"] {
            grid-template-columns: 1fr;
          }
        }

        [part="panels"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="panel"][hidden] {
          display: none;
        }

        [part="error"] {
          margin: 0;
          padding: 0.55rem 0.7rem;
          border-radius: ${boeRadius.large};
          font-size: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 10%, var(--boe-token-surface-surface, #ffffff));
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 34%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 72%, black 28%);
        }

        [part="error"][hidden] {
          display: none;
        }

        [part="footer"] {
          display: flex;
          align-items: center;
          gap: ${boePanel.gap};
          padding-top: 0.2rem;
          border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 62%, transparent);
        }

        [part="footer-spacer"] {
          flex: 1;
        }

        [part="back"],
        [part="draft"],
        [part="next"],
        [part="submit"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          min-height: 2.1rem;
          padding: 0.4rem 0.9rem;
          border-radius: ${boeRadius.control};
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="back"],
        [part="draft"] {
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
        }

        [part="back"]:hover:not(:disabled),
        [part="draft"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="back"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        [part="next"],
        [part="submit"] {
          border: 1px solid transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="next"]:hover,
        [part="submit"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, black 12%);
        }

        [part="next"][hidden],
        [part="submit"][hidden],
        [part="draft"][hidden] {
          display: none;
        }

        [part="back"]:focus-visible,
        [part="draft"]:focus-visible,
        [part="next"]:focus-visible,
        [part="submit"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }
      `;

export class FormWizard extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["draft-label", "heading", "steps", "submit-label"];
  }

  private controller: FormWizardController | null = null;

  private pendingStart = false;

  private unsubscribeFns: Array<() => void> = [];

  private validatorsValue: Record<string, WizardStepValidator> = {};

  private initialValuesValue: Record<string, unknown> = {};

  private titleEl!: HTMLElement;

  private railEl!: ProgressSteps;

  private panelsEl!: HTMLElement;

  private errorEl!: HTMLElement;

  private backEl!: HTMLButtonElement;

  private draftEl!: HTMLButtonElement;

  private nextEl!: HTMLButtonElement;

  private submitEl!: HTMLButtonElement;

  private panelsSignature = "";

  private suppressRailEvent = false;

  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    if (!value) {
      this.removeAttribute("heading");
      return;
    }

    this.setAttribute("heading", value);
  }

  /**
   * Step configuration; JSON `[{"id","label","description?","optional?"}]`.
   * A step's id doubles as the slot name feeding its panel.
   */
  get steps(): WizardStepConfig[] {
    const raw = this.getAttribute("steps");
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.every(isWizardStepRecord) ? parsed : [];
    } catch {
      return [];
    }
  }

  set steps(value: WizardStepConfig[]) {
    if (value.length) {
      this.setAttribute("steps", JSON.stringify(value));
      return;
    }

    this.removeAttribute("steps");
  }

  get submitLabel(): string {
    return this.getAttribute("submit-label") ?? "Submit";
  }

  set submitLabel(value: string) {
    this.setAttribute("submit-label", value);
  }

  /** When set, a Save draft button renders and emits `draft-saved`. */
  get draftLabel(): string | null {
    return this.getAttribute("draft-label");
  }

  set draftLabel(value: string | null) {
    if (!value) {
      this.removeAttribute("draft-label");
      return;
    }

    this.setAttribute("draft-label", value);
  }

  get validators(): Record<string, WizardStepValidator> {
    return this.validatorsValue;
  }

  set validators(value: Record<string, WizardStepValidator>) {
    this.validatorsValue = value;
    this.scheduleStart();
  }

  get initialValues(): Record<string, unknown> {
    return this.initialValuesValue;
  }

  set initialValues(value: Record<string, unknown>) {
    this.initialValuesValue = value;
    this.scheduleStart();
  }

  get values(): Record<string, unknown> {
    return this.controller?.getState().values ?? {};
  }

  get activeStep(): string {
    return this.controller?.getState().currentStepId ?? "";
  }

  /** The live session controller. Null until steps are configured. */
  get wizardController(): FormWizardController | null {
    return this.controller;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    // Labels are presentation-only; steps re-create the session.
    if (name === "steps") {
      this.scheduleStart();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.scheduleStart();
  }

  disconnectedCallback(): void {
    this.teardownController();
  }

  setValue(field: string, value: unknown): void {
    this.controller?.setValue(field, value);
  }

  setValues(patch: Record<string, unknown>): void {
    this.controller?.setValues(patch);
  }

  next(): boolean {
    return this.controller?.next() ?? false;
  }

  previous(): boolean {
    return this.controller?.previous() ?? false;
  }

  goTo(stepId: string): boolean {
    return this.controller?.goTo(stepId) ?? false;
  }

  saveDraft(): void {
    this.controller?.saveDraft();
  }

  submit(): boolean {
    return this.controller?.submit() ?? false;
  }

  reset(): void {
    this.controller?.reset();
  }

  private scheduleStart(): void {
    if (this.pendingStart) {
      return;
    }

    this.pendingStart = true;
    queueMicrotask(() => {
      this.pendingStart = false;
      this.startController();
    });
  }

  private startController(): void {
    if (!this.isConnected) {
      return;
    }

    const steps = this.steps;
    if (!steps.length) {
      this.teardownController();
      if (this.isRendered) {
        this.update();
      }
      return;
    }

    this.teardownController();
    const controller = new FormWizardController({
      steps,
      validators: this.validatorsValue,
      initialValues: this.initialValuesValue,
    });
    this.controller = controller;
    this.subscribeToController(controller);
    if (this.isRendered) {
      this.update();
    }
  }

  private subscribeToController(controller: FormWizardController): void {
    const events: Array<[keyof WizardEvents, string]> = [
      ["stepChanged", "step-changed"],
      ["valuesChanged", "values-changed"],
      ["stepInvalid", "step-invalid"],
      ["draftSaved", "draft-saved"],
      ["submitted", "submitted"],
    ];

    this.unsubscribeFns = events.map(([eventName, domEventName]) =>
      controller.subscribe(eventName, payload => {
        this.dispatchEvent(
          new CustomEvent(domEventName, {
            bubbles: true,
            composed: true,
            detail: payload,
          }),
        );
        if (this.isRendered) {
          this.update();
        }
      }),
    );
  }

  private teardownController(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];

    this.controller?.destroy();
    this.controller = null;
    this.panelsSignature = "";
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="wizard" aria-label="Form wizard">
        <h2 part="title" hidden></h2>
        <div part="layout">
          <box-progress-steps part="rail"></box-progress-steps>
          <div part="body">
            <p part="error" role="alert" hidden></p>
            <div part="panels"></div>
          </div>
        </div>
        <footer part="footer">
          <button type="button" part="back">Back</button>
          <span part="footer-spacer"></span>
          <button type="button" part="draft" hidden></button>
          <button type="button" part="next">Next</button>
          <button type="button" part="submit" hidden></button>
        </footer>
      </section>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.railEl = this.shadowRoot.querySelector('[part="rail"]') as ProgressSteps;
    this.panelsEl = this.shadowRoot.querySelector('[part="panels"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error"]')!;
    this.backEl = this.shadowRoot.querySelector('[part="back"]')!;
    this.draftEl = this.shadowRoot.querySelector('[part="draft"]')!;
    this.nextEl = this.shadowRoot.querySelector('[part="next"]')!;
    this.submitEl = this.shadowRoot.querySelector('[part="submit"]')!;
  }

  protected setupListeners(): void {
    this.backEl.addEventListener("click", () => {
      this.previous();
    });
    this.nextEl.addEventListener("click", () => {
      this.next();
    });
    this.submitEl.addEventListener("click", () => {
      this.submit();
    });
    this.draftEl.addEventListener("click", () => {
      this.saveDraft();
    });

    // Rail clicks route through the controller's gating: visited steps are
    // reachable, jumping ahead validates the steps in between.
    this.railEl.addEventListener("value-changed", event => {
      event.stopPropagation();
      if (this.suppressRailEvent) {
        return;
      }
      const stepId = (event as CustomEvent<{ value?: string }>).detail?.value ?? "";
      const current = this.controller?.getState().currentStepId ?? "";
      if (stepId && stepId !== current) {
        this.goTo(stepId);
        // goTo may refuse (or stop partway); re-sync the rail to the truth.
        if (this.isRendered) {
          this.update();
        }
      }
    });
  }

  /** One panel per step, fed by a slot named after the step id. */
  private rebuildPanels(steps: WizardStepConfig[]): void {
    this.panelsEl.innerHTML = steps
      .map(
        step => `
          <div part="panel" data-step-id="${escapeHtml(step.id)}" role="group" aria-label="${escapeHtml(step.label)}" hidden>
            <slot name="${escapeHtml(step.id)}"></slot>
          </div>
        `,
      )
      .join("");
  }

  protected update(): void {
    if (!this.railEl) {
      return;
    }

    const state = this.controller?.getState() ?? null;
    const steps = state?.steps ?? [];

    this.titleEl.hidden = !this.heading;
    this.titleEl.textContent = this.heading;

    const signature = JSON.stringify(steps.map(step => step.id));
    if (signature !== this.panelsSignature) {
      this.panelsSignature = signature;
      this.rebuildPanels(steps);
    }

    this.suppressRailEvent = true;
    try {
      this.railEl.label = this.heading ? `${this.heading} steps` : "Wizard steps";
      this.railEl.items = steps.map(step => ({
        label: step.label,
        value: step.id,
        ...(step.description ? { description: step.description } : {}),
      }));
      if (state && this.railEl.value !== state.currentStepId) {
        this.railEl.value = state.currentStepId;
      }
    } finally {
      this.suppressRailEvent = false;
    }

    this.panelsEl.querySelectorAll<HTMLElement>('[part="panel"]').forEach(panel => {
      panel.hidden = panel.dataset.stepId !== state?.currentStepId;
    });

    const error = state?.stepError ?? null;
    this.errorEl.hidden = !error;
    this.errorEl.textContent = error?.message ?? (error ? "Complete the required fields to continue." : "");

    const isLast = this.controller?.isLastStep ?? false;
    this.backEl.disabled = this.controller?.isFirstStep ?? true;
    this.nextEl.hidden = isLast;
    this.submitEl.hidden = !isLast;
    this.submitEl.textContent = this.submitLabel;
    const draftLabel = this.draftLabel;
    this.draftEl.hidden = !draftLabel;
    if (draftLabel) {
      this.draftEl.textContent = draftLabel;
    }
  }
}

ProgressSteps.register();
FormWizard.register();
