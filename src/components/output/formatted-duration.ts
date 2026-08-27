import { FormattedValue } from "./formatted-value.js";
import {
  type BoeDurationParts,
  parseDuration,
  resolveDurationParts,
  toIsoDuration,
} from "../../foundations/format/index.js";

const DEFAULT_TAG_NAME = "box-formatted-duration";

/** Whether the split came out as a plain zero, which `Intl` renders as nothing. */
const isZero = (parts: BoeDurationParts): boolean =>
  Object.values(parts).every(amount => amount === 0);

const DURATION_STYLES = new Set(["long", "short", "narrow"]);

/** `Intl` names duration fields in the plural; the parts are singular. */
const INTL_FIELD: Record<string, string> = {
  day: "days",
  hour: "hours",
  minute: "minutes",
  second: "seconds",
};

/** The unit identifiers `Intl.NumberFormat` uses, for the fallback path. */
const NUMBER_UNIT: Record<string, string> = {
  day: "day",
  hour: "hour",
  minute: "minute",
  second: "second",
};

/**
 * How long something takes or lasts, in the reader's locale.
 *
 * ```html
 * <box-formatted-duration value="5400"></box-formatted-duration>
 * ```
 *
 * `value` is a count of seconds or an ISO 8601 duration (`PT1H30M`), because
 * hosts have both: an API field is usually a number, while `<time datetime>`
 * wants the ISO form. Whichever comes in, the ISO form goes back out in
 * `datetime`, so the exact quantity survives for anything reading the document
 * rather than looking at it.
 *
 * Not to be confused with `box-relative-time`, which renders *when* something
 * happened relative to now ("3 days ago"). This renders *how long* — a
 * retention period, an SLA, a processing time — and carries no direction.
 *
 * `Intl.DurationFormat` does the rendering where the browser has it. Where it
 * does not, the same output is composed from `Intl.NumberFormat`'s unit style
 * and `Intl.ListFormat`, both long supported; the two paths were compared
 * across styles and locales and agree.
 */
export class FormattedDuration extends FormattedValue {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["format-style", "locale", "max-units", "value"];
  }

  /** Seconds, or an ISO 8601 duration such as `PT1H30M`. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /**
   * `short` (default, `1 hr, 30 min`), `long` (`1 hour, 30 minutes`) or
   * `narrow` (`1h 30m`).
   *
   * Named `format-style` rather than `style` because `style` is a global HTML
   * attribute: naming it after the `Intl` option would put CSS on the host and
   * be silently ignored as a formatting instruction.
   */
  get formatStyle(): string {
    const raw = this.getAttribute("format-style");
    return raw && DURATION_STYLES.has(raw) ? raw : "short";
  }

  set formatStyle(next: string) {
    this.setAttribute("format-style", next);
  }

  /**
   * How many units to show, default 2.
   *
   * A duration carries more precision than a reader wants: 1 day, 3 hours, 12
   * minutes and 8 seconds is a number to scan past, not to read. Two units is
   * enough to convey magnitude.
   */
  get maxUnits(): number {
    const raw = Number(this.getAttribute("max-units"));
    return Number.isFinite(raw) && raw >= 1 ? Math.trunc(raw) : 2;
  }

  set maxUnits(next: number) {
    this.setAttribute("max-units", String(next));
  }

  protected usesTimeElement(): boolean {
    // A duration is a valid `datetime` value, so `<time>` is honest here.
    return true;
  }

  protected formatted(): { machine?: string; text: string } | null {
    const seconds = parseDuration(this.value);
    if (seconds === null) {
      return null;
    }

    const parts = resolveDurationParts(seconds, this.maxUnits);
    const machine = toIsoDuration(parts);
    const style = this.formatStyle;

    try {
      return { machine, text: this.render(parts, style) };
    } catch {
      // A locale Intl rejects, or a runtime missing both paths. The duration is
      // real, so fall back to the machine form rather than losing it.
      return { machine, text: machine };
    }
  }

  private render(parts: BoeDurationParts, style: string): string {
    const durationFormat = (
      Intl as unknown as { DurationFormat?: new (...args: unknown[]) => { format: (v: unknown) => string } }
    ).DurationFormat;

    if (durationFormat) {
      const input = Object.fromEntries(
        Object.entries(parts).map(([unit, amount]) => [INTL_FIELD[unit]!, amount]),
      );
      // A zero duration otherwise formats to the empty string, leaving a visible
      // element with no text in it — zero is a real answer. Scoped to that case:
      // asking for it always appends "0 sec" to every other duration in
      // browsers that honour the option, which Node's Intl quietly does not.
      const options = isZero(parts)
        ? { secondsDisplay: "always", style }
        : { style };
      return new durationFormat(this.locale, options).format(input);
    }

    const unitDisplay = style === "long" ? "long" : style === "narrow" ? "narrow" : "short";
    const pieces = Object.entries(parts).map(([unit, amount]) =>
      new Intl.NumberFormat(this.locale, {
        style: "unit",
        unit: NUMBER_UNIT[unit]!,
        unitDisplay,
      }).format(amount),
    );

    // `narrow` runs the units together (`1h 30m`); the wider styles take the
    // locale's own unit-list joiner, which is what DurationFormat uses too.
    return style === "narrow"
      ? pieces.join(" ")
      : new Intl.ListFormat(this.locale, { style: "long", type: "unit" }).format(pieces);
  }
}

FormattedDuration.register();
