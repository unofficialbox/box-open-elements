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
