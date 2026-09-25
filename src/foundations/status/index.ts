import { boeEntranceKeyframes, boeReducedMotionPolicy } from "../motion/behaviors.js";

export type StatusKind = "pending" | "active" | "done" | "warning" | "failed" | "skipped" | "approved" | "rejected";
const mappings: Record<string, StatusKind> = {
  pending: "pending", info: "pending", active: "active", running: "active", in_progress: "active",
  done: "done", succeeded: "done", completed: "done", pass: "done", approved: "approved",
  warning: "warning", warn: "warning", failed: "failed", fail: "failed", error: "failed",
  skipped: "skipped", rejected: "rejected",
};
export const toStatusKind = (status: string): StatusKind => mappings[status] ?? "pending";
export const statusLabel = (kind: StatusKind, labels: Partial<Record<StatusKind, string>> = {}): string => labels[kind] ?? ({
  pending: "Not started", active: "In progress", done: "Done", warning: "Done with a warning",
  failed: "Failed", skipped: "Skipped",
  approved: "Approved", rejected: "Rejected",
})[kind];
/** Decorative markup. Pair with visible words or the StatusIcon component. */
export const boeStatusGlyph = (kind: StatusKind): string => {
  const state = toStatusKind(kind);
  const path = state === "done" || state === "approved" ? '<path d="m4 8 3 3 5-6"/>'
    : state === "rejected" ? '<path d="M4 12 12 4"/>'
    : state === "failed" ? '<path d="m5 5 6 6m0-6-6 6"/>'
    : state === "warning" ? '<path d="M8 4.75v3.75M8 11h.01"/>'
    : state === "active" ? '<path class="boe-status-arc" d="M8 1.75a6.25 6.25 0 0 1 6.25 6.25"/>' : "";
  return `<svg class="boe-status" data-kind="${state}" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6.25"/>${path}</svg>`;
};
export const boeStatusStyles = `
.boe-status { flex: none; vertical-align: middle; fill: none; stroke: currentColor; stroke-width: 1.5; }
.boe-status[data-kind="active"] { color: var(--boe-token-surface-surface-brand, #0061d5); }
.boe-status-arc { transform-origin: 8px 8px; animation: boe-status-spin .8s linear infinite; }
.boe-status[data-kind="active"] circle { opacity: .25; }
.boe-status[data-kind="done"] { color: var(--boe-token-text-status-text-success, #187657); }
.boe-status[data-kind="warning"] { color: var(--boe-token-text-status-text-warning, #946400); }
.boe-status[data-kind="failed"] { color: var(--boe-token-text-status-text-error, #c52a46); }
.boe-status[data-kind="skipped"] circle { stroke-dasharray: 2 2; }
.boe-status:is([data-kind="done"], [data-kind="warning"], [data-kind="failed"]) circle { fill: currentColor; }
.boe-status:is([data-kind="done"], [data-kind="warning"], [data-kind="failed"]) path { stroke: var(--boe-token-surface-surface, #fff); stroke-linecap: round; }
.boe-status[data-kind="done"] { animation: boe-pop 200ms ease-out both; }
.boe-status[data-kind="done"] path { stroke-dasharray: 20; animation: boe-status-check 200ms ease-out both; }
`;
/** Self-contained styles for light-DOM glyphs; safe to insert in a document style element. */
export const boeStatusDocumentStyles = `${boeEntranceKeyframes}${boeStatusStyles}${boeReducedMotionPolicy}`;
