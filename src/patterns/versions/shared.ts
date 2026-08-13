import type { VersionStatus } from "./types.js";

/** Internal to the versions pattern — not part of the public barrel. */
export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const STATUS_LABELS: Record<VersionStatus, string> = {
  current: "Current",
  executed: "Executed",
  superseded: "Superseded",
  abandoned: "Abandoned",
};
