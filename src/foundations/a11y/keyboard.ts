/**
 * Shared keyboard helpers for composite widgets (menu, toolbar, listbox, radiogroup).
 * Prefer these over per-component Arrow/Home/End copies.
 */

export type RovingOrientation = "horizontal" | "vertical" | "both";

export type RovingKeyOptions = {
  /** When true (default), Arrow past the ends wraps. */
  wrap?: boolean;
  /** Which arrow keys participate. Default `"both"`. */
  orientation?: RovingOrientation;
};

/**
 * Map a keyboard event key to the next index in a roving-tabindex collection.
 * Returns `null` when the key is not a navigation key for the orientation.
 */
export const nextRovingIndex = (
  key: string,
  currentIndex: number,
  length: number,
  options: RovingKeyOptions = {},
): number | null => {
  if (length <= 0) {
    return null;
  }

  const wrap = options.wrap ?? true;
  const orientation = options.orientation ?? "both";
  const lastIndex = length - 1;
  const clamped = Math.max(0, Math.min(lastIndex, currentIndex));

  const isNext =
    ((orientation === "horizontal" || orientation === "both") && key === "ArrowRight") ||
    ((orientation === "vertical" || orientation === "both") && key === "ArrowDown");
  const isPrevious =
    ((orientation === "horizontal" || orientation === "both") && key === "ArrowLeft") ||
    ((orientation === "vertical" || orientation === "both") && key === "ArrowUp");

  if (isNext) {
    if (clamped >= lastIndex) {
      return wrap ? 0 : lastIndex;
    }
    return clamped + 1;
  }

  if (isPrevious) {
    if (clamped <= 0) {
      return wrap ? lastIndex : 0;
    }
    return clamped - 1;
  }

  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return lastIndex;
  }

  return null;
};

/** Set `tabIndex` so only `activeIndex` is in the tab order (roving tabindex). */
export const applyRovingTabindex = (items: readonly HTMLElement[], activeIndex: number): void => {
  items.forEach((item, index) => {
    item.tabIndex = index === activeIndex ? 0 : -1;
  });
};

/**
 * Focus the item at `index` after applying roving tabindex.
 * Uses `queueMicrotask` so callers can finish DOM patches first.
 */
export const focusRovingItem = (items: readonly HTMLElement[], index: number): void => {
  applyRovingTabindex(items, index);
  const target = items[index];
  if (!target) {
    return;
  }
  queueMicrotask(() => {
    target.focus();
  });
};

/**
 * Handle Arrow/Home/End inside a toolbar / menu / radiogroup collection.
 * Returns true when the event was handled.
 */
export const handleRovingKeydown = (
  event: KeyboardEvent,
  items: readonly HTMLElement[],
  options: RovingKeyOptions = {},
): boolean => {
  const currentIndex = items.indexOf(event.target as HTMLElement);
  if (currentIndex < 0) {
    return false;
  }

  const nextIndex = nextRovingIndex(event.key, currentIndex, items.length, options);
  if (nextIndex == null) {
    return false;
  }

  event.preventDefault();
  focusRovingItem(items, nextIndex);
  return true;
};
