// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Table } from "../../../src/components/collections/table.js";

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "owner", label: "Owner" },
];
const ROWS = [
  { id: "1", cells: { name: "A.pdf", owner: "Morgan" } },
  { id: "2", cells: { name: "B.pdf", owner: "Alex" } },
  { id: "3", cells: { name: "C.pdf", owner: "Sam" } },
  { id: "4", cells: { name: "D.pdf", owner: "Kai" } },
];

const create = (mode = "multiple"): Table => {
  const el = document.createElement("box-table") as Table;
  el.columns = COLUMNS as never;
  el.rows = ROWS as never;
  el.selectionMode = mode as never;
  document.body.append(el);
  return el;
};

const rowAt = (el: Table, i: number): HTMLElement =>
  el.shadowRoot?.querySelectorAll('[part="row"]')[i] as HTMLElement;

describe("Table", () => {
  beforeEach(() => {
    Table.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders headers and a row per item", () => {
    const el = create("none");
    expect(el.shadowRoot?.querySelectorAll("thead th").length).toBe(2);
    expect(el.shadowRoot?.querySelectorAll('[part="row"]').length).toBe(4);
    expect(el.shadowRoot?.querySelector('[part="table"]')?.getAttribute("role")).toBe("table");
  });

  it("uses grid semantics when selectable", () => {
    const el = create("multiple");
    expect(el.shadowRoot?.querySelector('[part="table"]')?.getAttribute("role")).toBe("grid");
    expect(rowAt(el, 0).getAttribute("tabindex")).toBe("0");
  });

  it("selects a single row on click in single mode", () => {
    const el = create("single");
    const changed = vi.fn();
    el.addEventListener("selection-changed", changed);
    rowAt(el, 1).click();
    expect(el.selectedIds).toEqual(["2"]);
    rowAt(el, 2).click();
    expect(el.selectedIds).toEqual(["3"]); // single replaces
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("toggles with Ctrl/Cmd-click in multiple mode", () => {
    const el = create("multiple");
    rowAt(el, 0).dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    rowAt(el, 2).dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    expect(new Set(el.selectedIds)).toEqual(new Set(["1", "3"]));
    rowAt(el, 0).dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    expect(el.selectedIds).toEqual(["3"]);
  });

  it("selects a range with Shift-click", () => {
    const el = create("multiple");
    rowAt(el, 1).click(); // anchor at index 1
    rowAt(el, 3).dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    expect(new Set(el.selectedIds)).toEqual(new Set(["2", "3", "4"]));
  });

  it("selects all with Ctrl/Cmd+A and clears with Escape", () => {
    const el = create("multiple");
    const body = el.shadowRoot?.querySelector('[part="body"]') as HTMLElement;
    rowAt(el, 0).focus();
    body.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true }));
    expect(el.selectedIds.length).toBe(4);
    body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(el.selectedIds.length).toBe(0);
  });

  it("emits sort on a sortable header click", () => {
    const el = create("none");
    const sorted = vi.fn();
    el.addEventListener("sort", sorted);
    (el.shadowRoot?.querySelector('th[part="sortable"]') as HTMLElement).click();
    expect(sorted).toHaveBeenCalledTimes(1);
    expect(sorted.mock.calls[0][0].detail).toEqual({ key: "name", direction: "ascending" });
  });

  it("renders sortable headers as real buttons so sorting is keyboard-reachable", () => {
    const el = create("none");
    // A native button gives focus, Enter and Space for free; a bare th with a
    // click listener gives none of them.
    const button = el.shadowRoot?.querySelector(
      'th[part="sortable"] button[part="sort-button"]',
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();

    const sorted = vi.fn();
    el.addEventListener("sort", sorted);
    button!.click(); // what the browser synthesises for Enter/Space on a button
    expect(sorted).toHaveBeenCalledTimes(1);
    expect(sorted.mock.calls[0][0].detail).toEqual({ key: "name", direction: "ascending" });

    // Non-sortable headers stay plain.
    const headers = Array.from(el.shadowRoot!.querySelectorAll("thead th"));
    expect(headers[1]?.querySelector("button")).toBeNull();
  });

  it("states the sort state in the button's accessible name", () => {
    const el = create("none");
    const buttonName = (): string =>
      el.shadowRoot
        ?.querySelector('button[part="sort-button"]')
        ?.getAttribute("aria-label") ?? "";
    expect(buttonName()).toBe("Sort by Name, not sorted");

    el.setAttribute("sort-key", "name");
    el.setAttribute("sort-direction", "descending");
    expect(buttonName()).toBe("Sort by Name, sorted descending");
  });

  it("does not select when selection-mode is none", () => {
    const el = create("none");
    const changed = vi.fn();
    el.addEventListener("selection-changed", changed);
    rowAt(el, 0).click();
    expect(changed).not.toHaveBeenCalled();
  });
});

