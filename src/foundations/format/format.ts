/**
 * Typed-value formatting, as a foundation.
 *
 * Every read surface in a content platform renders the same handful of value
 * types — a modified date, a file size, a count, a duration since something
 * happened. Before this module each consumer reinvented that, which meant
 * locale handling, `<time datetime>` semantics and invalid-input behaviour were
 * reinvented with it, differently each time.
 *
 * The rules here are deliberately shared rather than per-component:
 *
 * - **A locale is never guessed.** An absent `locale` means "use the host's",
 *   which is `undefined` to `Intl` — not a hardcoded `en-US`. Substituting one
 *   would silently render American dates to a German reader.
 * - **Invalid input renders nothing.** Not `Invalid Date`, not `NaN`, not the
 *   raw string. A malformed value is a host bug, and showing its wreckage to a
 *   reader helps nobody; the element collapses and the host sees an empty slot.
 */

/**
 * The locale to format in.
 *
 * `undefined` is meaningful: it tells `Intl` to use the runtime's own locale.
 * An empty or absent attribute must therefore become `undefined` rather than
 * any particular language tag.
 */
export const resolveLocale = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Parse an instant from author input.
 *
 * Accepts an ISO 8601 string or epoch milliseconds, because hosts have both:
 * a JSON API hands over strings, a `Date.now()` arithmetic result hands over
 * numbers. Anything unparseable is `null` rather than an Invalid Date, so
 * callers test one thing instead of remembering `Number.isNaN(d.getTime())`.
 */
export const parseInstant = (value: string | number | null | undefined): Date | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // A bare number, or a numeric string, is epoch milliseconds. Checking the
  // string form first matters: `new Date("1700000000000")` is not the same
  // instant as `new Date(1700000000000)`.
  const numeric = typeof value === "number" ? value : Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Parse a finite number from author input, or `null`. */
export const parseNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Date and time presets, mirroring `Intl.DateTimeFormat`'s own vocabulary. */
export type BoeDateStyle = "full" | "long" | "medium" | "short";

const DATE_STYLES = new Set<BoeDateStyle>(["full", "long", "medium", "short"]);

/** Narrow an author-supplied style, or `undefined` to omit it entirely. */
export const resolveDateStyle = (value: string | null | undefined): BoeDateStyle | undefined =>
  DATE_STYLES.has(value as BoeDateStyle) ? (value as BoeDateStyle) : undefined;

/**
 * The units a relative time can be expressed in, largest first.
 *
 * Seconds are the floor: "0 minutes ago" reads as broken, and a surface that
 * needs sub-second precision is not one a human is reading.
 */
const RELATIVE_UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
  { unit: "second", ms: 1000 },
];

/** A relative duration, in the largest unit that yields a whole number ≥ 1. */
export interface BoeRelativeParts {
  unit: Intl.RelativeTimeFormatUnit;
  value: number;
}

/**
 * Express the distance from `reference` to `instant` in one unit.
 *
 * The sign follows `Intl.RelativeTimeFormat`: negative is the past. The largest
 * unit that yields a magnitude of at least one is chosen, so a four-day-old
 * file reads "4 days ago" rather than "96 hours ago"; months and years are the
 * usual approximations, which is what a reader wants from a relative label and
 * why an exact timestamp stays available alongside it.
 */
export const resolveRelativeParts = (instant: Date, reference: Date): BoeRelativeParts => {
  const delta = instant.getTime() - reference.getTime();
  const magnitude = Math.abs(delta);

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (magnitude >= ms) {
      // Truncate rather than round: 47 hours is "1 day ago", not "2 days ago".
      // Rounding would let a label claim a boundary the instant has not crossed.
      return { unit, value: Math.trunc(delta / ms) };
    }
  }

  return { unit: "second", value: 0 };
};

/**
 * Byte units.
 *
 * `binary` is powers of 1024 with IEC names (KiB, MiB); `decimal` is powers of
 * 1000 with SI names (kB, MB). Box's own UI reports decimal, which is why it is
 * the default — a file the product calls 1.2 MB should not become 1.1 MiB here.
 */
export type BoeByteUnits = "decimal" | "binary";

const BYTE_UNITS = new Set<BoeByteUnits>(["decimal", "binary"]);

/** Narrow author-supplied byte units, falling back to `decimal`. */
export const resolveByteUnits = (value: string | null | undefined): BoeByteUnits =>
  BYTE_UNITS.has(value as BoeByteUnits) ? (value as BoeByteUnits) : "decimal";

const DECIMAL_SUFFIXES = ["B", "kB", "MB", "GB", "TB", "PB"] as const;
const BINARY_SUFFIXES = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;

/** A file size split into the number to format and the unit to append. */
export interface BoeFileSizeParts {
  suffix: string;
  value: number;
}

/**
 * Reduce a byte count to a readable magnitude and its unit.
 *
 * The number is returned unformatted so the caller can run it through
 * `Intl.NumberFormat` in the reader's locale — a size rendered as "1,5 MB" for
 * a German reader is the whole point of not doing this with `toFixed`.
 *
 * Bytes themselves are never fractional: "1.5 B" is nonsense, so the base unit
 * is reported whole.
 */
