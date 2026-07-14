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

export class BoxGovernancePanelElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "message", "policies", "signals", "status", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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

  get title(): string {
    return this.getAttribute("title") ?? "Governance";
  }

  set title(value: string) {
    this.setAttribute("title", value);
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const statusMarkup = this.status ? `<span part="status">${escapeHtml(this.status)}</span>` : "";
    const signalsMarkup = this.signals.length
      ? `
          <div part="signals">
            ${this.signals
              .map(
                signal => `
                  <span part="signal" data-tone="${escapeHtml(signal.tone ?? "neutral")}">${escapeHtml(signal.label)}</span>
                `,
              )
              .join("")}
          </div>
        `
      : "";
    const policiesMarkup = this.policies.length
      ? `
          <section part="policies">
            <div part="section-title">Policy Summary</div>
            <div part="policy-list">
              ${this.policies
                .map(
                  policy => `
                    <button
                      type="button"
                      part="policy"
                      data-policy-label="${escapeHtml(policy.label)}"
                      data-policy-value="${escapeHtml(policy.value)}"
                      data-policy-description="${escapeHtml(policy.description ?? "")}"
                      data-policy-tone="${escapeHtml(policy.tone ?? "neutral")}"
                    >
                      <span part="policy-header">
                        <span part="policy-label">${escapeHtml(policy.label)}</span>
                        <span part="policy-value" data-tone="${escapeHtml(policy.tone ?? "neutral")}">${escapeHtml(policy.value)}</span>
                      </span>
                      ${policy.description ? `<span part="policy-description">${escapeHtml(policy.description)}</span>` : ""}
                    </button>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
      : "";
    const actionsMarkup = this.actions.length
      ? `
          <div part="actions">
            ${this.actions
              .map(
                action => `
                  <button type="button" part="action" data-action-id="${escapeHtml(action.id)}" data-tone="${escapeHtml(action.tone ?? "neutral")}">
                    ${escapeHtml(action.label)}
                  </button>
                `,
              )
              .join("")}
          </div>
        `
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="panel"] {
          display: grid;
          gap: 1rem;
          padding: 1.1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, white 6%);
        }

        [part="header"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="title-row"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.6rem;
        }

        [part="title"] {
          font-size: 1.35rem;
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
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
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
          gap: 0.55rem;
        }

        [part="policies"] {
          display: grid;
          gap: 0.7rem;
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
          gap: 0.75rem;
        }

        [part="policy"] {
          width: 100%;
          display: grid;
          gap: 0.4rem;
          text-align: left;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 56%, transparent);
          border-radius: 0.9rem;
          padding: 0.85rem 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="policy"]:hover {
          border-color: rgba(0, 97, 213, 0.22);
          transform: translateY(-1px);
        }

        [part="policy"]:focus-visible,
        [part="action"]:focus-visible {
          outline: 2px solid rgba(0, 97, 213, 0.28);
          outline-offset: 2px;
        }

        [part="policy-header"] {
          display: flex;
          gap: 0.7rem;
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
          gap: 0.75rem;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          padding: 0.72rem 1rem;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: white;
        }
      </style>
      <section part="panel">
        <header part="header">
          <div part="title-row">
            <div part="title">${escapeHtml(this.title)}</div>
            ${statusMarkup}
          </div>
          ${messageMarkup}
          ${signalsMarkup}
        </header>
        ${policiesMarkup}
        ${actionsMarkup}
      </section>
    `;

    this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.dataset.actionId;
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });

    this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="policy"]').forEach(button => {
      button.addEventListener("click", () => {
        this.emitPolicySelected({
          label: button.dataset.policyLabel ?? "",
          value: button.dataset.policyValue ?? "",
          description: button.dataset.policyDescription || undefined,
          tone: button.dataset.policyTone || undefined,
        });
      });
    });
  }
}

export const defineBoxGovernancePanelElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxGovernancePanelElement);
  }
};
