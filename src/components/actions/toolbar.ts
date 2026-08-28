import { BaseElement } from "../../core/index.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../foundations/a11y/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-toolbar";

const ORIENTATIONS = new Set(["horizontal", "vertical"]);

/**
 * Controls a toolbar will manage. Deliberately the natively focusable ones:
 * roving tabindex works by moving `tabindex` between elements, which only
 * focuses what the browser already considers focusable. A custom element host
 * is not focusable unless it says so, so wrapping one in a toolbar requires it
 * to carry its own `tabindex`.
 */
const FOCUSABLE = "button, a[href], input, select, textarea, [tabindex]";

const toolbarStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

  [part="toolbar"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${boePanel.gap};
  }

  :host([orientation="vertical"]) [part="toolbar"] {
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;
  }
`;

/**
 * A row of independent controls, with the keyboard behaviour a toolbar owes.
 *
 * ```html
 * <box-toolbar label="Document actions">
 *   <button type="button">Share</button>
 *   <button type="button">Download</button>
 * </box-toolbar>
 * ```
 *
 * The controls are yours — this contributes `role="toolbar"`, the accessible
 * name, and roving tabindex, so the group is one tab stop and the arrow keys
 * move within it.
 *
 * Not to be confused with `box-button-group`, which is a `radiogroup`: that one
 * is for picking exactly one of a set, and its children answer to a shared
 * value. A toolbar's controls are independent of each other.
 */
export class Toolbar extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["label", "orientation"];
  }

  private listenersBound = false;

  private controlObserver: MutationObserver | null = null;

  /** Accessible name for the group, announced before its controls. */
  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(next: string) {
    this.setAttribute("label", next);
  }

  /** `horizontal` (default) or `vertical`; picks which arrow keys navigate. */
  get orientation(): string {
    const raw = this.getAttribute("orientation");
    return raw && ORIENTATIONS.has(raw) ? raw : "horizontal";
  }

  set orientation(next: string) {
    this.setAttribute("orientation", next);
  }

  /** The controls this toolbar is managing, in document order. */
  get controls(): HTMLElement[] {
    return this.focusableElements().filter(element => !element.hasAttribute("disabled"));
  }

  /** Every focusable control, disabled ones included. */
  private focusableElements(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector("slot");
    if (!slot) {
      return [];
    }

    return slot
      .assignedElements()
      .flatMap(element =>
        element.matches(FOCUSABLE)
          ? [element as HTMLElement]
          : Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE)),
      );
  }

  disconnectedCallback(): void {
    this.controlObserver?.disconnect();
    this.controlObserver = null;
    this.listenersBound = false;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${toolbarStyles}</style>
      <div part="toolbar" role="toolbar"><slot></slot></div>
    `;
    this.listenersBound = false;
  }

  protected setupListeners(): void {
    if (!this.shadowRoot || this.listenersBound) {
      return;
    }

    this.listenersBound = true;

    // A toolbar's controls are the host's children, so the set changes without
    // this element re-rendering. Without this the tab stops describe whatever
    // was there when it first rendered.
    this.shadowRoot.querySelector("slot")?.addEventListener("slotchange", () => {
      this.update();
    });

    // `slotchange` covers assigned children being swapped, but not a control
    // deep in a wrapper, and not `disabled` toggling — the two ways a host
    // routinely changes which controls are live.
    this.controlObserver ??= new MutationObserver(() => {
      this.update();
    });
    this.controlObserver.observe(this, {
      attributeFilter: ["disabled"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    this.shadowRoot.querySelector('[part="toolbar"]')?.addEventListener("keydown", event => {
      handleRovingKeydown(event as KeyboardEvent, this.controls, {
        orientation: this.orientation as "horizontal" | "vertical",
      });
    });

    // Clicking a control makes it the tab stop, so returning by Tab lands where
    // the reader last was rather than back at the first control.
    this.addEventListener("focusin", event => {
      const index = this.controls.indexOf(event.target as HTMLElement);
      if (index >= 0) {
        applyRovingTabindex(this.controls, index);
      }
    });
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const toolbar = this.shadowRoot.querySelector('[part="toolbar"]');
    toolbar?.setAttribute("aria-orientation", this.orientation);
    if (this.label) {
      toolbar?.setAttribute("aria-label", this.label);
    } else {
      toolbar?.removeAttribute("aria-label");
    }

    const controls = this.controls;
    // Keep whichever control already holds the tab stop, so a re-render for an
    // unrelated reason does not send focus back to the start.
    const active = controls.findIndex(control => control.tabIndex === 0);

    // Disabled controls are excluded from the rotation, so roving tabindex
    // never touches them — and a button's default tabIndex is 0. Left alone,
    // one re-enabled at runtime (which is the norm: a Clear Selection that
    // wakes when something is selected) becomes a second tab stop the arrow
    // keys cannot reach. Claim every focusable control first, then hand the
    // stop to one.
    for (const element of this.focusableElements()) {
      element.tabIndex = -1;
    }
    applyRovingTabindex(controls, active >= 0 ? active : 0);
  }
}

Toolbar.register();
