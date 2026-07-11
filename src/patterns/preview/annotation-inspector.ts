const DEFAULT_TAG_NAME = "box-annotation-inspector";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type AnnotationInspectorAction = {
  id: string;
  label: string;
  tone?: string;
};

type AnnotationInspectorReply = {
  author: string;
  body: string;
  initials?: string;
};

type AnnotationInspectorAnnotation = {
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

export class BoxAnnotationInspectorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "annotation", "message", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

  get title(): string {
    return this.getAttribute("title") ?? "Annotation Inspector";
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const annotation = this.annotation;
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
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

    const detailMarkup = annotation
      ? `
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
              ${annotation.color ? `<span part="color-chip" style="--annotation-color:${escapeHtml(annotation.color)};"></span>` : ""}
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
        `
      : `<div part="empty">No annotation selected.</div>`;

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
          padding: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 94%, white 6%);
        }

        [part="header"] {
          display: grid;
          gap: 0.42rem;
        }

        [part="title"] {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.5;
        }

        [part="annotation"] {
          display: grid;
          gap: 0.85rem;
          padding: 0.95rem;
          border-radius: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 48%, transparent);
          background: rgba(255, 255, 255, 0.72);
        }

        [part="annotation-header"] {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.7rem;
          align-items: center;
        }

        [part="avatar"],
        [part="reply-avatar"] {
          display: inline-grid;
          place-items: center;
          inline-size: 2rem;
          block-size: 2rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
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
          color: var(--boe-token-text-text-secondary, #52606d);
          font-size: 0.78rem;
        }

        [part="tool"],
        [part="status"],
        [part="page"] {
          display: inline-flex;
          padding: 0.2rem 0.45rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, white 92%);
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
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #52606d) 86%, transparent);
          font-size: 0.78rem;
        }

        [part="replies"] {
          display: grid;
          gap: 0.55rem;
        }

        [part="section-title"] {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="reply-list"] {
          display: grid;
          gap: 0.5rem;
        }

        [part="reply"] {
          appearance: none;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.7rem;
          align-items: start;
          padding: 0.7rem 0.75rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 42%, transparent);
          border-radius: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 88%, white 12%);
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        [part="reply-body"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.45;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        [part="action"] {
          appearance: none;
          min-height: 2rem;
          padding: 0.35rem 0.72rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 60%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: #fff;
        }

        [part="empty"] {
          padding: 1rem;
          border-radius: 0.9rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #52606d);
        }
      </style>
      <article part="panel">
        <header part="header">
          <div part="title">${escapeHtml(this.title)}</div>
          ${messageMarkup}
        </header>
        ${detailMarkup}
        ${actionsMarkup}
      </article>
    `;

    this.shadowRoot.querySelectorAll('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.getAttribute("data-action-id");
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });

    this.shadowRoot.querySelectorAll('[part="reply"]').forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-reply-index"));
        const reply = this.annotation?.replies?.[index];
        if (reply) {
          this.emitReplySelected(reply, index);
        }
      });
    });
  }
}

export const defineBoxAnnotationInspectorElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAnnotationInspectorElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAnnotationInspectorElement;
  }

  customElements.define(tagName, BoxAnnotationInspectorElement);
  return BoxAnnotationInspectorElement;
};
