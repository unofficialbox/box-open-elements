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

    // Same view again — onViewChange should not re-fire.
    filterBar.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { query: "y", sort: "name", view: "table", filters: ["pdf"] } },
      }),
    );
    expect(onViewChange).toHaveBeenCalledTimes(1);

    filterBar.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { query: "y", sort: "name", view: "list", filters: [] } },
      }),
    );
    expect(onViewChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    filterBar.dispatchEvent(
      new CustomEvent("search", {
        detail: { value: { query: "again", sort: "", view: "", filters: [] } },
      }),
    );
    expect(explorer.search).toHaveBeenCalledTimes(1);
  });

  it("routes rejected search promises to onError", async () => {
    const filterBar = new EventTarget();
    const onError = vi.fn();
    const explorer = {
      search: vi.fn(async () => {
        throw new Error("boom");
      }),
      clearSearch: vi.fn(async () => undefined),
    };
    bindFilterBarToExplorer(filterBar, explorer, { onError });
    filterBar.dispatchEvent(
      new CustomEvent("search", {
        detail: { value: { query: "x", sort: "", view: "", filters: [] } },
      }),
    );
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
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
