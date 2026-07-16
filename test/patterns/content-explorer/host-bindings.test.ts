import { describe, expect, it, vi } from "vitest";

import {
  bindFilterBarToExplorer,
  bindSavedViewPickerToExplorer,
} from "../../../src/patterns/content-explorer/host-bindings.js";

describe("explorer host bindings", () => {
  it("bindFilterBarToExplorer maps search events to search/clearSearch", async () => {
    const filterBar = new EventTarget() as EventTarget & { query?: string };
    const explorer = {
      search: vi.fn(async () => undefined),
      clearSearch: vi.fn(async () => undefined),
    };
    const onViewChange = vi.fn();
    const unsubscribe = bindFilterBarToExplorer(filterBar, explorer, { onViewChange });

    filterBar.dispatchEvent(
      new CustomEvent("search", {
        detail: { value: { query: "contracts", sort: "", view: "", filters: [] } },
      }),
    );
    expect(explorer.search).toHaveBeenCalledWith("contracts");

    filterBar.dispatchEvent(
      new CustomEvent("search", {
        detail: { value: { query: "  ", sort: "", view: "", filters: [] } },
      }),
    );
    expect(explorer.clearSearch).toHaveBeenCalled();

    filterBar.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { query: "x", sort: "name", view: "table", filters: ["pdf"] } },
      }),
    );
    expect(onViewChange).toHaveBeenCalledWith(
      "table",
      expect.objectContaining({ view: "table", filters: ["pdf"] }),
    );

    unsubscribe();
    filterBar.dispatchEvent(new CustomEvent("search", { detail: { query: "again" } }));
    expect(explorer.search).toHaveBeenCalledTimes(1);
  });

  it("bindSavedViewPickerToExplorer applies host presets", () => {
    const picker = new EventTarget();
    const explorer = {
      search: vi.fn(async () => undefined),
      clearSearch: vi.fn(async () => undefined),
    };
    const unsubscribe = bindSavedViewPickerToExplorer(picker, explorer, {
      resolvePreset: id =>
        id === "legal"
          ? { id: "legal", query: "legal" }
          : id === "all"
            ? { id: "all", query: "" }
            : null,
    });

    picker.dispatchEvent(new CustomEvent("value-changed", { detail: { value: "legal" } }));
    expect(explorer.search).toHaveBeenCalledWith("legal");

    picker.dispatchEvent(new CustomEvent("value-changed", { detail: { value: "all" } }));
    expect(explorer.clearSearch).toHaveBeenCalled();

    unsubscribe();
  });
});
