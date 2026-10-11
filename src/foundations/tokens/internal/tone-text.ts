/** Text on translucent status fills uses text tokens, not darkened surface tokens. */
export const toneTextColor = (tone: string): string => {
  switch (tone) {
    case "success": case "succeeded": case "completed":
      return "var(--boe-token-text-status-text-success, #187657)";
    case "warning": case "inprogress":
      return "var(--boe-token-text-status-text-warning, #805600)";
    case "error": case "failed":
      return "var(--boe-token-text-status-text-error, #b92340)";
    case "brand": case "running":
      return "var(--boe-token-text-text, #222222)";
    default:
      return "var(--boe-token-text-text, #222222)";
  }
};
