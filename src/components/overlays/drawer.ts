import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-drawer";

const drawerStyles = `
  :host {
    color: inherit;
    font: inherit;
  }

  [part="backdrop"] {
    position: fixed;
    inset: 0;
    display: grid;
    z-index: 1200;
    background: rgba(15, 23, 42, 0.24);
    backdrop-filter: blur(6px);
  }

  [part="drawer"] {
    width: min(26.25rem, calc(100vw - 2rem));
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 78%, var(--boe-token-surface-surface-secondary, #fbfbfb) 22%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 100%
      );
    color: var(--boe-token-text-text, #1f1e1b);
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 26px 52px rgba(15, 23, 42, 0.14);
  }

  [part="drawer"][data-position="left"] {
    border-left: 0;
    border-top-right-radius: 1.35rem;
    border-bottom-right-radius: 1.35rem;
  }

  [part="drawer"][data-position="right"] {
    border-right: 0;
    border-top-left-radius: 1.35rem;
    border-bottom-left-radius: 1.35rem;
  }

  [part="drawer"][data-position="bottom"] {
    width: 100%;
    max-width: none;
    height: min(20rem, calc(100vh - 3rem));
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    border-top-left-radius: 1.35rem;
    border-top-right-radius: 1.35rem;
  }

  [part="header"] {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.35rem 1.35rem 1.1rem;
    border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
  }

  [part="meta"] {
    display: grid;
    gap: 0.35rem;
  }

  [part="meta"] h2 {
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

  [part="close"] {
    appearance: none;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.9rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    min-height: 2rem;
    padding: 0.35rem 0.8rem;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  }

  [part="close"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }

  [part="body"] {
    padding: 1.35rem;
    overflow: auto;
  }
`;

export class BoxDrawerElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["description", "heading", "open", "position"];
  }

  private openValue = false;
  private placeholder: Comment | null = null;
  private portaled = false;
  private hostEl!: HTMLElement;
  private backdropEl: HTMLElement | null = null;
  private drawerEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private descriptionEl: HTMLElement | null = null;

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

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
    if (this.isRendered) {
      this.update();
    }
  }

  get position(): string {
    return this.getAttribute("position") ?? "right";
  }

  set position(value: string) {
    this.setAttribute("position", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Drawer";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  connectedCallback(): void {
    if (this.openValue) {
      this.portalToBody();
    }
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
      if (this.openValue) {
        this.portalToBody();
      } else {
        this.restoreFromPortal();
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
    this.restoreFromPortal();
  }

  private portalToBody(): void {
    if (this.portaled || !this.isConnected || !this.ownerDocument?.body) {
      return;
    }

    const parent = this.parentNode;
    if (!parent || parent === this.ownerDocument.body) {
      return;
    }

    this.placeholder = this.ownerDocument.createComment("box-drawer-placeholder");
    parent.insertBefore(this.placeholder, this);
    this.ownerDocument.body.append(this);
    this.portaled = true;
  }

  private restoreFromPortal(): void {
    if (!this.portaled || !this.placeholder?.parentNode) {
      return;
    }

    this.placeholder.parentNode.insertBefore(this, this.placeholder);
    this.placeholder.remove();
    this.placeholder = null;
    this.portaled = false;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Keep styles inside the host so a closed drawer has empty textContent.
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

      if (target.closest('[part="close"]')) {
        this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
        this.close();
      }
    });

    this.hostEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== "Escape") {
        return;
      }
      if (!(keyboardEvent.target as HTMLElement | null)?.closest('[part="drawer"]')) {
        return;
      }
      keyboardEvent.preventDefault();
      this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
      this.close();
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    if (!this.openValue) {
      this.hostEl.innerHTML = "";
      this.backdropEl = null;
      this.drawerEl = null;
      this.titleEl = null;
      this.descriptionEl = null;
      return;
    }

    if (!this.hostEl.querySelector('[part="drawer"]')) {
      this.hostEl.innerHTML = `
        <style>${drawerStyles}</style>
        <div part="backdrop">
          <aside part="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <header part="header">
              <div part="meta">
                <h2 id="drawer-title"></h2>
                <p part="description" hidden></p>
              </div>
              <button type="button" part="close" aria-label="Close drawer">Close</button>
            </header>
            <div part="body">
              <slot></slot>
            </div>
          </aside>
        </div>
      `;
    }

    this.backdropEl = this.hostEl.querySelector('[part="backdrop"]');
    this.drawerEl = this.hostEl.querySelector('[part="drawer"]');
    this.titleEl = this.hostEl.querySelector("#drawer-title");
    this.descriptionEl = this.hostEl.querySelector('[part="description"]');

    const isLeft = this.position === "left";
    const isBottom = this.position === "bottom";
    if (this.backdropEl) {
      this.backdropEl.style.alignItems = isBottom ? "end" : "";
      this.backdropEl.style.justifyItems = isBottom ? "stretch" : isLeft ? "start" : "end";
    }
    if (this.drawerEl) {
      this.drawerEl.dataset.position = this.position;
    }
    if (this.titleEl) {
      this.titleEl.textContent = this.heading;
    }
    if (this.descriptionEl) {
      const description = this.description;
      this.descriptionEl.textContent = description;
      this.descriptionEl.hidden = !description;
    }
  }
}

export const defineBoxDrawerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDrawerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDrawerElement;
  }

  customElements.define(tagName, BoxDrawerElement);
  return BoxDrawerElement;
};
