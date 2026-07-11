const DEFAULT_TAG_NAME = "box-spin-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const parseNumber = (value: string | null, fallback: number): number => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export class BoxSpinButtonElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "min", "step", "value"];
  }

  private valueInternal = 0;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Spin Button";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number | null {
    return this.hasAttribute("max") ? parseNumber(this.getAttribute("max"), 0) : null;
  }

  set max(value: number | null) {
    if (value == null) {
      this.removeAttribute("max");
    } else {
      this.setAttribute("max", String(value));
    }
  }

  get min(): number | null {
    return this.hasAttribute("min") ? parseNumber(this.getAttribute("min"), 0) : null;
  }

  set min(value: number | null) {
    if (value == null) {
      this.removeAttribute("min");
    } else {
      this.setAttribute("min", String(value));
    }
  }

  get step(): number {
    return parseNumber(this.getAttribute("step"), 1);
  }

  set step(value: number) {
    this.setAttribute("step", String(value));
  }

  get value(): number {
    return this.valueInternal;
  }

  set value(nextValue: number) {
    const normalizedValue = Number.isFinite(nextValue) ? nextValue : 0;
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = parseNumber(this.getAttribute("value"), 0);
    }

    this.render();
  }

  private clamp(nextValue: number): number {
    let normalizedValue = nextValue;
    if (this.min != null) {
      normalizedValue = Math.max(this.min, normalizedValue);
    }
    if (this.max != null) {
      normalizedValue = Math.min(this.max, normalizedValue);
    }
    return normalizedValue;
  }

  private syncValue(nextValue: number): void {
    const normalizedValue = this.clamp(nextValue);
    this.valueInternal = normalizedValue;
    const input = this.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    if (input) {
      input.value = String(normalizedValue);
    }
    this.syncInputAria(input);
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: normalizedValue },
      }),
    );
  }

  private syncInputAria(input: HTMLInputElement | null): void {
    if (!input) {
      return;
    }

    input.setAttribute("role", "spinbutton");
    input.setAttribute("aria-valuenow", String(this.valueInternal));
    if (this.min != null) {
      input.setAttribute("aria-valuemin", String(this.min));
    }
    if (this.max != null) {
      input.setAttribute("aria-valuemax", String(this.max));
    }
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const minAttribute = this.min == null ? "" : `min="${escapeHtml(String(this.min))}"`;
    const maxAttribute = this.max == null ? "" : `max="${escapeHtml(String(this.max))}"`;

    this.shadowRoot.innerHTML = `
      <div part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <div part="control">
          <button type="button" part="decrement" aria-label="Decrease value" ${this.disabled ? "disabled" : ""}>-</button>
          <input
            type="number"
            part="input"
            value="${escapeHtml(String(this.valueInternal))}"
            step="${escapeHtml(String(this.step))}"
            ${minAttribute}
            ${maxAttribute}
            ${this.disabled ? "disabled" : ""}
          />
          <button type="button" part="increment" aria-label="Increase value" ${this.disabled ? "disabled" : ""}>+</button>
        </div>
      </div>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.addEventListener("input", event => {
      const nextValue = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      this.syncValue(nextValue);
    });

    input?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "ArrowUp") {
        keyboardEvent.preventDefault();
        this.syncValue(this.valueInternal + this.step);
      }

      if (keyboardEvent.key === "ArrowDown") {
        keyboardEvent.preventDefault();
        this.syncValue(this.valueInternal - this.step);
      }

      if (keyboardEvent.key === "Home" && this.min != null) {
        keyboardEvent.preventDefault();
        this.syncValue(this.min);
      }

      if (keyboardEvent.key === "End" && this.max != null) {
        keyboardEvent.preventDefault();
        this.syncValue(this.max);
      }
    });

    this.syncInputAria(input);

    this.shadowRoot.querySelector('[part="decrement"]')?.addEventListener("click", () => {
      this.syncValue(this.valueInternal - this.step);
    });

    this.shadowRoot.querySelector('[part="increment"]')?.addEventListener("click", () => {
      this.syncValue(this.valueInternal + this.step);
    });
  }
}

export const defineBoxSpinButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSpinButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSpinButtonElement;
  }

  customElements.define(tagName, BoxSpinButtonElement);
  return BoxSpinButtonElement;
};
