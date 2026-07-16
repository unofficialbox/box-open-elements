import { BaseElement } from "../../core/index.js";
import {
  boeBrandInteractiveStyles,
  boeFocusRingShadow,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-annotation-thread";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type AnnotationThreadAction = {
  id: string;
  label: string;
  tone?: string;
};

type AnnotationThreadEntry = {
  author: string;
  body: string;
  createdAt?: string;
  id: string;
  initials?: string;
  status?: string;
  toolLabel?: string;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="thread"] {
          display: grid;
          gap: 0.55rem;
          padding: 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.7rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
        }

        [part="header"] {
          display: grid;
          gap: 0.42rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        [part="entries"] {
          display: grid;
          gap: 0.6rem;
        }

        [part="entry"] {
          appearance: none;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.55rem;
          align-items: start;
          padding: 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: 0.7rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 78%, transparent);
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition:
            transform ${boeMotionDuration.fast} ${boeMotionEasing.standard},
            border-color ${boeMotionDuration.fast} ${boeMotionEasing.standard},
            box-shadow ${boeMotionDuration.fast} ${boeMotionEasing.standard};
        }

        [part="entry-avatar"] {
          display: inline-grid;
          place-items: center;
          inline-size: 2rem;
          block-size: 2rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        [part="entry-copy"] {
          display: grid;
          gap: 0.24rem;
        }

        [part="entry-topline"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem;
        }

        [part="entry-author"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="entry-tool"],
        [part="entry-status"] {
          display: inline-flex;
          padding: 0.18rem 0.42rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.75rem;
        }

        [part="entry-body"] {
          line-height: 1.55;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="entry-time"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.78rem;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        [part="action"] {
          appearance: none;
          min-height: 2rem;
          padding: 0.4rem 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="empty"] {
          padding: 0.7rem;
          border-radius: 0.7rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        ${boeNeutralInteractiveStyles('[part="entry"]')}
        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="entry"][aria-pressed="true"],
        [part="entry"][aria-pressed="true"]:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          box-shadow: ${boeFocusRingShadow};
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class BoxAnnotationThreadElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "entries", "message", "selected-entry-id", "heading"];
  }
  get actions(): AnnotationThreadAction[] {
    return this.parseJsonAttribute<AnnotationThreadAction[]>("actions", []);
  }

  set actions(value: AnnotationThreadAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get entries(): AnnotationThreadEntry[] {
    return this.parseJsonAttribute<AnnotationThreadEntry[]>("entries", []);
  }

  set entries(value: AnnotationThreadEntry[]) {
    this.setAttribute("entries", JSON.stringify(value));
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

  get selectedEntryId(): string {
    return this.getAttribute("selected-entry-id") ?? "";
  }

  set selectedEntryId(value: string) {
    if (!value) {
      this.removeAttribute("selected-entry-id");
      return;
    }

    this.setAttribute("selected-entry-id", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Annotation Thread";
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
        detail: {
          action: actionId,
          selectedEntryId: this.selectedEntryId || null,
        },
      }),
    );
  }

  private emitEntrySelected(entry: AnnotationThreadEntry): void {
    this.selectedEntryId = entry.id;
    this.dispatchEvent(
      new CustomEvent("entry-selected", {
        bubbles: true,
        composed: true,
        detail: entry,
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

    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
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

    const entriesMarkup = this.entries.length
      ? `
          <div part="entries" role="list" aria-label="${escapeHtml(this.heading)} entries">
            ${this.entries
              .map(entry => {
                const selected = entry.id === this.selectedEntryId;
                return `
                  <button
                    type="button"
                    part="entry"
                    data-entry-id="${escapeHtml(entry.id)}"
                    aria-pressed="${selected ? "true" : "false"}"
                  >
                    <span part="entry-avatar">${escapeHtml(entry.initials ?? entry.author.slice(0, 2).toUpperCase())}</span>
                    <span part="entry-copy">
                      <span part="entry-topline">
                        <span part="entry-author">${escapeHtml(entry.author)}</span>
                        ${entry.toolLabel ? `<span part="entry-tool">${escapeHtml(entry.toolLabel)}</span>` : ""}
                        ${entry.status ? `<span part="entry-status">${escapeHtml(entry.status)}</span>` : ""}
                      </span>
                      <span part="entry-body">${escapeHtml(entry.body)}</span>
                      ${entry.createdAt ? `<span part="entry-time">${escapeHtml(entry.createdAt)}</span>` : ""}
                    </span>
                  </button>
                `;
              })
              .join("")}
          </div>
        `
      : `<div part="empty">No annotation thread entries available.</div>`;

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <article part="thread">
        <header part="header">
          <h2 part="title">${escapeHtml(this.heading)}</h2>
          ${messageMarkup}
        </header>
        ${entriesMarkup}
        ${actionsMarkup}
      </article>
    `;

    this.shadowRoot.querySelectorAll('[part="entry"]').forEach(button => {
      button.addEventListener("click", () => {
        const entryId = button.getAttribute("data-entry-id");
        const entry = this.entries.find(item => item.id === entryId);
        if (entry) {
          this.emitEntrySelected(entry);
        }
      });
    });

    this.shadowRoot.querySelectorAll('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.getAttribute("data-action-id");
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });
  
  }
}

export const defineBoxAnnotationThreadElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAnnotationThreadElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAnnotationThreadElement;
  }

  customElements.define(tagName, BoxAnnotationThreadElement);
  return BoxAnnotationThreadElement;
};
