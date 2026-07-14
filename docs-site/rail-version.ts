/**
 * Populate the rail version footer. Uses the build-time inlined version when
 * present (static hosting, no server); otherwise falls back to fetching the dev
 * server's /api/status. Split out of main.ts so both branches are testable.
 */
export function applyRailVersion(
  el: HTMLElement | null,
  inlinedVersion: string | null,
  fetchStatus: () => Promise<{ version: string }>,
): void {
  if (!el) return;
  if (inlinedVersion) {
    el.textContent = `v${inlinedVersion}`;
    return;
  }
  void fetchStatus()
    .then(status => {
      el.textContent = `v${status.version}`;
    })
    .catch(() => {});
}
