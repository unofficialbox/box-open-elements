/**
 * Strict-pixel gate configuration helpers.
 *
 * Extracted from regression.ts so the threshold parsing is unit-testable without
 * importing the script (which runs capture on import).
 */

/** Default fraction of pixels allowed to differ in strict `--pixel` mode. */
export const DEFAULT_MAX_DIFF_RATIO = 0.001;

/**
 * Parses the `REGRESSION_MAX_DIFF_RATIO` override into a diff ratio in `[0, 1]`.
 *
 * Throws on any invalid value (empty, non-numeric, NaN, Infinity, negative, or
 * greater than 1) rather than falling through: a `NaN` threshold makes every
 * `ratio > MAX_DIFF_RATIO` comparison false, and a threshold above 1 exceeds the
 * maximum possible diff ratio — either would silently disable the pixel gate the
 * CI is built around.
 */
export function parseMaxDiffRatio(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_MAX_DIFF_RATIO;
  const trimmed = raw.trim();
  const parsed = Number(trimmed);
  if (trimmed === "" || !Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`Invalid REGRESSION_MAX_DIFF_RATIO (expected a number in [0, 1]): ${JSON.stringify(raw)}`);
  }
  return parsed;
}
