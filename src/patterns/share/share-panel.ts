import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-share-panel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type SharePanelAction = {
  id: string;
  label: string;
  tone?: string;
};

type SharePanelCollaborator = {
  description?: string;
  id?: string;
  initials?: string;
  name: string;
  role: string;
};

type SharePanelSetting = {
  label: string;
  tone?: string;
  value: string;
};

type SharePanelSharedLink = {
  access: string;
  expiresAt?: string;
  label?: string;
  status?: string;
  url: string;
};


const elementStyles = `
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
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
        }

        [part="header"] {
          display: grid;
          gap: 0.45rem;
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

        [part="shared-link"],
        [part="settings"],
        [part="collaborators"] {
          display: grid;
          gap: 0.7rem;
        }

        [part="shared-link"] {
          padding: 0.95rem;
          border-radius: 0.95rem;
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
        }

        [part="shared-link-header"] {
          display: flex;
          gap: 0.8rem;
          align-items: center;
          justify-content: space-between;
        }

        [part="shared-link-label"],
        [part="section-title"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="shared-link-access"] {
          display: inline-flex;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="shared-link-url"] {
          appearance: none;
          width: 100%;
          text-align: left;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: 0.8rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
          color: var(--boe-token-text-text, #1f1e1b);
          font: inherit;
          padding: 0.8rem 0.9rem;
          cursor: pointer;
        }

        [part="shared-link-url"]:hover,
        [part="shared-link-url"]:focus-visible {
          border-color: rgba(0, 97, 213, 0.24);
          outline: none;
        }

        [part="shared-link-meta"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.92rem;
        }

        [part="shared-link-status"] {
          font-weight: 600;
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 70%, var(--boe-token-text-text, #222222));
        }

        [part="settings-list"] {
          display: grid;
          gap: 0.7rem;
          margin: 0;
        }

        [part="setting"] {
          display: flex;
          gap: 0.8rem;
          align-items: center;
          justify-content: space-between;
          padding: 0.8rem 0.9rem;
          border-radius: 0.85rem;
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 42%, transparent);
        }

        [part="setting-label"] {
          margin: 0;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-weight: 600;
        }

        [part="setting-value"] {
          margin: 0;
          font-weight: 600;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="setting-value"][data-tone="success"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 70%, var(--boe-token-text-text, #222222));
        }

        [part="setting-value"][data-tone="accent"] {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="collaborator-list"] {
          display: grid;
          gap: 0.75rem;
        }

        [part="collaborator"] {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.8rem;
          align-items: center;
          width: 100%;
          text-align: left;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: 0.9rem;
          padding: 0.8rem 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="collaborator"]:hover,
        [part="collaborator"]:focus-visible {
          border-color: rgba(0, 97, 213, 0.22);
          outline: none;
        }

        [part="collaborator-avatar"] {
          inline-size: 2.5rem;
          block-size: 2.5rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(0, 97, 213, 0.12);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-weight: 700;
        }

        [part="collaborator-meta"] {
          display: grid;
          gap: 0.15rem;
        }

        [part="collaborator-name"] {
          font-weight: 600;
        }

        [part="collaborator-role"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="collaborator-description"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.94rem;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          font-weight: 600;
          padding: 0.72rem 1rem;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: var(--boe-token-text-text, #1f1e1b);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class BoxSharePanelElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "collaborators", "message", "settings", "shared-link", "heading"];
  }
  get actions(): SharePanelAction[] {
    return this.parseJsonAttribute<SharePanelAction[]>("actions", []);
  }

  set actions(value: SharePanelAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get collaborators(): SharePanelCollaborator[] {
    return this.parseJsonAttribute<SharePanelCollaborator[]>("collaborators", []);
  }

  set collaborators(value: SharePanelCollaborator[]) {
    this.setAttribute("collaborators", JSON.stringify(value));
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get settings(): SharePanelSetting[] {
    return this.parseJsonAttribute<SharePanelSetting[]>("settings", []);
  }

  set settings(value: SharePanelSetting[]) {
    this.setAttribute("settings", JSON.stringify(value));
  }

  get sharedLink(): SharePanelSharedLink | null {
    return this.parseJsonAttribute<SharePanelSharedLink | null>("shared-link", null);
  }

  set sharedLink(value: SharePanelSharedLink | null) {
    if (!value) {
      this.removeAttribute("shared-link");
      return;
    }

    this.setAttribute("shared-link", JSON.stringify(value));
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Share";
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

  private emitCollaboratorSelected(collaborator: SharePanelCollaborator): void {
    this.dispatchEvent(
      new CustomEvent("collaborator-selected", {
        bubbles: true,
        composed: true,
        detail: collaborator,
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const sharedLink = this.sharedLink;
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const sharedLinkMarkup = sharedLink
      ? `
          <section part="shared-link">
            <div part="shared-link-header">
              <div part="shared-link-label">${escapeHtml(sharedLink.label ?? "Shared link")}</div>
              <div part="shared-link-access">${escapeHtml(sharedLink.access)}</div>
            </div>
            <button type="button" part="shared-link-url" data-action-id="copy-link">${escapeHtml(sharedLink.url)}</button>
            <div part="shared-link-meta">
              ${sharedLink.status ? `<span part="shared-link-status">${escapeHtml(sharedLink.status)}</span>` : ""}
              ${sharedLink.expiresAt ? `<span part="shared-link-expiry">Expires ${escapeHtml(sharedLink.expiresAt)}</span>` : ""}
            </div>
          </section>
        `
      : "";
    const settingsMarkup = this.settings.length
      ? `
          <section part="settings">
            <div part="section-title">Settings</div>
            <dl part="settings-list">
              ${this.settings
                .map(
                  setting => `
                    <div part="setting">
                      <dt part="setting-label">${escapeHtml(setting.label)}</dt>
                      <dd part="setting-value" data-tone="${escapeHtml(setting.tone ?? "neutral")}">${escapeHtml(setting.value)}</dd>
                    </div>
                  `,
                )
                .join("")}
            </dl>
          </section>
        `
      : "";
    const collaboratorsMarkup = this.collaborators.length
      ? `
          <section part="collaborators">
            <div part="section-title">Collaborators</div>
            <div part="collaborator-list">
              ${this.collaborators
                .map(
                  collaborator => `
                    <button
                      type="button"
                      part="collaborator"
                      data-collaborator-name="${escapeHtml(collaborator.name)}"
                      data-collaborator-role="${escapeHtml(collaborator.role)}"
                      data-collaborator-description="${escapeHtml(collaborator.description ?? "")}"
                      data-collaborator-id="${escapeHtml(collaborator.id ?? "")}"
                    >
                      <span part="collaborator-avatar">${escapeHtml(collaborator.initials ?? collaborator.name.slice(0, 2).toUpperCase())}</span>
                      <span part="collaborator-meta">
                        <span part="collaborator-name">${escapeHtml(collaborator.name)}</span>
                        <span part="collaborator-role">${escapeHtml(collaborator.role)}</span>
                        ${collaborator.description ? `<span part="collaborator-description">${escapeHtml(collaborator.description)}</span>` : ""}
                      </span>
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
                  <button
                    type="button"
                    part="action"
                    data-action-id="${escapeHtml(action.id)}"
                    data-tone="${escapeHtml(action.tone ?? "neutral")}"
                  >
                    ${escapeHtml(action.label)}
                  </button>
                `,
              )
              .join("")}
          </div>
        `
      : "";

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <section part="panel">
        <header part="header">
          <div part="title">${escapeHtml(this.heading)}</div>
          ${messageMarkup}
        </header>
        ${sharedLinkMarkup}
        ${settingsMarkup}
        ${collaboratorsMarkup}
        ${actionsMarkup}
      </section>
    `;

    this.shadowRoot.querySelectorAll<HTMLElement>("[data-action-id]").forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.dataset.actionId;
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });

    this.shadowRoot.querySelectorAll<HTMLElement>("[data-collaborator-name]").forEach(button => {
      button.addEventListener("click", () => {
        this.emitCollaboratorSelected({
          id: button.dataset.collaboratorId || undefined,
          name: button.dataset.collaboratorName ?? "",
          role: button.dataset.collaboratorRole ?? "",
          description: button.dataset.collaboratorDescription || undefined,
        });
      });
    });
  
  }
}

export const defineBoxSharePanelElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSharePanelElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSharePanelElement;
  }

  customElements.define(tagName, BoxSharePanelElement);
  return BoxSharePanelElement;
};