describe("Table cell descriptors, expansion, and states (dispatch intake round 5)", () => {
  beforeEach(() => {
    Table.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const COLS = [
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
  ];

  it("renders badge and link descriptors, escaped, never as raw HTML", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.rows = [
      {
        id: "1",
        cells: {
          name: { kind: "link", text: "MSA_Acme.pdf", href: "https://box.com/f/1" },
          status: { kind: "badge", text: "Approved", tone: "success" },
        },
      },
      {
        id: "2",
        cells: {
          name: { kind: "link", text: "evil", href: "javascript:alert(1)" },
          status: "<img src=x onerror=alert(1)>",
        },
      },
    ] as never;
    document.body.append(el);

    const link = el.shadowRoot?.querySelector('[part="cell-link"]');
    expect(link?.getAttribute("href")).toBe("https://box.com/f/1");
    expect(el.shadowRoot?.querySelector('[part="cell-badge"]')?.textContent).toBe("Approved");

    // Unsafe href renders as plain text, not a link.
    const links = el.shadowRoot?.querySelectorAll('[part="cell-link"]') ?? [];
    expect(links.length).toBe(1);
    // The rejected link's text still renders — as escaped plain text.
    expect(el.shadowRoot?.textContent).toContain("evil");
    // And a string cell is escaped like always.
    expect(el.shadowRoot?.querySelector("img")).toBeNull();
  });

  it("expands and collapses row detail without selecting the row", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.selectionMode = "multiple" as never;
    el.rows = [
      { id: "1", cells: { name: "A", status: "ok" }, detail: "Uploaded by <b>Morgan</b>." },
      { id: "2", cells: { name: "B", status: "ok" } },
    ] as never;
    document.body.append(el);

    const toggled = vi.fn();
    const selected = vi.fn();
    el.addEventListener("row-toggled", toggled);
    el.addEventListener("selection-changed", selected);

    const expander = el.shadowRoot?.querySelector('[part="expander"]') as HTMLButtonElement;
    expect(expander).not.toBeNull();
    // Row 2 has no detail: no expander rendered for it.
    expect(el.shadowRoot?.querySelectorAll('[part="expander"]').length).toBe(1);

    expander.click();
    expect(toggled).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { rowId: "1", expanded: true } }),
    );
    expect(selected).not.toHaveBeenCalled(); // expanding is not selecting
    expect(el.expandedRows).toEqual(["1"]);

    const detailRow = el.shadowRoot?.querySelector('[part="detail-row"]');
    expect(detailRow?.textContent).toContain("Uploaded by <b>Morgan</b>.");
    // Detail is data like any cell: escaped, never parsed as markup.
    expect(detailRow?.querySelector("b")).toBeNull();
    // A named slot lets the host project rich detail per row.
    expect(detailRow?.querySelector('slot[name="detail-1"]')).not.toBeNull();

    (el.shadowRoot?.querySelector('[part="expander"]') as HTMLButtonElement).click();
    expect(el.shadowRoot?.querySelector('[part="detail-row"]')).toBeNull();
  });

  it("states loading, error, and empty in words — loading wins over a stale error", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.rows = [] as never;
    document.body.append(el);

    const stateRow = (): HTMLElement | null | undefined =>
      el.shadowRoot?.querySelector<HTMLElement>('[part="state-row"]');

    expect(stateRow()?.dataset.state).toBe("empty");
    expect(stateRow()?.textContent).toContain("No rows");

    el.setAttribute("empty-text", "No documents match");
    expect(stateRow()?.textContent).toContain("No documents match");

    el.setAttribute("error-text", "Could not load documents");
    expect(stateRow()?.dataset.state).toBe("error");
    expect(stateRow()?.textContent).toContain("Could not load documents");

    el.setAttribute("loading", "");
    expect(stateRow()?.dataset.state).toBe("loading");
    expect(stateRow()?.textContent).toContain("Loading rows…");
    expect(el.shadowRoot?.querySelector('[part="table"]')?.getAttribute("aria-busy")).toBe("true");

    el.removeAttribute("loading");
    el.removeAttribute("error-text");
    el.rows = [{ id: "1", cells: { name: "A", status: "ok" } }] as never;
    expect(stateRow()).toBeNull();
    expect(el.shadowRoot?.querySelector('[part="table"]')?.hasAttribute("aria-busy")).toBe(false);
  });

  it("marks every cell with its column label for the stacked layout", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.rows = [{ id: "1", cells: { name: "A", status: "ok" } }] as never;
    el.setAttribute("stacked", "auto");
    document.body.append(el);

    const cells = Array.from(el.shadowRoot?.querySelectorAll("tbody td") ?? []);
    expect(cells.map(cell => cell.getAttribute("data-label"))).toEqual(["Name", "Status"]);

    // The stacked rules exist for both the forced and the container-driven mode.
    const styles = el.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('@container (max-width: 560px)');
    expect(styles).toContain(':host([stacked]:not([stacked="auto"]))');
    expect(styles).toContain("content: attr(data-label)");
  });
});

describe("Table review fixes (PR #188)", () => {
  beforeEach(() => {
    Table.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const COLS = [
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
  ];

  it("rejects a forged align value instead of interpolating it into markup", () => {
    const el = document.createElement("box-table") as Table;
    el.setAttribute(
      "columns",
      JSON.stringify([{ key: "name", label: "Name", align: `end"><img src=x onerror=alert(1)>` }]),
    );
    el.rows = [{ id: "1", cells: { name: "A" } }] as never;
    document.body.append(el);

    expect(el.shadowRoot?.querySelector("img")).toBeNull();
    expect(el.shadowRoot?.querySelector("th")?.hasAttribute("data-align")).toBe(false);
    // A legitimate value still lands.
    el.setAttribute("columns", JSON.stringify([{ key: "name", label: "Name", align: "end" }]));
    expect(el.shadowRoot?.querySelector("th")?.getAttribute("data-align")).toBe("end");
  });

  it("restores focus to the re-rendered expander after a toggle", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.rows = [{ id: "r-1", cells: { name: "A", status: "ok" }, detail: "More." }] as never;
    document.body.append(el);

    const expander = el.shadowRoot?.querySelector('[part="expander"]') as HTMLButtonElement;
    expander.focus();
    expander.click();

    const replacement = el.shadowRoot?.querySelector('[part="expander"]') as HTMLButtonElement;
    expect(replacement).not.toBe(expander); // the body was rewritten
    expect(el.shadowRoot?.activeElement).toBe(replacement);
  });

  it("treats a non-string detail as malformed input, not a crash", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.setAttribute(
      "rows",
      JSON.stringify([{ id: "1", cells: { name: "A", status: "ok" }, detail: 7 }]),
    );
    document.body.append(el);

    expect(el.shadowRoot?.querySelector('[part="expander"]')).toBeNull();
    expect(el.shadowRoot?.querySelectorAll('[part="row"]').length).toBe(1);
  });
});

