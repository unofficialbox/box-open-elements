import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-item-details-panel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeSelectorValue = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

type ItemDetailsAction = {
  id: string;
  label: string;
  tone?: string;
};

type ItemDetailsMetaItem = {
  label: string;
  value: string;
};

type ItemDetailsOwner = {
  name: string;
  description?: string;
  status?: string;
  initials?: string;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          --_obp-surface: var(--boe-token-surface-surface, #ffffff);
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #fbfbfb);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #6f6f6f);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
        }

        [part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid var(--_obp-border);
          border-radius: ${boePanel.radius};
          background: var(--_obp-surface-muted);
        }

        [part="eyebrow"] {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--_obp-brand);
        }

        [part="header"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="title"] {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="message"] {
          color: var(--_obp-text-muted);
          line-height: 1.6;
        }

        [part="status"] {
          display: inline-flex;
          width: fit-content;
          padding: 0.45rem 0.7rem;
          border-radius: 999px;
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="owner"] {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: ${boePanel.gap};
          align-items: center;
          padding: 0.65rem;
          border-radius: ${boePanel.radius};
          background: color-mix(in srgb, var(--_obp-surface) 76%, transparent);
          border: 1px solid var(--_obp-border-subtle);
        }

        [part="owner-avatar"] {
          inline-size: 2.8rem;
          block-size: 2.8rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: color-mix(in srgb, var(--_obp-brand) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
          color: var(--_obp-brand);
          font-weight: 700;
        }

        [part="owner-meta"] {
          display: grid;
          gap: 0.2rem;
        }

        [part="owner-name"] {
          font-weight: 700;
        }

        [part="owner-description"],
        [part="owner-status"] {
          color: var(--_obp-text-muted);
        }

        [part="meta"] {
          display: grid;
          gap: 0.65rem;
          margin: 0;
        }

        [part="meta-row"] {
          display: grid;
          grid-template-columns: minmax(8rem, 0.85fr) minmax(0, 1fr);
          gap: ${boePanel.gap};
          margin: 0;
          padding: 0.5rem 0.65rem;
          border-radius: ${boeRadius.med};
          background: color-mix(in srgb, var(--_obp-surface) 76%, transparent);
          border: 1px solid var(--_obp-border-subtle);
        }

        [part="meta-label"] {
          margin: 0;
          font-weight: 700;
          color: var(--_obp-text-muted);
        }

        [part="meta-value"] {
          margin: 0;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
        }

        [part="action"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.4rem 0.7rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          background: var(--_obp-brand);
          border-color: var(--_obp-brand);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class BoxItemDetailsPanelElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "eyebrow", "message", "meta", "owner", "status", "heading"];
  }

  private eyebrowEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private ownerEl!: HTMLElement;
  private ownerAvatarEl!: HTMLElement;
  private ownerNameEl!: HTMLElement;
  private ownerDescriptionEl!: HTMLElement;
  private ownerStatusEl!: HTMLElement;
  private metaEl!: HTMLElement;
  private actionsEl!: HTMLElement;
  private metaSignature = "";
  private actionsSignature = "";

  get actions(): ItemDetailsAction[] {
    return this.parseJsonAttribute<ItemDetailsAction[]>("actions", []);
  }

  set actions(value: ItemDetailsAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    this.setAttribute("eyebrow", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get meta(): ItemDetailsMetaItem[] {
    return this.parseJsonAttribute<ItemDetailsMetaItem[]>("meta", []);
  }

  set meta(value: ItemDetailsMetaItem[]) {
    this.setAttribute("meta", JSON.stringify(value));
  }

  get owner(): ItemDetailsOwner | null {
    const raw = this.getAttribute("owner");
    if (!raw) {
      return null;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // A bare string (e.g. owner="Morgan Lee") is a common author shorthand —
      // treat it as the owner name rather than rendering an empty avatar.
      parsed = raw;
    }
    if (typeof parsed === "string") {
      const name = parsed.trim();
      return name ? { name } : null;
    }
    if (parsed && typeof parsed === "object" && typeof (parsed as ItemDetailsOwner).name === "string") {
      return parsed as ItemDetailsOwner;
    }
    return null;
  }

  set owner(value: ItemDetailsOwner | null) {
    if (!value) {
      this.removeAttribute("owner");
      return;
    }

    this.setAttribute("owner", JSON.stringify(value));
  }

  get status(): string {
    return this.getAttribute("status") ?? "";
  }

  set status(value: string) {
    this.setAttribute("status", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "";
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

  private metaKey(): string {
    return JSON.stringify(this.meta.map(item => item.label));
  }

  private actionsKey(): string {
    return JSON.stringify(this.actions.map(action => action.id));
  }

  private rebuildMeta(): void {
    this.metaEl.innerHTML = this.meta
      .map(
        item => `
          <div part="meta-row">
            <dt part="meta-label">${escapeHtml(item.label)}</dt>
            <dd part="meta-value">${escapeHtml(item.value)}</dd>
          </div>
        `,
      )
      .join("");
  }

  private patchMetaValues(): void {
    const rows = this.metaEl.querySelectorAll('[part="meta-row"]');
    this.meta.forEach((item, index) => {
      const row = rows[index];
      if (!row) {
        return;
      }
      const labelEl = row.querySelector('[part="meta-label"]');
      const valueEl = row.querySelector('[part="meta-value"]');
      if (labelEl) {
        labelEl.textContent = item.label;
      }
      if (valueEl) {
        valueEl.textContent = item.value;
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
            data-tone="${escapeHtml(action.tone ?? "neutral")}"
            data-action-id="${escapeHtml(action.id)}"
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
          <div part="eyebrow" hidden></div>
          <h2 part="title"></h2>
          <div part="message" hidden></div>
          <div part="status" hidden></div>
        </header>
        <section part="owner" hidden>
          <div part="owner-avatar"></div>
          <div part="owner-meta">
            <div part="owner-name"></div>
            <div part="owner-description" hidden></div>
            <div part="owner-status" hidden></div>
          </div>
        </section>
        <dl part="meta" hidden></dl>
        <div part="actions" hidden></div>
      </section>
    `;
    this.eyebrowEl = this.shadowRoot.querySelector('[part="eyebrow"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part="message"]')!;
    this.statusEl = this.shadowRoot.querySelector('[part="status"]')!;
    this.ownerEl = this.shadowRoot.querySelector('[part="owner"]')!;
    this.ownerAvatarEl = this.shadowRoot.querySelector('[part="owner-avatar"]')!;
    this.ownerNameEl = this.shadowRoot.querySelector('[part="owner-name"]')!;
    this.ownerDescriptionEl = this.shadowRoot.querySelector('[part="owner-description"]')!;
    this.ownerStatusEl = this.shadowRoot.querySelector('[part="owner-status"]')!;
    this.metaEl = this.shadowRoot.querySelector('[part="meta"]')!;
    this.actionsEl = this.shadowRoot.querySelector('[part="actions"]')!;
  }

  protected setupListeners(): void {
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
  }

  protected update(): void {
    if (!this.titleEl || !this.actionsEl) {
      return;
    }

    this.eyebrowEl.hidden = !this.eyebrow;
    this.eyebrowEl.textContent = this.eyebrow;
    this.titleEl.textContent = this.heading;
    this.messageEl.hidden = !this.message;
    this.messageEl.textContent = this.message;
    this.statusEl.hidden = !this.status;
    this.statusEl.textContent = this.status;

    const owner = this.owner;
    this.ownerEl.hidden = !owner;
    if (owner) {
      const initials = (owner.initials ?? owner.name.slice(0, 2)).trim().toUpperCase();
      // Never leave a bare tinted circle — hide the avatar when there is nothing
      // to put in it.
      this.ownerAvatarEl.hidden = initials === "";
      this.ownerAvatarEl.textContent = initials;
      this.ownerNameEl.textContent = owner.name;
      this.ownerDescriptionEl.hidden = !owner.description;
      this.ownerDescriptionEl.textContent = owner.description ?? "";
      this.ownerStatusEl.hidden = !owner.status;
      this.ownerStatusEl.textContent = owner.status ?? "";
    }

    const meta = this.meta;
    this.metaEl.hidden = meta.length === 0;
    const nextMeta = this.metaKey();
    if (nextMeta !== this.metaSignature || this.metaEl.childElementCount === 0) {
      this.metaSignature = nextMeta;
      this.rebuildMeta();
    } else {
      this.patchMetaValues();
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

export const defineBoxItemDetailsPanelElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxItemDetailsPanelElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxItemDetailsPanelElement;
  }

  customElements.define(tagName, BoxItemDetailsPanelElement);
  return BoxItemDetailsPanelElement;
};
