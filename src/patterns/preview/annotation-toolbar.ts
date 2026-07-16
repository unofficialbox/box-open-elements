import { BaseElement } from "../../core/index.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../foundations/a11y/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
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

type AnnotationToolbarTool = {
  disabled?: boolean;
  icon?: string;
  id: string;
  label: string;
};

type AnnotationToolbarAction = {
  id: string;
  label: string;
  tone?: string;
};

type AnnotationToolbarColor = {
  id: string;
  label: string;
  value: string;
};


const elementStyles = `
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
          border-radius: 0.55rem;
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

export class BoxAnnotationToolbarElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "active-tool-id", "color-options", "current-color", "label", "tools"];
  }
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

    const toolMarkup = this.tools.length
      ? this.tools
          .map(tool => {
            const isActive = tool.id === this.activeToolId;
            return `
              <button
                type="button"
                part="tool"
                data-tool-id="${escapeHtml(tool.id)}"
                ${tool.disabled ? "disabled" : ""}
                aria-pressed="${isActive ? "true" : "false"}"
              >
                <span part="tool-icon">${escapeHtml(tool.icon ?? "")}</span>
                <span part="tool-label">${escapeHtml(tool.label)}</span>
              </button>
            `;
          })
          .join("")
      : `<div part="empty">No annotation tools configured.</div>`;

    const colorMarkup = this.colorOptions.length
      ? this.colorOptions
          .map(color => {
            const selected = color.value === this.currentColor;
            return `
              <button
                type="button"
                part="color"
                data-color-id="${escapeHtml(color.id)}"
                data-color-value="${escapeHtml(color.value)}"
                aria-pressed="${selected ? "true" : "false"}"
                aria-label="${escapeHtml(color.label)}"
                title="${escapeHtml(color.label)}"
                style="--annotation-color:${escapeHtml(color.value)};"
              >
                <span part="color-swatch"></span>
              </button>
            `;
          })
          .join("")
      : `<div part="empty">No colors configured.</div>`;

    const actionMarkup = this.actions.length
      ? this.actions
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
          .join("")
      : "";

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <article part="toolbar">
        <div part="header">${escapeHtml(this.label)}</div>
        <div part="body">
          <section part="section">
            <div part="section-title">Tools</div>
            <div part="tools" role="toolbar" aria-label="${escapeHtml(this.label)} tools">
              ${toolMarkup}
            </div>
          </section>
          <section part="section">
            <div part="section-title">Colors</div>
            <div part="colors" role="toolbar" aria-label="${escapeHtml(this.label)} colors">
              ${colorMarkup}
            </div>
          </section>
          ${actionMarkup
            ? `
              <section part="section">
                <div part="section-title">Actions</div>
                <div part="actions">
                  ${actionMarkup}
                </div>
              </section>
            `
            : ""}
        </div>
      </article>
    `;

    this.shadowRoot.querySelectorAll('[part="tool"]').forEach(button => {
      button.addEventListener("click", () => {
        const toolId = button.getAttribute("data-tool-id");
        const tool = this.tools.find(item => item.id === toolId);
        if (tool && !tool.disabled) {
          this.emitToolSelected(tool);
        }
      });
    });

    this.shadowRoot.querySelectorAll('[part="color"]').forEach(button => {
      button.addEventListener("click", () => {
        const colorId = button.getAttribute("data-color-id");
        const color = this.colorOptions.find(item => item.id === colorId);
        if (color) {
          this.emitColorSelected(color);
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

    const bindToolbar = (selector: string): void => {
      const toolbar = this.shadowRoot?.querySelector(selector);
      if (!toolbar) {
        return;
      }
      const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>("button")).filter(
        button => !button.disabled,
      );
      applyRovingTabindex(buttons, 0);
      toolbar.addEventListener("keydown", event => {
        handleRovingKeydown(event as KeyboardEvent, buttons, { orientation: "horizontal" });
      });
    };
    bindToolbar('[part="tools"]');
    bindToolbar('[part="colors"]');
  }
}

export const defineBoxAnnotationToolbarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAnnotationToolbarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAnnotationToolbarElement;
  }

  customElements.define(tagName, BoxAnnotationToolbarElement);
  return BoxAnnotationToolbarElement;
};
