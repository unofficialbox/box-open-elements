import type { StoryModule } from "../metadata.js";

const columns = JSON.stringify([
  { key: "name", label: "Name", sortable: true },
  { key: "owner", label: "Owner" },
  { key: "modified", label: "Modified", align: "end" },
]);

const rows = JSON.stringify([
  { id: "123", cells: { name: "Quarterly Plan.pdf", owner: "Morgan Lee", modified: "Jul 10, 2026" } },
  { id: "124", cells: { name: "Brand Guidelines.pdf", owner: "Alex Kim", modified: "Jun 2, 2026" } },
  { id: "42", cells: { name: "Marketing", owner: "Morgan Lee", modified: "May 30, 2026" } },
]);

const table: StoryModule = {
  title: "Components/Collections/Table",
  meta: {
    id: "table",
    tag: "box-table",
    shortDescription: "A semantic, selectable data table.",
    docsDescription:
      "Columns and rows from JSON. `selection-mode=\"single|multiple\"` enables row selection: click, Ctrl/Cmd-click to toggle, Shift-click for a range; Arrow/Home/End move focus, Space toggles, Shift+Arrow extends, Ctrl/Cmd+A selects all, Escape clears. Sorting is host-owned — `sortable` headers emit `sort` and you reorder `rows`.",
    sourceSnippet: `<box-table label="Files" selection-mode="multiple"></box-table>`,
    referenceRows: [
      { kind: "attribute", name: "columns", type: "TableColumn[] (JSON)", description: "{ key, label, align?, sortable? }." },
      { kind: "attribute", name: "rows", type: "TableRow[] (JSON)", description: "{ id, cells } — cells keyed by column key or positional." },
      { kind: "attribute", name: "selection-mode", type: '"none" | "single" | "multiple"', description: "Row selection behaviour." },
      { kind: "event", name: "selection-changed", type: "CustomEvent", description: "Fires with the selected row ids." },
      { kind: "event", name: "sort", type: "CustomEvent", description: "Fires when a sortable header is clicked." },
    ],
  },
  variants: [
    { name: "Selectable", html: `<box-table label="Files" selection-mode="multiple" columns='${columns}' rows='${rows}'></box-table>` },
    { name: "Read-only", html: `<box-table label="Files" columns='${columns}' rows='${rows}'></box-table>` },
  ],
};

export default table;