describe("Table row virtualization", () => {
  beforeEach(() => {
    Table.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const COLS = [
    { key: "name", label: "Name" },
    { key: "owner", label: "Owner" },
  ];

  const manyRows = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: `r-${String(index)}`,
      cells: { name: `Row ${String(index)}`, owner: "Morgan" },
    }));

  /**
   * jsdom has no layout, so the scroll viewport is faked before any rows exist:
   * the element renders its shell on connect, and assigning rows afterwards is
   * what drives the first windowed render.
   */
  const create = (
    count: number,
    { virtualize = true, viewportHeight = 640, selectionMode = "multiple" } = {},
  ): Table => {
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.selectionMode = selectionMode as never;
    if (virtualize) el.setAttribute("virtualize", "");
    el.setAttribute("row-height", "32");
    document.body.append(el);

    const shell = el.shadowRoot?.querySelector('[part="shell"]') as HTMLElement;
    Object.defineProperty(shell, "clientHeight", { value: viewportHeight, configurable: true });

    el.rows = manyRows(count) as never;
    return el;
  };

  const shellOf = (el: Table): HTMLElement =>
    el.shadowRoot?.querySelector('[part="shell"]') as HTMLElement;

  /** Scroll through the real listener path, including its frame coalescing. */
  const scrollTo = async (el: Table, top: number): Promise<void> => {
    const shell = shellOf(el);
    shell.scrollTop = top;
    shell.dispatchEvent(new Event("scroll"));
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
  };

  const renderedIndices = (el: Table): number[] =>
    Array.from(el.shadowRoot?.querySelectorAll<HTMLElement>('[part="row"]') ?? []).map(row =>
      Number(row.dataset.index),
    );

  it("renders every row when virtualization is off", () => {
    const el = create(300, { virtualize: false });
    expect(renderedIndices(el).length).toBe(300);
    expect(el.renderedWindow).toBeNull();
  });

  it("renders only a window of a large collection", () => {
    const el = create(10_000);
    const indices = renderedIndices(el);

    // 640/32 = 20 visible, plus the straddling row and overscan — a far cry
    // from ten thousand DOM rows.
    expect(indices.length).toBeGreaterThan(0);
    expect(indices.length).toBeLessThan(40);
    expect(indices[0]).toBe(0);
    expect(el.renderedWindow?.totalHeight).toBe(10_000 * 32);
  });

  it("pads with spacers so the scroll range covers the whole collection", async () => {
    const el = create(10_000);
    await scrollTo(el, 3_200);

    const spacers = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLElement>('[part="spacer"]') ?? [],
    );
    expect(spacers.map(row => row.dataset.position)).toEqual(["top", "bottom"]);
    // Spacers are not rows: keyboard navigation and selection must not see them.
    expect(spacers.every(row => row.getAttribute("part") !== "row")).toBe(true);
    expect(spacers.every(row => row.getAttribute("aria-hidden") === "true")).toBe(true);

    const window = el.renderedWindow!;
    const rendered = (window.endIndex - window.startIndex) * 32;
    expect(window.paddingTop + rendered + window.paddingBottom).toBe(window.totalHeight);
  });

  it("keeps indices absolute so selection addresses the right record", async () => {
    const el = create(10_000);
    await scrollTo(el, 3_200);

    const indices = renderedIndices(el);
    expect(indices[0]).toBeGreaterThan(90); // ~row 100, minus overscan

    // Clicking the first *rendered* row must select that row's record, not the
    // collection's row 0 — the trap a slice-relative index would fall into.
    const expectedId = `r-${String(indices[0])}`;
    el.shadowRoot?.querySelector<HTMLElement>('[part="row"]')?.click();
    expect(el.selectedIds).toEqual([expectedId]);
  });

  it("gives the tab stop to the first rendered row", async () => {
    const el = create(10_000);
    await scrollTo(el, 3_200);

    const rows = Array.from(el.shadowRoot?.querySelectorAll<HTMLElement>('[part="row"]') ?? []);
    expect(rows[0]?.tabIndex).toBe(0);
    expect(rows.slice(1).every(row => row.tabIndex === -1)).toBe(true);
  });

  it("End reaches the last row of the collection, not the last rendered row", () => {
    const el = create(10_000);
    const body = el.shadowRoot?.querySelector('[part="body"]') as HTMLElement;
    el.shadowRoot?.querySelector<HTMLElement>('[part="row"]')?.focus();
    body.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));

    // The window scrolled to bring the final row in, and it is rendered now —
    // bounds come from the data, not from the rendered slice.
    expect(shellOf(el).scrollTop).toBeGreaterThan(0);
    expect(renderedIndices(el)).toContain(9_999);
  });

  it("keeps End/Home focus through delayed measurement and Space selection", async () => {
    const el = create(200, { viewportHeight: 240 });
    const key = (value: string): void => {
      el.shadowRoot!.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }));
    };
    const frame = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => resolve()));
    // A different measured height queues the same follow-up render that a
    // native browser produces when the final row loses its bottom border.
    const height = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 31.5 } as DOMRect);
    try {
      rowAt(el, 0).focus();
      key("End");
      expect((el.shadowRoot!.activeElement as HTMLElement).dataset.id).toBe("r-199");
      await frame();
      await frame();
      expect((el.shadowRoot!.activeElement as HTMLElement).dataset.id).toBe("r-199");
      expect(el.renderedWindow!.totalHeight).toBe(200 * 31.5);
      key(" ");
      expect(el.selectedIds).toEqual(["r-199"]);
      key("Home");
      await frame();
      await frame();
      expect((el.shadowRoot!.activeElement as HTMLElement).dataset.id).toBe("r-0");
      key(" ");
      expect(el.selectedIds).toEqual(["r-199", "r-0"]);
    } finally {
      height.mockRestore();
    }
  });

  it("follows the focused ID through visible reorder and controlled selection, not the old index", () => {
    const el = create(200, { viewportHeight: 240 });
    const id = 'row"\\identity';
    el.rows = [{ id, cells: { name: "Before" } }, ...el.rows.slice(1)];
    rowAt(el, 0).focus();
    const rows = el.rows;
    el.rows = [rows[1]!, { ...rows[0]!, cells: { name: "Current" } }, ...rows.slice(2)];
    el.selectedIds = [id];
    const active = el.shadowRoot!.activeElement as HTMLElement;
    expect(active.dataset.id).toBe(id);
    expect(active.dataset.index).toBe("1");
    expect(active.textContent).toContain("Current");
    active.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(el.selectedIds).toEqual([]);
    el.rows = el.rows.filter(row => row.id !== id);
    expect(el.shadowRoot!.activeElement).toBeNull();
  });

  it("does not reclaim focus after a host handoff before a queued window render", async () => {
    const el = create(200, { viewportHeight: 240 });
    const external = document.createElement("button");
    document.body.append(external);
    rowAt(el, 0).focus();
    const pending = scrollTo(el, 32);
    external.focus();
    await pending;
    expect(document.activeElement).toBe(external);
    expect(el.shadowRoot!.activeElement).toBeNull();
  });

  it("leaves a reentrant focusin host update final and respects its focus handoff", () => {
    const el = create(200, { viewportHeight: 240 });
    const external = document.createElement("button");
    document.body.append(external);
    rowAt(el, 0).focus();
    el.addEventListener("focusin", () => {
      external.focus();
      el.rows = [{ id: "current", cells: { name: "Host replacement" } }];
    }, { once: true });
    el.selectedIds = ["r-0"];
    expect(rowAt(el, 0).dataset.id).toBe("current");
    expect(rowAt(el, 0).textContent).toContain("Host replacement");
    expect(document.activeElement).toBe(external);
  });

  it("skips the re-render while the resolved window is unchanged", async () => {
    const el = create(10_000);
    const before = el.renderedWindow;
    const firstRow = el.shadowRoot?.querySelector('[part="row"]');

    await scrollTo(el, 4); // same slice
    expect(el.renderedWindow).toEqual(before);
    // Same DOM nodes: the body was not rebuilt.
    expect(el.shadowRoot?.querySelector('[part="row"]')).toBe(firstRow);

    await scrollTo(el, 6_400); // a different slice
    expect(el.renderedWindow).not.toEqual(before);
  });

  it("ignores scroll entirely when not virtualizing", async () => {
    const el = create(300, { virtualize: false });
    const firstRow = el.shadowRoot?.querySelector('[part="row"]');
    await scrollTo(el, 3_200);
    expect(el.shadowRoot?.querySelector('[part="row"]')).toBe(firstRow);
    expect(renderedIndices(el).length).toBe(300);
  });

  it("refuses to window a collection whose rows can expand", () => {
    // The window derives the entire scroll range from rows.length * rowHeight.
    // An expanded row renders a second <tr> that arithmetic knows nothing
    // about, so the spacers would under-report the real height and scrollTop
    // would stop mapping to the right absolute index. Rendering everything is
    // slower; scrolling to the wrong record is wrong.
    const el = create(300);
    expect(el.renderedWindow).not.toBeNull(); // windowing while rows are flat

    el.rows = manyRows(300).map(row => ({ ...row, detail: `About ${row.id}` })) as never;

    expect(el.renderedWindow).toBeNull();
    expect(renderedIndices(el).length).toBe(300);
    expect(el.shadowRoot?.querySelectorAll('[part="spacer"]').length).toBe(0);
    // The opt-in is untouched — the element declined it, it was not revoked.
    expect(el.virtualize).toBe(true);
  });

  it("keeps an expandable collection unwindowed across expand and scroll", async () => {
    // The decision is made from the data, not from what happens to be open: a
    // window that appeared and disappeared as a row toggled would jump the
    // viewport under the pointer mid-scroll.
    const el = document.createElement("box-table") as Table;
    el.columns = COLS as never;
    el.setAttribute("virtualize", "");
    el.setAttribute("row-height", "32");
    document.body.append(el);
    Object.defineProperty(shellOf(el), "clientHeight", { value: 640, configurable: true });
    el.rows = manyRows(300).map(row => ({ ...row, detail: `About ${row.id}` })) as never;

    expect(el.renderedWindow).toBeNull();

    // Expand a row: the detail <tr> appears and windowing stays off.
    el.shadowRoot?.querySelector<HTMLElement>('[part="expander"]')?.click();
    expect(el.expandedRows).toEqual(["r-0"]);
    expect(el.shadowRoot?.querySelectorAll('[part="detail-row"]').length).toBe(1);
    expect(el.renderedWindow).toBeNull();

    // And a scroll past where the window would have moved changes nothing.
    const firstRow = el.shadowRoot?.querySelector('[part="row"]');
    await scrollTo(el, 6_400);
    expect(el.renderedWindow).toBeNull();
    expect(el.shadowRoot?.querySelector('[part="row"]')).toBe(firstRow);
    expect(renderedIndices(el).length).toBe(300);
  });

  it("reports no window while showing a state row", () => {
    const el = create(10_000);
    expect(el.renderedWindow).not.toBeNull();

    el.loading = true;
    expect(el.renderedWindow).toBeNull();

    el.loading = false;
    expect(el.renderedWindow).not.toBeNull();

    el.rows = [] as never;
    expect(el.renderedWindow).toBeNull();
  });
});

