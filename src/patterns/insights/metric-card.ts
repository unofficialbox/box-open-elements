import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/interaction.js";

const DEFAULT_TAG_NAME = "box-metric-card";

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


const elementStyles = `
        :host {
          display: grid;
          min-width: 0;
          color: inherit;
          font: inherit;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="content-host"] {
          display: grid;
          min-width: 0;
        }

        [part="card"] {
          display: grid;
          align-content: start;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
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
          text-transform: none;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="title-row"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.05rem;
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
          text-transform: none;
        }

        [part="value"] {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        :host([size="compact"]) [part="card"] {
          gap: 0.5rem;
          padding: 0.75rem;
        }

        :host([size="compact"]) [part="title"] {
          font-size: 0.8rem;
          font-weight: 500;
          line-height: 1.35;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="value"][data-tone="error"] {
          color: var(--boe-token-text-status-text-error, #b92340);
        }

        [part="value"][data-tone="warning"] {
          color: var(--boe-token-text-status-text-warning, #805600);
        }

        [part="value"][data-tone="success"] {
          color: var(--boe-token-text-status-text-success, #187657);
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
          gap: ${boePanel.gap};
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
          padding: 0.4rem 0.7rem;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class MetricCard extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["action", "eyebrow", "message", "status", "heading", "trend", "value", "size", "tone"];
  }
  get size(): "default" | "compact" {
    return this.getAttribute("size") === "compact" ? "compact" : "default";
  }

  set size(value: "default" | "compact") {
    this.setAttribute("size", value);
  }

  get tone(): "neutral" | "error" | "warning" | "success" {
    const value = this.getAttribute("tone");
    return value === "error" || value === "warning" || value === "success" ? value : "neutral";
  }

  set tone(value: "neutral" | "error" | "warning" | "success") {
    this.setAttribute("tone", value);
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

  get heading(): string {
    return this.getAttribute("heading") ?? "Metric";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
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

  private emitAction(action: MetricCardAction): void {
    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail: action,
      }),
    );
  }

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML=`<style>${elementStyles}[hidden]{display:none!important}</style><div part="content-host"><article part="card"><header part="header"><div part="eyebrow" hidden></div><div part="title-row"><h2 part="title"></h2></div></header><div part="value"></div><div part="message" hidden></div><div part="footer"><div part="trend" hidden></div></div></article></div>`;
  }
  protected setupListeners(): void {
    const footer=this.shadowRoot!.querySelector('[part="footer"]')!;
    footer.addEventListener("click",event=>{
      const button=(event.target as Element).closest<HTMLButtonElement>('[part="action"]');const action=this.action;
      if(button&&footer.contains(button)&&action&&action.id===button.dataset.actionId)this.emitAction(action);
    });
  }
  protected update(): void {
    if(!this.isRendered)return;
    const root=this.shadowRoot!;
    root.querySelector('[part="title"]')!.textContent=this.heading;
    const value=root.querySelector<HTMLElement>('[part="value"]')!;value.textContent=this.value;value.dataset.tone=this.tone;
    for(const [part,text] of [["eyebrow",this.eyebrow],["message",this.message]]){const element=root.querySelector<HTMLElement>(`[part="${part}"]`)!;element.textContent=text;element.hidden=!text;}
    let status=root.querySelector<HTMLElement>('[part="status"]');
    if(this.status){if(!status){status=document.createElement("span");status.setAttribute("part","status");root.querySelector('[part="title-row"]')!.append(status);}status.textContent=this.status;}else status?.remove();
    const trend=root.querySelector<HTMLElement>('[part="trend"]')!,data=this.trend;trend.hidden=!data;trend.textContent=data?.label??"";trend.dataset.direction=data?.direction??"flat";trend.dataset.tone=data?.tone??"neutral";
    const action=this.action;
    syncKeyedChildren(root.querySelector('[part="footer"]')!,action?[action]:[],action=>action.id,()=>actionButton("action"),(button,action)=>{button.dataset.actionId=action.id;button.dataset.tone=action.tone??"neutral";button.textContent=action.label;},trend);
  }
}
MetricCard.register();
