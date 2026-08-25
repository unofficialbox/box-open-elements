import { FormattedValue } from "./formatted-value.js";
import {
  parseNumber,
  resolveByteUnits,
  resolveFileSizeParts,
} from "../../foundations/format/index.js";

const DEFAULT_TAG_NAME = "box-formatted-file-size";

/**
 * A byte count, rendered as a readable size.
 *
 * ```html
 * <box-formatted-file-size value="2517630"></box-formatted-file-size>
 * ```
 *
 * The magnitude goes through `Intl.NumberFormat`, so a German reader sees
 * "2,52 MB" rather than "2.52 MB". That is the reason this exists as a
 * component rather than a `toFixed` call in each consumer: the decimal
 * separator is not the same everywhere, and a file size is one of the most
 * frequently rendered values in a content platform.
 *
 * Defaults to decimal units (powers of 1000, `kB`/`MB`), matching what the Box
 * product reports. `units="binary"` switches to powers of 1024 with IEC names
 * (`KiB`/`MiB`) for hosts that need to agree with a filesystem instead.
 */
export class FormattedFileSize extends FormattedValue {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["locale", "maximum-fraction-digits", "units", "value"];
  }

  /** The size in bytes. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** `decimal` (default) or `binary`. */
  get units(): string {
    return resolveByteUnits(this.getAttribute("units"));
  }

  set units(next: string) {
    this.setAttribute("units", next);
  }

  protected formatted(): { text: string } | null {
    const bytes = parseNumber(this.value);
    if (bytes === null) {
      return null;
    }

    const { suffix, value } = resolveFileSizeParts(bytes, resolveByteUnits(this.units));
    const requested = parseNumber(this.getAttribute("maximum-fraction-digits"));
    // Whole bytes have no fractional part worth showing; above that, one
    // decimal is the convention every file browser uses — "2.5 MB", not
    // "2.517 MB", which is precision no reader asked for.
    const maximumFractionDigits = requested ?? (suffix === "B" ? 0 : 1);

    try {
      return {
        text: `${new Intl.NumberFormat(this.locale, { maximumFractionDigits }).format(value)} ${suffix}`,
      };
    } catch {
      return { text: `${String(value)} ${suffix}` };
    }
  }
}

FormattedFileSize.register();