describe("Table row headers, column groups and plain descriptors", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it.each(["none", "multiple"] as const)("renders row header semantics in %s mode with selection styling", mode => {
    const el = document.createElement("box-table") as Table;
    el.columns = [{ key: "name", label: "Step", rowHeader: true }, { key: "count", label: "Failed" }];
    el.rows = [{ id: "one", cells: { name: "users.me", count: "3" } }];
    el.selectionMode = mode;
    el.stacked = "auto";
    document.body.append(el);
    const row = el.shadowRoot!.querySelector('[part="row"]') as HTMLElement;
    const header = row.querySelector("th")!;
    expect(header.getAttribute("scope")).toBe("row");
    expect(header.getAttribute("role")).toBe("rowheader");
    expect(header.getAttribute("data-label")).toBe("Step");
    expect(header.textContent).toBe("users.me");
    expect(row.querySelector("td")?.getAttribute("role")).toBe(mode === "none" ? "cell" : "gridcell");
    if (mode !== "none") { header.click(); expect(el.selectedIds).toEqual(["one"]); }
  });

  it("starts body row headers by default while retaining explicit end and center alignment", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = [
      { key: "start", label: "Start", rowHeader: true, align: "start" },
      { key: "end", label: "End", rowHeader: true, align: "end" },
      { key: "center", label: "Center", rowHeader: true, align: "center" },
    ];
    el.rows = [{ id: "1", cells: { start: "A", end: "B", center: "C" } }];
    document.body.append(el);
    const cells = [...el.shadowRoot!.querySelectorAll("tbody th")];
    expect(cells[1].getAttribute("data-align")).toBe("end");
    expect(cells[2].getAttribute("data-align")).toBe("center");
    const styles = el.shadowRoot!.querySelector("style")!.textContent!;
    expect(styles).toContain("tbody th { text-align: start; }");
    expect(styles).toContain('th[data-align="end"], td[data-align="end"] { text-align: end; }');
    expect(styles).toContain('th[data-align="center"], td[data-align="center"] { text-align: center; }');
  });

  it("keeps distinct grouped leaf labels in stacked cells, including escaped group text", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = [
      { key: "step", label: "Step", rowHeader: true },
      { key: "current", label: "Calls", group: "This run" },
      { key: "previous", label: "Calls", group: 'Earlier "run" <prior>' },
    ];
    el.rows = [{ id: "1", cells: { step: "users.me", current: "142", previous: "130" } }];
    el.stacked = "always";
    document.body.append(el);
    const cells = [...el.shadowRoot!.querySelectorAll("tbody :is(td, th)")];
    expect(cells.map(cell => cell.getAttribute("data-label"))).toEqual([
      "Step", "This run — Calls", 'Earlier "run" <prior> — Calls',
    ]);
    expect(cells.map(cell => cell.textContent)).toEqual(["users.me", "142", "130"]);
    expect(cells[2].children.length).toBe(0);
  });

  it("spans contiguous groups, keeps ungrouped sortable columns and details aligned, and restores one-row headers", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = [
      { key: "name", label: "Step", rowHeader: true, sortable: true },
      { key: "a", label: "Calls", group: "This run", sortable: true },
      { key: "b", label: "Failed", group: "This run" },
      { key: "c", label: "Calls", group: "Earlier run" },
      { key: "d", label: "Rate", group: "This run" },
    ];
    el.rows = [{ id: "one", cells: { name: "users.me" }, detail: "Detail" }];
    document.body.append(el);
    const root = el.shadowRoot!;
    expect([...root.querySelectorAll('th[scope="colgroup"]')].map(e => [e.textContent, e.getAttribute("colspan")]))
      .toEqual([["This run", "2"], ["Earlier run", "1"], ["This run", "1"]]);
    expect([...root.querySelectorAll("colgroup")].map(e => e.span)).toEqual([1, 1, 2, 1, 1]);
    expect(root.querySelector('th[aria-label="Row details"]')?.getAttribute("rowspan")).toBe("2");
    expect(root.querySelector('th[data-key="name"]')?.getAttribute("rowspan")).toBe("2");
    expect(root.querySelectorAll('[part="header-row"] th').length).toBe(4);
    const sort = vi.fn(); el.addEventListener("sort", sort);
    (root.querySelector('th[data-key="name"] button') as HTMLElement).click();
    expect(sort.mock.calls[0][0].detail.key).toBe("name");
    (root.querySelector('th[data-key="a"] button') as HTMLElement).click();
    expect(sort.mock.calls[1][0].detail.key).toBe("a");
    (root.querySelector('[part="expander"]') as HTMLElement).click();
    expect(root.querySelector('[part="detail-row"] td')?.getAttribute("colspan")).toBe("6");
    el.columns = [{ key: "name", label: "Step", rowHeader: true }];
    expect(root.querySelector('[part="group-header-row"]')).toBeNull();
    expect(root.querySelectorAll("colgroup").length).toBe(0);
  });

  it("renders omitted-kind toned text without badge chrome and keeps unknown tones escaped", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = [{ key: "count", label: "Failed" }];
    el.rows = [{ id: "one", cells: { count: { text: "3", tone: "error" } } },
      { id: "two", cells: { count: { text: "<img src=x>", tone: 'bad" onmouseover="alert(1)' } as never } }];
    document.body.append(el);
    const text = el.shadowRoot!.querySelector('[part="cell-text"]') as HTMLElement;
    expect(text.textContent).toBe("3");
    expect(text.getAttribute("style")).toContain("--boe-token-text-status-text-error");
    expect(el.shadowRoot!.querySelector('[part="cell-badge"]')).toBeNull();
    expect(el.shadowRoot!.querySelector("img")).toBeNull();
    expect(el.shadowRoot!.textContent).toContain("<img src=x>");
  });

  it("escapes link metadata, supports downloads and labels, and refuses unsafe hrefs", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = [{ key: "link", label: "Report" }];
    const value = { kind: "link" as const, text: "Report", href: "/report", target: "_BLANK", download: 'run".csv', ariaLabel: 'Report" onmouseover="bad' };
    el.rows = [{ id: "one", cells: { link: value } },
      { id: "two", cells: { link: { ...value, href: "javascript:bad()" } } },
      { id: "three", cells: { link: { ...value, download: true } } },
      { id: "four", cells: { link: { ...value, download: false } } }];
    document.body.append(el);
    const links = el.shadowRoot!.querySelectorAll("a");
    expect(links.length).toBe(3);
    expect(links[0]?.getAttribute("rel")).toBe("noopener");
    expect(links[0]?.getAttribute("download")).toBe('run".csv');
    expect(links[0]?.getAttribute("aria-label")).toBe('Report" onmouseover="bad');
    expect(links[0]?.hasAttribute("onmouseover")).toBe(false);
    expect(links[1]?.getAttribute("download")).toBe("");
    expect(links[2]?.hasAttribute("download")).toBe(false);
  });

  it("keeps row header semantics and grouped header geometry in a windowed table", () => {
    const el = document.createElement("box-table") as Table;
    el.columns = [{ key: "name", label: "Step", rowHeader: true }, { key: "count", label: "Count", group: "This run" }];
    el.virtualize = true;
    document.body.append(el);
    Object.defineProperty(el.shadowRoot!.querySelector('[part="shell"]'), "clientHeight", { value: 300 });
    el.rows = Array.from({ length: 500 }, (_, i) => ({ id: String(i), cells: { name: "Step "+i, count: "4" } }));
    expect(el.renderedWindow).not.toBeNull();
    expect(el.shadowRoot!.querySelectorAll('tbody th[scope="row"]').length).toBeLessThan(500);
    expect(el.shadowRoot!.querySelector('th[scope="colgroup"]')?.textContent).toBe("This run");
    expect(el.shadowRoot!.querySelector('[part="spacer"] td')?.getAttribute("colspan")).toBe("2");
  });
});

