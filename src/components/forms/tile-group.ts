import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeFocusRingShadow } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-tile-group";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** One choice. `description` is the second line; `disabled` greys it out. */
export interface TileOption {
  description?: string;
  disabled?: boolean;
  id: string;
  label: string;
}

/** Attribute payloads are author input — validate every record. */
export const isTileOptionRecord = (value: unknown): value is TileOption => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.label === "string";
};

const tileStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  :host([hidden]) {
    display: none !important;
  }

  [part="group"] {
    display: grid;
    /* Tiles carry a label and often a description, so they need width to be
       worth choosing over radios. Below the minimum they stack rather than
       squeeze. */
    grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    border: 0;
  }

  [part="legend"] {
    padding: 0 0 0.5rem;
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="legend"]:empty {
    display: none;
  }

  [part="tile"] {
    position: relative;
    display: grid;
    gap: 0.2rem;
    padding: 0.75rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 85%, transparent);
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface, #ffffff);
    cursor: pointer;
  }

  [part="tile"]:hover:not([data-disabled="true"]) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="tile"][data-selected="true"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
  }

  [part="tile"][data-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* The ring is drawn on the tile the native control sits inside, because the
     control itself is visually hidden — without this, keyboard focus would be
     invisible. */
  [part="tile"]:has(input:focus-visible) {
    box-shadow: ${boeFocusRingShadow};
  }

  /* Hidden from sight, not from the accessibility tree or the tab order: the
     tile is a real radio or checkbox, so grouping, arrow-key behaviour and
     form participation are the platform's rather than reimplemented. */
  [part="control"] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  [part="tile-label"] {
    font-weight: 600;
    color: var(--boe-token-text-text, #222222);
  }

  [part="tile-description"] {
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="tile-description"]:empty {
    display: none;
  }
`;

/**
 * Choose one option, or several, as cards rather than radios.
 *
 * ```html
 * <box-tile-group name="plan" options='[{"id":"team","label":"Team"}]'></box-tile-group>
 * ```
 *
 * Each tile wraps a real `<input type="radio">` or `<input type="checkbox">`,
 * visually hidden but present in the tab order and the accessibility tree. That
 * is the whole design: grouping, arrow-key navigation between radios, the
 * roving focus rules, and form participation all come from the platform rather
 * than being reimplemented on `<div>`s and then subtly diverging from what a
 * screen reader user expects.
 *
 * Use it where the choice deserves explaining — a plan, a permission level, a
 * retention policy — and a bare radio label would not have room. Where the
 * options are one word each, radios are smaller and better.
 */
export class TileGroup extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["legend", "multiple", "name", "options", "value"];
  }

  private groupEl!: HTMLElement;
  private legendEl!: HTMLElement;
  private optionsSignature = "";

  /** The choices, as JSON. */
  get options(): TileOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.every(isTileOptionRecord)
        ? (parsed as TileOption[])
        : [];
    } catch {
      return [];
    }
  }

  set options(value: TileOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  /** Several selections rather than one. Switches radios for checkboxes. */
  get multiple(): boolean {
    return this.hasAttribute("multiple");
  }

  set multiple(value: boolean) {
    this.toggleAttribute("multiple", value);
  }

  /** The radio group name. Required for radios to behave as one group. */
  get name(): string {
    return this.getAttribute("name") ?? "tile-group";
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  /** Selected ids, comma-separated. A single id when not `multiple`. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    if (!next) {
      this.removeAttribute("value");
      return;
    }
    this.setAttribute("value", next);
  }

  /** Selected ids as an array, which is what a host actually wants. */
  get selected(): string[] {
    return this.value
      .split(",")
      .map(part => part.trim())
      .filter(Boolean);
  }

  get legend(): string {
    return this.getAttribute("legend") ?? "";
  }

  set legend(value: string) {
    this.setAttribute("legend", value);
  }

  private optionsKey(): string {
    return `${this.getAttribute("options") ?? ""}|${String(this.multiple)}|${this.name}`;
  }

  private rebuild(): void {
    const type = this.multiple ? "checkbox" : "radio";
    this.groupEl.innerHTML = this.options
      .map(option => {
        const id = escapeHtml(option.id);
        return `
          <label part="tile" data-option-id="${id}" data-selected="false" data-disabled="${option.disabled ? "true" : "false"}">
            <input
              part="control"
              type="${type}"
              name="${escapeHtml(this.name)}"
              value="${id}"
              ${option.disabled ? "disabled" : ""}
            />
            <span part="tile-label">${escapeHtml(option.label)}</span>
            <span part="tile-description">${escapeHtml(option.description ?? "")}</span>
          </label>
        `;
      })
      .join("");
  }

  private syncSelection(): void {
    const selected = new Set(this.selected);
    this.groupEl.querySelectorAll<HTMLElement>('[part="tile"]').forEach(tile => {
      const id = tile.dataset.optionId ?? "";
      const isSelected = selected.has(id);
      tile.dataset.selected = isSelected ? "true" : "false";
      const control = tile.querySelector<HTMLInputElement>('[part="control"]');
      if (control) {
        control.checked = isSelected;
      }
    });
  }

  private readSelection(): string[] {
    return Array.from(
      this.groupEl.querySelectorAll<HTMLInputElement>('[part="control"]'),
    )
      .filter(input => input.checked)
      .map(input => input.value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>${tileStyles}</style>
      <fieldset part="group">
        <legend part="legend"></legend>
      </fieldset>
    `;
    this.groupEl = this.shadowRoot.querySelector('[part="group"]')!;
    this.legendEl = this.shadowRoot.querySelector('[part="legend"]')!;
  }

  protected setupListeners(): void {
    this.groupEl.addEventListener("change", () => {
      const next = this.readSelection();
      this.value = next.join(",");
      this.dispatchEvent(
        new CustomEvent("tile-change", {
          bubbles: true,
          composed: true,
          detail: { selected: next },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.groupEl) {
      return;
    }

    const nextKey = this.optionsKey();
    if (nextKey !== this.optionsSignature) {
      this.optionsSignature = nextKey;
      // The legend lives inside the fieldset and is wiped by the rebuild, so it
      // is re-created rather than queried once at render time.
      this.rebuild();
      const legend = document.createElement("legend");
      legend.setAttribute("part", "legend");
      this.groupEl.prepend(legend);
      this.legendEl = legend;
    }

    this.legendEl.textContent = this.legend;
    this.syncSelection();
  }
}

TileGroup.register();
