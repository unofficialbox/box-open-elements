/**
 * Host-level wiring between search chrome (filter bar / saved views) and an
 * explorer surface that exposes search / clearSearch. Keeps transport and
 * recents out of these helpers — hosts own presets and presentation mode.
 */

export type ExplorerSearchHost = {
  search: (query: string) => void | Promise<void>;
  clearSearch: () => void | Promise<void>;
};

export type FilterBarValue = {
  filters: string[];
  query: string;
  sort: string;
  view: string;
};

export type FilterBarLike = EventTarget & {
  query?: string;
};

export type SavedViewPreset = {
  id: string;
  /** Search query to apply; empty/undefined clears search. */
  query?: string;
};

export type BindFilterBarOptions = {
  /**
   * Optional hook when the filter-bar `view` select changes (list/table/etc.).
   * Explorer itself does not switch presentation modes — the host does.
   * Fires only when `view` differs from the previous value.
   */
  onViewChange?: (view: string, state: FilterBarValue) => void;
  /** Fired for every `value-changed` (filters/sort/query/view). */
  onValueChange?: (state: FilterBarValue) => void;
  /** Called when search/clearSearch rejects (avoids unhandled rejections). */
  onError?: (error: unknown) => void;
};

const readFilterBarDetail = (event: Event): FilterBarValue | null => {
  const detail = (event as CustomEvent<{ value?: FilterBarValue }>).detail;
  const value = detail?.value;
  if (!value || typeof value !== "object") {
    return null;
  }
  return {
    filters: Array.isArray(value.filters) ? value.filters : [],
    query: typeof value.query === "string" ? value.query : "",
    sort: typeof value.sort === "string" ? value.sort : "",
    view: typeof value.view === "string" ? value.view : "",
  };
};

const runExplorerSearch = (
  explorer: ExplorerSearchHost,
  query: string,
  onError?: (error: unknown) => void,
): void => {
  const result = query ? explorer.search(query) : explorer.clearSearch();
  void Promise.resolve(result).catch(error => {
    onError?.(error);
  });
};

/**
 * Wire `box-filter-bar` search → explorer search/clearSearch.
 * Returns an unsubscribe function.
 */
export const bindFilterBarToExplorer = (
  filterBar: FilterBarLike,
  explorer: ExplorerSearchHost,
  options: BindFilterBarOptions = {},
): (() => void) => {
  let lastView: string | undefined;

  const onSearch = (event: Event): void => {
    // filter-bar emits `search` with `detail.value` = FilterBarState
    const detail = (event as CustomEvent<{ value?: FilterBarValue; query?: string }>).detail;
    const fromState = detail?.value?.query;
    const query = (typeof fromState === "string" ? fromState : detail?.query ?? filterBar.query ?? "").trim();
    runExplorerSearch(explorer, query, options.onError);
  };

  const onValueChanged = (event: Event): void => {
    const state = readFilterBarDetail(event);
    if (!state) {
      return;
    }
    options.onValueChange?.(state);
    if (state.view !== lastView) {
      lastView = state.view;
      options.onViewChange?.(state.view, state);
    }
  };

  filterBar.addEventListener("search", onSearch);
  filterBar.addEventListener("value-changed", onValueChanged);

  return () => {
    filterBar.removeEventListener("search", onSearch);
    filterBar.removeEventListener("value-changed", onValueChanged);
  };
};

export type BindSavedViewOptions = {
  /** Resolve a picked view id to a preset the host owns (local, not server). */
  resolvePreset: (viewId: string) => SavedViewPreset | null | undefined;
  /** Called when search/clearSearch rejects (avoids unhandled rejections). */
  onError?: (error: unknown) => void;
};

/**
 * Wire `box-saved-view-picker` → explorer search using host-owned presets.
 */
export const bindSavedViewPickerToExplorer = (
  picker: EventTarget,
  explorer: ExplorerSearchHost,
  options: BindSavedViewOptions,
): (() => void) => {
  const onValueChanged = (event: Event): void => {
    const viewId = (event as CustomEvent<{ value?: string }>).detail?.value;
    if (!viewId) {
      return;
    }
    const preset = options.resolvePreset(viewId);
    if (!preset) {
      return;
    }
    const query = (preset.query ?? "").trim();
    runExplorerSearch(explorer, query, options.onError);
  };

  picker.addEventListener("value-changed", onValueChanged);
  return () => {
    picker.removeEventListener("value-changed", onValueChanged);
  };
};