describe("Table expandable header and controlled sort focus", () => {
  beforeEach(() => { Table.register(); });
  afterEach(() => { document.body.innerHTML = ""; });

  it.each([false, true])("gives the details header screen-reader text (grouped=%s)", grouped => {
    const el = create("none");
    el.columns = [{ key: "name", label: "Name", sortable: true, ...(grouped ? { group: "Files" } : {}) }];
    el.rows = [{ id: "one", cells: { name: "A" }, detail: "More information" }];
    const header = el.shadowRoot!.querySelector('th[aria-label="Row details"]')!;
    expect(header.querySelector(".boe-sr-only")?.textContent).toBe("Details");
    expect(header.querySelector("[hidden], [aria-hidden=true]")).toBeNull();
    expect(header.getAttribute("scope")).toBe("col");
    expect(header.getAttribute("rowspan")).toBe(grouped ? "2" : null);
  });

  it.each([false, true])("retains repeated controlled sorting focus and state (grouped=%s)", grouped => {
    const el = create("multiple");
    el.columns = [{ key: "name", label: "Name", sortable: true, ...(grouped ? { group: "Files" } : {}) }];
    el.rows = [{ id: "one", cells: { name: "A" }, detail: "More information" }];
    el.selectedIds = ["one"];
    const directions: string[] = [];
    el.addEventListener("sort", event => {
      const { key, direction } = (event as CustomEvent).detail;
      directions.push(direction);
      el.setAttribute("sort-key", key);
      el.setAttribute("sort-direction", direction);
      el.rows = [...el.rows];
    });
    const button = () => el.shadowRoot!.querySelector<HTMLButtonElement>('[part="sort-button"]')!;
    button().focus();
    for (const direction of ["ascending", "descending", "ascending"]) {
      button().click();
      expect(el.shadowRoot!.activeElement).toBe(button());
      expect(button().getAttribute("aria-label")).toBe(`Sort by Name, sorted ${direction}`);
      expect(el.selectedIds).toEqual(["one"]);
    }
    expect(directions).toEqual(["ascending", "descending", "ascending"]);
  });

  it("retains the same focused column across regrouping and deferred row updates", async () => {
    const el = create("none");
    const key = 'name"\\key';
    el.columns = [{ key, label: "Name", sortable: true }, { key: "owner", label: "Owner" }];
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="sort-button"]')!.focus();
    el.columns = [{ key: "owner", label: "Owner" }, { key, label: "Name", sortable: true, group: "Files" }];
    await Promise.resolve();
    el.rows = [...el.rows];
    const active = el.shadowRoot!.activeElement as HTMLElement;
    expect(active?.getAttribute("part")).toBe("sort-button");
    expect(active.closest<HTMLElement>("th")?.dataset.key).toBe(key);
  });

  it("does not steal external focus or focus another column when the active sortable column disappears", () => {
    const el = create("none");
    const external = document.createElement("button");
    document.body.append(external);
    external.focus();
    el.setAttribute("sort-direction", "descending");
    expect(document.activeElement).toBe(external);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="sort-button"]')!.focus();
    el.columns = [{ key: "owner", label: "Owner", sortable: true }];
    expect(el.shadowRoot!.activeElement).toBeNull();
  });
});

describe("Table focus restoration render transaction", () => {
  beforeEach(() => { Table.register(); });
  afterEach(() => { document.body.innerHTML = ""; });

  it.each(["rows", "columns", "loading", "error", "empty"])("keeps a focusin host update as the final DOM after %s rendering", state => {
    const el = create("multiple");
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="sort-button"]')!.focus();
    el.addEventListener("focusin", () => {
      el.rows = [{ id: "new", cells: { name: "Replacement B", owner: "New owner" } }];
      if (state === "columns") el.columns = [{ key: "name", label: "New name", sortable: true }];
      el.loading = false;
      el.errorText = "";
    }, { once: true });
    if (state === "loading") el.loading = true;
    else if (state === "error") el.errorText = "Before update";
    else if (state === "empty") el.rows = [];
    else el.setAttribute("sort-direction", "descending");
    expect(el.rows.map(row => row.id)).toEqual(["new"]);
    expect(el.shadowRoot!.querySelector("tbody")!.textContent).toContain("Replacement B");
    expect(el.shadowRoot!.querySelector('[part="row"]')?.getAttribute("data-id")).toBe("new");
    if (state === "columns") {
      expect(el.shadowRoot!.querySelector("thead")!.textContent).toContain("New name");
      expect(el.shadowRoot!.querySelectorAll("tbody td").length).toBe(1);
    }
    (el.shadowRoot!.querySelector('[part="row"]') as HTMLElement).click();
    expect(el.selectedIds).toEqual(["new"]);
  });
});

