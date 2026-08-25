import { FormattedValue } from "./formatted-value.js";
import { parseInstant, resolveRelativeParts } from "../../foundations/format/index.js";

const DEFAULT_TAG_NAME = "box-relative-time";

const NUMERIC_MODES = new Set(["always", "auto"]);

/**
 * How long ago something happened, in the reader's locale.
 *
 * ```html
 * <box-relative-time value="2026-08-24T09:00:00Z"></box-relative-time>
 * ```
 *
 * Renders into `<time datetime="…">` carrying the exact instant, because
 * "4 days ago" is an approximation and the precise value is what a reader
 * reaches for when the approximation is not enough. `box-due-badge` makes the
 * same trade for the same reason.
 *
 * `reference-time` pins what "now" means. It exists for the same reason
 * `box-due-badge` has one: a component whose output depends on the wall clock
 * cannot be tested or screenshotted deterministically, and a host rendering a
 * list wants every row measured against one instant rather than each against
 * the moment it happened to render.
 */
export class RelativeTime extends FormattedValue {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["locale", "numeric", "reference-time", "value"];
  }

  protected usesTimeElement(): boolean {
    return true;
  }

  /** The instant being described, as ISO 8601 or epoch milliseconds. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** What "now" means. Absent uses the current time. */
  get referenceTime(): string {
    return this.getAttribute("reference-time") ?? "";
  }

  set referenceTime(next: string) {
    if (!next) {
      this.removeAttribute("reference-time");
      return;
    }
    this.setAttribute("reference-time", next);
  }

  /**
   * `auto` lets Intl say "yesterday" where the language has a word for it;
   * `always` forces "1 day ago". Defaults to `auto`, because the idiomatic
   * form is what a reader expects.
   */
  get numeric(): string {
    const raw = this.getAttribute("numeric");
    return raw && NUMERIC_MODES.has(raw) ? raw : "auto";
  }

  set numeric(next: string) {
    this.setAttribute("numeric", next);
  }

  protected formatted(): { machine: string; text: string } | null {
    const instant = parseInstant(this.value);
    if (!instant) {
      return null;
    }

    // An unparseable reference falls back to now rather than hiding the
    // element: the instant being described is still valid, and a broken
    // reference should not erase it.
    const reference = parseInstant(this.referenceTime) ?? new Date();
    const { unit, value } = resolveRelativeParts(instant, reference);

    try {
      const formatter = new Intl.RelativeTimeFormat(this.locale, {
        numeric: this.numeric as Intl.RelativeTimeFormatNumeric,
      });
      return { machine: instant.toISOString(), text: formatter.format(value, unit) };
    } catch {
      return { machine: instant.toISOString(), text: instant.toISOString() };
    }
  }
}

RelativeTime.register();
