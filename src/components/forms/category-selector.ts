import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeOverlay, boeRadius } from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import {
  parsePlacement,
  trackAnchor,
  type OverlayPlacement,
} from "../../foundations/overlay/index.js";

const DEFAULT_TAG_NAME = "box-category-selector";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type CategoryOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const categorySelectorStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="group"] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  [part~="pill"] {
    appearance: none;
    padding: 0.35rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 999px;
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part~="pill"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part~="pill-checked"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part~="pill"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
  }

  [part~="pill"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part="empty"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.86rem;
  }

  /* Overflow "More" menu (shown when options exceed max-links). */
  [part="more-menu"] {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 40;
    margin: 0;
    padding: ${boeOverlay.padding};
    list-style: none;
    min-inline-size: 10rem;
    max-block-size: 16rem;
    overflow-y: auto;
    border: ${boeOverlay.border};
    border-radius: ${boeOverlay.radius};
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: ${boeOverlay.shadow};
  }

  [part="more-menu"][hidden] {
    display: none;
  }

  [part="more-item"] {
    appearance: none;
    display: block;
    inline-size: 100%;
    text-align: start;
    border: 0;
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 0.84rem;
    padding: 6px 10px;
    border-radius: ${boeRadius.med};
    cursor: pointer;
  }

  [part="more-item"][aria-checked="true"] {
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-weight: 700;
  }

  ${boeNeutralInteractiveStyles('[part="more-item"]')}
