import { BaseElement } from "../../core/index.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../foundations/a11y/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-annotation-toolbar";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const isSafeColorValue = (value: string): boolean =>
  /^#[0-9a-fA-F]{3,8}$/.test(value) || /^[a-zA-Z]+$/.test(value);

export type AnnotationToolbarTool = {
  disabled?: boolean;
  icon?: string;
  id: string;
  label: string;
};

export type AnnotationToolbarAction = {
  id: string;
  label: string;
  tone?: string;
};

export type AnnotationToolbarColor = {
  id: string;
  label: string;
  value: string;
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

        [part="toolbar"] {
          display: grid;
          gap: 0.5rem;
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="header"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="body"] {
          display: grid;
          gap: 0.6rem;
        }

        [part="section"] {
          display: grid;
          gap: 0.5rem;
        }

        [part="section-title"] {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="tools"],
        [part="colors"],
        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        [part="tool"],
        [part="action"] {
          appearance: none;
          min-height: 1.75rem;
          padding: 0.3rem 0.65rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          border-radius: ${boeRadius.control};
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="tool"] {
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
        }

        [part="tool-icon"] {
          font-size: 0.8rem;
          line-height: 1;
        }

        [part="color"] {
          appearance: none;
          inline-size: 2rem;
          block-size: 2rem;
          padding: 0;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          cursor: pointer;
        }

        [part="color-swatch"] {
          display: block;
          inline-size: 100%;
          block-size: 100%;
          border-radius: inherit;
          background: var(--annotation-color, #0061d5);
          transform: scale(0.62);
        }

        [part="empty"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        ${boeNeutralInteractiveStyles('[part="tool"]')}
        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeNeutralInteractiveStyles('[part="color"]')}
        ${boeBrandInteractiveStyles('[part="tool"][aria-pressed="true"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="tool"][aria-pressed="true"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="color"][aria-pressed="true"],
        [part="color"][aria-pressed="true"]:hover:not(:disabled) {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.12);
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="action"][data-tone="danger"],
        [part="action"][data-tone="destructive"],
        [part="action"][data-tone="error"] {
          border-color: transparent;
          background: var(--boe-token-surface-status-surface-error, #ed3757);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="action"][data-tone="danger"]:hover:not(:disabled),
        [part="action"][data-tone="destructive"]:hover:not(:disabled),
        [part="action"][data-tone="error"]:hover:not(:disabled) {
          background: color-mix(
            in srgb,
            var(--boe-token-surface-status-surface-error, #ed3757) 88%,
            #000000 12%
          );
        }
      `;

export class AnnotationToolbar extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "active-tool-id", "color-options", "current-color", "label", "tools"];
  }

  private headerEl!: HTMLElement;
  private toolsEl!: HTMLElement;
  private colorsEl!: HTMLElement;
  private actionsSectionEl!: HTMLElement;
  private actionsEl!: HTMLElement;
  private toolsSignature: string | null = null;
  private colorsSignature: string | null = null;
  private actionsSignature = "";

  get actions(): AnnotationToolbarAction[] {
    return this.parseJsonAttribute<AnnotationToolbarAction[]>("actions", []);
  }

  set actions(value: AnnotationToolbarAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get activeToolId(): string {
    return this.getAttribute("active-tool-id") ?? "";
  }

  set activeToolId(value: string) {
    if (!value) {
      this.removeAttribute("active-tool-id");
      return;
    }

    this.setAttribute("active-tool-id", value);
  }

  get colorOptions(): AnnotationToolbarColor[] {
    return this.parseJsonAttribute<AnnotationToolbarColor[]>("color-options", []);
  }

  set colorOptions(value: AnnotationToolbarColor[]) {
    this.setAttribute("color-options", JSON.stringify(value));
  }

  get currentColor(): string {
    return this.getAttribute("current-color") ?? "";
  }

  set currentColor(value: string) {
    if (!value) {
      this.removeAttribute("current-color");
      return;
    }

    this.setAttribute("current-color", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Annotation Toolbar";
  }

  set label(value: string) {
    if (!value) {
      this.removeAttribute("label");
      return;
    }

    this.setAttribute("label", value);
  }

  get tools(): AnnotationToolbarTool[] {
    return this.parseJsonAttribute<AnnotationToolbarTool[]>("tools", []);
  }

  set tools(value: AnnotationToolbarTool[]) {
    this.setAttribute("tools", JSON.stringify(value));
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

  private emitToolSelected(tool: AnnotationToolbarTool): void {
    this.activeToolId = tool.id;
    this.dispatchEvent(
      new CustomEvent("tool-selected", {
        bubbles: true,
        composed: true,
        detail: tool,
      }),
    );
  }

  private emitColorSelected(color: AnnotationToolbarColor): void {
    this.currentColor = color.value;
    this.dispatchEvent(
      new CustomEvent("color-selected", {
        bubbles: true,
        composed: true,
        detail: color,
      }),
    );
  }

  private enabledButtons(container: HTMLElement): HTMLButtonElement[] {
    return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).filter(
      button => !button.disabled,
    );
  }

  private rebuildTools(): void {
    this.toolsEl.innerHTML = this.tools.length
      ? this.tools
          .map(
            tool => `
              <button
                type="button"
                part="tool"
                data-tool-id="${escapeHtml(tool.id)}"
                ${tool.disabled ? "disabled" : ""}
                aria-pressed="false"
              >
                <span part="tool-icon">${escapeHtml(tool.icon ?? "")}</span>
                <span part="tool-label">${escapeHtml(tool.label)}</span>
              </button>
            `,
          )
          .join("")
      : `<div part="empty">No annotation tools configured.</div>`;
  }

  private rebuildColors(): void {
    this.colorsEl.innerHTML = this.colorOptions.length
      ? this.colorOptions
          .map(color => {
            const styleAttr = isSafeColorValue(color.value)
              ? ` style="--annotation-color:${escapeHtml(color.value)};"`
              : "";
            return `
              <button
                type="button"
                part="color"
                data-color-id="${escapeHtml(color.id)}"
                data-color-value="${escapeHtml(color.value)}"
                aria-pressed="false"
                aria-label="${escapeHtml(color.label)}"
                title="${escapeHtml(color.label)}"${styleAttr}
              >
                <span part="color-swatch"></span>
              </button>
            `;
          })
          .join("")
      : `<div part="empty">No colors configured.</div>`;
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

  private patchToolSelection(): void {
    this.toolsEl.querySelectorAll('[part="tool"]').forEach(button => {
      const isActive = button.getAttribute("data-tool-id") === this.activeToolId;
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    const buttons = this.enabledButtons(this.toolsEl);
    const activeIndex = buttons.findIndex(button => button.getAttribute("aria-pressed") === "true");
    applyRovingTabindex(buttons, activeIndex >= 0 ? activeIndex : 0);
  }

  private patchColorSelection(): void {
    this.colorsEl.querySelectorAll('[part="color"]').forEach(button => {
      const selected = button.getAttribute("data-color-value") === this.currentColor;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    const buttons = this.enabledButtons(this.colorsEl);
    const activeIndex = buttons.findIndex(button => button.getAttribute("aria-pressed") === "true");
    applyRovingTabindex(buttons, activeIndex >= 0 ? activeIndex : 0);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <article part="toolbar">
        <div part="header"></div>
        <div part="body">
          <section part="section">
            <div part="section-title">Tools</div>
            <div part="tools" role="toolbar"></div>
          </section>
          <section part="section">
            <div part="section-title">Colors</div>
            <div part="colors" role="toolbar"></div>
          </section>
          <section part="section" hidden>
            <div part="section-title">Actions</div>
            <div part="actions"></div>
          </section>
        </div>
      </article>
    `;
    this.headerEl = this.shadowRoot.querySelector('[part="header"]')!;
    this.toolsEl = this.shadowRoot.querySelector('[part="tools"]')!;
    this.colorsEl = this.shadowRoot.querySelector('[part="colors"]')!;
    this.actionsEl = this.shadowRoot.querySelector('[part="actions"]')!;
    this.actionsSectionEl = this.actionsEl.closest("section")!;
  }

  protected setupListeners(): void {
    this.toolsEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="tool"]') as HTMLButtonElement | null;
      if (!button || !this.toolsEl.contains(button)) {
        return;
      }

      const toolId = button.getAttribute("data-tool-id");
      const tool = this.tools.find(item => item.id === toolId);
      if (tool && !tool.disabled) {
        this.emitToolSelected(tool);
      }
    });

    this.colorsEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="color"]') as HTMLButtonElement | null;
      if (!button || !this.colorsEl.contains(button)) {
        return;
      }

      const colorId = button.getAttribute("data-color-id");
      const color = this.colorOptions.find(item => item.id === colorId);
      if (color) {
        this.emitColorSelected(color);
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

    this.toolsEl.addEventListener("keydown", event => {
      handleRovingKeydown(event as KeyboardEvent, this.enabledButtons(this.toolsEl), {
        orientation: "horizontal",
      });
    });

    this.colorsEl.addEventListener("keydown", event => {
      handleRovingKeydown(event as KeyboardEvent, this.enabledButtons(this.colorsEl), {
        orientation: "horizontal",
      });
    });
  }

  protected update(): void {
    if (!this.toolsEl) {
      return;
    }

    this.headerEl.textContent = this.label;
    this.toolsEl.setAttribute("aria-label", `${this.label} tools`);
    this.colorsEl.setAttribute("aria-label", `${this.label} colors`);

    const nextTools = this.getAttribute("tools");
    if (nextTools !== this.toolsSignature || this.toolsEl.childElementCount === 0) {
      this.toolsSignature = nextTools;
      this.rebuildTools();
    }
    this.patchToolSelection();

    const nextColors = this.getAttribute("color-options");
    if (nextColors !== this.colorsSignature || this.colorsEl.childElementCount === 0) {
      this.colorsSignature = nextColors;
      this.rebuildColors();
    }
    this.patchColorSelection();

    const actions = this.actions;
    this.actionsSectionEl.hidden = actions.length === 0;
    const nextActions = this.actionsKey();
    if (nextActions !== this.actionsSignature || this.actionsEl.childElementCount === 0) {
      this.actionsSignature = nextActions;
      this.rebuildActions();
    } else {
      this.patchActionLabels();
    }
  }

  private actionsKey(): string {
    return JSON.stringify(this.actions.map(action => action.id));
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
}

AnnotationToolbar.register();
