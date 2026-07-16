import { BaseElement } from "../../core/index.js";
import { boeFocusRingShadow } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-permission-matrix";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type PermissionMatrixOption = {
  label: string;
  value: string;
};

type PermissionMatrixSubject = {
  description?: string;
  id: string;
  name: string;
  type?: string;
};

type PermissionMatrixValue = Record<string, string>;

const matrixStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="matrix"] {
    display: grid;
    gap: 0.55rem;
    padding: 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.7rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
  }

  [part="label"] {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="table"] {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
  }

  [part="table"] th,
  [part="table"] td {
    text-align: left;
    padding: 0.5rem 0.65rem;
    border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
    vertical-align: top;
  }

  [part="table"] th {
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="subject-name"] {
    font-weight: 600;
    color: var(--boe-token-text-text, #1f1e1b);
  }

  [part="subject-description"] {
    margin-top: 0.2rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.94rem;
  }

  [part="subject-type"] {
    display: inline-flex;
    margin-top: 0.45rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  [part="select"] {
    width: 100%;
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 0.94rem;
    font-weight: 600;
    line-height: 1.3;
    padding: 0.4rem 2.25rem 0.4rem 0.7rem;
    cursor: pointer;
  }

  [part="select-shell"] {
    position: relative;
    display: inline-grid;
    width: min(100%, 13rem);
    min-width: 10rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 76%, var(--boe-token-surface-surface, #ffffff) 24%);
    border-radius: 0.55rem;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 0%,
      var(--boe-token-surface-surface, #ffffff) 100%
    );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 1px 2px rgba(15, 23, 42, 0.04);
    transition:
      border-color 140ms ease,
      box-shadow 140ms ease,
      background-color 140ms ease;
  }

  [part="select-shell"]:hover {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, var(--boe-token-stroke-stroke, #e8e8e8) 72%);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface, #ffffff) 96%) 0%,
      var(--boe-token-surface-surface, #ffffff) 100%
    );
  }

  [part="select"]:focus {
    outline: none;
  }

  [part="select"]:focus-visible + [part="select-icon"],
  [part="select-shell"]:has([part="select"]:focus-visible) {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 46%, var(--boe-token-stroke-stroke, #e8e8e8) 54%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      ${boeFocusRingShadow};
  }

  [part="select-shell"]:has([part="select"]:active:not(:disabled)) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
  }

  [part="select"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  [part="select-shell"]:has([part="select"]:disabled) {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }

  [part="select-icon"] {
    position: absolute;
    right: 0.9rem;
    top: 50%;
    width: 0.85rem;
    height: 0.85rem;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="select-icon"]::before,
  [part="select-icon"]::after {
    content: "";
    position: absolute;
    top: 0.32rem;
    width: 0.48rem;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
  }

  [part="select-icon"]::before {
    left: 0.02rem;
    transform: rotate(40deg);
  }

  [part="select-icon"]::after {
    right: 0.02rem;
    transform: rotate(-40deg);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
`;

export class BoxPermissionMatrixElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "subjects", "value"];
  }

  private labelEl!: HTMLElement;
  private tbodyEl!: HTMLElement;
  private structureSignature = "";
  private syncingFromUi = false;

  get label(): string {
    return this.getAttribute("label") ?? "Permission Matrix";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): PermissionMatrixOption[] {
    return this.parseJsonAttribute<PermissionMatrixOption[]>("options", []);
  }

  set options(value: PermissionMatrixOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get subjects(): PermissionMatrixSubject[] {
    return this.parseJsonAttribute<PermissionMatrixSubject[]>("subjects", []);
  }

  set subjects(value: PermissionMatrixSubject[]) {
    this.setAttribute("subjects", JSON.stringify(value));
  }

  get value(): PermissionMatrixValue {
    return this.parseJsonAttribute<PermissionMatrixValue>("value", {});
  }

  set value(value: PermissionMatrixValue) {
    this.setAttribute("value", JSON.stringify(value));
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value" && this.syncingFromUi) {
      return;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private parseJsonAttribute<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private updateSubjectRole(subjectId: string, nextValue: string): void {
    const next = {
      ...this.value,
      [subjectId]: nextValue,
    };
    this.syncingFromUi = true;
    this.value = next;
    this.syncingFromUi = false;
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: next },
      }),
    );
    this.dispatchEvent(
      new CustomEvent("subject-role-changed", {
        bubbles: true,
        composed: true,
        detail: { subjectId, value: nextValue },
      }),
    );
  }

  private structureKey(): string {
    return JSON.stringify({
      options: this.options,
      subjects: this.subjects,
    });
  }

  private renderRows(): string {
    const options = this.options;
    const subjects = this.subjects;
    const currentValue = this.value;

    return subjects
      .map(
        subject => `
          <tr data-subject-id="${escapeHtml(subject.id)}">
            <td>
              <div part="subject-name">${escapeHtml(subject.name)}</div>
              ${subject.description ? `<div part="subject-description">${escapeHtml(subject.description)}</div>` : ""}
              ${subject.type ? `<div part="subject-type">${escapeHtml(subject.type)}</div>` : ""}
            </td>
            <td>
              <label>
                <span class="sr-only">Access for ${escapeHtml(subject.name)}</span>
                <span part="select-shell">
                  <select part="select" data-subject-id="${escapeHtml(subject.id)}">
                    ${options
                      .map(
                        option => `
                          <option value="${escapeHtml(option.value)}" ${currentValue[subject.id] === option.value ? "selected" : ""}>
                            ${escapeHtml(option.label)}
                          </option>
                        `,
                      )
                      .join("")}
                  </select>
                  <span part="select-icon" aria-hidden="true"></span>
                </span>
              </label>
            </td>
          </tr>
        `,
      )
      .join("");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${matrixStyles}</style>
      <section part="matrix">
        <div part="label"></div>
        <table part="table">
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col">Access</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </section>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.tbodyEl = this.shadowRoot.querySelector("tbody")!;
  }

  protected setupListeners(): void {
    this.tbodyEl.addEventListener("change", event => {
      const select = event.target as HTMLSelectElement;
      if (select.getAttribute("part") !== "select") {
        return;
      }
      const subjectId = select.dataset.subjectId;
      if (!subjectId) {
        return;
      }

      this.updateSubjectRole(subjectId, select.value);
    });
  }

  protected update(): void {
    if (!this.labelEl || !this.tbodyEl) {
      return;
    }

    this.labelEl.textContent = this.label;

    const nextSignature = this.structureKey();
    if (nextSignature !== this.structureSignature) {
      this.structureSignature = nextSignature;
      this.tbodyEl.innerHTML = this.renderRows();
      return;
    }

    // Preserve select elements; only patch selected values.
    const currentValue = this.value;
    this.tbodyEl.querySelectorAll<HTMLSelectElement>("[data-subject-id]").forEach(select => {
      const subjectId = select.dataset.subjectId;
      if (!subjectId) {
        return;
      }
      const next = currentValue[subjectId] ?? "";
      if (select !== this.shadowRoot?.activeElement && select.value !== next) {
        select.value = next;
      }
    });
  }
}

export const defineBoxPermissionMatrixElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPermissionMatrixElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPermissionMatrixElement;
  }

  customElements.define(tagName, BoxPermissionMatrixElement);
  return BoxPermissionMatrixElement;
};
