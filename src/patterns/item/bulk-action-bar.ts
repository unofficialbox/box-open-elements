import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";
import { BaseElement } from "../../core/index.js";
import { applyRovingTabindex, nextRovingIndex } from "../../foundations/a11y/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/interaction.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-bulk-action-bar";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BulkAction = {
  id: string;
  label: string;
  tone?: string;
};

type BulkActionItem = {
  description?: string;
  id?: string;
  label: string;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          --_obp-surface: var(--boe-token-surface-surface, #ffffff);
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #fbfbfb);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 58%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #6f6f6f);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="bar"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid var(--_obp-border);
          border-radius: ${boePanel.radius};
          background: var(--_obp-surface-muted);
        }

        [part="topline"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
          align-items: center;
          justify-content: space-between;
        }

        [part="summary"] {
          display: grid;
          gap: 0.25rem;
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--_obp-brand);
        }

        [part="count"] {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.1;
        }

        [part="message"] {
          color: var(--_obp-text-muted);
          line-height: 1.55;
        }

        [part="items"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }

        [part="item"] {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 0.65rem;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          background: var(--_obp-surface);
        }

        [part="item-label"] {
          font-weight: 600;
        }

        [part="item-description"] {
          color: var(--_obp-text-muted);
          font-size: 0.92rem;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
          align-items: center;
          justify-content: flex-end;
        }

        [part="action"],
        [part="clear"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.4rem 0.7rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
          transition:
            transform ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="clear"] {
          color: var(--_obp-text-muted);
        }

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeNeutralInteractiveStyles('[part="clear"]')}

        [part="action"][data-tone="primary"],
        [part="action"][data-tone="primary"]:hover:not(:disabled),
        [part="action"][data-tone="primary"]:active:not(:disabled) {
          border-color: color-mix(in srgb, var(--_obp-brand) 34%, transparent);
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
        }

        @media (max-width: 720px) {
          [part="topline"] {
            align-items: start;
          }

          [part="actions"] {
            justify-content: start;
          }
        }
      `;

export class BulkActionBar extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "clear-label", "count", "items", "label", "message"];
  }
  get actions(): BulkAction[] {
    return this.parseJsonAttribute<BulkAction[]>("actions", []);
  }

  set actions(value: BulkAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get clearLabel(): string {
    return this.getAttribute("clear-label") ?? "Clear selection";
  }

  set clearLabel(value: string) {
    this.setAttribute("clear-label", value);
  }

  get count(): number {
    const raw = this.getAttribute("count");
    if (!raw) {
      return this.items.length;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : this.items.length;
  }

  set count(value: number) {
    this.setAttribute("count", String(value));
  }

  get items(): BulkActionItem[] {
    return this.parseJsonAttribute<BulkActionItem[]>("items", []);
  }

  set items(value: BulkActionItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Bulk actions";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
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
          count: this.count,
          items: this.items,
        },
      }),
    );
  }

  private emitClear(): void {
    this.dispatchEvent(
      new CustomEvent("clear", {
        bubbles: true,
        composed: true,
        detail: {
          count: this.count,
          items: this.items,
        },
      }),
    );
  }

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style>
      <div part="content-host"><section part="bar"><div part="topline"><div part="summary">
      <div part="label"></div><div part="count"></div><div part="message" hidden></div>
      </div><div part="actions" role="toolbar"></div></div><div part="items" hidden></div></section></div>`;
  }

  protected setupListeners(): void {
    const toolbar = this.shadowRoot!.querySelector<HTMLElement>('[part="actions"]')!;
    toolbar.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button || !toolbar.contains(button)) return;
      if (button.getAttribute("part") === "clear") this.emitClear();
      else if (button.dataset.actionId) this.emitAction(button.dataset.actionId);
    });
    toolbar.addEventListener("keydown", event => {
      const keyboard = event as KeyboardEvent;
      const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>("button"));
      const current = buttons.indexOf(keyboard.target as HTMLButtonElement);
      const next = current < 0 ? null : nextRovingIndex(keyboard.key, current, buttons.length, { orientation: "horizontal" });
      if (next !== null) { keyboard.preventDefault(); applyRovingTabindex(buttons, next); buttons[next]?.focus(); }
    });
  }

  protected update(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    root.querySelector('[part="label"]')!.textContent = this.label;
    root.querySelector('[part="count"]')!.textContent = `${this.count} selected`;
    const message = root.querySelector<HTMLElement>('[part="message"]')!;
    message.textContent = this.message; message.hidden = !this.message;
    const items = root.querySelector<HTMLElement>('[part="items"]')!;
    items.hidden = !this.items.length;
    items.innerHTML = this.items.map(item => `<div part="item"><span part="item-label">${escapeHtml(item.label)}</span>${item.description ? `<span part="item-description">${escapeHtml(item.description)}</span>` : ""}</div>`).join("");
    const toolbar = root.querySelector<HTMLElement>('[part="actions"]')!;
    toolbar.setAttribute("aria-label", this.label);
    const previousEntry = toolbar.querySelector<HTMLButtonElement>('button[tabindex="0"]');
    syncKeyedChildren<BulkAction | null>(toolbar, [...this.actions, null], action => action ? `action:${action.id}` : "clear", action => actionButton(action ? "action" : "clear"), (button, action) => {
      button.dataset.actionId = action?.id ?? "clear-selection";
      button.textContent = action?.label ?? this.clearLabel;
      if (action) { button.dataset.tone = action.tone ?? "neutral"; button.setAttribute("aria-label", action.label); }
    });
    const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>("button"));
    applyRovingTabindex(buttons, Math.max(0, buttons.indexOf(root.activeElement as HTMLButtonElement) >= 0 ? buttons.indexOf(root.activeElement as HTMLButtonElement) : buttons.indexOf(previousEntry!)));
  }
}

BulkActionBar.register();
