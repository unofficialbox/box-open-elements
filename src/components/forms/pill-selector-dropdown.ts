const DEFAULT_TAG_NAME = "box-pill-selector-dropdown";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type PillOption = {
  value: string;
  label: string;
};

/**
 * A multi-select pill field: the current selection shows as removable pills, and
 * an "Add" dropdown offers the remaining options. Data arrives via `options`;
 * the selection is exposed as `value` (a string[]) and every add/remove emits
 * `value-changed`. The popup is a `role="menu"` of `role="menuitem"` buttons —
 * opening focuses the first item; ArrowUp/Down/Home/End move focus, Escape (or
 * moving focus outside) closes and returns focus to the trigger.
 */
export class BoxPillSelectorDropdownElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "placeholder", "value"];
  }

  private valueInternal: string[] = [];
  private open = false;
  private menuFocusValue: string | null = null;
  private pendingFocus: "menu" | "trigger" | null = null;

  // Close the open menu when a pointer press lands outside this element. Bound
  // once so it can be added/removed cleanly; a focusout listener can't be used
  // because every interaction re-renders and transiently drops focus to body.
  private readonly onOutsidePointer = (event: Event): void => {
    if (!this.open) {
      return;
    }
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (!path.some(node => node === this)) {
      this.closeMenu(false);
    }
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Selection";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Add";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get options(): PillOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as PillOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: PillOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get value(): string[] {
    return [...this.valueInternal];
  }

  set value(nextValue: string[]) {
    this.valueInternal = [...nextValue];
    this.setAttribute("value", JSON.stringify(nextValue));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    document.removeEventListener("pointerdown", this.onOutsidePointer);
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      const raw = this.getAttribute("value");
      if (!raw) {
        this.valueInternal = [];
      } else {
        try {
          const parsed = JSON.parse(raw) as string[];
          this.valueInternal = Array.isArray(parsed) ? parsed : [];
        } catch {
          this.valueInternal = [];
        }
      }
    }

    this.render();
  }

  private availableOptions(): PillOption[] {
    return this.options.filter(option => !this.valueInternal.includes(option.value));
  }

  private labelFor(value: string): string {
    return this.options.find(option => option.value === value)?.label ?? value;
  }

  private commit(next: string[]): void {
    this.valueInternal = next;
    const serialized = JSON.stringify(next);
    // Render exactly once: setAttribute already triggers attributeChangedCallback
    // (which renders), so only render manually when the attribute is unchanged.
    // A double render would replace and un-focus the item we just moved focus to.
    if (this.getAttribute("value") === serialized) {
      this.render();
    } else {
      this.setAttribute("value", serialized);
    }
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: [...next] },
      }),
    );
  }

  private addValue(value: string): void {
    if (!value || this.valueInternal.includes(value)) {
      return;
    }

    const next = [...this.valueInternal, value];
    // Keep the menu open so several options can be added in a row; move focus to
    // the next remaining option, or back to the trigger once none remain.
    const remaining = this.options.filter(
      option => !next.includes(option.value),
    );
    this.menuFocusValue = remaining[0]?.value ?? null;
    this.pendingFocus = remaining.length ? "menu" : "trigger";
    this.commit(next);
  }

  private removeValue(value: string): void {
    if (!this.valueInternal.includes(value)) {
      return;
    }
    // The clicked remove button is destroyed by the re-render; move focus to the
    // trigger so keyboard/AT users stay inside the widget.
    this.pendingFocus = "trigger";
    this.commit(this.valueInternal.filter(item => item !== value));
  }

  private openMenu(): void {
    if (this.open) {
      return;
    }
    this.open = true;
    this.menuFocusValue = this.availableOptions()[0]?.value ?? null;
    this.pendingFocus = this.menuFocusValue ? "menu" : null;
    document.addEventListener("pointerdown", this.onOutsidePointer);
    this.render();
  }

  private closeMenu(focusTrigger: boolean): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.menuFocusValue = null;
    this.pendingFocus = focusTrigger ? "trigger" : null;
    document.removeEventListener("pointerdown", this.onOutsidePointer);
    this.render();
  }

  private moveMenuFocus(delta: number): void {
    const available = this.availableOptions();
    if (!available.length) {
      return;
    }

    const currentIndex = available.findIndex(option => option.value === this.menuFocusValue);
    const nextIndex = Math.max(0, Math.min(available.length - 1, currentIndex + delta));
    this.menuFocusValue = available[nextIndex]?.value ?? null;
    this.pendingFocus = "menu";
    this.render();
  }

  private moveMenuFocusTo(edge: "first" | "last"): void {
    const available = this.availableOptions();
    if (!available.length) {
      return;
    }
    this.menuFocusValue = (edge === "first" ? available[0] : available[available.length - 1])?.value ?? null;
    this.pendingFocus = "menu";
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const available = this.availableOptions();

    const pillsMarkup = this.valueInternal
      .map(
        value => `
          <span part="pill" data-value="${escapeHtml(value)}">
            <span part="pill-label">${escapeHtml(this.labelFor(value))}</span>
            <button type="button" part="pill-remove" data-value="${escapeHtml(value)}" aria-label="Remove ${escapeHtml(this.labelFor(value))}">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </span>
        `,
      )
      .join("");

    const optionsMarkup = available.length
      ? available
          .map(
            option => `
              <li part="option-row" role="none">
                <button
                  type="button"
                  part="option"
                  role="menuitem"
                  data-value="${escapeHtml(option.value)}"
                  tabindex="${option.value === this.menuFocusValue ? "0" : "-1"}"
                >${escapeHtml(option.label)}</button>
              </li>
            `,
          )
          .join("")
      : `<li part="option-empty" role="none">No more options</li>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="field"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="pill"] {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.3rem 0.2rem 0.6rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 70%, white 30%);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          font-size: 0.82rem;
          font-weight: 600;
        }

        [part="pill-remove"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          inline-size: 1.1rem;
          block-size: 1.1rem;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
        }

        [part="pill-remove"] svg {
          inline-size: 0.65rem;
          block-size: 0.65rem;
        }

        [part="pill-remove"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
          color: var(--boe-token-text-text, #222222);
        }

        [part="dropdown"] {
          position: relative;
          display: inline-block;
        }

        [part="trigger"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.6rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }

        [part="trigger"]:hover {
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
          color: var(--boe-token-text-text, #222222);
        }

        [part="trigger"]:focus-visible,
        [part="option"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="menu"] {
          position: absolute;
          z-index: 10;
          inset-block-start: calc(100% + 0.25rem);
          inset-inline-start: 0;
          min-inline-size: 11rem;
          margin: 0;
          padding: 0.3rem;
          list-style: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.6rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
        }

        [part="option"] {
          appearance: none;
          display: block;
          inline-size: 100%;
          text-align: start;
          padding: 0.4rem 0.55rem;
          border: 0;
          border-radius: 0.4rem;
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.85rem;
          cursor: pointer;
        }

        [part="option"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="option-empty"] {
          padding: 0.4rem 0.55rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.82rem;
        }
      </style>
      <div part="field" role="group" aria-label="${escapeHtml(this.label)}">
        ${pillsMarkup}
        <div part="dropdown">
          <button
            type="button"
            part="trigger"
            aria-haspopup="menu"
            aria-expanded="${String(this.open)}"
          >+ ${escapeHtml(this.placeholder)}</button>
          ${
            this.open
              ? `<ul part="menu" role="menu" aria-label="${escapeHtml(this.label)} options">${optionsMarkup}</ul>`
              : ""
          }
        </div>
      </div>
    `;

    this.attachListeners();
    this.applyPendingFocus();
  }

  private attachListeners(): void {
    if (!this.shadowRoot) {
      return;
    }

    const trigger = this.shadowRoot.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.addEventListener("click", () => {
      if (this.open) {
        // Re-render recreates the trigger, so ask to refocus it after closing.
        this.closeMenu(true);
      } else {
        this.openMenu();
      }
    });
    trigger?.addEventListener("keydown", event => {
      const key = (event as KeyboardEvent).key;
      if ((key === "ArrowDown" || key === "Enter" || key === " ") && !this.open) {
        event.preventDefault();
        this.openMenu();
      } else if (key === "Escape" && this.open) {
        // Focus can rest on the trigger while the menu is open (e.g. after adding
        // the last option); Escape must still close it.
        event.preventDefault();
        this.closeMenu(true);
      }
    });

    for (const remove of Array.from(this.shadowRoot.querySelectorAll('[part="pill-remove"]'))) {
      remove.addEventListener("click", () => {
        this.removeValue((remove as HTMLButtonElement).dataset.value ?? "");
      });
    }

    for (const option of Array.from(this.shadowRoot.querySelectorAll('[part="option"]'))) {
      const button = option as HTMLButtonElement;
      button.addEventListener("click", () => {
        this.addValue(button.dataset.value ?? "");
      });
      button.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        switch (keyboardEvent.key) {
          case "ArrowDown":
            keyboardEvent.preventDefault();
            this.moveMenuFocus(1);
            break;
          case "ArrowUp":
            keyboardEvent.preventDefault();
            this.moveMenuFocus(-1);
            break;
          case "Home":
            keyboardEvent.preventDefault();
            this.moveMenuFocusTo("first");
            break;
          case "End":
            keyboardEvent.preventDefault();
            this.moveMenuFocusTo("last");
            break;
          case "Escape":
            keyboardEvent.preventDefault();
            this.closeMenu(true);
            break;
          default:
            break;
        }
      });
    }

  }

  private applyPendingFocus(): void {
    if (!this.shadowRoot || !this.pendingFocus) {
      return;
    }

    const pending = this.pendingFocus;
    this.pendingFocus = null;

    if (pending === "trigger") {
      (this.shadowRoot.querySelector('[part="trigger"]') as HTMLButtonElement | null)?.focus();
      return;
    }

    if (pending === "menu" && this.menuFocusValue) {
      const target = Array.from(this.shadowRoot.querySelectorAll('[part="option"]')).find(
        node => (node as HTMLButtonElement).dataset.value === this.menuFocusValue,
      ) as HTMLButtonElement | undefined;
      target?.focus();
    }
  }
}

export const defineBoxPillSelectorDropdownElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPillSelectorDropdownElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPillSelectorDropdownElement;
  }

  customElements.define(tagName, BoxPillSelectorDropdownElement);
  return BoxPillSelectorDropdownElement;
};
