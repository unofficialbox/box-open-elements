const DEFAULT_TAG_NAME = "box-progress-bar";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxProgressBarElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "max", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Progress";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    return Number(this.getAttribute("max") ?? "100");
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get value(): number {
    return Number(this.getAttribute("value") ?? "0");
  }

  set value(value: number) {
    this.setAttribute("value", String(value));
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const max = Math.max(1, this.max);
    const value = clamp(this.value, 0, max);
    const percentage = Math.round((value / max) * 100);

    this.shadowRoot.innerHTML = `
      <div part="progress" role="group" aria-label="${escapeHtml(this.label)} progress">
        <div part="meta">
          <span part="label">${escapeHtml(this.label)}</span>
          <span part="value">${percentage}%</span>
        </div>
        <div
          part="track"
          role="progressbar"
          aria-label="${escapeHtml(this.label)}"
          aria-valuemin="0"
          aria-valuemax="${max}"
          aria-valuenow="${value}"
          aria-valuetext="${percentage}%"
        >
          <span part="indicator" style="width:${percentage}%"></span>
        </div>
      </div>
    `;
  }
}

export const defineBoxProgressBarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxProgressBarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxProgressBarElement;
  }

  customElements.define(tagName, BoxProgressBarElement);
  return BoxProgressBarElement;
};
