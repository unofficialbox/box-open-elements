import { chartHeader, syncChartHeader, syncChartLegend, bindChartEvents, syncChartPoints } from "./chart-content.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/interaction.js";

const DEFAULT_TAG_NAME = "box-chart-panel";

type ChartPanelAction = {
  id: string;
  label: string;
  tone?: string;
};

type ChartPanelLegendItem = {
  label: string;
  tone?: string;
  value?: string;
};

type ChartPanelPoint = {
  id: string;
  label: string;
  tone?: string;
  value: number;
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

        [part="panel"] {
          display: grid;
          gap: 0.6rem;
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 96%, var(--boe-token-surface-surface, #ffffff) 4%);
        }

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          align-items: start;
          justify-content: space-between;
        }

        [part="meta"] {
          display: grid;
          gap: 0.3rem;
        }

        [part="header-side"] {
          display: grid;
          gap: 0.45rem;
          justify-items: end;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="summary"] {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        [part="timeframe"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          padding: 0.4rem 0.7rem;
          cursor: pointer;
        }

        [part="visual"] {
          padding: 0.65rem;
          border-radius: ${boePanel.radius};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, #eef4fb 12%);
        }

        [part="chart"] {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(3.6rem, 1fr));
          gap: ${boePanel.gap};
          align-items: end;
          min-height: 8.5rem;
        }

        [part="point"] {
          appearance: none;
          display: grid;
          gap: 0.45rem;
          align-content: end;
          padding: 0.45rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: ${boePanel.radius};
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 90%, #eef4fb 10%);
          cursor: pointer;
          font: inherit;
          color: inherit;
          text-align: left;
        }

        [part="point"][data-tone="accent"] {
          border-color: color-mix(in srgb, #5a7cf7 22%, var(--boe-token-stroke-stroke, #e8e8e8) 78%);
          background: color-mix(in srgb, #5a7cf7 8%, var(--boe-token-surface-surface, #ffffff) 92%);
        }

        [part="point"][data-tone="success"] {
          border-color: color-mix(in srgb, #26c281 22%, var(--boe-token-stroke-stroke, #e8e8e8) 78%);
          background: color-mix(in srgb, #26c281 8%, var(--boe-token-surface-surface, #ffffff) 92%);
        }

        [part="bar"] {
          display: block;
          /* Thin, centered columns with a light rounded cap — matches box-bar-chart.
             A full-width bar with the panel's 16px radius reads as a rounded blob
             and flattens the visible height differences between points. */
          inline-size: min(100%, 1.6rem);
          justify-self: center;
          min-block-size: 0.45rem;
          block-size: calc(5.25rem * var(--point-ratio));
          border-radius: 0.6rem 0.6rem 0.4rem 0.4rem;
          background: linear-gradient(180deg, color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 84%, var(--boe-token-surface-surface, #ffffff) 16%) 0%, var(--boe-token-surface-surface-brand, #0061d5) 100%);
          box-shadow: 0 10px 18px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
        }

        [part="point"][data-tone="accent"] [part="bar"] {
          background: linear-gradient(180deg, #5a7cf7 0%, #3f62ea 100%);
        }

        [part="point"][data-tone="success"] [part="bar"] {
          background: linear-gradient(180deg, rgba(38, 194, 129, 0.86) 0%, rgba(19, 138, 88, 0.94) 100%);
        }

        [part="point-label"] {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="point-value"] {
          font-size: 0.82rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="legend"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
        }

        [part="legend-item"] {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.42rem 0.65rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, #eef4fb 14%);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
        }

        [part="legend-item"][data-tone="accent"] {
          border-color: color-mix(in srgb, #5a7cf7 18%, var(--boe-token-stroke-stroke, #e8e8e8) 82%);
          background: color-mix(in srgb, #5a7cf7 7%, var(--boe-token-surface-surface, #ffffff) 93%);
        }

        [part="legend-item"][data-tone="success"] {
          border-color: color-mix(in srgb, #26c281 18%, var(--boe-token-stroke-stroke, #e8e8e8) 82%);
          background: color-mix(in srgb, #26c281 7%, var(--boe-token-surface-surface, #ffffff) 93%);
        }

        [part="legend-swatch"] {
          inline-size: 0.7rem;
          block-size: 0.7rem;
          border-radius: 999px;
          background: linear-gradient(180deg, color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 84%, var(--boe-token-surface-surface, #ffffff) 16%) 0%, var(--boe-token-surface-surface-brand, #0061d5) 100%);
        }

        [part="legend-item"][data-tone="accent"] [part="legend-swatch"] {
          background: linear-gradient(180deg, #5a7cf7 0%, #3f62ea 100%);
        }

        [part="legend-item"][data-tone="success"] [part="legend-swatch"] {
          background: linear-gradient(180deg, rgba(38, 194, 129, 0.86) 0%, rgba(19, 138, 88, 0.94) 100%);
        }

        [part="legend-label"] {
          font-weight: 700;
        }

        [part="legend-value"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boePanel.radius};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeNeutralInteractiveStyles('[part="point"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class ChartPanel extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "heading", "legend", "message", "points", "summary", "timeframe"];
  }
  get actions(): ChartPanelAction[] {
    return this.parseJsonAttribute<ChartPanelAction[]>("actions", []);
  }

  set actions(value: ChartPanelAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get legend(): ChartPanelLegendItem[] {
    return this.parseJsonAttribute<ChartPanelLegendItem[]>("legend", []);
  }

  set legend(value: ChartPanelLegendItem[]) {
    this.setAttribute("legend", JSON.stringify(value));
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

  get points(): ChartPanelPoint[] {
    return this.parseJsonAttribute<ChartPanelPoint[]>("points", []);
  }

  set points(value: ChartPanelPoint[]) {
    this.setAttribute("points", JSON.stringify(value));
  }

  get summary(): string {
    return this.getAttribute("summary") ?? "";
  }

  set summary(value: string) {
    if (!value) {
      this.removeAttribute("summary");
      return;
    }

    this.setAttribute("summary", value);
  }

  get timeframe(): string {
    return this.getAttribute("timeframe") ?? "";
  }

  set timeframe(value: string) {
    if (!value) {
      this.removeAttribute("timeframe");
      return;
    }

    this.setAttribute("timeframe", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Chart";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {

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

  private emitAction(actionId: string): void {
    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail: { action: actionId },
      }),
    );
  }

  private emitPointSelected(point: ChartPanelPoint): void {
    this.dispatchEvent(
      new CustomEvent("point-selected", {
        bubbles: true,
        composed: true,
        detail: point,
      }),
    );
  }

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style><div part="content-host"><article part="panel">${chartHeader}
      <section part="visual"><slot name="chart"><div part="chart" role="list" hidden></div><div part="empty">No chart data available.</div></slot></section><div part="legend" hidden></div></article></div>`;
  }
  protected setupListeners(): void {
    bindChartEvents(this.shadowRoot!,id=>this.emitAction(id),id=>{const point=this.points.find(point=>point.id===id);if(point)this.emitPointSelected(point);});
  }
  protected update(): void {
    if(!this.isRendered)return;
    const root=this.shadowRoot!,points=this.points;
    syncChartHeader(root,this);syncChartLegend(root,this.legend);
    const chart=root.querySelector<HTMLElement>('[part="chart"]')!;chart.hidden=!points.length;chart.setAttribute("aria-label",`${this.heading} chart data`);
    root.querySelector<HTMLElement>('[part="empty"]')!.hidden=!!points.length;
    const max=points.reduce((max,point)=>Math.max(max,point.value),0)||1;
    syncChartPoints(chart,points,"bar",point=>Math.max(point.value,0)/max);
  }
}
ChartPanel.register();
