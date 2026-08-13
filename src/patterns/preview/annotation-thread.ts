import { BaseElement } from "../../core/index.js";
import {
  boeBrandInteractiveStyles,
  boeFocusRingShadow,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-annotation-thread";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export type AnnotationThreadAction = {
  id: string;
  label: string;
  tone?: string;
};

export type AnnotationThreadEntry = {
  author: string;
  body: string;
  createdAt?: string;
  id: string;
  initials?: string;
  status?: string;
  toolLabel?: string;
};

export type AnnotationThreadEntrySubmittedDetail = {
  body: string;
  inReplyToId: string | null;
};


const elementStyles = `
        /* Author display rules on parts would otherwise defeat the UA's
           [hidden] rule — state toggling relies on the hidden attribute. */
        [hidden] {
          display: none !important;
        }

        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="thread"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="header"] {
          display: grid;
          gap: 0.42rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
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
          margin: 0;
          padding: 0;
          list-style: none;
        }

        [part="entry-item"] {
          display: block;
        }

        [part="entry"] {
          appearance: none;
          display: grid;
          inline-size: 100%;
          grid-template-columns: auto 1fr;
          gap: ${boePanel.gap};
          align-items: start;
          padding: 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: ${boePanel.radius};
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
          padding: ${boePanel.padding};
          border-radius: ${boePanel.radius};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="composer"] {
          display: grid;
          gap: 0.5rem;
        }

        [part="composer-label"] {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="composer-input"] {
          min-height: 4rem;
          padding: 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          line-height: 1.5;
          resize: vertical;
        }

        [part="composer-submit"] {
          appearance: none;
          justify-self: start;
          min-height: 2rem;
          padding: 0.4rem 0.7rem;
          border: 1px solid transparent;
          border-radius: 999px;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font: inherit;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="entry"]')}
        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}
        ${boeBrandInteractiveStyles('[part="composer-submit"]')}

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

export class AnnotationThread extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "composable", "entries", "message", "selected-entry-id", "heading"];
  }

  private titleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private entriesEl!: HTMLElement;
  private emptyEl!: HTMLElement;
  private actionsEl!: HTMLElement;
  private composerEl!: HTMLElement;
  private composerInputEl!: HTMLTextAreaElement;
  private entriesSignature = "";
  private actionsSignature = "";

  get actions(): AnnotationThreadAction[] {
    return this.parseJsonAttribute<AnnotationThreadAction[]>("actions", []);
  }

  set actions(value: AnnotationThreadAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get composable(): boolean {
    return this.hasAttribute("composable");
  }

  set composable(value: boolean) {
    this.toggleAttribute("composable", value);
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

  private submitComposer(): void {
    const body = this.composerInputEl.value.trim();
    if (!this.composable || !body) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<AnnotationThreadEntrySubmittedDetail>("entry-submitted", {
        bubbles: true,
        composed: true,
        detail: {
          body,
          inReplyToId: this.selectedEntryId || null,
        },
      }),
    );
    this.composerInputEl.value = "";
  }

  private entriesKey(): string {
    return this.getAttribute("entries") ?? "";
  }

  private actionsKey(): string {
    return JSON.stringify(this.actions.map(action => action.id));
  }

  private rebuildEntries(): void {
    this.entriesEl.innerHTML = this.entries
      .map(entry => {
        const selected = entry.id === this.selectedEntryId;
        return `
          <li part="entry-item" role="listitem">
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
          </li>
        `;
      })
      .join("");
  }

  private patchEntrySelection(): void {
    this.entriesEl.querySelectorAll('[part="entry"]').forEach(button => {
      const selected = button.getAttribute("data-entry-id") === this.selectedEntryId;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  private rebuildActions(): void {
    this.actionsEl.innerHTML = this.actions
      .map(
        action => `
          <button type="button" part="action" data-action-id="${escapeHtml(action.id)}" data-tone="${escapeHtml(action.tone ?? "neutral")}">
            ${escapeHtml(action.label)}
          </button>
        `,
      )
      .join("");
  }

  private patchActionLabels(): void {
    // Action IDs are arbitrary strings (quotes, newlines, …) — match on the
    // dataset instead of interpolating them into a CSS selector.
    const buttons = Array.from(
      this.actionsEl.querySelectorAll<HTMLButtonElement>('[part="action"]'),
    );
    this.actions.forEach(action => {
      const button = buttons.find(candidate => candidate.dataset.actionId === action.id);
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
      <article part="thread">
        <header part="header">
          <h2 part="title"></h2>
          <div part="message" hidden></div>
        </header>
        <ul part="entries" role="list" hidden></ul>
        <div part="empty" hidden>No annotation thread entries available.</div>
        <div part="actions" hidden></div>
        <div part="composer" hidden>
          <label part="composer-label" for="annotation-thread-composer-input">Reply</label>
          <textarea
            part="composer-input"
            id="annotation-thread-composer-input"
            placeholder="Add a reply"
          ></textarea>
          <button type="button" part="composer-submit">Reply</button>
        </div>
      </article>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part="message"]')!;
    this.entriesEl = this.shadowRoot.querySelector('[part="entries"]')!;
    this.emptyEl = this.shadowRoot.querySelector('[part="empty"]')!;
    this.actionsEl = this.shadowRoot.querySelector('[part="actions"]')!;
    this.composerEl = this.shadowRoot.querySelector('[part="composer"]')!;
    this.composerInputEl = this.shadowRoot.querySelector('[part="composer-input"]')!;
  }

  protected setupListeners(): void {
    this.entriesEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="entry"]') as HTMLButtonElement | null;
      if (!button || !this.entriesEl.contains(button)) {
        return;
      }

      const entryId = button.getAttribute("data-entry-id");
      const entry = this.entries.find(item => item.id === entryId);
      if (entry) {
        this.emitEntrySelected(entry);
      }
    });

    this.actionsEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="action"]') as HTMLButtonElement | null;
      if (!button || !this.actionsEl.contains(button)) {
        return;
      }

      const actionId = button.getAttribute("data-action-id");
      if (actionId) {
        this.emitAction(actionId);
      }
    });

    this.composerEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="composer-submit"]');
      if (button) {
        this.submitComposer();
      }
    });

    this.composerInputEl.addEventListener("keydown", event => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        this.submitComposer();
      }
    });
  }

  protected update(): void {
    if (!this.entriesEl) {
      return;
    }

    this.titleEl.textContent = this.heading;
    this.messageEl.hidden = !this.message;
    this.messageEl.textContent = this.message;

    const entries = this.entries;
    this.entriesEl.hidden = entries.length === 0;
    this.emptyEl.hidden = entries.length > 0;
    this.entriesEl.setAttribute("aria-label", `${this.heading} entries`);
    const nextEntries = this.entriesKey();
    if (nextEntries !== this.entriesSignature) {
      this.entriesSignature = nextEntries;
      this.rebuildEntries();
    } else {
      this.patchEntrySelection();
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

    const composable = this.composable;
    this.composerEl.hidden = !composable;
    this.composerInputEl.disabled = !composable;
  }
}

AnnotationThread.register();
