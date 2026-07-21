import { BaseElement } from "../../core/index.js";
import { FocusRestore, trapTabKey } from "../../foundations/a11y/index.js";
import { boeControl, boeOverlay, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
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
    background: ${boeOverlay.modalBackdrop};
    display: grid;
    place-items: center;
    padding: ${boeOverlay.modalPadding};
  }

  [part="dialog"] {
    width: min(${boeOverlay.modalWidth}, calc(100vw - 3rem));
    background: var(--boe-token-surface-surface, #ffffff);
    border: 0;
    border-radius: ${boeOverlay.modalRadius};
    box-shadow: ${boeOverlay.modalShadow};
    padding: ${boeOverlay.modalPadding};
    display: grid;
    gap: ${boeSpace[5]};
    color: var(--boe-token-text-text, #222222);
  }

  /* Size options — box-ui-elements Modal sizes. Default (medium) is the base. */
  [part="dialog"][data-size="small"] { width: min(380px, calc(100vw - 3rem)); }
  [part="dialog"][data-size="large"] { width: min(760px, calc(100vw - 3rem)); }
  [part="dialog"][data-size="fullscreen"] {
    width: calc(100vw - 2rem);
    height: calc(100vh - 2rem);
    max-width: none;
    border-radius: ${boeRadius.large};
  }

  [part="header"] h2 {
    margin: 0;
    font: inherit;
    font-size: ${boeOverlay.modalTitleSize};
    font-weight: 700;
    line-height: 24px;
  }

  [part="description"] {
    margin: 0;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 14px;
    line-height: 20px;
  }

  [part="description"][hidden] {
    display: none;
  }

  [part="body"] {
    color: var(--boe-token-text-text, #222222);
    font-size: 14px;
    line-height: 20px;
  }

  [part="footer"] {
    display: flex;
    justify-content: end;
    gap: ${boeSpace[2]};
    margin-top: ${boeSpace[2]};
    padding-top: 0;
    border-top: 0;
  }

  [part="cancel"],
  [part="confirm"] {
    appearance: none;
    box-sizing: border-box;
    border: 1px solid ${boeControl.buttonBorder};
    border-radius: ${boeRadius.med};
    font: inherit;
    font-size: ${boeControl.fontSize};
    font-weight: 700;
    letter-spacing: ${boeControl.letterSpacing};
    min-height: ${boeControl.heightLarge};
    padding: 0 ${boeControl.paddingInline};
    cursor: pointer;
  }

  [part="cancel"] {
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #222222);
  }

  [part="confirm"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  ${boeNeutralInteractiveStyles('[part="cancel"]')}
  ${boeBrandInteractiveStyles('[part="confirm"]')}
`;

export class BoxDialogElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["confirm-label", "description", "heading", "open", "size"];
  }

  private openValue = false;
  private wasOpen = false;
  private scrollLocked = false;
  private previousBodyOverflow = "";
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

  /** Modal size — box-ui-elements Modal sizes. Default `medium`. */
  get size(): "small" | "medium" | "large" | "fullscreen" {
    const size = this.getAttribute("size");
    return size === "small" || size === "large" || size === "fullscreen" ? size : "medium";
  }

  set size(value: "small" | "medium" | "large" | "fullscreen") {
    this.setAttribute("size", value);
  }

  /** Lock/unlock background page scroll while the modal is open. */
  private setScrollLock(locked: boolean): void {
    if (locked === this.scrollLocked) {
      return;
    }
    this.scrollLocked = locked;
    if (locked) {
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = this.previousBodyOverflow;
    }
  }

  disconnectedCallback(): void {
    this.setScrollLock(false);
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
      this.setScrollLock(false);
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
    this.setScrollLock(true);

    if (!this.hostEl.querySelector('[part="dialog"]')) {
      this.hostEl.innerHTML = `
        <style>${dialogStyles}</style>
        <div part="backdrop">
          <section part="dialog" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="dialog-title" data-size="${this.size}">
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

    const dialogEl = this.hostEl.querySelector('[part="dialog"]') as HTMLElement | null;
    if (dialogEl) {
      dialogEl.dataset.size = this.size;
    }

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
