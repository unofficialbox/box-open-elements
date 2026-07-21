import { BaseElement } from "./element.js";

/**
 * Form-associated custom element base for Batch 5.
 *
 * Subclasses set `static formAssociated = true` (inherited), call
 * `syncFormAssociation()` whenever the submitted value or validity changes,
 * and implement `getFormValue` / `restoreFormValue`.
 *
 * jsdom's `ElementInternals` stubs omit `setFormValue` / `setValidity`; we keep
 * a mirror store so unit tests can assert submission values via
 * `getMirroredFormValue`.
 */

export type FormValue = string | File | FormData | null;

const mirroredFormValues = new WeakMap<ElementInternals, FormValue>();

export const getMirroredFormValue = (internals: ElementInternals): FormValue =>
  mirroredFormValues.get(internals) ?? null;

/** Build a multi-entry FormData payload (empty selection → `null`). */
export const formDataFromNamedValues = (
  name: string,
  values: readonly string[],
): FormData | null => {
  if (values.length === 0) {
    return null;
  }
  const key = name || "value";
  const data = new FormData();
  for (const value of values) {
    data.append(key, value);
  }
  return data;
};

/** Restore string[] from FormData / JSON / comma-separated / single string. */
export const stringValuesFromFormValue = (value: FormValue, name: string): string[] => {
  if (value instanceof FormData) {
    const key = name || "value";
    return value.getAll(key).map(entry => String(entry));
  }
  if (typeof value !== "string" || value === "") {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(entry => String(entry));
    }
  } catch {
    // fall through
  }
  if (value.includes(",")) {
    return value
      .split(",")
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0);
  }
  return [value];
};

/** Range pair as FormData (`${name}-start` / `${name}-end`). */
export const formDataFromRange = (
  name: string,
  start: number,
  end: number,
): FormData => {
  const base = name || "range";
  const data = new FormData();
  data.append(`${base}-start`, String(start));
  data.append(`${base}-end`, String(end));
  return data;
};

export const rangeFromFormValue = (
  value: FormValue,
  name: string,
  fallback: { start: number; end: number },
): { start: number; end: number } => {
  if (value instanceof FormData) {
    const base = name || "range";
    const startRaw = value.get(`${base}-start`);
    const endRaw = value.get(`${base}-end`);
    const start = startRaw == null ? fallback.start : Number(startRaw);
    const end = endRaw == null ? fallback.end : Number(endRaw);
    return {
      start: Number.isFinite(start) ? start : fallback.start,
      end: Number.isFinite(end) ? end : fallback.end,
    };
  }
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value) as { start?: unknown; end?: unknown };
      const start = Number(parsed.start);
      const end = Number(parsed.end);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        return { start, end };
      }
    } catch {
      // fall through
    }
  }
  return fallback;
};

const writeFormValue = (internals: ElementInternals, value: FormValue): void => {
  mirroredFormValues.set(internals, value);
  const setFormValue = (
    internals as ElementInternals & {
      setFormValue?: (value: FormValue) => void;
    }
  ).setFormValue;
  if (typeof setFormValue === "function") {
    setFormValue.call(internals, value);
  }
};

const writeValidity = (
  internals: ElementInternals,
  invalid: boolean,
  message: string,
): void => {
  const setValidity = (
    internals as ElementInternals & {
      setValidity?: (flags: ValidityStateFlags, message?: string) => void;
    }
  ).setValidity;
  if (typeof setValidity !== "function") {
    return;
  }
  if (invalid) {
    setValidity.call(internals, { customError: true }, message || "Invalid value");
  } else {
    setValidity.call(internals, {});
  }
};

/** Shared invalid-state styles using the status-error token. */
export const boeFormFieldErrorStyles = `
  :host([invalid]) [part="input"],
  :host([invalid]) [part="textarea"],
  :host([invalid]) [part="select"],
  :host([invalid]) [part="control"],
  :host([invalid]) [part="editor"] {
    border-color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  :host([invalid]) [part="input"]:focus-visible,
  :host([invalid]) [part="textarea"]:focus-visible,
  :host([invalid]) [part="select"]:focus-visible,
  :host([invalid]) [part="control"]:focus-visible {
    border-color: var(--boe-token-surface-status-surface-error, #ed3757);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 22%, transparent);
  }

  [part="error-message"] {
    margin: 0;
    color: var(--boe-token-surface-status-surface-error, #ed3757);
    font-size: 0.82rem;
    line-height: 1.35;
  }

  [part="error-message"][hidden] {
    display: none;
  }
`;

export const FORM_ERROR_MESSAGE_ID = "boe-field-error";

export const formErrorMessageMarkup = (): string =>
  `<p part="error-message" id="${FORM_ERROR_MESSAGE_ID}" role="alert" hidden></p>`;

export const FORM_DESCRIPTION_ID = "boe-field-description";

/** Optional help text rendered under the label (shown only when `description` is set). */
export const formDescriptionMarkup = (): string =>
  `<p part="description" id="${FORM_DESCRIPTION_ID}" hidden></p>`;

/**
 * Shared chrome for the field-feature set: help-text `description`, the
 * `required` indicator, and the visually-hidden `hide-label` treatment.
 * Include alongside `boeFormFieldErrorStyles` in a field's stylesheet.
 */
