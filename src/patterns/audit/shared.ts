// Internal helpers shared by the two audit projections. Kept in one place so
// escaping and formatting can never drift between the log and the density
// strip — they render the same records.

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const isSafeHref = (value: string): boolean =>
  /^https?:\/\//.test(value) || value.startsWith("/") || value.startsWith("#");

export const auditToneColor = (tone: string): string => {
  switch (tone) {
    case "brand":
      return "var(--boe-token-surface-surface-brand, #0061d5)";
    case "success":
      return "var(--boe-token-surface-status-surface-success, #26a27b)";
    case "warning":
      return "var(--boe-token-surface-status-surface-warning, #f5b31b)";
    case "error":
      return "var(--boe-token-surface-status-surface-error, #ed3757)";
    default:
      return "var(--boe-token-text-text-secondary, #6f6f6f)";
  }
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const pad = (value: number): string => String(value).padStart(2, "0");

/**
 * Format an event instant for a row. Rendered in UTC to match the UTC day
 * grouping — a row must never appear to sit outside the day section holding
 * it, which is exactly what a locale-local time would produce near midnight.
 */
export const formatAuditTimestamp = (value: string | undefined): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${MONTHS[date.getUTCMonth()]!} ${String(date.getUTCDate())}, ${String(date.getUTCFullYear())}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
};

/** Reference time for deterministic day labels; falls back to the wall clock. */
export const resolveReferenceTime = (raw: string | null): Date => {
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};