describe("Table compact stacked layout", () => {
  beforeEach(() => { Table.register(); });
  afterEach(() => { document.body.innerHTML = ""; });
  const compact = (): Table => {
    const el = document.createElement("box-table") as Table;
    el.setAttribute("stacked", "auto");
    el.setAttribute("stacked-layout", "grid");
    el.columns = [{key:"step",label:"Step",rowHeader:true},{key:"calls",label:"Calls"},{key:"median",label:"Median",group:"Successful times"},{key:"p95",label:"95% within",group:"Successful times"}];
    el.rows = [{id:"one",cells:{step:"Upload",calls:"20",median:"48 ms",p95:"98 ms"}}];
    document.body.append(el);return el;
  };
  it("keeps the old list default and reflects the opt-in property", () => {
    const el = create("none");
    expect(el.stackedLayout).toBe("list");
    el.stackedLayout = "grid";
    expect(el.getAttribute("stacked-layout")).toBe("grid");
    el.setAttribute("stacked-layout", "invalid");
    expect(el.stackedLayout).toBe("list");
  });
  it("keeps native cells and row header while exposing one contiguous group heading", () => {
    const el = compact(),row = rowAt(el,0);
    expect([...row.children].filter(cell => cell.matches("td, th")).length).toBe(4);
    expect(row.querySelector('th[scope="row"]')?.textContent).toBe("Upload");
    expect([...row.querySelectorAll('[part="stacked-group"]')].map(e=>e.textContent)).toEqual(["Successful times"]);
    expect([...row.querySelectorAll('[part="stacked-label"]')].map(e=>e.textContent)).toEqual(["Calls","Median","95% within"]);
  });
  it("renders repeated separated groups once per adjacent segment", () => {
    const el = compact();
    el.columns = [{key:"a",label:"A",group:"Timing"},{key:"b",label:"B",group:"Timing"},{key:"c",label:"C"},{key:"d",label:"D",group:"Timing"}];
    expect([...rowAt(el,0).querySelectorAll('[part="stacked-group"]')].map(e=>e.textContent)).toEqual(["Timing","Timing"]);
    expect(rowAt(el,0).querySelectorAll('[part="stacked-label"]').length).toBe(4);
  });
  it("keeps ordinary windowing when the grid preference has no stacked request", () => {
    const el = compact();el.removeAttribute("stacked");el.virtualize=true;
    expect(el.renderedWindow).not.toBeNull();
  });
  it("escapes compact labels and groups and preserves descriptor controls", () => {
    const el = compact();el.columns=[{key:"x",label:'<img src=x onerror="bad">',group:'<svg onload="bad">'}];
    el.rows=[{id:"x",cells:{x:{kind:"link",text:"Report",href:"/report",target:"_blank"}}}];
    expect(el.shadowRoot!.querySelector("img,svg")).toBeNull();
    expect(el.shadowRoot!.querySelector('[part="stacked-label"]')?.textContent).toBe('<img src=x onerror="bad">');
    expect(el.shadowRoot!.querySelector("tbody a")?.getAttribute("rel")).toBe("noopener");
  });
  it("retains keyboard focus and selection state with ordinary compact cells", () => {
    const el = compact();el.columns = el.columns.map(column => ({...column,rowHeader:false}));el.selectionMode="multiple";
    rowAt(el,0).focus();rowAt(el,0).dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));
    expect(el.selectedIds).toEqual(["one"]);
    expect(rowAt(el,0).getAttribute("aria-selected")).toBe("true");
    expect(el.shadowRoot!.activeElement).toBe(rowAt(el,0));
    rowAt(el,0).dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));
    expect(el.selectedIds).toEqual([]);
  });
  it("suppresses fixed-height windowing only for the compact stacked request", () => {
    const el = compact();el.virtualize=true;
    expect(el.renderedWindow).toBeNull();
    el.stackedLayout="list";
    expect(el.renderedWindow).not.toBeNull();
  });
});

