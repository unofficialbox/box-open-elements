import { BaseElement } from "../../core/index.js";
import { resolveLocale } from "../../foundations/format/index.js";

const valueStyles = `
  :host {
    display: inline;
    color: inherit;
    font: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  /* Numbers and dates are scanned in columns far more often than they are read
     in prose — a modified date beside a file name, a size in a table. Tabular
     figures keep those columns aligned without the host having to ask. */
  :host([tabular]) [part="value"] {
    font-variant-numeric: tabular-nums;
  }

  [part="value"] {
    white-space: nowrap;
  }
`;

/**
 * Shared behaviour for the read-only `box-formatted-*` renderers.
 *
 * These components render a typed value and nothing else: no interaction, no
 * state, no events. What they do share is the awkward part — resolving a
 * locale, deciding what a broken value looks like, and keeping a
 * machine-readable form beside the human one.
 *
 * **A value that cannot be formatted hides the element.** Not `Invalid Date`,
 * not `NaN`, not the raw string echoed back. A malformed value is a host bug,
 * and rendering its wreckage puts the bug in front of a reader who can do
 * nothing about it. The host is left with an empty inline box, which is what a
 * missing value should look like anyway.
 */
export abstract class FormattedValue extends BaseElement {
  protected valueEl!: HTMLElement;

  /**
   * The formatted text, plus an optional machine-readable form for the
   * `datetime` attribute. `null` means the value could not be formatted.
   */
  protected abstract formatted(): { machine?: string; text: string } | null;

  /**
   * Whether to render into `<time>` rather than `<span>`.
   *
   * Only the instant-valued renderers should; `<time>` on a file size would be
   * a lie to anything reading the document semantically.
   */
  protected usesTimeElement(): boolean {
    return false;
  }

  /** Extra styles a subclass wants appended. */
  protected valueStyles(): string {
    return valueStyles;
  }

  /**
   * The locale to format in. Absent means the host's own — deliberately
   * `undefined` rather than a hardcoded tag.
   */
  get locale(): string | undefined {
    return resolveLocale(this.getAttribute("locale"));
  }

  set locale(value: string | undefined) {
    if (!value) {
      this.removeAttribute("locale");
      return;
    }
    this.setAttribute("locale", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    const tag = this.usesTimeElement() ? "time" : "span";
    this.shadowRoot.innerHTML = `<style>${this.valueStyles()}</style><${tag} part="value"></${tag}>`;
    this.valueEl = this.shadowRoot.querySelector('[part="value"]')!;
  }

  protected setupListeners(): void {
    // Output only: nothing to listen to.
  }

  protected update(): void {
    if (!this.valueEl) {
      return;
    }

    const result = this.formatted();
    // toggleAttribute rather than `.hidden = `, so a host that set `hidden`
    // itself is not fought with on every update.
    this.toggleAttribute("hidden", result === null);
    if (!result) {
      this.valueEl.textContent = "";
      this.valueEl.removeAttribute("datetime");
      return;
    }

    this.valueEl.textContent = result.text;
    if (result.machine) {
      this.valueEl.setAttribute("datetime", result.machine);
    } else {
      this.valueEl.removeAttribute("datetime");
    }
  }
}
