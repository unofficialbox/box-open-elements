const DEFAULT_TAG_NAME = "box-metric-card";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type MetricCardAction = {
  id: string;
  label: string;
  tone?: string;
};

type MetricCardTrend = {
  direction?: "up" | "down" | "flat";
  label: string;
  tone?: string;
};

export class BoxMetricCardElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["action", "eyebrow", "message", "status", "title", "trend", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get action(): MetricCardAction | null {
    return this.parseJsonAttribute<MetricCardAction | null>("action", null);
  }

  set action(value: MetricCardAction | null) {
    if (!value) {
      this.removeAttribute("action");
      return;
    }

    this.setAttribute("action", JSON.stringify(value));
  }

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    if (!value) {
      this.removeAttribute("eyebrow");
      return;
    }

    this.setAttribute("eyebrow", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    if (!value) {
      this.removeAttribute("message");
      return;
    }

    this.setAttribute("message", value);
  }

  get status(): string {
    return this.getAttribute("status") ?? "";
  }

  set status(value: string) {
    if (!value) {
      this.removeAttribute("status");
      return;
    }

    this.setAttribute("status", value);
  }

  get title(): string {
    return this.getAttribute("title") ?? "Metric";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get trend(): MetricCardTrend | null {
    return this.parseJsonAttribute<MetricCardTrend | null>("trend", null);
  }

  set trend(value: MetricCardTrend | null) {
    if (!value) {
      this.removeAttribute("trend");
      return;
    }

    this.setAttribute("trend", JSON.stringify(value));
  }

  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
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

  private emitAction(action: MetricCardAction): void {
    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail: action,
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const action = this.action;
    const trend = this.trend;
    const eyebrowMarkup = this.eyebrow ? `<div part="eyebrow">${escapeHtml(this.eyebrow)}</div>` : "";
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const statusMarkup = this.status ? `<span part="status">${escapeHtml(this.status)}</span>` : "";
    const trendMarkup = trend
      ? `<div part="trend" data-direction="${escapeHtml(trend.direction ?? "flat")}" data-tone="${escapeHtml(trend.tone ?? "neutral")}">${escapeHtml(trend.label)}</div>`
      : "";
    const actionMarkup = action
      ? `<button type="button" part="action" data-action-id="${escapeHtml(action.id)}" data-tone="${escapeHtml(action.tone ?? "neutral")}">${escapeHtml(action.label)}</button>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="card"] {
          display: grid;
          gap: 0.75rem;
          padding: 0.95rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 96%, var(--boe-token-surface-surface, #ffffff) 4%);
        }

        [part="header"] {
          display: grid;
          gap: 0.25rem;
        }

        [part="eyebrow"] {
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="title-row"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }

        [part="title"] {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="status"] {
          display: inline-flex;
          align-items: center;
          padding: 0.22rem 0.5rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="value"] {
          font-size: 1.95rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.42;
        }

        [part="footer"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.65rem;
        }

        [part="trend"] {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.22rem 0.48rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-tertiary, #e8e8e8) 72%, var(--boe-token-surface-surface, #ffffff) 28%);
          color: var(--boe-token-text-text, #222222);
          font-size: 0.76rem;
          font-weight: 700;
        }

        [part="trend"][data-direction="up"] {
          background: color-mix(in srgb, #26c281 14%, var(--boe-token-surface-surface, #ffffff) 86%);
          color: #138a58;
        }

        [part="trend"][data-direction="down"] {
          background: color-mix(in srgb, #ed3757 14%, var(--boe-token-surface-surface, #ffffff) 86%);
          color: #bf2340;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          padding: 0.58rem 0.9rem;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="action"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <article part="card">
        <header part="header">
          ${eyebrowMarkup}
          <div part="title-row">
            <div part="title">${escapeHtml(this.title)}</div>
            ${statusMarkup}
          </div>
        </header>
        <div part="value">${escapeHtml(this.value)}</div>
        ${messageMarkup}
        <div part="footer">
          ${trendMarkup}
          ${actionMarkup}
        </div>
      </article>
    `;

    if (action) {
      this.shadowRoot.querySelector('[part="action"]')?.addEventListener("click", () => {
        this.emitAction(action);
      });
    }
  }
}

export const defineBoxMetricCardElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxMetricCardElement);
  }
};
