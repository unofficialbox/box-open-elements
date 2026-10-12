import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/interaction.js";

const DEFAULT_TAG_NAME = "box-governance-panel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type GovernancePanelAction = {
  id: string;
  label: string;
  tone?: string;
};

type GovernancePanelPolicy = {
  description?: string;
  label: string;
  tone?: string;
  value: string;
};

type GovernancePanelSignal = {
  label: string;
  tone?: string;
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
          background: ${boePanel.background};
        }

        [part="header"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="title-row"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.55;
        }

        [part="status"],
        [part="signal"],
        [part="policy-value"] {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.28rem 0.55rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="status"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 14%, var(--boe-token-surface-surface, #ffffff));
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 70%, var(--boe-token-text-text, #222222));
        }

        [part="signal"][data-tone="warning"],
        [part="policy-value"][data-tone="warning"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 16%, var(--boe-token-surface-surface, #ffffff));
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 62%, var(--boe-token-text-text, #222222));
        }

        [part="signal"][data-tone="accent"],
        [part="policy-value"][data-tone="accent"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-accent, #5b4b8a) 12%, var(--boe-token-surface-surface, #ffffff));
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-accent, #5b4b8a) 72%, var(--boe-token-text-text, #222222));
        }

        [part="signals"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        [part="policies"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="section-title"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="policy-list"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="policy"] {
          width: 100%;
          display: grid;
          gap: 0.4rem;
          text-align: left;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 56%, transparent);
          border-radius: ${boePanel.radius};
          padding: 0.65rem 0.75rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="policy-header"] {
          display: flex;
          gap: ${boePanel.gap};
          align-items: start;
          justify-content: space-between;
        }

        [part="policy-label"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="policy-description"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.45;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
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

        ${boeNeutralInteractiveStyles('[part="policy"]')}
        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class GovernancePanel extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "heading", "message", "policies", "signals", "status"];
  }
  get actions(): GovernancePanelAction[] {
    return this.parseJsonAttribute<GovernancePanelAction[]>("actions", []);
  }

  set actions(value: GovernancePanelAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get policies(): GovernancePanelPolicy[] {
    return this.parseJsonAttribute<GovernancePanelPolicy[]>("policies", []);
  }

  set policies(value: GovernancePanelPolicy[]) {
    this.setAttribute("policies", JSON.stringify(value));
  }

  get signals(): GovernancePanelSignal[] {
    return this.parseJsonAttribute<GovernancePanelSignal[]>("signals", []);
  }

  set signals(value: GovernancePanelSignal[]) {
    this.setAttribute("signals", JSON.stringify(value));
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
    return this.getAttribute("heading") ?? "Governance";
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

  private emitPolicySelected(policy: GovernancePanelPolicy): void {
    this.dispatchEvent(
      new CustomEvent("policy-selected", {
        bubbles: true,
        composed: true,
        detail: policy,
      }),
    );
  }

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style>
      <div part="content-host"><section part="panel"><header part="header"><div part="title-row"><h2 part="title"></h2><span part="status" hidden></span></div><div part="message" hidden></div><div part="signals" hidden></div></header>
      <section part="policies" hidden><div part="section-title">Policy Summary</div><div part="policy-list"></div></section><div part="actions" hidden></div></section></div>`;
  }

  protected setupListeners(): void {
    this.shadowRoot!.querySelector('[part="content-host"]')!.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      if (button.getAttribute("part") === "action" && button.dataset.actionId) this.emitAction(button.dataset.actionId);
      if (button.getAttribute("part") === "policy") this.emitPolicySelected({ label: button.dataset.policyLabel ?? "", value: button.dataset.policyValue ?? "", description: button.dataset.policyDescription || undefined, tone: button.dataset.policyTone || undefined });
    });
  }

  protected update(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    root.querySelector('[part="title"]')!.textContent = this.heading;
    for (const [part, value] of [["status", this.status], ["message", this.message]]) {
      const element = root.querySelector<HTMLElement>(`[part="${part}"]`)!; element.textContent = value; element.hidden = !value;
    }
    const signals = root.querySelector<HTMLElement>('[part="signals"]')!; signals.hidden = !this.signals.length;
    signals.innerHTML = this.signals.map(signal => `<span part="signal" data-tone="${escapeHtml(signal.tone ?? "neutral")}">${escapeHtml(signal.label)}</span>`).join("");
    root.querySelector<HTMLElement>('[part="policies"]')!.hidden = !this.policies.length;
    syncKeyedChildren(root.querySelector<HTMLElement>('[part="policy-list"]')!, this.policies, policy => policy.label, () => actionButton("policy"), (button, policy) => {
      button.dataset.policyLabel = policy.label; button.dataset.policyValue = policy.value;
      button.dataset.policyDescription = policy.description ?? ""; button.dataset.policyTone = policy.tone ?? "neutral";
      button.innerHTML = `<span part="policy-header"><span part="policy-label">${escapeHtml(policy.label)}</span><span part="policy-value" data-tone="${escapeHtml(policy.tone ?? "neutral")}">${escapeHtml(policy.value)}</span></span>${policy.description ? `<span part="policy-description">${escapeHtml(policy.description)}</span>` : ""}`;
    });
    const actions = root.querySelector<HTMLElement>('[part="actions"]')!; actions.hidden = !this.actions.length;
    syncKeyedChildren(actions, this.actions, action => action.id, () => actionButton("action"), (button, action) => { button.dataset.actionId = action.id; button.dataset.tone = action.tone ?? "neutral"; button.textContent = action.label; });
  }
}

GovernancePanel.register();
