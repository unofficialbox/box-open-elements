import { BaseElement } from "../../core/index.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../foundations/a11y/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-saved-view-picker";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type SavedView = {
  description?: string;
  id: string;
  label: string;
  resultCount?: number;
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

        [part="picker"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem 1.1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--_obp-brand);
        }

        [part="views"] {
          display: grid;
          gap: 0.75rem;
        }

        [part="view"] {
          display: grid;
          gap: 0.3rem;
          width: 100%;
          text-align: left;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 0.9rem;
          padding: 0.85rem 0.95rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="view"]')}

        [part="view"][data-selected="true"],
        [part="view"][data-selected="true"]:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--_obp-brand) 34%, transparent);
          background: var(--_obp-brand-soft);
        }

        [part="view-label"] {
          font-weight: 700;
        }

        [part="view-description"] {
          color: var(--_obp-text-muted);
          line-height: 1.45;
        }

        [part="view-count"] {
          color: var(--_obp-text-muted);
          font-size: 0.88rem;
        }
      `;

export class BoxSavedViewPickerElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "value", "views"];
  }

  private valueInternal = "";
  get label(): string {
    return this.getAttribute("label") ?? "Saved Views";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(value: string) {
    this.valueInternal = value;
    this.setAttribute("value", value);
    if (this.isRendered) {
      this.update();
    }
  }

  get views(): SavedView[] {
    return this.parseJsonAttribute<SavedView[]>("views", []);
  }

  set views(value: SavedView[]) {
    this.setAttribute("views", JSON.stringify(value));
  }

  connectedCallback(): void {
    this.valueInternal = this.getAttribute("value") ?? "";
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    
    super.attributeChangedCallback(name, oldValue, newValue);
  }
    if (this.isRendered) {
      this.update();
    }
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

  private emitValueChanged(): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: this.valueInternal },
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

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <section part="picker" role="radiogroup" aria-label="${escapeHtml(this.label)}">
        <div part="label">${escapeHtml(this.label)}</div>
        <div part="views">
          ${this.views
            .map(
              view => `
                <button
                  type="button"
                  part="view"
                  role="radio"
                  aria-checked="${String(this.value === view.id)}"
                  data-view-id="${escapeHtml(view.id)}"
                  data-selected="${String(this.value === view.id)}"
                >
                  <div part="view-label">${escapeHtml(view.label)}</div>
                  ${view.description ? `<div part="view-description">${escapeHtml(view.description)}</div>` : ""}
                  ${typeof view.resultCount === "number" ? `<div part="view-count">${escapeHtml(`${view.resultCount} results`)}</div>` : ""}
                </button>
              `,
            )
            .join("")}
        </div>
      </section>
    `;

    const views = Array.from(this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="view"]'));
    const selectedIndex = Math.max(
      0,
      views.findIndex(button => button.getAttribute("data-view-id") === this.valueInternal),
    );
    applyRovingTabindex(views, selectedIndex);

    const selectView = (nextValue: string): void => {
      if (!nextValue || nextValue === this.valueInternal) {
        return;
      }
      this.valueInternal = nextValue;
      this.setAttribute("value", nextValue);
      this.emitValueChanged();
    };

    views.forEach(button => {
      button.addEventListener("click", () => {
        selectView(button.getAttribute("data-view-id") ?? "");
      });
    });

    this.shadowRoot.querySelector('[part="views"]')?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      // APG radiogroup: Arrow/Home/End move focus and select the newly focused view.
      if (handleRovingKeydown(keyboardEvent, views, { orientation: "both" })) {
        queueMicrotask(() => {
          const focused = views.find(button => button.tabIndex === 0);
          selectView(focused?.getAttribute("data-view-id") ?? "");
        });
        return;
      }

      if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") {
        return;
      }
      const button = (keyboardEvent.target as HTMLElement).closest(
        '[part="view"]',
      ) as HTMLButtonElement | null;
      if (!button) {
        return;
      }
      keyboardEvent.preventDefault();
      selectView(button.getAttribute("data-view-id") ?? "");
    });
  }
}

export const defineBoxSavedViewPickerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSavedViewPickerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSavedViewPickerElement;
  }

  customElements.define(tagName, BoxSavedViewPickerElement);
  return BoxSavedViewPickerElement;
};
