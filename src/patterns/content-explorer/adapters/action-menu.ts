import { ContentExplorerController } from "../controller.js";
import { BaseElement } from "../../../core/index.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../../foundations/a11y/index.js";
import {
  boeFocusRingShadow,
  boeNeutralInteractiveStyles,
} from "../../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../../foundations/motion/index.js";
import { boePanel } from "../../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-explorer-action-menu";

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");


const elementStyles = `
        :host {
          display: inline-grid;
          position: relative;
          color: inherit;
          font: inherit;
          font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
        }

        [part="menu-shell"] {
          position: relative;
          display: inline-grid;
          justify-items: end;
        }

        [part="trigger"] {
          width: 2rem;
          min-width: 2rem;
          height: 2rem;
          display: inline-grid;
          place-items: center;
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
          border-radius: ${boePanel.radius};
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, #eef4fb 6%);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font: inherit;
          cursor: pointer;
          padding: 0;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 1px 2px rgba(15, 23, 42, 0.04);
          transition:
            border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        ${boeNeutralInteractiveStyles('[part="trigger"]')}

        [part="trigger"][aria-expanded="true"],
        [part="trigger"][aria-expanded="true"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          box-shadow: 0 10px 22px rgba(0, 97, 213, 0.18);
        }

        [part="trigger"][aria-expanded="true"]:focus-visible {
          outline: none;
          box-shadow:
            ${boeFocusRingShadow},
            0 10px 22px rgba(0, 97, 213, 0.18);
        }

        [part="trigger-label"] {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        [part="trigger-icon"] {
          font-size: 1rem;
          line-height: 1;
          transform: translateY(-1px);
        }

        [part="menu"] {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 3;
          min-width: 11rem;
          margin: 0;
          padding: 0.45rem;
          display: grid;
          gap: 0.2rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 18px 32px rgba(0, 67, 146, 0.12);
        }

        [part="menu-item"] {
          width: 100%;
          appearance: none;
          text-align: left;
          border: 0;
          border-radius: ${boePanel.radius};
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.92rem;
          padding: 0.6rem 0.7rem;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="menu-item"]')}
      `;

export class BoxExplorerActionMenuElement extends BaseElement {
  private controllerValue: ContentExplorerController | null = null;

  private itemIdValue: string | null = null;

  private open = false;

  private wasOpen = false;

  private unsubscribeFns: Array<() => void> = [];

  private menuId = `box-action-menu-${Math.random().toString(36).slice(2, 10)}`;

  private hostEl!: HTMLElement;


  get controller(): ContentExplorerController | null {
    return this.controllerValue;
  }

  set controller(value: ContentExplorerController | null) {
    this.controllerValue = value;
    this.bindController();
    this.refresh();
  }

  get itemId(): string | null {
    return this.itemIdValue;
  }

  set itemId(value: string | null) {
    this.itemIdValue = value;
    this.open = false;
    this.refresh();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.bindController();
    this.refresh();
  }

  private refresh(): void {
    if (this.isRendered) {
      this.update();
    }
  }

  disconnectedCallback(): void {
    this.teardownSubscriptions();
  }

  private bindController(): void {
    this.teardownSubscriptions();

    if (!this.isConnected || !this.controllerValue) {
      return;
    }

    this.unsubscribeFns.push(
      this.controllerValue.subscribe("itemsChanged", payload => {
        this.dispatchEvent(
          new CustomEvent("items-changed", {
            bubbles: true,
            composed: true,
            detail: payload,
          }),
        );
        this.refresh();
      }),
    );

    this.unsubscribeFns.push(
      this.controllerValue.subscribe("selectionChanged", () => {
        this.refresh();
      }),
    );

  }

