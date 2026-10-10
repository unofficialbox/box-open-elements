import { FormWizardController } from "./controller.js";
import type {
  WizardEvents,
  WizardStepConfig,
  WizardStepValidator,
  WizardStepStatus,
} from "./types.js";
import { ProgressSteps, STEP_STATE_LABEL, type ProgressStepItem } from "../../components/feedback/progress-steps.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

/** DOM event payloads forwarded from the wizard controller. */
export interface FormWizardEventDetails {
  "step-changed": WizardEvents["stepChanged"];
  "values-changed": WizardEvents["valuesChanged"];
  "step-invalid": WizardEvents["stepInvalid"];
  "draft-saved": WizardEvents["draftSaved"];
  submitted: WizardEvents["submitted"];
}

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
  return (
    typeof step.id === "string" && step.id.length > 0 &&
    typeof step.label === "string" && step.label.length > 0 &&
    (step.description === undefined || typeof step.description === "string") &&
    (step.optional === undefined || typeof step.optional === "boolean")
  );
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        :host([steps-layout="path"]) { container-type: inline-size; container-name: boe-wizard-path; }

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

        [part="body"] { min-width: 0; }

        [part="path-nav"] { display: none; min-width: 0; }
        [part="layout"][data-steps-layout="path"] { grid-template-columns: minmax(0, 1fr); }
        [part="layout"][data-steps-layout="path"] [part="path-nav"] { display: block; }
        [part="layout"][data-steps-layout="path"] [part="rail"] { display: none; }

        [part="path"] {
          display: flex;
          align-items: stretch;
          min-width: 0;
          overflow-x: auto;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        [part="path-item"] { flex: 1 0 6rem; min-width: 0; }
        [part="path-item"]:not(:last-child) { margin-inline-end: -0.55rem; }
        [part="path-step"] {
          appearance: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          width: 100%;
          min-height: 1.75rem;
          padding: 0.45em 1.35rem;
          border: 0;
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.2;
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 0.7rem) 0, 100% 50%, calc(100% - 0.7rem) 100%, 0 100%, 0.7rem 50%);
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="path-item"]:first-child [part="path-step"] {
          clip-path: polygon(0 0, calc(100% - 0.7rem) 0, 100% 50%, calc(100% - 0.7rem) 100%, 0 100%);
          border-start-start-radius: 999px;
          border-end-start-radius: 999px;
        }

        [part="path-item"]:last-child [part="path-step"] {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0.7rem 50%);
          border-start-end-radius: 999px;
          border-end-end-radius: 999px;
        }

        [part="path-item"]:only-child [part="path-step"] { clip-path: none; border-radius: 999px; }
        [part="path-step"]:hover { background: var(--boe-token-surface-item-surface-selected, #f2f7fd); }
        [part="path-step"]:focus-visible {
          outline: 3px solid var(--boe-token-surface-surface-brand, #0061d5);
          outline-offset: -3px;
        }
        [part="path-step"][data-state="complete"] {
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text, #222222);
        }
        [part="path-step"][data-state="visited"] {
          background: var(--boe-token-surface-surface-secondary, #fbfbfb);
          color: var(--boe-token-text-text, #222222);
        }
        [part="path-step"][data-current="true"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font-weight: 700;
        }
        [part="path-step"][data-state="failed"] {
          box-shadow: inset 0 0 0 2px var(--boe-token-surface-status-surface-error, #ed3757);
        }
        [part="path-step"][data-state="failed"][data-current="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 18%, var(--boe-token-surface-surface, #ffffff));
          color: var(--boe-token-text-text, #222222);
        }
        [part="path-marker"] { font-weight: 700; }
        [part="path-optional"] { font-size: 0.7rem; font-weight: 400; }
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

        @media (max-width: 720px) {
          [part="layout"] {
            grid-template-columns: 1fr;
          }
        }

        /* The available column, not the window, decides when a six-step path
           stops being legible. Keep Optional in the accessible button name. */
        @container boe-wizard-path (max-width: 820px) {
          [part="path-label"] { white-space: nowrap; }
          [part="path-optional"] {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            clip: rect(0, 0, 0, 0);
            overflow: hidden;
            white-space: nowrap;
          }
        }

        @container boe-wizard-path (max-width: 720px) {
          [part="layout"][data-steps-layout="path"] [part="path-nav"] { display: none; }
          [part="layout"][data-steps-layout="path"] [part="rail"] { display: block; }
        }

        @media (prefers-reduced-motion: reduce) {
          [part="path-step"] { transition: none; }
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
          color: var(--boe-token-text-status-text-error, #b92340);
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
    return ["draft-label", "heading", "steps", "steps-layout", "submit-label"];
  }

  private controller: FormWizardController | null = null;

  private pendingStart = false;

  private unsubscribeFns: Array<() => void> = [];

  private validatorsValue: Record<string, WizardStepValidator> = {};

  private initialValuesValue: Record<string, unknown> = {};

  private titleEl!: HTMLElement;

  private railEl!: ProgressSteps;

  private layoutEl!: HTMLElement;

  private pathEl!: HTMLOListElement;

  private pathSignature = "";

  private stepStatusesValue: Record<string, WizardStepStatus> = {};

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

  /** `rail` (default) or a full-width chevron path above the panel. */
  get stepsLayout(): "rail" | "path" {
    return this.getAttribute("steps-layout") === "path" ? "path" : "rail";
  }

  set stepsLayout(value: "rail" | "path") {
    this.setAttribute("steps-layout", value);
  }

  /** Optional host status overrides, keyed by step id; they do not bypass validation. */
  get stepStatuses(): Record<string, WizardStepStatus> {
    return { ...this.stepStatusesValue };
  }

  set stepStatuses(value: Record<string, WizardStepStatus>) {
    this.stepStatusesValue = Object.fromEntries(
      Object.entries(value).filter(([, status]) =>
        status === "complete" || status === "visited" || status === "failed"),
    );
    if (this.isRendered) this.update();
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
    const events: Array<[keyof WizardEvents, keyof FormWizardEventDetails]> = [
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
          if (eventName === "stepChanged") {
            queueMicrotask(() => {
              this.panelsEl.querySelector<HTMLElement>('[part="panel"]:not([hidden])')?.focus();
            });
          }
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
    this.pathSignature = "";
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="wizard" aria-label="Form wizard">
        <h2 id="wizard-title" part="title" hidden></h2>
        <div part="layout">
          <nav part="path-nav" aria-label="Wizard steps"><ol part="path"></ol></nav>
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
    this.layoutEl = this.shadowRoot.querySelector('[part="layout"]')!;
    this.pathEl = this.shadowRoot.querySelector('[part="path"]')!;
    this.railEl = this.shadowRoot.querySelector('[part="rail"]') as ProgressSteps;
    this.railEl.compact = true;
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

    this.pathEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[part="path-step"]');
      if (button && this.pathEl.contains(button)) this.selectPathStep(button.dataset.stepId ?? "");
    });
    this.pathEl.addEventListener("keydown", event => this.handlePathKeydown(event));
  }

  private selectPathStep(stepId: string): void {
    if (stepId && stepId !== this.activeStep) this.goTo(stepId);
  }

  private handlePathKeydown(event: KeyboardEvent): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[part="path-step"]');
    if (!button || !this.pathEl.contains(button)) return;
    const buttons = Array.from(this.pathEl.querySelectorAll<HTMLButtonElement>('[part="path-step"]'));
    const index = buttons.indexOf(button);
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else return;
    event.preventDefault();
    const target = buttons[next];
    if (!target) return;
    this.selectPathStep(target.dataset.stepId ?? "");
    queueMicrotask(() => this.pathEl.querySelectorAll<HTMLButtonElement>('[part="path-step"]')[next]?.focus());
  }

  private updatePath(steps: WizardStepConfig[], items: ProgressStepItem[], currentStepId: string): void {
    const signature = JSON.stringify(steps);
    if (signature !== this.pathSignature) {
      this.pathSignature = signature;
      this.pathEl.innerHTML = steps.map((step, index) => `
        <li part="path-item">
          <button type="button" part="path-step" data-step-id="${escapeHtml(step.id)}">
            <span part="path-marker" aria-hidden="true"></span>
            <span part="path-label">${escapeHtml(step.label)}</span>
            ${step.optional ? '<span part="path-optional">Optional</span>' : ""}
            <span part="path-state" class="boe-sr-only"></span>
          </button>
          ${step.description ? `<span id="wizard-path-description-${index}" class="boe-sr-only">${escapeHtml(step.description)}</span>` : ""}
        </li>`).join("");
    }

    const buttons = this.pathEl.querySelectorAll<HTMLButtonElement>('[part="path-step"]');
    buttons.forEach((button, index) => {
      const step = steps[index];
      const item = items[index];
      if (!step || !item) return;
      const isCurrent = step.id === currentStepId;
      const state = item.status ?? (isCurrent ? "current" : index < steps.findIndex(entry => entry.id === currentStepId) ? "complete" : "upcoming");
      button.dataset.state = state;
      button.dataset.current = String(isCurrent);
      button.tabIndex = isCurrent ? 0 : -1;
      button.setAttribute("aria-current", isCurrent ? "step" : "false");
      if (state === "failed") button.setAttribute("aria-invalid", "true");
      else button.removeAttribute("aria-invalid");
      const description = button.parentElement?.querySelector<HTMLElement>(`#wizard-path-description-${index}`);
      if (description) button.setAttribute("aria-describedby", description.id);
      button.querySelector<HTMLElement>('[part="path-state"]')!.textContent = STEP_STATE_LABEL[state];
      button.querySelector<HTMLElement>('[part="path-marker"]')!.textContent = state === "complete" ? "✓" : state === "failed" ? "!" : "";
    });
  }

  /** One panel per step, fed by a slot named after the step id. */
  private rebuildPanels(steps: WizardStepConfig[]): void {
    this.panelsEl.innerHTML = steps
      .map(
        step => `
          <div part="panel" data-step-id="${escapeHtml(step.id)}" role="group" aria-label="${escapeHtml(step.label)}" tabindex="-1" hidden>
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
    this.layoutEl.dataset.stepsLayout = this.stepsLayout;
    this.railEl.toggleAttribute("data-container-compact", this.stepsLayout === "path");

    this.titleEl.hidden = !this.heading;
    this.titleEl.textContent = this.heading;
    const wizard = this.shadowRoot?.querySelector('[part="wizard"]');
    if (this.heading) {
      wizard?.setAttribute("aria-labelledby", "wizard-title");
      wizard?.removeAttribute("aria-label");
    } else {
      wizard?.removeAttribute("aria-labelledby");
      wizard?.setAttribute("aria-label", "Form wizard");
    }

    const signature = JSON.stringify(steps.map(step => step.id));
    if (signature !== this.panelsSignature) {
      this.panelsSignature = signature;
      this.rebuildPanels(steps);
    }

    this.suppressRailEvent = true;
    try {
      this.railEl.label = this.heading ? `${this.heading} steps` : "Wizard steps";
      const furthestVisitedIndex = Math.max(
        -1,
        ...steps.map((step, index) => state?.visitedStepIds.includes(step.id) ? index : -1),
      );
      const items: ProgressStepItem[] = steps.map((step, index) => {
        const visited = state?.visitedStepIds.includes(step.id) ?? false;
        const derivedStatus = visited && step.id !== state?.currentStepId
          ? (index < furthestVisitedIndex || step.optional || state?.submitted ? "complete" : "visited")
          : undefined;
        const status = (step.id === state?.currentStepId && state.stepError ? "failed" : undefined)
          ?? this.stepStatusesValue[step.id]
          ?? derivedStatus;
        return {
          label: step.label,
          value: step.id,
          ...(step.optional ? { optional: true } : {}),
          ...(step.description ? { description: step.description } : {}),
          ...(status ? { status } : {}),
        };
      });
      this.railEl.items = items;
      if (state && this.railEl.value !== state.currentStepId) {
        this.railEl.value = state.currentStepId;
      }
      this.updatePath(steps, items, state?.currentStepId ?? "");
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
