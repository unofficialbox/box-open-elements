import { describe, expect, it, vi } from "vitest";

import { ContentPickerController } from "../../../src/patterns/content-picker/controller.js";
import { isItemPickable } from "../../../src/patterns/content-picker/types.js";
import type { PickerConstraints, PickerSessionConfig } from "../../../src/patterns/content-picker/types.js";
import type {
  ExplorerItem,
  ExplorerTransport,
  ExplorerTransportResult,
} from "../../../src/patterns/content-explorer/types.js";

const rootItems: ExplorerItem[] = [
  { id: "f1", name: "report.pdf", type: "file", extension: "pdf" },
  { id: "f2", name: "notes.txt", type: "file", extension: "txt" },
  { id: "sub", name: "Subfolder", type: "folder" },
  { id: "w1", name: "Link", type: "web_link" },
];

const subItems: ExplorerItem[] = [{ id: "f3", name: "deck.pdf", type: "file", extension: "pdf" }];

const folderResult = (folderId: string): ExplorerTransportResult => ({
  breadcrumbs:
    folderId === "sub"
      ? [
          { id: "0", name: "All Files", type: "folder" },
          { id: "sub", name: "Subfolder", type: "folder" },
        ]
      : [{ id: "0", name: "All Files", type: "folder" }],
  folder:
    folderId === "sub"
      ? { id: "sub", name: "Subfolder", type: "folder" }
      : { id: "0", name: "All Files", type: "folder" },
  folderId,
  items: folderId === "sub" ? subItems : rootItems,
  pagination: { hasMoreItems: false, limit: 100, offset: 0, totalCount: null },
});

const createTransport = (): ExplorerTransport => ({
  loadFolderItems: vi.fn().mockImplementation(({ folderId }) => Promise.resolve(folderResult(folderId))),
});

const createPicker = (
  overrides: Partial<PickerSessionConfig> = {},
  transport: ExplorerTransport = createTransport(),
): ContentPickerController =>
  new ContentPickerController({
    rootFolderId: "0",
    token: "token",
    transport,
    ...overrides,
  });

describe("isItemPickable", () => {
  it("defaults to files only", () => {
    expect(isItemPickable(rootItems[0]!, {})).toBe(true);
    expect(isItemPickable(rootItems[2]!, {})).toBe(false);
    expect(isItemPickable(rootItems[3]!, {})).toBe(false);
  });

  it("honours selectableTypes", () => {
    const constraints: PickerConstraints = { selectableTypes: ["folder", "web_link"] };
    expect(isItemPickable(rootItems[0]!, constraints)).toBe(false);
    expect(isItemPickable(rootItems[2]!, constraints)).toBe(true);
    expect(isItemPickable(rootItems[3]!, constraints)).toBe(true);
  });

  it("filters files by extension, case-insensitively, with or without the dot", () => {
    expect(isItemPickable(rootItems[0]!, { extensions: ["PDF"] })).toBe(true);
    expect(isItemPickable(rootItems[0]!, { extensions: [".pdf"] })).toBe(true);
    expect(isItemPickable(rootItems[1]!, { extensions: ["pdf"] })).toBe(false);
    // Falls back to the name suffix when the item has no extension field.
    expect(isItemPickable({ id: "x", name: "photo.JPG", type: "file" }, { extensions: ["jpg"] })).toBe(true);
    expect(isItemPickable({ id: "x", name: "README", type: "file" }, { extensions: ["md"] })).toBe(false);
  });
});

