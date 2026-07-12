const DEFAULT_TAG_NAME = "box-fieldset";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const DESCRIPTION_ID = "box-fieldset-description";

/**
 * A generic form grouping: a `<legend>`, an optional description, and slotted
 * controls. Because slotted controls live in light DOM (outside the shadow
 * `<fieldset>`), native `fieldset[disabled]` propagation cannot reach them, so
 * `disabled` is mirrored onto the light-DOM controls directly. Groups arbitrary
 * fields; use `box-checkbox-group`/`box-radio-group` for option lists.
 */
export class BoxFieldsetElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["description", "disabled", "label"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

  connectedCallback(): void {
    this.render();
    this.syncDisabledControls();
  }

  attributeChangedCallback(name: string): void {
    this.render();
    if (name === "disabled") {
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
    const controls = this.querySelectorAll<HTMLElement>("input, select, textarea, button, [disabled], [aria-disabled]");
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const label = this.label;
    const description = this.description;
    const legendMarkup = label ? `<legend part="legend">${escapeHtml(label)}</legend>` : "";
    const descriptionMarkup = description
      ? `<p part="description" id="${DESCRIPTION_ID}">${escapeHtml(description)}</p>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
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
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="description"] {
          margin: 0 0 0.85rem;
          font-size: 0.86rem;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="body"] {
          display: grid;
          gap: 0.75rem;
        }
      </style>
      <fieldset
        part="fieldset"
        data-disabled="${this.disabled ? "true" : "false"}"
        ${this.disabled ? "disabled" : ""}
        ${description ? `aria-describedby="${DESCRIPTION_ID}"` : ""}
      >
        ${legendMarkup}
        ${descriptionMarkup}
        <div part="body">
          <slot></slot>
        </div>
      </fieldset>
    `;
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