export const boeFormFieldSupportStyles = `
  [part="description"] {
    margin: 0;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.82rem;
    line-height: 1.35;
  }

  [part="description"][hidden] {
    display: none;
  }

  [part="label"] .boe-required-mark {
    margin-inline-start: 2px;
    color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  :host([hide-label]) [part="label"] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

export abstract class FormAssociatedElement extends BaseElement {
  static formAssociated = true;

  /** Attributes every form control should observe (merge into subclass lists). */
  static readonly formObservedAttributes = ["name", "invalid", "error-message"] as const;

  /**
   * `formObservedAttributes` plus the shared field-feature attributes
   * (`required`, `description`, `hide-label`). A field that renders a label +
   * `formDescriptionMarkup()` and calls `applyFieldSupport()` should observe
   * these instead.
   */
  static readonly fieldObservedAttributes = [
    "name",
    "invalid",
    "error-message",
    "required",
    "description",
    "hide-label",
  ] as const;

  /** ElementInternals for form association (public for tests / advanced hosts). */
  readonly internals: ElementInternals;
  private defaultFormValue: FormValue = null;
  private defaultCaptured = false;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  get name(): string {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    if (value) {
      this.setAttribute("name", value);
    } else {
      this.removeAttribute("name");
    }
  }

  get invalid(): boolean {
    return this.hasAttribute("invalid");
  }

  set invalid(value: boolean) {
    this.toggleAttribute("invalid", Boolean(value));
  }

  get errorMessage(): string {
    return this.getAttribute("error-message") ?? "";
  }

  set errorMessage(value: string) {
    if (value) {
      this.setAttribute("error-message", value);
    } else {
      this.removeAttribute("error-message");
    }
  }

  get required(): boolean {
    return this.hasAttribute("required");
  }

  set required(value: boolean) {
    this.toggleAttribute("required", Boolean(value));
  }

  /** Help text rendered under the label (empty string hides it). */
  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    if (value) {
      this.setAttribute("description", value);
    } else {
      this.removeAttribute("description");
    }
  }

  /** Keep the label for assistive tech but hide it visually. */
  get hideLabel(): boolean {
    return this.hasAttribute("hide-label");
  }

  set hideLabel(value: boolean) {
    this.toggleAttribute("hide-label", Boolean(value));
  }

  /** Value reported to the owning form (`null` omits the control). */
  protected abstract getFormValue(): FormValue;

  /** Restore a value from form reset / autocomplete. */
  protected abstract restoreFormValue(value: FormValue): void;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.defaultCaptured) {
      this.defaultFormValue = this.getFormValue();
      this.defaultCaptured = true;
    }
    this.syncFormAssociation();
  }

  formResetCallback(): void {
    this.restoreFormValue(this.defaultFormValue);
    this.syncFormAssociation();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.restoreFormValue(state as FormValue);
    this.syncFormAssociation();
  }

  /** Push the current value + validity into ElementInternals. */
  protected syncFormAssociation(): void {
    const disabled = this.hasAttribute("disabled");
    writeFormValue(this.internals, disabled ? null : this.getFormValue());
    writeValidity(this.internals, this.invalid, this.errorMessage);
  }

  /**
   * Apply `aria-invalid` / `aria-errormessage` on the focusable control and
   * update the error message region.
   */
  protected applyInvalidState(
    control: HTMLElement | null | undefined,
    messageEl: HTMLElement | null | undefined,
  ): void {
    this.applyInvalidStateToControls(control ? [control] : [], messageEl);
  }

  /** Apply invalid ARIA to every focusable control in a multi-option field. */
  protected applyInvalidStateToControls(
    controls: Iterable<HTMLElement | null | undefined>,
    messageEl: HTMLElement | null | undefined,
  ): void {
    const invalid = this.invalid;
    const message = this.errorMessage;

    for (const control of controls) {
      if (!control) {
        continue;
      }
      control.setAttribute("aria-invalid", String(invalid));
      if (invalid && message) {
        control.setAttribute("aria-errormessage", FORM_ERROR_MESSAGE_ID);
      } else {
        control.removeAttribute("aria-errormessage");
      }
    }

    if (messageEl) {
      messageEl.textContent = message;
      messageEl.hidden = !(invalid && Boolean(message));
    }

    this.syncFormAssociation();
  }

  /**
   * Apply the shared field features to a rendered field: the `required`
   * indicator + `aria-required` on the control, the `description` help text +
   * `aria-describedby`, and the `hide-label` visually-hidden treatment (handled
   * in CSS via `:host([hide-label])`). Call after setting the label's text
   * content each update, since setting `textContent` clears the appended mark.
   */
  protected applyFieldSupport(
    labelEl: HTMLElement | null | undefined,
    control: HTMLElement | null | undefined,
    descriptionEl: HTMLElement | null | undefined,
  ): void {
    const required = this.required;
    const description = this.description;

    if (labelEl) {
      const existing = labelEl.querySelector(".boe-required-mark");
      if (required && !existing) {
        const mark = document.createElement("span");
        mark.className = "boe-required-mark";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = "*";
        labelEl.append(mark);
      } else if (!required && existing) {
        existing.remove();
      }
    }

    if (control) {
      control.toggleAttribute("required", required);
      control.setAttribute("aria-required", String(required));
      if (description) {
        control.setAttribute("aria-describedby", FORM_DESCRIPTION_ID);
      } else {
        control.removeAttribute("aria-describedby");
      }
    }

    if (descriptionEl) {
      descriptionEl.textContent = description;
      descriptionEl.hidden = description.length === 0;
    }
  }
}