describe("ContentPickerController constraints", () => {
  it("rejects non-selectable items with a reason", async () => {
    const picker = createPicker();
    await picker.connect();

    const rejected = vi.fn();
    picker.subscribe("selectionRejected", rejected);

    picker.togglePick("sub");
    picker.togglePick("w1");

    expect(picker.getState().selectedItems).toEqual([]);
    expect(rejected).toHaveBeenCalledTimes(2);
    expect(rejected.mock.calls[0]?.[0]).toMatchObject({ reason: "not-selectable", item: { id: "sub" } });
  });

  it("rejects picks past maxSelectable and keeps the roster intact", async () => {
    const picker = createPicker({ maxSelectable: 1, selectableTypes: ["file"] });
    await picker.connect();

    picker.togglePick("f1");
    expect(picker.getState().selectedItems.map(item => item.id)).toEqual(["f1"]);

    // maxSelectable 1 replaces instead of rejecting.
    picker.togglePick("f2");
    expect(picker.getState().selectedItems.map(item => item.id)).toEqual(["f2"]);
  });

  it("emits limit-reached when maxSelectable > 1 is exhausted", async () => {
    const picker = createPicker({ maxSelectable: 2 });
    await picker.connect();

    const rejected = vi.fn();
    picker.subscribe("selectionRejected", rejected);

    picker.togglePick("f1");
    picker.togglePick("f2");
    const third: ExplorerItem = { id: "f4", name: "extra.pdf", type: "file", extension: "pdf" };
    picker.explorer.setItems([...rootItems, third]);
    picker.togglePick("f4");

    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({ reason: "limit-reached" }));
    expect(picker.getState().selectedItems.map(item => item.id)).toEqual(["f1", "f2"]);
  });

  it("applies the extensions allowlist through togglePick", async () => {
    const picker = createPicker({ extensions: ["pdf"] });
    await picker.connect();

    const rejected = vi.fn();
    picker.subscribe("selectionRejected", rejected);

    picker.togglePick("f2");
    picker.togglePick("f1");

    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({ reason: "not-selectable", item: { id: "f2", name: "notes.txt", type: "file", extension: "txt" } }));
    expect(picker.getState().selectedItems.map(item => item.id)).toEqual(["f1"]);
  });
});

describe("ContentPickerController roster across navigation", () => {
  it("keeps picks across folders and re-marks them in the visible collection", async () => {
    const picker = createPicker();
    await picker.connect();

    picker.togglePick("f1");
    await picker.explorer.navigateTo("sub");
    expect(picker.getState().selectedItems.map(item => item.id)).toEqual(["f1"]);
    expect(picker.explorer.getState().selectedItemIds).toEqual([]);

    picker.togglePick("f3");
    expect(picker.getState().selectedItems.map(item => item.id)).toEqual(["f1", "f3"]);
    expect(picker.explorer.getState().selectedItemIds).toEqual(["f3"]);

    await picker.explorer.navigateTo("0");
    expect(picker.explorer.getState().selectedItemIds).toEqual(["f1"]);
    expect(picker.getState().selectedItems.map(item => item.id)).toEqual(["f1", "f3"]);
  });

  it("unpicks roster members that are not in the current folder", async () => {
    const picker = createPicker();
    await picker.connect();

    picker.togglePick("f1");
    await picker.explorer.navigateTo("sub");
    picker.togglePick("f1");

    expect(picker.getState().selectedItems).toEqual([]);
    expect(picker.getState().canChoose).toBe(false);
  });
});

describe("ContentPickerController choose/cancel", () => {
  it("choose is a no-op while the roster is empty", async () => {
    const picker = createPicker();
    await picker.connect();

    const chosen = vi.fn();
    picker.subscribe("chosen", chosen);

    expect(picker.choose()).toBeNull();
    expect(chosen).not.toHaveBeenCalled();
  });

  it("choose emits the roster in pick order and keeps it", async () => {
    const picker = createPicker();
    await picker.connect();

    const chosen = vi.fn();
    picker.subscribe("chosen", chosen);

    picker.togglePick("f2");
    picker.togglePick("f1");
    const items = picker.choose();

    expect(items?.map(item => item.id)).toEqual(["f2", "f1"]);
    expect(chosen).toHaveBeenCalledWith({ items });
    expect(picker.getState().canChoose).toBe(true);
  });

  it("cancel clears the roster and emits cancelled", async () => {
    const picker = createPicker();
    await picker.connect();

    const cancelled = vi.fn();
    const selectionChanged = vi.fn();
    picker.subscribe("cancelled", cancelled);
    picker.togglePick("f1");
    picker.subscribe("selectionChanged", selectionChanged);

    picker.cancel();

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(selectionChanged).toHaveBeenCalledWith({ selectedItems: [] });
    expect(picker.getState().selectedItems).toEqual([]);
  });

  it("disconnect clears the roster", async () => {
    const picker = createPicker();
    await picker.connect();

    picker.togglePick("f1");
    picker.disconnect();

    expect(picker.getState().selectedItems).toEqual([]);
    expect(picker.getState().canChoose).toBe(false);
  });
});
