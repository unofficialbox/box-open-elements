import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentPicker } from "../../../src/patterns/content-picker/content-picker.js";
import type {
  ExplorerTransport,
  ExplorerTransportResult,
} from "../../../src/patterns/content-explorer/types.js";

ContentPicker.register();

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const createResult = (folderId: string): ExplorerTransportResult => ({
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
  items:
    folderId === "sub"
      ? [{ id: "f3", name: "deck.pdf", type: "file", extension: "pdf" }]
      : [
          { id: "f1", name: "report.pdf", type: "file", extension: "pdf" },
          { id: "f2", name: "notes.txt", type: "file", extension: "txt" },
          { id: "sub", name: "Subfolder", type: "folder" },
        ],
  pagination: { hasMoreItems: false, limit: 100, offset: 0, totalCount: null },
});

const createTransport = (): ExplorerTransport => ({
  loadFolderItems: vi.fn().mockImplementation(({ folderId }) => Promise.resolve(createResult(folderId))),
});

const mountPicker = async (configure?: (element: ContentPicker) => void): Promise<ContentPicker> => {
  const element = document.createElement("box-content-picker") as ContentPicker;
  element.transport = createTransport();
  element.rootFolderId = "0";
  element.token = "token";
  configure?.(element);
  document.body.append(element);
  await flushMicrotasks();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-content-picker", () => {
  it("renders items with the footer and a disabled Choose button when nothing is picked", async () => {
    const element = await mountPicker();

    expect(element.shadowRoot?.textContent).toContain("report.pdf");
    expect(element.shadowRoot?.textContent).toContain("0 selected");
    const choose = element.shadowRoot?.querySelector('[part="choose"]') as HTMLButtonElement;
    expect(choose.disabled).toBe(true);
    expect(choose.textContent).toBe("Choose");
    expect(element.shadowRoot?.querySelector('[part="cancel"]')?.textContent).toBe("Cancel");
  });

  it("toggles picks on click and enables Choose", async () => {
    const element = await mountPicker();

    (element.shadowRoot?.querySelector('[part="item"][data-item-id="f1"]') as HTMLButtonElement).click();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("1 selected");
    expect(
      element.shadowRoot?.querySelector('[part="item"][data-item-id="f1"]')?.getAttribute("aria-selected"),
    ).toBe("true");
    expect((element.shadowRoot?.querySelector('[part="choose"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it("disables rows that are neither pickable nor navigable", async () => {
    const element = await mountPicker(el => {
      el.extensions = ["pdf"];
    });

    const txt = element.shadowRoot?.querySelector('[part="item"][data-item-id="f2"]') as HTMLButtonElement;
    const folder = element.shadowRoot?.querySelector('[part="item"][data-item-id="sub"]') as HTMLButtonElement;
    expect(txt.disabled).toBe(true);
    expect(txt.getAttribute("aria-disabled")).toBe("true");
    // Folders stay enabled for navigation even when not pickable.
    expect(folder.disabled).toBe(false);
    expect(folder.getAttribute("data-pickable")).toBe("false");
  });

  it("navigates into folders on click when they are not pickable", async () => {
    const element = await mountPicker();

    (element.shadowRoot?.querySelector('[part="item"][data-item-id="sub"]') as HTMLButtonElement).click();
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("deck.pdf");
    expect(element.shadowRoot?.textContent).toContain("Subfolder");
  });

  it("keeps the roster across navigation and reflects the count with max-selectable", async () => {
    const element = await mountPicker(el => {
      el.maxSelectable = 2;
    });

    (element.shadowRoot?.querySelector('[part="item"][data-item-id="f1"]') as HTMLButtonElement).click();
    await flushMicrotasks();
    await element.navigateTo("sub");
    await flushMicrotasks();

    expect(element.shadowRoot?.textContent).toContain("1 of 2 selected");

    (element.shadowRoot?.querySelector('[part="item"][data-item-id="f3"]') as HTMLButtonElement).click();
    await flushMicrotasks();
    expect(element.shadowRoot?.textContent).toContain("2 of 2 selected");
  });

  it("emits chosen with the picked items and cancelled from the footer buttons", async () => {
    const element = await mountPicker();
    const chosen = vi.fn();
    const cancelled = vi.fn();
    element.addEventListener("chosen", chosen);
    element.addEventListener("cancelled", cancelled);

    (element.shadowRoot?.querySelector('[part="item"][data-item-id="f1"]') as HTMLButtonElement).click();
    await flushMicrotasks();
    (element.shadowRoot?.querySelector('[part="choose"]') as HTMLButtonElement).click();

    expect(chosen).toHaveBeenCalledTimes(1);
    expect(chosen.mock.calls[0]?.[0]?.detail.items.map((item: { id: string }) => item.id)).toEqual(["f1"]);

    (element.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement).click();
    await flushMicrotasks();
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(element.shadowRoot?.textContent).toContain("0 selected");
  });

  it("emits selection-rejected for constrained picks", async () => {
    const element = await mountPicker(el => {
      el.extensions = ["pdf"];
    });
    const rejected = vi.fn();
    element.addEventListener("selection-rejected", rejected);

    element.togglePick("f2");

    expect(rejected).toHaveBeenCalledTimes(1);
    expect(rejected.mock.calls[0]?.[0]?.detail).toMatchObject({ reason: "not-selectable" });
  });

  it("uses single-select semantics when max-selectable is 1", async () => {
    const element = await mountPicker(el => {
      el.maxSelectable = 1;
    });

    expect(
      element.shadowRoot?.querySelector('[part="items"]')?.getAttribute("aria-multiselectable"),
    ).toBe("false");

    element.togglePick("f1");
    element.togglePick("f2");
    await flushMicrotasks();

    expect(element.state?.selectedItems.map(item => item.id)).toEqual(["f2"]);
    expect(element.shadowRoot?.textContent).toContain("1 of 1 selected");
  });

  it("honours custom footer labels", async () => {
    const element = await mountPicker(el => {
      el.chooseLabel = "Attach";
      el.cancelLabel = "Back";
    });

    expect(element.shadowRoot?.querySelector('[part="choose"]')?.textContent).toBe("Attach");
    expect(element.shadowRoot?.querySelector('[part="cancel"]')?.textContent).toBe("Back");
  });
});