export const resolveFileSizeParts = (
  bytes: number,
  units: BoeByteUnits = "decimal",
): BoeFileSizeParts => {
  const base = units === "binary" ? 1024 : 1000;
  const suffixes = units === "binary" ? BINARY_SUFFIXES : DECIMAL_SUFFIXES;
  const magnitude = Math.abs(bytes);

  if (magnitude < base) {
    return { suffix: suffixes[0], value: Math.trunc(bytes) };
  }

  // Clamped so a petabyte-plus value keeps the largest name we have rather than
  // running off the end of the table.
  const exponent = Math.min(
    Math.floor(Math.log(magnitude) / Math.log(base)),
    suffixes.length - 1,
  );
  return { suffix: suffixes[exponent]!, value: bytes / base ** exponent };
};

/** The duration units a formatted duration can be broken into, largest first. */
export type BoeDurationUnit = "day" | "hour" | "minute" | "second";

/** A duration split into whole units, ready for `Intl` to render. */
export type BoeDurationParts = Partial<Record<BoeDurationUnit, number>>;

const ISO_DURATION =
  /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

const SECONDS_PER: Record<BoeDurationUnit, number> = {
  day: 86_400,
  hour: 3_600,
  minute: 60,
  second: 1,
};

const DURATION_ORDER: readonly BoeDurationUnit[] = ["day", "hour", "minute", "second"];

/**
 * Parse a duration to whole seconds.
 *
 * Accepts a count of seconds (a number, or a numeric string) or an ISO 8601
 * duration such as `PT1H30M`, because hosts have both: an API field is usually
 * a number, while `<time datetime>` wants the ISO form. Weeks, months and years
 * are deliberately not accepted — `P1M` is ambiguous between a month and a
 * minute in the calendar sense, and a month is not a fixed number of seconds,
 * so rendering one as though it were would be a lie about how long the duration
 * actually is.
 *
 * Negative and unparseable input is `null`. A duration is an elapsed quantity,
 * so a negative one is a host bug rather than a direction — `box-relative-time`
 * is the component that expresses "ago".
 */
export const parseDuration = (value: string | number | null | undefined): number | null => {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }

  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.round(Number(trimmed));
  }

  const match = ISO_DURATION.exec(trimmed);
  if (!match || trimmed === "P" || trimmed === "PT") {
    return null;
  }

  const [, days, hours, minutes, seconds] = match;
  const total =
    Number(days ?? 0) * SECONDS_PER.day +
    Number(hours ?? 0) * SECONDS_PER.hour +
    Number(minutes ?? 0) * SECONDS_PER.minute +
    Number(seconds ?? 0);
  return Number.isFinite(total) ? Math.round(total) : null;
};

/**
 * Split whole seconds into at most `maxUnits` consecutive units.
 *
 * Consecutive, not merely the largest: 90061 seconds is "1 day, 1 hour" rather
 * than "1 day, 1 minute", because a reader scanning a duration wants its
 * magnitude, and skipping an empty unit to reach a smaller non-empty one
 * overstates the precision.
 *
 * A duration of zero returns whole seconds rather than nothing, so "0 sec"
 * renders instead of the element disappearing — zero is a real answer.
 */
export const resolveDurationParts = (
  totalSeconds: number,
  maxUnits = 2,
): BoeDurationParts => {
  const limit = Math.max(1, Math.trunc(maxUnits));
  if (totalSeconds <= 0) {
    return { second: 0 };
  }

  const collected: Array<[BoeDurationUnit, number]> = [];
  let remaining = Math.round(totalSeconds);
  let started = false;

  for (const unit of DURATION_ORDER) {
    const size = SECONDS_PER[unit];
    const amount = Math.floor(remaining / size);

    if (!started && amount === 0) {
      continue;
    }

    started = true;
    collected.push([unit, amount]);
    remaining -= amount * size;

    if (collected.length === limit) {
      break;
    }
  }

  // Trailing zeroes are noise: an exact hour is "1 hr", not "1 hr, 0 min". Only
  // trailing ones go — an interior zero is load-bearing, since "1 day, 0 hr" as
  // the first two units of 1d 0h 5m would otherwise become "1 day, 5 min" and
  // claim a precision the split does not have.
  while (collected.length > 1 && collected[collected.length - 1]![1] === 0) {
    collected.pop();
  }

  return Object.fromEntries(collected) as BoeDurationParts;
};

/** Render a parts object back to an ISO 8601 duration, for `<time datetime>`. */
export const toIsoDuration = (parts: BoeDurationParts): string => {
  const date = parts.day ? `${parts.day}D` : "";
  const time = [
    parts.hour ? `${parts.hour}H` : "",
    parts.minute ? `${parts.minute}M` : "",
    parts.second ? `${parts.second}S` : "",
  ].join("");
  if (!date && !time) {
    return "PT0S";
  }
  return `P${date}${time ? `T${time}` : ""}`;
};