describe("Table host cells, actions and current row", () => {
  beforeEach(() => { Table.register(); });
  afterEach(() => { document.body.innerHTML = ""; });
  const action = (el: Table, key = "view"): HTMLButtonElement =>
    [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="row-action"]')].find(button => button.dataset.actionKey === key)!;

  it("renders escaped descriptor fallbacks in opt-in slots and preserves host nodes", () => {
    const el = create("none");
    const id = 'row"<unsafe>', key = 'name"<unsafe>';
    el.columns = [{ key, label: "Name", rowHeader: true, hostContent: true }];
    el.rows = [{ id, cells: { [key]: '<img src=x onerror="bad">' } }];
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="cell-slot"]')!;
    expect(slot.name).toBe(`cell-${id}-${key}`);
    expect(slot.textContent).toBe('<img src=x onerror="bad">');
    expect(el.shadowRoot!.querySelector("img")).toBeNull();
    const input = document.createElement("input");
    input.slot = slot.name; input.value = "Host value";
    el.append(input);
    expect(slot.assignedElements()).toEqual([input]);
    el.rows = [{ id, cells: { [key]: { kind: "link", text: "Fallback report", href: "javascript:bad()" } } }];
    const next = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="cell-slot"]')!;
    expect(next.assignedElements()).toEqual([input]);
    expect(input.value).toBe("Host value");
    expect(next.textContent).toBe("Fallback report");
    expect(next.querySelector("a")).toBeNull();
    expect(next.closest("th")?.getAttribute("scope")).toBe("row");
    el.columns = [{ key, label: "Name" }];
    expect(el.shadowRoot!.querySelector('[part="cell-slot"]')).toBeNull();
  });

  it("preserves an assigned custom control's focused inner target and external handoff", () => {
    const el = create("multiple");
    el.columns = [{ key: "name", label: "Name", hostContent: true }];
    const control = document.createElement("div"); control.slot = "cell-1-name";
    const shadow = control.attachShadow({ mode: "open" });
    const input = document.createElement("input"); shadow.append(input); el.append(control);
    input.focus();
    el.rows = [...el.rows].reverse();
    expect(document.activeElement).toBe(control);
    expect(shadow.activeElement).toBe(input);
    const outside = document.createElement("button"); document.body.append(outside); outside.focus();
    el.selectedIds = ["1"];
    expect(document.activeElement).toBe(outside);
    expect(el.querySelector('[slot="cell-1-name"]')).toBe(control);
  });

  it("keeps compact column labels beside host controls and row header semantics", () => {
    const el = create("none");
    el.setAttribute("stacked", "auto"); el.stackedLayout = "grid";
    el.columns = [{ key: "name", label: "Run", rowHeader: true, hostContent: true }, { key: "rate", label: "Test users", group: "Load", hostContent: true }];
    el.rows = [{ id: "a", cells: { name: "Run A", rate: "10" } }];
    const root = el.shadowRoot!;
    expect(root.querySelector('th[scope="row"] slot')?.getAttribute("name")).toBe("cell-a-name");
    expect(root.querySelector('td [part="stacked-label"]')?.textContent).toBe("Test users");
    expect(root.querySelector('td [part="stacked-group"]')?.textContent).toBe("Load");
    expect(root.querySelector("td")?.getAttribute("data-label")).toBe("Load — Test users");
    expect(root.querySelector("td slot")?.getAttribute("name")).toBe("cell-a-rate");
  });

  it.each(["input", "select", "button"])("leaves native %s keys and clicks independent of selection", tag => {
    const el = create("multiple");
    el.columns = [{ key: "name", label: "Name", hostContent: true }];
    const control = document.createElement(tag); control.slot = "cell-1-name";
    el.append(control);
    for (const key of [" ", "Enter", "Home", "End", "ArrowDown", "a", "Escape"]) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true, ctrlKey: key === "a" });
      control.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    control.click();
    expect(el.selectedIds).toEqual([]);
  });

  it("keeps descriptor links independent of row selection", () => {
    const el = create("multiple");
    el.rows = [{ id: "a", cells: { name: { kind: "link", text: "Report", href: "#report" } } }];
    const link = el.shadowRoot!.querySelector<HTMLAnchorElement>("a")!;
    const key = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    link.dispatchEvent(key); link.click();
    expect(key.defaultPrevented).toBe(false);
    expect(el.selectedIds).toEqual([]);
  });

  it.each(["row-action", "expander"])("keeps host buttons independent even when they expose an %s part", part => {
    const el = create("multiple");
    el.columns = [{ key: "name", label: "Name", hostContent: true }];
    el.rows = [{ id: "a", detail: "Details", cells: { name: "A" }, actions: [{ key: "view", label: "View" }] }];
    const button = document.createElement("button");
    button.slot = "cell-a-name"; button.setAttribute("part", part);
    button.dataset.rowId = "a"; button.dataset.actionKey = "view"; el.append(button);
    const listener = vi.fn(); el.addEventListener("row-action", listener);
    button.click();
    expect(listener).not.toHaveBeenCalled();
    expect(el.selectedIds).toEqual([]);
    expect(el.expandedRows).toEqual([]);
  });

  it("names actions per row, emits one typed current record and never selects", () => {
    const el = create("multiple");
    el.columns = [{ key: "name", label: "Run", rowHeader: true }];
    el.rows = [{ id: "a", cells: { name: "Run A" }, actions: [{ key: "view", label: "View" }, { key: "compare", label: "Compare", disabled: true }, { key: "report", label: "Report", ariaLabel: "Download A report" }] }];
    const listener = vi.fn(); el.addEventListener("row-action", listener);
    expect(action(el).getAttribute("aria-label")).toBe("View for Run A");
    expect(action(el, "report").getAttribute("aria-label")).toBe("Download A report");
    action(el).click(); action(el, "compare").click();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ rowId: "a", action: "view", row: el.rows[0] });
    expect(listener.mock.calls[0][0].composed).toBe(true);
    expect(el.selectedIds).toEqual([]);
  });

  it.each(["refresh", "remove", "disable", "remove-action"])("resolves action data after a host capture %s", change => {
    const el = create("multiple");
    el.rows = [{ id: "a", cells: { name: "Old" }, actions: [{ key: "view", label: "View" }] }];
    const listener = vi.fn(); el.addEventListener("row-action", listener);
    el.addEventListener("click", () => {
      el.rows = change === "remove" ? [] : [{ id: "a", cells: { name: "Current" }, actions: change === "remove-action" ? [] : [{ key: "view", label: "Current View", disabled: change === "disable" }] }];
    }, { once: true, capture: true });
    action(el).click();
    expect(listener).toHaveBeenCalledTimes(change === "refresh" ? 1 : 0);
    if (change === "refresh") expect(listener.mock.calls[0][0].detail.row.cells.name).toBe("Current");
    expect(el.selectedIds).toEqual([]);
  });

  it("retains action focus by row/action ID through reorder and respects removal and external focus", () => {
    const el = create("multiple");
    el.rows = [{ id: 'a"\\id', cells: { name: "A" }, actions: [{ key: 'view"\\key', label: "View" }] }, { id: "b", cells: { name: "B" }, actions: [{ key: "view", label: "View" }] }];
    action(el, 'view"\\key').focus();
    el.rows = el.rows.map(row => ({ ...row, cells: { name: "Current " + row.id } })).reverse();
    expect(el.shadowRoot!.activeElement).toBe(action(el, 'view"\\key'));
    expect((el.shadowRoot!.activeElement as HTMLElement).dataset.rowId).toBe('a"\\id');
    el.rows = el.rows.filter(row => row.id === "b");
    expect(el.shadowRoot!.activeElement).toBeNull();
    const outside = document.createElement("input"); document.body.append(outside); outside.focus();
    el.selectedIds = ["b"];
    expect(document.activeElement).toBe(outside);
  });

  it("escapes action markup, ignores malformed actions and accounts for grouped/detail columns", () => {
    const el = create("none");
    el.columns = [{ key: "name", label: "Name", group: "Runs", rowHeader: true }];
    el.rows = [{ id: 'a"<bad>', detail: "Details", cells: { name: "<svg>" }, actions: [{ key: 'view"<bad>', label: '<img src=x onerror="bad">', ariaLabel: 'View" onclick="bad' }, null as never] }];
    expect(el.shadowRoot!.querySelector("img,svg")).toBeNull();
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="row-action"]')!;
    expect(button.textContent).toBe('<img src=x onerror="bad">');
    expect(button.hasAttribute("onclick")).toBe(false);
    expect(button.dataset.rowId).toBe('a"<bad>');
    expect(el.shadowRoot!.querySelector('th:last-child')?.getAttribute("rowspan")).toBe("2");
    (el.shadowRoot!.querySelector('[part="expander"]') as HTMLElement).click();
    expect(el.shadowRoot!.querySelector('[part="detail-row"] td')?.getAttribute("colspan")).toBe("3");
    el.loading = true;
    expect(el.shadowRoot!.querySelector('[part="state-row"] td')?.getAttribute("colspan")).toBe("3");
  });

  it.each(["none", "multiple"])("marks the current row independently of selection (%s)", mode => {
    const el = create(mode);
    el.rows = [{ id: "a", current: true, cells: { name: "A" } }, { id: "b", cells: { name: "B" } }];
    el.selectedIds = ["b"];
    expect(rowAt(el, 0).getAttribute("aria-current")).toBe("true");
    expect(rowAt(el, 1).hasAttribute("aria-current")).toBe(false);
    expect(el.selectedIds).toEqual(["b"]);
    el.rows = el.rows.map(row => ({ ...row, current: row.id === "b" }));
    expect(rowAt(el, 0).hasAttribute("aria-current")).toBe(false);
    expect(rowAt(el, 1).getAttribute("aria-current")).toBe("true");
  });

  it.each(["host", "actions"])("declines fixed-height windowing for variable-height %s cells", kind => {
    const el = create("none"); el.virtualize = true;
    el.columns = [{ key: "name", label: "Name", hostContent: kind === "host" }];
    el.rows = Array.from({ length: 200 }, (_, i) => ({ id: String(i), cells: { name: "Row " + i }, ...(kind === "actions" && i === 199 ? { actions: [{ key: "view", label: "View" }] } : {}) }));
    expect(el.renderedWindow).toBeNull();
    expect(el.shadowRoot!.querySelectorAll('[part="row"]').length).toBe(200);
    el.columns = [{ key: "name", label: "Name" }];
    el.rows = el.rows.map(({ actions, ...row }) => row);
    expect(el.renderedWindow).not.toBeNull();
  });
});

