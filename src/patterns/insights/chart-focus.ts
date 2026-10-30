/** Keep focus in a usable place only when an owned focused control disappeared. */
export function restoreChartFocus(host: HTMLElement, previous: HTMLElement | null): void {
  if (!previous || previous.isConnected && !previous.closest("[hidden]")) return;
  const active = host.ownerDocument.activeElement;
  if (active && active !== host && active !== host.ownerDocument.body) return;
  const heading = host.shadowRoot?.querySelector<HTMLElement>('[part="heading"]');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}
