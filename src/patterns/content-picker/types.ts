import type { ExplorerItem, ExplorerSessionConfig } from "../content-explorer/types.js";

export type PickerItemType = ExplorerItem["type"];

/**
 * Eligibility rules for what the picker lets the user put in its roster.
 * Items that fail the rules stay visible (folders remain navigable) but their
 * rows are not pickable.
 */
export interface PickerConstraints {
  /**
   * Item types eligible for picking. Defaults to `["file"]`, mirroring
   * box-ui-elements' ContentPicker default type. Folders always stay
   * navigable whether or not they are pickable.
   */
  selectableTypes?: PickerItemType[];
  /**
   * Extension allowlist applied to files (case-insensitive, no leading dot).
   * Empty or omitted allows every extension. Only files are filtered — other
   * item types have no extension.
   */
  extensions?: string[];
  /**
   * Maximum roster size. Omitted means unlimited. `1` also switches the
   * underlying explorer selection to single mode, so picking replaces
   * instead of rejecting.
   */
  maxSelectable?: number;
}

export interface PickerSessionConfig
  extends Omit<ExplorerSessionConfig, "itemActions" | "selectionMode">,
    PickerConstraints {}

export interface PickerState {
  /** True when the roster is non-empty — drives the Choose button. */
  canChoose: boolean;
  maxSelectable: number | null;
  /** The cross-folder pick roster, in pick order. */
  selectedItems: ExplorerItem[];
}

export type PickerSelectionRejectionReason = "limit-reached" | "not-selectable";

export interface PickerEvents {
  cancelled: undefined;
  chosen: { items: ExplorerItem[] };
  selectionChanged: { selectedItems: ExplorerItem[] };
  selectionRejected: { item: ExplorerItem; reason: PickerSelectionRejectionReason };
}

const normalizeExtension = (value: string): string => value.replace(/^\./, "").toLowerCase();

/** File extension resolved from the item's own field or its name's suffix. */
const resolveItemExtension = (item: ExplorerItem): string | null => {
  if (item.extension) {
    return normalizeExtension(item.extension);
  }
  const dotIndex = item.name.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === item.name.length - 1) {
    return null;
  }
  return normalizeExtension(item.name.slice(dotIndex + 1));
};

/** Pure eligibility check — the single source of truth for pickability. */
export const isItemPickable = (item: ExplorerItem, constraints: PickerConstraints): boolean => {
  const selectableTypes = constraints.selectableTypes?.length ? constraints.selectableTypes : ["file"];
  if (!selectableTypes.includes(item.type)) {
    return false;
  }

  if (item.type === "file" && constraints.extensions?.length) {
    const extension = resolveItemExtension(item);
    if (!extension || !constraints.extensions.map(normalizeExtension).includes(extension)) {
      return false;
    }
  }

  return true;
};
