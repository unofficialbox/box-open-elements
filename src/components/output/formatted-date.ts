import { FormattedValue } from "./formatted-value.js";
import { parseInstant, resolveDateStyle } from "../../foundations/format/index.js";

const DEFAULT_TAG_NAME = "box-formatted-date";

/**
 * A date or time, rendered in the reader's locale.
 *
 * ```html
 * <box-formatted-date value="2026-08-25T14:30:00Z" date-style="medium" time-style="short"></box-formatted-date>
 * ```
 *
 * Renders into `<time datetime="…">`, so the exact instant stays available to
 * anything reading the document rather than looking at it — a crawler, a
 * calendar extension, a screen reader offering "copy date". The visible text is
 * the reader's format; the attribute is always ISO 8601.
 *
 * With neither `date-style` nor `time-style` set, the date alone is shown at
 * medium width. That is the common case in a file list, and defaulting to a
 * timestamp would put a time nobody asked for beside every filename.
 */
export class FormattedDate extends FormattedValue {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["date-style", "locale", "time-style", "time-zone", "value"];
  }

  protected usesTimeElement(): boolean {
    return true;
  }

  /** The instant, as ISO 8601 or epoch milliseconds. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** Date width, mirroring `Intl.DateTimeFormat`'s `dateStyle`. */
  get dateStyle(): string {
    return this.getAttribute("date-style") ?? "";
  }

  set dateStyle(next: string) {
    this.setAttribute("date-style", next);
  }

  /** Time width. Absent renders no time at all. */
  get timeStyle(): string {
    return this.getAttribute("time-style") ?? "";
  }

  set timeStyle(next: string) {
    this.setAttribute("time-style", next);
  }

  /** IANA zone, e.g. `America/New_York`. Absent uses the host's. */
  get timeZone(): string {
    return this.getAttribute("time-zone") ?? "";
  }

  set timeZone(next: string) {
    this.setAttribute("time-zone", next);
  }

  protected formatted(): { machine: string; text: string } | null {
    const instant = parseInstant(this.value);
    if (!instant) {
      return null;
    }

    const dateStyle = resolveDateStyle(this.dateStyle);
    const timeStyle = resolveDateStyle(this.timeStyle);
    const options: Intl.DateTimeFormatOptions = {};
    // Only one of the two being absent is normal; both absent means the caller
    // wants a plain date, so medium is supplied rather than leaving Intl to
    // fall back to a bare numeric date.
    if (dateStyle || !timeStyle) {
      options.dateStyle = dateStyle ?? "medium";
    }
    if (timeStyle) {
      options.timeStyle = timeStyle;
    }
    if (this.timeZone) {
      options.timeZone = this.timeZone;
    }

    try {
      return {
        machine: instant.toISOString(),
        text: new Intl.DateTimeFormat(this.locale, options).format(instant),
      };
    } catch {
      // An unknown locale or time zone throws a RangeError. The instant is
      // still good, so fall back to ISO rather than hiding a real value over a
      // bad option.
      return { machine: instant.toISOString(), text: instant.toISOString() };
    }
  }
}

FormattedDate.register();
