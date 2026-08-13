/**
 * A tab in the content sidebar. `id` doubles as the slot name that feeds the
 * tab's panel, so custom tabs work the same way as the built-in four.
 */
export interface SidebarTab {
  id: string;
  label: string;
}

/** The upstream ContentSidebar tab set, in its canonical order. */
export const DEFAULT_SIDEBAR_TABS: readonly SidebarTab[] = [
  { id: "details", label: "Details" },
  { id: "activity", label: "Activity" },
  { id: "metadata", label: "Metadata" },
  { id: "versions", label: "Versions" },
];

/**
 * Resolve which tabs the sidebar shows. An explicit configuration wins
 * verbatim (the host is declaring its surface — an empty array means "no
 * tabs", not "use the defaults"); otherwise the default tabs are filtered
 * to the ones with slotted panel content, so an integration that only
 * provides a details panel gets a details-only sidebar.
 */
export const resolveSidebarTabs = (
  configured: readonly SidebarTab[] | null,
  presentSlots: ReadonlySet<string>,
): SidebarTab[] => {
  if (configured) {
    return [...configured];
  }

  return DEFAULT_SIDEBAR_TABS.filter(tab => presentSlots.has(tab.id));
};