  private teardownSubscriptions(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];
  }


  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
    this.hostEl = this.shadowRoot.querySelector('[part="content-host"]')!;
  }

  protected setupListeners(): void {
    this.shadowRoot?.addEventListener("click", event => {
      const target = event.target as HTMLElement;
      const trigger = target.closest('[part="trigger"]') as HTMLButtonElement | null;
      if (trigger && this.shadowRoot?.contains(trigger)) {
        this.open = !this.open;
        this.update();
        return;
      }
      const menuItem = target.closest('[part="menu-item"]') as HTMLElement | null;
      if (menuItem && this.shadowRoot?.contains(menuItem)) {
        const actionId = menuItem.getAttribute("data-action-id");
        if (this.itemIdValue && actionId) {
          const item = this.controllerValue?.getState().items.find(entry => entry.id === this.itemIdValue) ?? null;
          const action = this.controllerValue?.getItemActions(this.itemIdValue).find(entry => entry.id === actionId) ?? null;
          this.controllerValue?.invokeItemAction(this.itemIdValue, actionId);
          if (item && action) {
            this.dispatchEvent(
              new CustomEvent(toKebabCase("itemActionInvoked"), {
                bubbles: true,
                composed: true,
                detail: { action, item },
              }),
            );
          }
          this.open = false;
          this.update();
        }
      }
    });

    this.shadowRoot?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const target = keyboardEvent.target as HTMLElement;
      const trigger = target.closest('[part="trigger"]') as HTMLButtonElement | null;
      if (trigger && this.shadowRoot?.contains(trigger)) {
        if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          this.open = true;
          this.update();
        } else if (keyboardEvent.key === "Escape" && this.open) {
          keyboardEvent.preventDefault();
          this.open = false;
          this.update();
        }
        return;
      }
      const menuItem = target.closest('[part="menu-item"]') as HTMLElement | null;
      if (!menuItem || !this.shadowRoot?.contains(menuItem)) {
        return;
      }

      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.open = false;
        this.update();
        queueMicrotask(() => {
          (this.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null)?.focus();
        });
        return;
      }

      const menuItems = Array.from(
        this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="menu-item"]'),
      );
      handleRovingKeydown(keyboardEvent, menuItems, { orientation: "vertical" });
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    const actions = this.itemIdValue ? (this.controllerValue?.getItemActions(this.itemIdValue) ?? []) : [];
    const justOpened = this.open && !this.wasOpen;
    this.wasOpen = this.open;

    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const focusedActionId = active?.getAttribute?.("data-action-id") ?? null;
    const focusedTrigger = active?.getAttribute?.("part") === "trigger";

    if (!this.itemIdValue || actions.length === 0) {
      this.hostEl.innerHTML = `<span part="empty"></span>`;
      return;
    }

    const menuMarkup = this.open
      ? `<div id="${this.menuId}" part="menu" role="menu">${actions
          .map(
            action =>
              `<button type="button" part="menu-item" role="menuitem" data-action-id="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`,
          )
          .join("")}</div>`
      : "";

    this.hostEl.innerHTML = `
      <div part="menu-shell">
        <button
          type="button"
          part="trigger"
          aria-label="Open item actions"
          aria-expanded="${this.open ? "true" : "false"}"
          aria-haspopup="menu"
          ${this.open ? `aria-controls="${this.menuId}"` : ""}
        ><span part="trigger-label">Actions</span><span part="trigger-icon" aria-hidden="true">⋯</span></button>
        ${menuMarkup}
      </div>
    `;

    if (this.open) {
      const menuItems = Array.from(
        this.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="menu-item"]') ?? [],
      );
      applyRovingTabindex(menuItems, 0);
    }

    if (justOpened) {
      queueMicrotask(() => {
        (this.shadowRoot?.querySelector('[part="menu-item"]') as HTMLButtonElement | null)?.focus();
      });
      return;
    }

    if (focusedActionId && this.open) {
      queueMicrotask(() => {
        const match = Array.from(
          this.shadowRoot?.querySelectorAll('[part="menu-item"]') ?? [],
        ).find(node => (node as HTMLElement).getAttribute("data-action-id") === focusedActionId) as
          | HTMLButtonElement
          | undefined;
        match?.focus();
      });
      return;
    }

    if (focusedTrigger) {
      queueMicrotask(() => {
        (this.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null)?.focus();
      });
    }
  }

}

export const defineBoxExplorerActionMenuElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerActionMenuElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerActionMenuElement;
  }

  customElements.define(tagName, BoxExplorerActionMenuElement);
  return BoxExplorerActionMenuElement;
};
