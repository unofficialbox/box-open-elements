import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

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


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
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

        [part="meta"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
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
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 16%, var(--boe-token-surface-surface, #ffffff));
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 62%, var(--boe-token-text-text, #222222));
        }

        [part="due-date"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-accent, #5b4b8a) 12%, var(--boe-token-surface-surface, #ffffff));
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-accent, #5b4b8a) 72%, var(--boe-token-text-text, #222222));
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
          gap: ${boePanel.gap};
        }

        [part="assignee-list"],
        [part="checklist-items"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="assignee"] {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: ${boePanel.gap};
          align-items: center;
          padding: 0.65rem 0.75rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        [part="assignee-avatar"] {
          width: 2rem;
          height: 2rem;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 82%, var(--boe-token-surface-surface, #ffffff) 18%) 0%,
            var(--boe-token-surface-surface-brand, #0061d5) 100%
          );
          color: var(--boe-token-text-text-on-brand, #ffffff);
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
          gap: ${boePanel.gap};
          align-items: start;
          padding: 0.65rem 0.75rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: ${boePanel.radius};
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

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeNeutralInteractiveStyles('[part="assignee"]')}
        ${boeFocusVisibleStyles('[part="checkbox"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="assignee"][aria-selected="true"],
        [part="assignee"][aria-selected="true"]:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 88%, var(--boe-token-surface-surface, #ffffff) 12%);
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class BoxTaskAssignmentPanelElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "assignees", "checklist", "current-assignee-id", "due-date", "message", "priority", "status", "heading"];
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

  get heading(): string {
    return this.getAttribute("heading") ?? "Task Assignment";
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
    const statusMarkup = this.status ? `<span part="status">${escapeHtml(this.status)}</span>` : "";
    const priorityMarkup = this.priority ? `<span part="priority">${escapeHtml(this.priority)}</span>` : "";
    const dueDateMarkup = this.dueDate ? `<span part="due-date">Due ${escapeHtml(this.dueDate)}</span>` : "";
    const assigneesMarkup = this.assignees.length
      ? `
          <section part="assignees">
            <div part="section-title">Assignees</div>
            <div part="assignee-list" role="listbox" aria-label="${escapeHtml(this.heading)} assignees">
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

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <section part="panel">
        <header part="header">
          <h2 part="title">${escapeHtml(this.heading)}</h2>
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
