import { BaseElement } from "../../core/index.js";
import { FocusRestore, trapTabKey } from "../../foundations/a11y/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-dialog";

const dialogStyles = `
  :host {
    color: inherit;
    font: inherit;
  }

  [part="backdrop"] {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: rgba(15, 23, 42, 0.34);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 1.5rem;
  }

  [part="dialog"] {
    width: min(30rem, calc(100vw - 3rem));
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 78%, var(--boe-token-surface-surface-secondary, #fbfbfb) 22%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 100%
      );
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 1.35rem;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 24px 48px rgba(15, 23, 42, 0.16);
    padding: 1.35rem;
    display: grid;
    gap: 1rem;
    color: var(--boe-token-text-text, #1f1e1b);
  }

  [part="header"] h2 {
    margin: 0;
    font: inherit;
    font-size: 1.2rem;
    font-weight: 700;
  }

  [part="description"] {
    margin: 0;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.5;
  }

  [part="description"][hidden] {
    display: none;
  }

  [part="body"] {
    color: var(--boe-token-text-text, #1f1e1b);
    line-height: 1.55;
  }

  [part="footer"] {
    display: flex;
    justify-content: end;
    gap: 0.65rem;
    padding-top: 0.15rem;
    border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
  }

  [part="cancel"],
  [part="confirm"] {
    appearance: none;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 999px;
    font: inherit;
    min-height: 2rem;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
  }

  [part="cancel"] {
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="confirm"] {
    border-color: transparent;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  ${boeNeutralInteractiveStyles('[part="cancel"]')}
  ${boeBrandInteractiveStyles('[part="confirm"]')}
`;

export class BoxDialogElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["confirm-label", "description", "heading", "open"];
  }

  private openValue = false;
  private wasOpen = false;
  private hostEl!: HTMLElement;
  private titleEl: HTMLElement | null = null;
  private descriptionEl: HTMLElement | null = null;
  private confirmEl: HTMLButtonElement | null = null;
  private readonly focusRestore = new FocusRestore();

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextOpen = Boolean(value);
    if (this.openValue === nextOpen) {
      return;
    }

    this.openValue = nextOpen;

    if (nextOpen) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }

    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextOpen } }));
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Dialog";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get confirmLabel(): string {
    return this.getAttribute("confirm-label") ?? "Confirm";
  }

  set confirmLabel(value: string) {
    this.setAttribute("confirm-label", value);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Keep styles inside the host so a closed dialog has empty textContent.
    this.shadowRoot.innerHTML = `<div part="host"></div>`;
    this.hostEl = this.shadowRoot.querySelector('[part="host"]')!;
  }

  protected setupListeners(): void {
    this.hostEl.addEventListener("click", event => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.getAttribute("part") === "backdrop") {
        this.close();
        return;
      }

      if (target.closest('[part="cancel"]')) {
        this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
        this.close();
        return;
      }

      if (target.closest('[part="confirm"]')) {
        this.dispatchEvent(new CustomEvent("confirm", { bubbles: true, composed: true }));
        this.close();
      }
    });

    this.hostEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const dialog = (keyboardEvent.target as HTMLElement | null)?.closest(
        '[part="dialog"]',
      ) as HTMLElement | null;
      if (!dialog || !this.hostEl.contains(dialog)) {
        return;
      }

      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
        this.close();
        return;
      }

      if (keyboardEvent.key === "Tab") {
        trapTabKey(keyboardEvent, dialog);
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    if (!this.openValue) {
      const wasOpen = this.wasOpen;
      this.hostEl.innerHTML = "";
      this.titleEl = null;
      this.descriptionEl = null;
      this.confirmEl = null;
      this.wasOpen = false;
      if (wasOpen) {
        this.focusRestore.restore();
      }
      return;
    }

    const justOpened = !this.wasOpen;
    this.wasOpen = true;
    if (justOpened) {
      this.focusRestore.capture();
    }

    if (!this.hostEl.querySelector('[part="dialog"]')) {
      this.hostEl.innerHTML = `
        <style>${dialogStyles}</style>
        <div part="backdrop">
          <section part="dialog" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="dialog-title">
            <header part="header">
              <h2 id="dialog-title"></h2>
            </header>
            <p part="description" hidden></p>
            <div part="body"><slot></slot></div>
            <footer part="footer">
              <button type="button" part="cancel">Cancel</button>
              <button type="button" part="confirm"></button>
            </footer>
          </section>
        </div>
      `;
    }

    this.titleEl = this.hostEl.querySelector("#dialog-title");
    this.descriptionEl = this.hostEl.querySelector('[part="description"]');
    this.confirmEl = this.hostEl.querySelector('[part="confirm"]');

    if (this.titleEl) {
      this.titleEl.textContent = this.heading;
    }
    if (this.descriptionEl) {
      const description = this.description;
      this.descriptionEl.textContent = description;
      this.descriptionEl.hidden = !description;
    }
    if (this.confirmEl) {
      this.confirmEl.textContent = this.confirmLabel;
    }

    if (justOpened) {
      queueMicrotask(() => {
        (this.hostEl.querySelector('[part="dialog"]') as HTMLElement | null)?.focus();
      });
    }
  }
}

export const defineBoxDialogElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDialogElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDialogElement;
  }

  customElements.define(tagName, BoxDialogElement);
  return BoxDialogElement;
};
