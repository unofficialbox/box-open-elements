import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-fieldset";

type DisabledOwnership = {
  control: HTMLElement;
  consumerDisabled: boolean;
  owners: Set<Fieldset>;
  observer: MutationObserver;
  reflected: Array<{ oldValue: string | null; newValue: string | null }>;
};

// A moved control keeps consumer intent separate from each group's reflection.
const disabledOwnership = new WeakMap<HTMLElement, DisabledOwnership>();

const reflectDisabled = (state: DisabledOwnership): void => {
  const disabled = state.consumerDisabled || state.owners.size > 0;
  const oldValue = state.control.getAttribute("disabled");
  if ((oldValue !== null) === disabled) return;
  state.reflected.push({ oldValue, newValue: disabled ? "" : null });
  state.control.toggleAttribute("disabled", disabled);
};

const reconcileDisabledMutations = (
  state: DisabledOwnership,
  records: MutationRecord[],
): void => {
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    // The following oldValue is this mutation's new value. The final record
    // uses the live attribute, so multiple writes in one task remain ordered.
    const newValue = index + 1 < records.length
      ? records[index + 1].oldValue
      : state.control.getAttribute("disabled");
    const reflected = state.reflected[0];
    if (reflected && record.oldValue === reflected.oldValue && newValue === reflected.newValue) {
      state.reflected.shift();
    } else {
      state.consumerDisabled = newValue !== null;
    }
  }
  reflectDisabled(state);
};

const hasNativeDisabledAncestor = (control: HTMLElement): boolean => {
  for (let parent = control.parentElement; parent; parent = parent.parentElement) {
    if (!(parent instanceof HTMLFieldSetElement)) continue;
    const state = disabledOwnership.get(parent);
    // Ignore a native fieldset attribute contributed solely by a custom group
    // that is being re-enabled; retain consumer and still-disabled group intent.
    const disabled = state
      ? state.consumerDisabled || Array.from(state.owners).some(owner => owner.disabled)
      : parent.disabled;
    if (!disabled) continue;
    const firstLegend = Array.from(parent.children).find(child => child.localName === "legend");
    if (!firstLegend?.contains(control)) return true;
  }
  return false;
};

const acquireDisabledControl = (owner: Fieldset, control: HTMLElement): void => {
  let state = disabledOwnership.get(control);
  if (!state) {
    const observer = new MutationObserver(records => reconcileDisabledMutations(state!, records));
    state = { control, consumerDisabled: control.hasAttribute("disabled"), owners: new Set(), observer, reflected: [] };
    disabledOwnership.set(control, state);
    observer.observe(control, { attributes: true, attributeFilter: ["disabled"], attributeOldValue: true });
  } else {
    reconcileDisabledMutations(state, state.observer.takeRecords());
  }
  state.owners.add(owner);
  reflectDisabled(state);
};

const releaseDisabledControl = (owner: Fieldset, control: HTMLElement): void => {
  const state = disabledOwnership.get(control);
  if (!state) return;
  // Capture consumer writes even if the group is re-enabled before the
  // observer callback, including same-value setAttribute writes.
  reconcileDisabledMutations(state, state.observer.takeRecords());
  state.owners.delete(owner);
  reflectDisabled(state);
  if (state.owners.size === 0) {
    state.observer.disconnect();
    disabledOwnership.delete(control);
  }
};

const DESCRIPTION_ID = "box-fieldset-description";

const fieldsetStyles = `
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
    margin: 0 0 0.5rem;
    font-size: 0.86rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="body"] {
    display: grid;
    gap: 0.55rem;
  }
`;

/**
 * A generic form grouping: a `<legend>`, an optional description, and slotted
 * controls. Because slotted controls live in light DOM (outside the shadow
 * `<fieldset>`), native `fieldset[disabled]` propagation cannot reach them, so
 * `disabled` is mirrored onto the light-DOM controls directly. Groups arbitrary
 * fields; use `box-checkbox-group`/`box-radio-group` for option lists.
 */
export class Fieldset extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["description", "disabled", "label"];
  }

  private fieldsetEl!: HTMLFieldSetElement;
  private childrenObserver: MutationObserver | null = null;
  private readonly disabledControls = new Set<HTMLElement>();
  private readonly watchedDefinitions = new Set<string>();
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

  connectedCallback(): void {
    super.connectedCallback();
    this.childrenObserver ??= new MutationObserver(() => this.syncDisabledControls());
    queueMicrotask(() => { if (this.isConnected) this.syncDisabledControls(); });
    this.childrenObserver.observe(this, {
      childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"],
    });
    for (let parent = this.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLFieldSetElement) {
        this.childrenObserver.observe(parent, { attributes: true, attributeFilter: ["disabled"] });
      }
    }
  }

  disconnectedCallback(): void {
    this.childrenObserver?.disconnect();
    this.childrenObserver = null;
    for (const control of this.disabledControls) releaseDisabledControl(this, control);
    this.disabledControls.clear();
    super.disconnectedCallback();
  }

  private ownsControl(control: HTMLElement): boolean {
    for (let parent = control.parentElement; parent && parent !== this; parent = parent.parentElement) {
      if (parent instanceof Fieldset) return false;
    }
    return this.contains(control);
  }

  private awaitControlDefinition(control: HTMLElement): void {
    const tag = control.localName;
    const constructor = customElements.get(tag);
    if (control.namespaceURI !== "http://www.w3.org/1999/xhtml" || !tag.includes("-")
      || (constructor && control instanceof constructor) || this.watchedDefinitions.has(tag)) return;
    this.watchedDefinitions.add(tag);
    // The registry can outlive a detached group whose controls never upgrade.
    const reference = new WeakRef(this);
    void customElements.whenDefined(tag).then(() => {
      const group = reference.deref();
      if (group?.isConnected) group.syncDisabledControls();
    }, () => { /* Reserved/invalid HTML names have no custom definition. */ });
  }

  /** Mirror only this group's contribution, retaining consumer/inner-group intent. */
  private syncDisabledControls(): void {
    // Pending consumer writes must precede inherited-state decisions.
    for (const control of this.disabledControls) {
      const state = disabledOwnership.get(control);
      if (state) reconcileDisabledMutations(state, state.observer.takeRecords());
    }
    const controls = new Set<HTMLElement>();
    if (this.isConnected) {
      for (const control of Array.from(this.querySelectorAll<HTMLElement>("*"))) {
        this.awaitControlDefinition(control);
        const supported = typeof (control as HTMLElement & { disabled?: unknown }).disabled === "boolean";
        // Retain the existing explicit disabled/aria-disabled discovery too.
        if ((supported || control.matches("[disabled], [aria-disabled]")) && this.ownsControl(control)
          && (this.disabled || hasNativeDisabledAncestor(control))) {
          controls.add(control);
        }
      }
    }
    for (const control of this.disabledControls) {
      if (!controls.has(control)) {
        this.disabledControls.delete(control);
        releaseDisabledControl(this, control);
      }
    }
    for (const control of controls) {
      this.disabledControls.add(control);
      acquireDisabledControl(this, control);
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

Fieldset.register();