describe("Table containing-root focus and projected ownership", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it.each(["open", "closed"] as const)("restores the assigned inner target in a %s containing shadow root", mode => {
    const outer = document.createElement("div"); document.body.append(outer);
    const scope = outer.attachShadow({ mode });
    const el = document.createElement("box-table") as Table;
    el.columns = [{ key: "name", label: "Name", hostContent: true }];
    el.rows = [{ id: "a", cells: { name: "A" } }]; scope.append(el);
    const control = document.createElement("div"); control.slot = "cell-a-name";
    const inner = control.attachShadow({ mode: "open" });
    const input = document.createElement("input"); inner.append(input); el.append(control);
    input.focus();
    const restore = vi.spyOn(input, "focus");
    // jsdom does not blur when a slot is replaced; native Firefox does. Assert
    // that restoration addresses the actual target in the containing root.
    el.rows = [{ id: "a", cells: { name: "Current A" } }];
    expect(restore).toHaveBeenCalledWith({ preventScroll: true });
    expect(scope.activeElement).toBe(control);
    expect(inner.activeElement).toBe(input);
    const sibling = document.createElement("button"); scope.append(sibling); sibling.focus();
    restore.mockClear(); el.selectedIds = ["a"];
    expect(scope.activeElement).toBe(sibling);
    expect(restore).not.toHaveBeenCalled();
    const outside = document.createElement("button"); document.body.append(outside); outside.focus();
    el.rows = [...el.rows];
    expect(document.activeElement).toBe(outside);
    expect(restore).not.toHaveBeenCalled(); restore.mockRestore();
  });

  it.each(["row-action", "expander"])("keeps projected built-ins independent of host %s part names", part => {
    const panel = document.createElement("div"); document.body.append(panel);
    panel.attachShadow({ mode: "open" }).innerHTML = '<slot name="panel-content" part="cell-slot"></slot>';
    const el = document.createElement("box-table") as Table; el.slot = "panel-content";
    el.selectionMode = "multiple";
    el.columns = [{ key: "name", label: "Name", hostContent: true }];
    el.rows = [{ id: "a", cells: { name: "A" }, detail: "Details", actions: [{ key: "view", label: "View" }] }];
    panel.append(el); const action = vi.fn(); el.addEventListener("row-action", action);
    (el.shadowRoot!.querySelector('[part="row-action"]') as HTMLButtonElement).click();
    expect(action).toHaveBeenCalledTimes(1);
    (el.shadowRoot!.querySelector('[part="expander"]') as HTMLButtonElement).click();
    expect(el.expandedRows).toEqual(["a"]);
    const hostButton = document.createElement("button"); hostButton.slot = "cell-a-name";
    hostButton.setAttribute("part", part); hostButton.dataset.rowId = "a"; hostButton.dataset.actionKey = "view";
    el.append(hostButton); hostButton.click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(el.expandedRows).toEqual(["a"]);
    expect(el.selectedIds).toEqual([]);
    // An unrelated ancestor slot's part name must not suppress row keys.
    const row = el.shadowRoot!.querySelector<HTMLElement>('[part="row"]')!;
    row.focus(); row.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, composed: true }));
    expect(el.selectedIds).toEqual(["a"]);
  });
});

describe("Table compact scan rows", () => {
  beforeEach(() => { Table.register(); });
  afterEach(() => { document.body.innerHTML = ""; });

  it("keeps field labels, explicit summary/hidden choices and row identity", () => {
    const el = create("none");
    el.stackedLayout = "compact";
    el.setAttribute("stacked", "auto");
    el.columns = [
      { key: "name", label: "Run", rowHeader: true, compact: "hidden" },
      { key: "status", label: "Status", compact: "summary", hostContent: true },
      { key: "duration", label: "Duration", group: "Timing" },
      { key: "calls", label: "Calls", compact: "hidden" },
      { key: "report", label: "Report", compact: '<img src=x>' as "summary" },
    ];
    el.rows = [{ id: "one", cells: ["Dry run", "Passed", "1 s", "142", "<img src=x>"], actions: [{ key: "view", label: "View" }] }];
    const cells = rowAt(el, 0).querySelectorAll('th, td');
    expect(el.stackedLayout).toBe("compact");
    expect(cells[0]!.getAttribute("role")).toBe("rowheader");
    expect(cells[0]!.hasAttribute("data-compact")).toBe(false);
    expect(cells[1]!.getAttribute("data-compact")).toBe("summary");
    expect(cells[1]!.querySelector('slot')!.name).toBe("cell-one-status");
    expect(cells[1]!.querySelector('[part="stacked-label"]')!.textContent).toBe("Status: ");
    expect(cells[2]!.querySelector('[part="stacked-label"]')!.textContent).toBe("Timing — Duration: ");
    expect(cells[3]!.getAttribute("data-compact")).toBe("hidden");
    expect(cells[4]!.hasAttribute("data-compact")).toBe(false);
    expect(el.shadowRoot!.querySelector("img")).toBeNull();
    expect(el.shadowRoot!.querySelector('[part="row-action"]')!.getAttribute("aria-label")).toBe("View for Dry run");
    el.virtualize = true;
    expect(el.renderedWindow).toBeNull();
  });

  it.each(["list", "grid"] as const)("ignores compact column choices in %s layout", layout => {
    const el = create("none");
    el.columns = [{ key: "name", label: "Name", compact: "hidden" }];
    el.stackedLayout = layout;
    expect(rowAt(el, 0).querySelector('[data-compact]')).toBeNull();
    expect(rowAt(el, 0).textContent).toContain("A.pdf");
  });

  it("retains action focus and current payload through repeated refreshes without selecting", () => {
    const el = create("multiple");
    el.stackedLayout = "compact";
    el.setAttribute("stacked", "always");
    el.rows = [{ id: "one", cells: { name: "Run 0" }, actions: [{ key: "view", label: "View" }] }];
    const action = () => el.shadowRoot!.querySelector<HTMLButtonElement>('[part="row-action"]')!;
    const emit = vi.fn(); el.addEventListener("row-action", emit);
    action().focus();
    for (let i = 1; i <= 5; i++) {
      el.rows = [{ ...el.rows[0]!, cells: { name: `Run ${i}` } }];
      expect(el.shadowRoot!.activeElement).toBe(action());
      expect(action().getAttribute("aria-label")).toBe(`View for Run ${i}`);
    }
    action().click();
    expect(emit.mock.calls[0]![0].detail.row.cells.name).toBe("Run 5");
    expect(el.selectedIds).toEqual([]);
    el.rows = [{ id: "one", cells: { name: "Run 5" } }, { id: "two", cells: { name: "Run 6" }, actions: [{ key: "view", label: "View" }] }];
    expect(rowAt(el, 0).querySelector('[part="actions-cell"]')!.hasAttribute("data-empty")).toBe(true);
    expect(el.shadowRoot!.activeElement).toBeNull();
  });
});


it.each(["single","multiple"] as const)("selects focused %s rows on Enter without activating nested controls",mode=>{
  const el=document.createElement("box-table") as Table;el.selectionMode=mode;el.columns=[{key:"name",label:"Name"}];el.rows=[{id:"a",cells:{name:"A"}},{id:"b",cells:{name:"B"}}];document.body.append(el);
  const selected=vi.fn();el.addEventListener("selection-changed",selected);
  const row=()=>el.shadowRoot!.querySelector<HTMLElement>('[part="row"][data-index="1"]')!;
  row().focus();const key=new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true});row().dispatchEvent(key);
  expect(key.defaultPrevented).toBe(true);expect(el.selectedIds).toEqual(["b"]);expect(selected).toHaveBeenCalledTimes(1);
  row().dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));
  expect(el.selectedIds).toEqual(mode==="multiple"?[]:["b"]);el.remove();
});
