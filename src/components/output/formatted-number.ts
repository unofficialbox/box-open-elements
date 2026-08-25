import { FormattedValue } from "./formatted-value.js";
import { parseNumber } from "../../foundations/format/index.js";

const DEFAULT_TAG_NAME = "box-formatted-number";

const NUMBER_STYLES = new Set(["decimal", "currency", "percent", "unit"]);

/**
 * A number, rendered in the reader's locale.
 *
 * ```html
 * <box-formatted-number value="1234.5" format-style="currency" currency="USD"></box-formatted-number>
 * ```
 *
 * The attribute is `format-style` rather than `style`, because `style` is a
 * global HTML attribute: setting it would put CSS on the host and be silently
 * ignored as a formatting instruction. Naming it after the `Intl` option would
 * be tidier right up until the first host wrote `style="currency"` and watched
 * nothing happen.
 *
 * `percent` follows `Intl`, which multiplies by 100: pass `0.42` to render
 * "42%". That surprises people, so it is worth stating rather than quietly
 * doubling the convention.
 */
export class FormattedNumber extends FormattedValue {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return [
      "currency",
      "format-style",
      "locale",
      "maximum-fraction-digits",
      "minimum-fraction-digits",
      "unit",
      "value",
    ];
  }

  /** The number to render. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** `decimal` (default), `currency`, `percent` or `unit`. */
  get formatStyle(): string {
    const raw = this.getAttribute("format-style");
    return raw && NUMBER_STYLES.has(raw) ? raw : "decimal";
  }

  set formatStyle(next: string) {
    this.setAttribute("format-style", next);
  }

  /** ISO 4217 code, required by `Intl` when the style is `currency`. */
  get currency(): string {
    return this.getAttribute("currency") ?? "";
  }

  set currency(next: string) {
    this.setAttribute("currency", next);
  }

  /** A sanctioned unit identifier, e.g. `megabyte`, when the style is `unit`. */
  get unit(): string {
    return this.getAttribute("unit") ?? "";
  }

  set unit(next: string) {
    this.setAttribute("unit", next);
  }

  protected formatted(): { text: string } | null {
    const numeric = parseNumber(this.value);
    if (numeric === null) {
      return null;
    }

    const options: Intl.NumberFormatOptions = { style: this.formatStyle as "decimal" };
    if (this.formatStyle === "currency") {
      if (!this.currency) {
        // Intl throws without one. Falling back to a plain decimal keeps a real
        // number on screen instead of hiding it over a missing attribute.
        options.style = "decimal";
      } else {
        options.currency = this.currency;
      }
    }
    if (this.formatStyle === "unit") {
      if (!this.unit) {
        options.style = "decimal";
      } else {
        options.unit = this.unit;
      }
    }

    const min = parseNumber(this.getAttribute("minimum-fraction-digits"));
    const max = parseNumber(this.getAttribute("maximum-fraction-digits"));
    if (min !== null) {
      options.minimumFractionDigits = min;
    }
    if (max !== null) {
      options.maximumFractionDigits = max;
    }

    try {
      return { text: new Intl.NumberFormat(this.locale, options).format(numeric) };
    } catch {
      // A bad currency code, unit, or digit range throws. The number is real,
      // so render it plainly rather than losing it.
      return { text: String(numeric) };
    }
  }
}

FormattedNumber.register();
