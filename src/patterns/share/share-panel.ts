import { BaseElement } from "../../core/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-share-panel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeSelectorValue = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

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
          gap: 0.55rem;
          padding: 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.7rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
        }

        [part="header"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="title"] {
          font-size: 1.1rem;
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
          gap: 0.55rem;
        }

        [part="shared-link"] {
          padding: 0.65rem;
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
        }

        [part="shared-link-header"] {
          display: flex;
          gap: 0.55rem;
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
          border-radius: 0.65rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
          color: var(--boe-token-text-text, #1f1e1b);
          font: inherit;
          padding: 0.55rem 0.7rem;
          cursor: pointer;
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
          gap: 0.55rem;
          margin: 0;
        }

        [part="setting"] {
          display: flex;
          gap: 0.55rem;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 0.7rem;
          border-radius: 0.65rem;
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
          gap: 0.55rem;
        }

        [part="collaborator"] {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.55rem;
          align-items: center;
          width: 100%;
          text-align: left;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: 0.7rem;
          padding: 0.55rem 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
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
          gap: 0.55rem;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          font-weight: 600;
          padding: 0.4rem 0.7rem;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="shared-link-url"]')}
        ${boeNeutralInteractiveStyles('[part="collaborator"]')}
        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

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

  private titleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private sharedLinkEl!: HTMLElement;
  private sharedLinkLabelEl!: HTMLElement;
  private sharedLinkAccessEl!: HTMLElement;
  private sharedLinkUrlEl!: HTMLButtonElement;
  private sharedLinkStatusEl!: HTMLElement;
  private sharedLinkExpiryEl!: HTMLElement;
  private settingsSectionEl!: HTMLElement;
  private settingsListEl!: HTMLElement;
  private collaboratorsSectionEl!: HTMLElement;
  private collaboratorListEl!: HTMLElement;
  private actionsEl!: HTMLElement;
  private settingsSignature = "";
  private collaboratorsSignature = "";
  private actionsSignature = "";

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

  private settingsKey(): string {
    return JSON.stringify(this.settings.map(setting => setting.label));
  }

  private collaboratorsKey(): string {
    return JSON.stringify(
      this.collaborators.map(collaborator => collaborator.id ?? collaborator.name),
    );
  }

  private actionsKey(): string {
    return JSON.stringify(this.actions.map(action => ({ id: action.id, tone: action.tone ?? "neutral" })));
  }

  private rebuildSettings(): void {
    this.settingsListEl.innerHTML = this.settings
      .map(
        setting => `
          <div part="setting">
            <dt part="setting-label">${escapeHtml(setting.label)}</dt>
            <dd part="setting-value" data-tone="${escapeHtml(setting.tone ?? "neutral")}">${escapeHtml(setting.value)}</dd>
          </div>
        `,
      )
      .join("");
  }

  private patchSettings(): void {
    const rows = this.settingsListEl.querySelectorAll('[part="setting"]');
    this.settings.forEach((setting, index) => {
      const row = rows[index];
      if (!row) {
        return;
      }
      const labelEl = row.querySelector('[part="setting-label"]');
      const valueEl = row.querySelector('[part="setting-value"]') as HTMLElement | null;
      if (labelEl) {
        labelEl.textContent = setting.label;
      }
      if (valueEl) {
        valueEl.textContent = setting.value;
        valueEl.dataset.tone = setting.tone ?? "neutral";
      }
    });
  }

  private rebuildCollaborators(): void {
    this.collaboratorListEl.innerHTML = this.collaborators
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
              <span part="collaborator-description" ${collaborator.description ? "" : "hidden"}>${escapeHtml(collaborator.description ?? "")}</span>
            </span>
          </button>
        `,
      )
      .join("");
  }

  private patchCollaborators(): void {
    this.collaborators.forEach(collaborator => {
      const button = this.collaboratorListEl.querySelector(
        collaborator.id
          ? `[data-collaborator-id="${escapeSelectorValue(collaborator.id)}"]`
          : `[data-collaborator-name="${escapeSelectorValue(collaborator.name)}"]`,
      ) as HTMLButtonElement | null;
      if (!button) {
        return;
      }

      button.dataset.collaboratorName = collaborator.name;
      button.dataset.collaboratorRole = collaborator.role;
      button.dataset.collaboratorDescription = collaborator.description ?? "";
      button.dataset.collaboratorId = collaborator.id ?? "";

      const avatar = button.querySelector('[part="collaborator-avatar"]');
      const nameEl = button.querySelector('[part="collaborator-name"]');
      const roleEl = button.querySelector('[part="collaborator-role"]');
      const descriptionEl = button.querySelector('[part="collaborator-description"]') as HTMLElement | null;
      if (avatar) {
        avatar.textContent = collaborator.initials ?? collaborator.name.slice(0, 2).toUpperCase();
      }
      if (nameEl) {
        nameEl.textContent = collaborator.name;
      }
      if (roleEl) {
        roleEl.textContent = collaborator.role;
      }
      if (descriptionEl) {
        descriptionEl.hidden = !collaborator.description;
        descriptionEl.textContent = collaborator.description ?? "";
      }
    });
  }

  private rebuildActions(): void {
    this.actionsEl.innerHTML = this.actions
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
      .join("");
  }

  private patchActionLabels(): void {
    this.actions.forEach(action => {
      const button = this.actionsEl.querySelector(
        `[data-action-id="${escapeSelectorValue(action.id)}"]`,
      ) as HTMLButtonElement | null;
      if (!button) {
        return;
      }
      button.textContent = action.label;
      button.dataset.tone = action.tone ?? "neutral";
    });
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="panel">
        <header part="header">
          <h2 part="title"></h2>
          <div part="message" hidden></div>
        </header>
        <section part="shared-link" hidden>
          <div part="shared-link-header">
            <div part="shared-link-label"></div>
            <div part="shared-link-access"></div>
          </div>
          <button type="button" part="shared-link-url" data-action-id="copy-link"></button>
          <div part="shared-link-meta">
            <span part="shared-link-status" hidden></span>
            <span part="shared-link-expiry" hidden></span>
          </div>
        </section>
        <section part="settings" hidden>
          <div part="section-title">Settings</div>
          <dl part="settings-list"></dl>
        </section>
        <section part="collaborators" hidden>
          <div part="section-title">Collaborators</div>
          <div part="collaborator-list"></div>
        </section>
        <div part="actions" hidden></div>
      </section>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part="message"]')!;
    this.sharedLinkEl = this.shadowRoot.querySelector('[part="shared-link"]')!;
    this.sharedLinkLabelEl = this.shadowRoot.querySelector('[part="shared-link-label"]')!;
    this.sharedLinkAccessEl = this.shadowRoot.querySelector('[part="shared-link-access"]')!;
    this.sharedLinkUrlEl = this.shadowRoot.querySelector('[part="shared-link-url"]')!;
    this.sharedLinkStatusEl = this.shadowRoot.querySelector('[part="shared-link-status"]')!;
    this.sharedLinkExpiryEl = this.shadowRoot.querySelector('[part="shared-link-expiry"]')!;
    this.settingsSectionEl = this.shadowRoot.querySelector('[part="settings"]')!;
    this.settingsListEl = this.shadowRoot.querySelector('[part="settings-list"]')!;
    this.collaboratorsSectionEl = this.shadowRoot.querySelector('[part="collaborators"]')!;
    this.collaboratorListEl = this.shadowRoot.querySelector('[part="collaborator-list"]')!;
    this.actionsEl = this.shadowRoot.querySelector('[part="actions"]')!;
  }

  protected setupListeners(): void {
    this.sharedLinkUrlEl.addEventListener("click", () => {
      this.emitAction("copy-link");
    });

    this.actionsEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="action"]') as HTMLButtonElement | null;
      if (!button || !this.actionsEl.contains(button)) {
        return;
      }

      const actionId = button.dataset.actionId ?? "";
      if (actionId) {
        this.emitAction(actionId);
      }
    });

    this.collaboratorListEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="collaborator"]') as HTMLButtonElement | null;
      if (!button || !this.collaboratorListEl.contains(button)) {
        return;
      }

      this.emitCollaboratorSelected({
        id: button.dataset.collaboratorId || undefined,
        name: button.dataset.collaboratorName ?? "",
        role: button.dataset.collaboratorRole ?? "",
        description: button.dataset.collaboratorDescription || undefined,
      });
    });
  }

  protected update(): void {
    if (!this.titleEl || !this.actionsEl) {
      return;
    }

    this.titleEl.textContent = this.heading;
    this.messageEl.hidden = !this.message;
    this.messageEl.textContent = this.message;

    const sharedLink = this.sharedLink;
    this.sharedLinkEl.hidden = !sharedLink;
    if (sharedLink) {
      this.sharedLinkLabelEl.textContent = sharedLink.label ?? "Shared link";
      this.sharedLinkAccessEl.textContent = sharedLink.access;
      this.sharedLinkUrlEl.textContent = sharedLink.url;
      this.sharedLinkStatusEl.hidden = !sharedLink.status;
      this.sharedLinkStatusEl.textContent = sharedLink.status ?? "";
      this.sharedLinkExpiryEl.hidden = !sharedLink.expiresAt;
      this.sharedLinkExpiryEl.textContent = sharedLink.expiresAt ? `Expires ${sharedLink.expiresAt}` : "";
    }

    const settings = this.settings;
    this.settingsSectionEl.hidden = settings.length === 0;
    const nextSettings = this.settingsKey();
    if (nextSettings !== this.settingsSignature || this.settingsListEl.childElementCount === 0) {
      this.settingsSignature = nextSettings;
      this.rebuildSettings();
    } else {
      this.patchSettings();
    }

    const collaborators = this.collaborators;
    this.collaboratorsSectionEl.hidden = collaborators.length === 0;
    const nextCollaborators = this.collaboratorsKey();
    if (
      nextCollaborators !== this.collaboratorsSignature ||
      this.collaboratorListEl.childElementCount === 0
    ) {
      this.collaboratorsSignature = nextCollaborators;
      this.rebuildCollaborators();
    } else {
      this.patchCollaborators();
    }

    const actions = this.actions;
    this.actionsEl.hidden = actions.length === 0;
    const nextActions = this.actionsKey();
    if (nextActions !== this.actionsSignature || this.actionsEl.childElementCount === 0) {
      this.actionsSignature = nextActions;
      this.rebuildActions();
    } else {
      this.patchActionLabels();
    }
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
