import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-fieldset";

const DESCRIPTION_ID = "box-fieldset-description";

const fieldsetStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="fieldset"] {
    margin: 0;
    padding: 0;
    border: none;
    min-inline-size: 0;
  }

  [part="fieldset"][data-disabled="true"] {
    opacity: 0.6;
  }

  [part="legend"] {
    margin: 0 0 0.35rem;
    padding: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="description"] {
    margin: 0 0 0.85rem;
    font-size: 0.86rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="body"] {
    display: grid;
    gap: 0.75rem;
  }
`;

/**
 * A generic form grouping: a `<legend>`, an optional description, and slotted
 * controls. Because slotted controls live in light DOM (outside the shadow
 * `<fieldset>`), native `fieldset[disabled]` propagation cannot reach them, so
 * `disabled` is mirrored onto the light-DOM controls directly. Groups arbitrary
 * fields; use `box-checkbox-group`/`box-radio-group` for option lists.
 */
export class BoxFieldsetElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["description", "disabled", "label"];
  }

  private fieldsetEl!: HTMLFieldSetElement;
  private bodyEl!: HTMLElement;
  private legendEl: HTMLLegendElement | null = null;
  private descriptionEl: HTMLParagraphElement | null = null;

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "disabled" && this.isRendered) {
      this.syncDisabledControls();
    }
  }

  /**
   * Reflect the group's disabled state onto the slotted (light-DOM) controls,
   * which the shadow `<fieldset disabled>` cannot reach. Tracks which controls
   * this element disabled so re-enabling never clobbers a control the consumer
   * disabled on its own.
   */
  private syncDisabledControls(): void {
    const controls = this.querySelectorAll<HTMLElement>(
      "input, select, textarea, button, [disabled], [aria-disabled]",
    );
    for (const control of Array.from(controls)) {
      if (this.disabled) {
        if (!control.hasAttribute("disabled")) {
          control.setAttribute("disabled", "");
          control.setAttribute("data-box-fieldset-disabled", "");
        }
      } else if (control.hasAttribute("data-box-fieldset-disabled")) {
        control.removeAttribute("disabled");
        control.removeAttribute("data-box-fieldset-disabled");
      }
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${fieldsetStyles}</style>
      <fieldset part="fieldset">
        <div part="body">
          <slot></slot>
        </div>
      </fieldset>
    `;
    this.fieldsetEl = this.shadowRoot.querySelector('[part="fieldset"]')!;
    this.bodyEl = this.shadowRoot.querySelector('[part="body"]')!;
  }

  protected update(): void {
    if (!this.fieldsetEl || !this.bodyEl) {
      return;
    }

    const label = this.label;
    const description = this.description;

    if (label) {
      if (!this.legendEl) {
        this.legendEl = document.createElement("legend");
        this.legendEl.setAttribute("part", "legend");
        this.fieldsetEl.insertBefore(this.legendEl, this.bodyEl);
      }
      this.legendEl.textContent = label;
    } else if (this.legendEl) {
      this.legendEl.remove();
      this.legendEl = null;
    }

    if (description) {
      if (!this.descriptionEl) {
        this.descriptionEl = document.createElement("p");
        this.descriptionEl.setAttribute("part", "description");
        this.descriptionEl.id = DESCRIPTION_ID;
        this.fieldsetEl.insertBefore(this.descriptionEl, this.bodyEl);
      }
      this.descriptionEl.textContent = description;
      this.fieldsetEl.setAttribute("aria-describedby", DESCRIPTION_ID);
    } else {
      this.descriptionEl?.remove();
      this.descriptionEl = null;
      this.fieldsetEl.removeAttribute("aria-describedby");
    }

    this.fieldsetEl.dataset.disabled = this.disabled ? "true" : "false";
    if (this.disabled) {
      this.fieldsetEl.setAttribute("disabled", "");
    } else {
      this.fieldsetEl.removeAttribute("disabled");
    }

    this.syncDisabledControls();
  }
}

export const defineBoxFieldsetElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxFieldsetElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxFieldsetElement;
  }

  customElements.define(tagName, BoxFieldsetElement);
  return BoxFieldsetElement;
};
