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
      "Columns and rows from JSON. `selection-mode=\"single|multiple\"` enables row selection: click, Ctrl/Cmd-click to toggle, Shift-click for a range; Arrow/Home/End move focus, Space toggles, Shift+Arrow extends, Ctrl/Cmd+A selects all, Escape clears. **Sorting and selection are controlled**: `sortable` headers emit `sort` with `{key, direction}` and the table never reorders its own rows — you sort, set `sort-key`/`sort-direction`, and `aria-sort` follows; selection round-trips through `selectedIds` and `selection-changed`. Cells accept **descriptors** beyond plain text — `{kind: \"badge\"}` and `{kind: \"link\"}` objects the table renders itself. Deliberately never an HTML string or a render callback: cell data is server-supplied and stays escaped, and a non-http(s) href renders as plain text. Rows with `detail` get an expander and a full-width detail row (plus a `detail-<id>` slot for rich content); expanding is not selecting. `loading`, `error-text` and empty states are stated in words, and `stacked=\"always\"|\"auto\"` turns rows into labelled cards on narrow containers without losing grid semantics. For production-scale collections add `virtualize`: the table then renders only the rows near the viewport, padding the rest with spacers so the scrollbar still describes the whole collection — a 10,000-row table renders around 20 DOM rows. Indices stay absolute, so selection, shift-range, and keyboard navigation address records rather than the rendered slice, and Home/End reach the ends of the *collection*.",
    sourceSnippet: `<box-table label="Files" selection-mode="multiple"></box-table>`,
    referenceRows: [
      { kind: "attribute", name: "columns", type: "TableColumn[] (JSON)", description: "{ key, label, align?, sortable? }." },
      { kind: "attribute", name: "rows", type: "TableRow[] (JSON)", description: "{ id, cells, detail? } — cells keyed by column key or positional; detail adds an expander and a detail-<id> slot." },
      { kind: "attribute", name: "selection-mode", type: '"none" | "single" | "multiple"', description: "Row selection behaviour." },
      { kind: "event", name: "selection-changed", type: "CustomEvent", description: "Fires with the selected row ids." },
      { kind: "event", name: "sort", type: "CustomEvent", description: "Fires when a sortable header is activated (click or keyboard) — detail { key, direction }." },
      { kind: "event", name: "row-toggled", type: "CustomEvent", description: "A row's detail was expanded or collapsed — detail { rowId, expanded }." },
      { kind: "attribute", name: "loading", type: "boolean", description: "States 'Loading rows…' with a spinner and sets aria-busy." },
      { kind: "attribute", name: "error-text", type: "string", description: "Non-empty puts the body in an error state stating this text." },
      { kind: "attribute", name: "empty-text", type: "string", description: "What the body says with zero rows (default 'No rows')." },
      { kind: "attribute", name: "stacked", type: '"always" | "auto"', description: "Card layout for narrow containers; auto stacks under a 560px container query." },
      { kind: "attribute", name: "virtualize", type: "boolean", description: "Render only the rows near the viewport; the shell scrolls within --boe-table-height (default 26rem)." },
      { kind: "attribute", name: "row-height", type: "number", description: "Starting row-height estimate for windowing (default 37). The element measures a real row after first paint and uses that." },
      { kind: "property", name: "renderedWindow", type: "RowWindow | null", description: "Read-only: the rendered slice and spacer heights while virtualizing." },
      { kind: "slot", name: "detail-<id>", type: "slot", description: "Rich host content projected into that row's expanded detail." },
    ],
  },
  variants: [
    { name: "Selectable", html: `<box-table label="Files" selection-mode="multiple" columns='${columns}' rows='${rows}'></box-table>` },
    { name: "Read-only", html: `<box-table label="Files" columns='${columns}' rows='${rows}'></box-table>` },
    {
      name: "Descriptors and expandable rows",
      html: `<box-table label="Contracts" columns='[{"key":"name","label":"Name"},{"key":"status","label":"Status"}]' rows='[{"id":"1","cells":{"name":{"kind":"link","text":"MSA_Acme.pdf","href":"https://example.com/f/1"},"status":{"kind":"badge","text":"Approved","tone":"success"}},"detail":"Uploaded by Morgan Lee on Jul 10, 2026."},{"id":"2","cells":{"name":{"kind":"link","text":"SOW_Initech.pdf","href":"https://example.com/f/2"},"status":{"kind":"badge","text":"In review","tone":"warning"}}}]'></box-table>`,
      note: "Badge and link cells are descriptors the table renders itself — never HTML strings. The first row is expandable.",
    },
    { name: "Loading", html: `<box-table label="Files" columns='${columns}' rows='[]' loading></box-table>` },
    { name: "Empty", html: `<box-table label="Files" columns='${columns}' rows='[]' empty-text="No documents match your filter"></box-table>` },
  ],
};

export default table;
