import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-annotation-inspector";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeSelectorValue = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const isSafeColorValue = (value: string): boolean =>
  /^#[0-9a-fA-F]{3,8}$/.test(value) || /^[a-zA-Z]+$/.test(value);

export type AnnotationInspectorAction = {
  id: string;
  label: string;
  tone?: string;
};

export type AnnotationInspectorReply = {
  author: string;
  body: string;
  createdAt?: string;
  id?: string;
  initials?: string;
};

export type AnnotationInspectorAnnotation = {
  author: string;
  body: string;
  color?: string;
  createdAt?: string;
  id: string;
  initials?: string;
  pageLabel?: string;
  replies?: AnnotationInspectorReply[];
  status?: string;
  subject?: string;
  toolLabel?: string;
};

export type AnnotationInspectorReplySubmittedDetail = {
  annotationId: string | null;
  body: string;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="panel"] {
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

        [part="detail-host"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="annotation"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: 0.65rem;
          border-radius: ${boePanel.radius};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          background: rgba(255, 255, 255, 0.72);
        }

        [part="annotation-header"] {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: ${boePanel.gap};
          align-items: center;
        }

        [part="avatar"],
        [part="reply-avatar"] {
          display: inline-grid;
          place-items: center;
          inline-size: 2rem;
          block-size: 2rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        [part="author-copy"],
        [part="reply-copy"] {
          display: grid;
          gap: 0.14rem;
        }

        [part="author"],
        [part="reply-author"],
        [part="subject"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="meta"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.78rem;
        }

        [part="tool"],
        [part="status"],
        [part="page"] {
          display: inline-flex;
          padding: 0.2rem 0.45rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
        }

        [part="color-chip"] {
          inline-size: 0.9rem;
          block-size: 0.9rem;
          border-radius: 999px;
          background: var(--annotation-color, #f59e0b);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--annotation-color, #f59e0b) 18%, transparent);
        }

        [part="body"] {
          line-height: 1.6;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="timestamp"] {
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 86%, transparent);
          font-size: 0.78rem;
        }

        [part="replies"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="section-title"] {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="reply-list"] {
          display: grid;
          gap: 0.5rem;
        }

        [part="reply"] {
          appearance: none;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.5rem;
          align-items: start;
          padding: 0.6rem 0.65rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 42%, transparent);
          border-radius: ${boeRadius.med};
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%);
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        [part="reply-body"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.45;
        }

        [part="reply-time"] {
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 86%, transparent);
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

        ${boeNeutralInteractiveStyles('[part="reply"]')}
        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}
        ${boeBrandInteractiveStyles('[part="composer-submit"]')}

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: #fff;
        }
      `;

export class AnnotationInspector extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "annotation", "composable", "heading", "message"];
  }

  private titleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private detailHostEl!: HTMLElement;
  private actionsEl!: HTMLElement;
  private composerEl!: HTMLElement;
  private composerInputEl!: HTMLTextAreaElement;
  private annotationSignature: string | null = null;
  private actionsSignature = "";

  get actions(): AnnotationInspectorAction[] {
    return this.parseJsonAttribute<AnnotationInspectorAction[]>("actions", []);
  }

  set actions(value: AnnotationInspectorAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get annotation(): AnnotationInspectorAnnotation | null {
    return this.parseJsonAttribute<AnnotationInspectorAnnotation | null>("annotation", null);
  }

  set annotation(value: AnnotationInspectorAnnotation | null) {
    if (!value) {
      this.removeAttribute("annotation");
      return;
    }

    this.setAttribute("annotation", JSON.stringify(value));
  }

  get composable(): boolean {
    return this.hasAttribute("composable");
  }

  set composable(value: boolean) {
    this.toggleAttribute("composable", value);
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

  get heading(): string {
    return this.getAttribute("heading") ?? "Annotation Inspector";
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
        detail: { action: actionId, annotationId: this.annotation?.id ?? null },
      }),
    );
  }

  private emitReplySelected(reply: AnnotationInspectorReply, index: number): void {
    this.dispatchEvent(
      new CustomEvent("reply-selected", {
        bubbles: true,
        composed: true,
        detail: { ...reply, index, annotationId: this.annotation?.id ?? null },
      }),
    );
  }

  private submitComposer(): void {
    const body = this.composerInputEl.value.trim();
    if (!this.composable || !body) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<AnnotationInspectorReplySubmittedDetail>("reply-submitted", {
        bubbles: true,
        composed: true,
        detail: {
          annotationId: this.annotation?.id ?? null,
          body,
        },
      }),
    );
    this.composerInputEl.value = "";
  }

  private actionsKey(): string {
    return JSON.stringify(this.actions.map(action => action.id));
  }

  private rebuildDetail(): void {
    const annotation = this.annotation;
    if (!annotation) {
      this.detailHostEl.innerHTML = `<div part="empty">No annotation selected.</div>`;
      return;
    }

    const colorChipMarkup =
      annotation.color && isSafeColorValue(annotation.color)
        ? `<span part="color-chip" style="--annotation-color:${escapeHtml(annotation.color)};"></span>`
        : "";

    this.detailHostEl.innerHTML = `
      <section part="annotation">
        <div part="annotation-header">
          <div part="avatar">${escapeHtml(annotation.initials ?? annotation.author.slice(0, 2).toUpperCase())}</div>
          <div part="author-copy">
            <div part="author">${escapeHtml(annotation.author)}</div>
            <div part="meta">
              ${annotation.toolLabel ? `<span part="tool">${escapeHtml(annotation.toolLabel)}</span>` : ""}
              ${annotation.status ? `<span part="status">${escapeHtml(annotation.status)}</span>` : ""}
              ${annotation.pageLabel ? `<span part="page">${escapeHtml(annotation.pageLabel)}</span>` : ""}
            </div>
          </div>
          ${colorChipMarkup}
        </div>
        ${annotation.subject ? `<div part="subject">${escapeHtml(annotation.subject)}</div>` : ""}
        <div part="body">${escapeHtml(annotation.body)}</div>
        ${annotation.createdAt ? `<div part="timestamp">${escapeHtml(annotation.createdAt)}</div>` : ""}
        ${
          annotation.replies?.length
            ? `
              <div part="replies">
                <div part="section-title">Replies</div>
                <div part="reply-list">
                  ${annotation.replies
                    .map(
                      (reply, index) => `
                        <button type="button" part="reply" data-reply-index="${String(index)}">
                          <span part="reply-avatar">${escapeHtml(reply.initials ?? reply.author.slice(0, 2).toUpperCase())}</span>
                          <span part="reply-copy">
                            <span part="reply-author">${escapeHtml(reply.author)}</span>
                            <span part="reply-body">${escapeHtml(reply.body)}</span>
                            ${reply.createdAt ? `<span part="reply-time">${escapeHtml(reply.createdAt)}</span>` : ""}
                          </span>
                        </button>
                      `,
                    )
                    .join("")}
                </div>
              </div>
            `
            : ""
        }
      </section>
    `;
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
      <article part="panel">
        <header part="header">
          <h2 part="title"></h2>
          <div part="message" hidden></div>
        </header>
        <div part="detail-host"></div>
        <div part="actions" hidden></div>
        <div part="composer" hidden>
          <label part="composer-label" for="annotation-inspector-composer-input">Reply</label>
          <textarea
            part="composer-input"
            id="annotation-inspector-composer-input"
            placeholder="Add a reply"
          ></textarea>
          <button type="button" part="composer-submit">Reply</button>
        </div>
      </article>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part="message"]')!;
    this.detailHostEl = this.shadowRoot.querySelector('[part="detail-host"]')!;
    this.actionsEl = this.shadowRoot.querySelector('[part="actions"]')!;
    this.composerEl = this.shadowRoot.querySelector('[part="composer"]')!;
    this.composerInputEl = this.shadowRoot.querySelector('[part="composer-input"]')!;
  }

  protected setupListeners(): void {
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

    this.detailHostEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="reply"]') as HTMLButtonElement | null;
      if (!button || !this.detailHostEl.contains(button)) {
        return;
      }

      const index = Number(button.getAttribute("data-reply-index"));
      const reply = this.annotation?.replies?.[index];
      if (reply) {
        this.emitReplySelected(reply, index);
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
    if (!this.detailHostEl) {
      return;
    }

    this.titleEl.textContent = this.heading;
    this.messageEl.hidden = !this.message;
    this.messageEl.textContent = this.message;

    const nextAnnotation = this.getAttribute("annotation");
    if (nextAnnotation !== this.annotationSignature || this.detailHostEl.childElementCount === 0) {
      this.annotationSignature = nextAnnotation;
      this.rebuildDetail();
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

AnnotationInspector.register();
