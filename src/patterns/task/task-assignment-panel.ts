const DEFAULT_TAG_NAME = "box-task-assignment-panel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type TaskAssignmentPanelAction = {
  id: string;
  label: string;
  tone?: string;
};

type TaskAssignmentPanelAssignee = {
  description?: string;
  id: string;
  initials?: string;
  name: string;
  status?: string;
};

type TaskAssignmentPanelChecklistItem = {
  checked?: boolean;
  description?: string;
  id: string;
  label: string;
};

export class BoxTaskAssignmentPanelElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "assignees", "checklist", "current-assignee-id", "due-date", "message", "priority", "status", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get actions(): TaskAssignmentPanelAction[] {
    return this.parseJsonAttribute<TaskAssignmentPanelAction[]>("actions", []);
  }

  set actions(value: TaskAssignmentPanelAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get assignees(): TaskAssignmentPanelAssignee[] {
    return this.parseJsonAttribute<TaskAssignmentPanelAssignee[]>("assignees", []);
  }

  set assignees(value: TaskAssignmentPanelAssignee[]) {
    this.setAttribute("assignees", JSON.stringify(value));
  }

  get checklist(): TaskAssignmentPanelChecklistItem[] {
    return this.parseJsonAttribute<TaskAssignmentPanelChecklistItem[]>("checklist", []);
  }

  set checklist(value: TaskAssignmentPanelChecklistItem[]) {
    this.setAttribute("checklist", JSON.stringify(value));
  }

  get currentAssigneeId(): string {
    return this.getAttribute("current-assignee-id") ?? "";
  }

  set currentAssigneeId(value: string) {
    if (!value) {
      this.removeAttribute("current-assignee-id");
      return;
    }

    this.setAttribute("current-assignee-id", value);
  }

  get dueDate(): string {
    return this.getAttribute("due-date") ?? "";
  }

  set dueDate(value: string) {
    if (!value) {
      this.removeAttribute("due-date");
      return;
    }

    this.setAttribute("due-date", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get priority(): string {
    return this.getAttribute("priority") ?? "";
  }

  set priority(value: string) {
    if (!value) {
      this.removeAttribute("priority");
      return;
    }

    this.setAttribute("priority", value);
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
    return this.getAttribute("title") ?? "Task Assignment";
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
        detail: {
          action: actionId,
          assigneeId: this.currentAssigneeId,
          checklist: this.checklist,
        },
      }),
    );
  }

  private updateAssignee(assigneeId: string): void {
    this.currentAssigneeId = assigneeId;
    this.dispatchEvent(
      new CustomEvent("assignee-changed", {
        bubbles: true,
        composed: true,
        detail: { assigneeId },
      }),
    );
  }

  private updateChecklist(itemId: string, checked: boolean): void {
    const nextChecklist = this.checklist.map(item => (item.id === itemId ? { ...item, checked } : item));
    this.checklist = nextChecklist;
    this.dispatchEvent(
      new CustomEvent("checklist-changed", {
        bubbles: true,
        composed: true,
        detail: { itemId, checked, checklist: nextChecklist },
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const statusMarkup = this.status ? `<span part="status">${escapeHtml(this.status)}</span>` : "";
    const priorityMarkup = this.priority ? `<span part="priority">${escapeHtml(this.priority)}</span>` : "";
    const dueDateMarkup = this.dueDate ? `<span part="due-date">Due ${escapeHtml(this.dueDate)}</span>` : "";
    const assigneesMarkup = this.assignees.length
      ? `
          <section part="assignees">
            <div part="section-title">Assignees</div>
            <div part="assignee-list" role="listbox" aria-label="${escapeHtml(this.title)} assignees">
              ${this.assignees
                .map(
                  assignee => `
                    <button
                      type="button"
                      part="assignee"
                      role="option"
                      aria-selected="${String(assignee.id === this.currentAssigneeId)}"
                      data-assignee-id="${escapeHtml(assignee.id)}"
                    >
                      <span part="assignee-avatar">${escapeHtml(assignee.initials ?? assignee.name.slice(0, 2).toUpperCase())}</span>
                      <span part="assignee-meta">
                        <span part="assignee-name">${escapeHtml(assignee.name)}</span>
                        ${assignee.description ? `<span part="assignee-description">${escapeHtml(assignee.description)}</span>` : ""}
                        ${assignee.status ? `<span part="assignee-status">${escapeHtml(assignee.status)}</span>` : ""}
                      </span>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
      : "";
    const checklistMarkup = this.checklist.length
      ? `
          <section part="checklist">
            <div part="section-title">Checklist</div>
            <div part="checklist-items">
              ${this.checklist
                .map(
                  item => `
                    <label part="checklist-item">
                      <input
                        type="checkbox"
                        part="checkbox"
                        data-item-id="${escapeHtml(item.id)}"
                        ${item.checked ? "checked" : ""}
                      />
                      <span part="checklist-copy">
                        <span part="checklist-label">${escapeHtml(item.label)}</span>
                        ${item.description ? `<span part="checklist-description">${escapeHtml(item.description)}</span>` : ""}
                      </span>
                    </label>
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

        [part="title"] {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.55;
        }

        [part="meta"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }

        [part="status"],
        [part="priority"],
        [part="due-date"],
        [part="assignee-status"] {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.28rem 0.55rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="priority"] {
          background: rgba(255, 248, 225, 0.96);
          color: #8a6517;
        }

        [part="due-date"] {
          background: rgba(241, 235, 255, 0.96);
          color: #5b4b8a;
        }

        [part="section-title"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="assignees"],
        [part="checklist"] {
          display: grid;
          gap: 0.7rem;
        }

        [part="assignee-list"],
        [part="checklist-items"] {
          display: grid;
          gap: 0.75rem;
        }

        [part="assignee"] {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.75rem;
          align-items: center;
          padding: 0.85rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        [part="assignee"][aria-selected="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 88%, white 12%);
        }

        [part="assignee-avatar"] {
          width: 2.2rem;
          height: 2.2rem;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 82%, white 18%) 0%,
            var(--boe-token-surface-surface-brand, #0061d5) 100%
          );
          color: white;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        [part="assignee-meta"] {
          display: grid;
          gap: 0.2rem;
          min-width: 0;
        }

        [part="assignee-name"],
        [part="checklist-label"] {
          font-weight: 600;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="assignee-description"],
        [part="checklist-description"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.45;
        }

        [part="checklist-item"] {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.75rem;
          align-items: start;
          padding: 0.85rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="checkbox"] {
          margin-top: 0.2rem;
        }

        [part="checklist-copy"] {
          display: grid;
          gap: 0.2rem;
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

        [part="action"]:focus-visible,
        [part="assignee"]:focus-visible,
        [part="checkbox"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <section part="panel">
        <header part="header">
          <div part="title">${escapeHtml(this.title)}</div>
          ${messageMarkup}
          <div part="meta">${statusMarkup}${priorityMarkup}${dueDateMarkup}</div>
        </header>
        ${assigneesMarkup}
        ${checklistMarkup}
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

    this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="assignee"]').forEach(button => {
      button.addEventListener("click", () => {
        const assigneeId = button.dataset.assigneeId;
        if (assigneeId) {
          this.updateAssignee(assigneeId);
        }
      });
    });

    this.shadowRoot.querySelectorAll<HTMLInputElement>('[part="checkbox"]').forEach(input => {
      input.addEventListener("change", () => {
        const itemId = input.dataset.itemId;
        if (itemId) {
          this.updateChecklist(itemId, input.checked);
        }
      });
    });
  }
}

export const defineBoxTaskAssignmentPanelElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxTaskAssignmentPanelElement);
  }
};
