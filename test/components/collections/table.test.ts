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
