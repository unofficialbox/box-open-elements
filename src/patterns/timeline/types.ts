export type TimelineTone = "neutral" | "brand" | "success" | "warning" | "error";

/** A piece of supporting evidence attached to an event (document, record, citation). */
export interface TimelineEvidence {
  id: string;
  label: string;
  /** Optional deep link; without it the shell still emits `evidence-selected`. */
  href?: string;
}

/**
 * One append-only activity entry: who did what, when, with what supporting
 * evidence. `correlationId` threads the event to the workflow call that
 * produced it (audit requirement); `badge` carries a short structured
 * outcome such as a policy-check result.
 */
export interface TimelineEvent {
  id: string;
  action: string;
  actor?: { name: string; initials?: string };
  /** Free-text detail under the action line. */
  summary?: string;
  /** ISO timestamp; rendered as-is-formatted, sorted by the host. */
  timestamp?: string;
  tone?: TimelineTone;
  badge?: string;
  correlationId?: string;
  evidence?: TimelineEvidence[];
}

export interface TimelineEntrySubmittedDetail {
  body: string;
}

const TONES = new Set<TimelineTone>(["neutral", "brand", "success", "warning", "error"]);

export const resolveTimelineTone = (value: string | null | undefined): TimelineTone =>
  value && TONES.has(value as TimelineTone) ? (value as TimelineTone) : "neutral";

/** Attribute payloads are author input — validate every record, not just the array. */
export const isTimelineEventRecord = (value: unknown): value is TimelineEvent => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;
  if (typeof event.id !== "string" || event.id.length === 0 || typeof event.action !== "string") {
    return false;
  }
  if (event.evidence !== undefined) {
    if (!Array.isArray(event.evidence)) {
      return false;
    }
    for (const entry of event.evidence) {
      const evidence = entry as Record<string, unknown> | null;
      if (
        typeof evidence !== "object" ||
        evidence === null ||
        typeof evidence.id !== "string" ||
        typeof evidence.label !== "string"
      ) {
        return false;
      }
    }
  }
  return true;
};
