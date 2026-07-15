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

export abstract class FormAssociatedElement extends BaseElement {
  static formAssociated = true;

  /** Attributes every form control should observe (merge into subclass lists). */
  static readonly formObservedAttributes = ["name", "invalid", "error-message"] as const;

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
}
