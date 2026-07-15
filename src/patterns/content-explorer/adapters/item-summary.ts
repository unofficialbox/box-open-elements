import type { ExplorerItem, ExplorerItemSharedLinkSummary } from "../types.js";

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Format byte size for list/table cells (e.g. `2.4 MB`). */
export const formatItemSize = (size: number | null | undefined): string => {
  if (size == null || !Number.isFinite(size) || size < 0) {
    return "";
  }

  if (size < 1024) {
    return `${Math.round(size)} B`;
  }

  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${SIZE_UNITS[unitIndex]}`;
};

/** Format an ISO timestamp for list/table cells. */
export const formatItemDate = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return dateFormatter.format(date);
};

export const formatItemOwner = (item: ExplorerItem): string => item.owner?.name?.trim() ?? "";

export const formatItemShared = (
  sharedLink: ExplorerItemSharedLinkSummary | null | undefined,
): string => {
  if (!sharedLink?.isShared) {
    return "";
  }

  switch (sharedLink.access) {
    case "open":
      return "Shared · Open";
    case "company":
      return "Shared · Company";
    case "collaborators":
      return "Shared · Collaborators";
    case undefined:
      return "Shared";
    default: {
      const _exhaustive: never = sharedLink.access;
      return _exhaustive;
    }
  }
};

/** Secondary meta line under the item name (list / composed shell). */
export const formatItemMetaLine = (item: ExplorerItem): string => {
  const parts = [
    item.type === "file" ? formatItemSize(item.size) : "",
    formatItemDate(item.modifiedAt),
    formatItemOwner(item),
    formatItemShared(item.sharedLink),
  ].filter(Boolean);

  return parts.join(" · ");
};

/** Compact signature fragment so adapters re-render when summary fields change. */
export const itemSummarySignature = (item: ExplorerItem): Record<string, unknown> => ({
  size: item.size ?? null,
  modifiedAt: item.modifiedAt ?? null,
  owner: item.owner?.name ?? null,
  shared: item.sharedLink?.isShared ? (item.sharedLink.access ?? true) : false,
  parent: item.parent?.id ?? null,
});
