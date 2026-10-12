import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";
import { BaseElement } from "../../core/index.js";
import { applyRovingTabindex, nextRovingIndex } from "../../foundations/a11y/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/interaction.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

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

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="picker"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid var(--_obp-border);
          border-radius: ${boePanel.radius};
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
          gap: ${boePanel.gap};
        }

        [part="view"] {
          display: grid;
          gap: 0.3rem;
          width: 100%;
          text-align: left;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: ${boeRadius.med};
          padding: 0.55rem 0.7rem;
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

export class SavedViewPicker extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["label", "value", "views"];
  }

  private valueInternal = "";
  private valueRevision = 0;
  private lifetimeRevision = 0;
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
    if (this.valueInternal !== value) this.valueRevision++;
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
      const value = newValue ?? "";
      if (this.valueInternal !== value) this.valueRevision++;
      this.valueInternal = value;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  disconnectedCallback(): void {
    this.lifetimeRevision++;
    super.disconnectedCallback();
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
    this.shadowRoot!.innerHTML = `<style>${elementStyles}</style><div part="content-host"><section part="picker" role="radiogroup"><div part="label"></div><div part="views"></div></section></div>`;
  }

  private selectView(value: string): void {
    if (!value || value === this.valueInternal) return;
    this.value = value;
    this.emitValueChanged();
  }

  protected setupListeners(): void {
    const parent = this.shadowRoot!.querySelector<HTMLElement>('[part="views"]')!;
    parent.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[part="view"]');
      if (button && parent.contains(button)) this.selectView(button.dataset.viewId ?? "");
    });
    parent.addEventListener("keydown", event => {
      if (!this.isConnected) return;
      const keyboard = event as KeyboardEvent;
      const views = Array.from(parent.querySelectorAll<HTMLButtonElement>('[part="view"]'));
      // Complete keyboard focus before dispatching to the host; no later focus
      // restoration may undo a callback's handoff or component teardown.
      const current = views.indexOf(keyboard.target as HTMLButtonElement);
      const next = current < 0 ? null : nextRovingIndex(keyboard.key, current, views.length, { orientation: "both" });
      if (next !== null) {
        const target = views[next];
        const valueRevision = this.valueRevision, lifetimeRevision = this.lifetimeRevision;
        keyboard.preventDefault(); applyRovingTabindex(views, next); target?.focus();
        // focusin is synchronous: a host can replace membership, write a newer
        // value or detach/reconnect before navigation resumes.
        if (target && this.isConnected && this.valueRevision === valueRevision && this.lifetimeRevision === lifetimeRevision && parent.contains(target) && this.views.some(view => view.id === target.dataset.viewId)) {
          this.selectView(target.dataset.viewId ?? "");
        }
      } else if (keyboard.key === "Enter" || keyboard.key === " ") {
        const button = (keyboard.target as HTMLElement).closest<HTMLButtonElement>('[part="view"]');
        if (button && parent.contains(button)) { keyboard.preventDefault(); this.selectView(button.dataset.viewId ?? ""); }
      }
    });
  }

  protected update(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    root.querySelector('[part="picker"]')!.setAttribute("aria-label", this.label);
    root.querySelector('[part="label"]')!.textContent = this.label;
    const parent = root.querySelector<HTMLElement>('[part="views"]')!;
    syncKeyedChildren(parent, this.views, view => view.id, () => {
      const button = actionButton("view"); button.setAttribute("role", "radio"); return button;
    }, (button, view) => {
      button.dataset.viewId = view.id; button.dataset.selected = String(this.value === view.id);
      button.setAttribute("aria-checked", String(this.value === view.id));
      button.innerHTML = `<div part="view-label">${escapeHtml(view.label)}</div>${view.description ? `<div part="view-description">${escapeHtml(view.description)}</div>` : ""}${typeof view.resultCount === "number" ? `<div part="view-count">${escapeHtml(`${view.resultCount} results`)}</div>` : ""}`;
    });
    const views = Array.from(parent.querySelectorAll<HTMLButtonElement>('[part="view"]'));
    applyRovingTabindex(views, Math.max(0, views.findIndex(button => button.dataset.viewId === this.valueInternal)));
  }
}

SavedViewPicker.register();