`;

/**
 * A single-select category picker rendered as a horizontal radiogroup of pills —
 * a filter bar for switching one active category (distinct from the multi-select
 * `box-pill-cloud`). Data arrives via `options`; the active value is exposed as
 * `value` and announced with `value-changed`. Follows the radiogroup keyboard
 * pattern: arrow keys move selection with roving `tabindex`.
 */
export class BoxCategorySelectorElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "value", "max-links"];
  }

  private valueInternal = "";
  private lastOptionsJson = "";
  private hadFocus = false;
  private rootEl!: HTMLElement;
  private moreOpen = false;
  private positionCleanup: (() => void) | null = null;
  private readonly onDocumentPointerDown = (event: PointerEvent): void => {
    if (event.composedPath().includes(this)) {
      return;
    }
    this.closeMore();
  };

  /** Max inline categories before the rest collapse into a "More" menu (0 = no limit). */
  get maxLinks(): number {
    const raw = Number(this.getAttribute("max-links"));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }

  set maxLinks(value: number) {
    this.setAttribute("max-links", String(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Categories";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): CategoryOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CategoryOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: CategoryOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private selectableOptions(): CategoryOption[] {
    return this.options.filter(option => !option.disabled);
  }

  private splitOptions(): { visible: CategoryOption[]; overflow: CategoryOption[] } {
    const options = this.options;
    const max = this.maxLinks;
    if (max <= 0 || options.length <= max) {
      return { visible: options, overflow: [] };
    }
    return { visible: options.slice(0, max), overflow: options.slice(max) };
  }

  private select(value: string): void {
    if (!value || value === this.valueInternal) {
      return;
    }
    if (this.options.find(option => option.value === value)?.disabled) {
      return;
    }

    this.hadFocus = this.shadowRoot?.activeElement !== null;
    this.valueInternal = value;
    this.setAttribute("value", value);
    if (this.isRendered) {
      this.update();
    }
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  private moveSelection(current: string, delta: number): void {
    const selectable = this.selectableOptions();
    if (!selectable.length) {
      return;
    }

    const currentIndex = selectable.findIndex(option => option.value === current);
    const baseIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = Math.max(0, Math.min(selectable.length - 1, baseIndex + delta));
    const nextValue = selectable[nextIndex]?.value;
    if (nextValue) {
      this.select(nextValue);
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${categorySelectorStyles}</style>
      <div part="root"></div>
    `;
    this.rootEl = this.shadowRoot.querySelector('[part="root"]')!;
  }

  private resolvedPlacement(): OverlayPlacement {
    return parsePlacement(this.getAttribute("placement")) ?? { side: "bottom", align: "end" };
  }

  private openMore(): void {
    const moreBtn = this.rootEl.querySelector('[data-more]') as HTMLButtonElement | null;
    const menu = this.rootEl.querySelector('[part="more-menu"]') as HTMLElement | null;
    if (!moreBtn || !menu || this.moreOpen) {
      return;
    }
    this.moreOpen = true;
    menu.hidden = false;
    moreBtn.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", this.onDocumentPointerDown);
    this.positionCleanup = trackAnchor(moreBtn, menu, {
      placement: this.resolvedPlacement(),
      offset: 4,
    });
    (menu.querySelector('[part="more-item"]') as HTMLElement | null)?.focus();
  }

  private closeMore(restoreFocus = false): void {
    if (!this.moreOpen) {
      return;
    }
    this.moreOpen = false;
    const moreBtn = this.rootEl.querySelector('[data-more]') as HTMLButtonElement | null;
    const menu = this.rootEl.querySelector('[part="more-menu"]') as HTMLElement | null;
    if (menu) {
      menu.hidden = true;
    }
    moreBtn?.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    this.positionCleanup?.();
    this.positionCleanup = null;
    if (restoreFocus) {
      moreBtn?.focus();
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    this.positionCleanup?.();
    this.positionCleanup = null;
    super.disconnectedCallback?.();
  }

  protected setupListeners(): void {
    this.rootEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;

      const moreBtn = target.closest('[data-more]') as HTMLButtonElement | null;
      if (moreBtn && this.rootEl.contains(moreBtn)) {
        if (this.moreOpen) {
          this.closeMore();
        } else {
          this.openMore();
        }
        return;
      }

      const menuItem = target.closest('[part="more-item"]') as HTMLButtonElement | null;
      if (menuItem && this.rootEl.contains(menuItem)) {
        this.select(menuItem.dataset.value ?? "");
        this.closeMore(true);
        return;
      }

      const button = target.closest('[part~="pill"]') as HTMLButtonElement | null;
      if (!button || !this.rootEl.contains(button)) {
        return;
      }
      this.select(button.dataset.value ?? "");
    });

    this.rootEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const target = event.target as HTMLElement;

      // Menu item keys: Escape closes and returns focus; Arrow moves within.
      const menuItem = target.closest('[part="more-item"]') as HTMLButtonElement | null;
      if (menuItem && this.rootEl.contains(menuItem)) {
        const items = Array.from(
          this.rootEl.querySelectorAll<HTMLButtonElement>('[part="more-item"]:not(:disabled)'),
        );
        const index = items.indexOf(menuItem);
        if (keyboardEvent.key === "Escape") {
          keyboardEvent.preventDefault();
          this.closeMore(true);
        } else if (keyboardEvent.key === "ArrowDown") {
          keyboardEvent.preventDefault();
          items[(index + 1) % items.length]?.focus();
        } else if (keyboardEvent.key === "ArrowUp") {
          keyboardEvent.preventDefault();
          items[(index - 1 + items.length) % items.length]?.focus();
        }
        return;
      }

      const button = target.closest('[part~="pill"]') as HTMLButtonElement | null;
      if (!button || !this.rootEl.contains(button)) {
        return;
      }

      // "More" button: open the overflow menu.
      if (button.dataset.more) {
        if (["Enter", " ", "ArrowDown"].includes(keyboardEvent.key)) {
          keyboardEvent.preventDefault();
          this.openMore();
        }
        return;
      }

      const value = button.dataset.value ?? "";
      switch (keyboardEvent.key) {
        case "ArrowRight":
        case "ArrowDown":
          keyboardEvent.preventDefault();
          this.moveSelection(value, 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          keyboardEvent.preventDefault();
          this.moveSelection(value, -1);
          break;
        case "Home": {
          keyboardEvent.preventDefault();
          const first = this.selectableOptions()[0]?.value;
          if (first) {
            this.select(first);
          }
          break;
        }
        case "End": {
          keyboardEvent.preventDefault();
          const options = this.selectableOptions();
          const last = options[options.length - 1]?.value;
          if (last) {
            this.select(last);
          }
          break;
        }
        case " ":
        case "Enter":
          keyboardEvent.preventDefault();
          this.select(value);
          break;
        default:
          break;
      }
    });
  }

  protected update(): void {
    if (!this.rootEl) {
      return;
    }

    const options = this.options;
    if (!options.length) {
      this.rootEl.innerHTML = `<div part="empty">No categories</div>`;
      this.lastOptionsJson = "";
      return;
    }

    const { visible, overflow } = this.splitOptions();
    const selectedInOverflow = overflow.some(option => option.value === this.valueInternal);
    const cacheKey = `${JSON.stringify(options)}|${this.maxLinks}`;
    if (cacheKey !== this.lastOptionsJson || !this.rootEl.querySelector('[part="group"]')) {
      const pillMarkup = (option: CategoryOption): string => `
        <button
          type="button"
          part="pill"
          role="radio"
          data-value="${escapeHtml(option.value)}"
          ${option.disabled ? "disabled" : ""}
        >${escapeHtml(option.label)}</button>
      `;
      const moreButton = overflow.length
        ? `<button type="button" part="pill more" data-more="true" aria-haspopup="menu" aria-expanded="false">More</button>`
        : "";
      const moreMenu = overflow.length
        ? `<ul part="more-menu" role="menu" aria-label="More categories" hidden>${overflow
            .map(
              option => `
                <li role="none"><button
                  type="button"
                  part="more-item"
                  role="menuitemradio"
                  data-value="${escapeHtml(option.value)}"
                  ${option.disabled ? "disabled" : ""}
                >${escapeHtml(option.label)}</button></li>
              `,
            )
            .join("")}</ul>`
        : "";
      this.rootEl.innerHTML = `
        <div part="group" role="radiogroup" aria-label="${escapeHtml(this.label)}">
          ${visible.map(pillMarkup).join("")}
          ${moreButton}
        </div>
        ${moreMenu}
      `;
      this.lastOptionsJson = cacheKey;
    }

    const group = this.rootEl.querySelector('[part="group"]');
    group?.setAttribute("aria-label", this.label);

    const tabbableValue = this.valueInternal || this.selectableOptions()[0]?.value || "";

    this.rootEl.querySelectorAll('[part~="pill"]:not([data-more])').forEach(node => {
      const button = node as HTMLButtonElement;
      const optionValue = button.dataset.value ?? "";
      const option = options.find(entry => entry.value === optionValue);
      const isChecked = optionValue === this.valueInternal;
      button.setAttribute("part", isChecked ? "pill pill-checked" : "pill");
      button.setAttribute("aria-checked", String(isChecked));
      button.tabIndex = optionValue === tabbableValue && !option?.disabled ? 0 : -1;
    });

    // "More" reflects an active overflow selection and shows its label.
    const moreBtn = this.rootEl.querySelector('[data-more]') as HTMLButtonElement | null;
    if (moreBtn) {
      const selectedOption = overflow.find(option => option.value === this.valueInternal);
      moreBtn.textContent = selectedOption ? selectedOption.label : "More";
      moreBtn.setAttribute("part", selectedInOverflow ? "pill more pill-checked" : "pill more");
      moreBtn.setAttribute("aria-expanded", this.moreOpen ? "true" : "false");
      // Roving tabindex: the More button is the tabbable entry when it holds the
      // active (overflow) selection; otherwise a visible pill is.
      moreBtn.tabIndex = selectedInOverflow ? 0 : -1;
    }

    // Reflect the checked overflow option in the menu.
    this.rootEl.querySelectorAll('[part="more-item"]').forEach(node => {
      const button = node as HTMLButtonElement;
      button.setAttribute("aria-checked", String(button.dataset.value === this.valueInternal));
    });

    if (this.hadFocus && this.valueInternal) {
      const active = Array.from(this.rootEl.querySelectorAll('[part~="pill"]')).find(
        node => (node as HTMLButtonElement).dataset.value === this.valueInternal,
      ) as HTMLButtonElement | undefined;
      active?.focus();
      this.hadFocus = false;
    }
  }
}

export const defineBoxCategorySelectorElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCategorySelectorElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCategorySelectorElement;
  }

  customElements.define(tagName, BoxCategorySelectorElement);
  return BoxCategorySelectorElement;
};
