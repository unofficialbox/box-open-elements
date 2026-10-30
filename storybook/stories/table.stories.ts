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
      "Columns and rows accept JSON attributes or JavaScript properties. `selection-mode=\"single|multiple\"` enables row selection: click, Ctrl/Cmd-click to toggle, Shift-click for a range; Arrow/Home/End move focus, Enter/Space select (and toggle in multiple mode), Shift+Arrow extends, Ctrl/Cmd+A selects all, Escape clears. Sorting and selection are controlled: sortable headers emit `sort` with `{key, direction}`; the host reorders rows and sets `sort-key`/`sort-direction`. Selection round-trips through `selectedIds` and `selection-changed`.\n\nCells accept plain text, badge and link descriptors; text stays escaped and non-http(s) links render as text. Descriptor links are underlined by default. `hostContent: true` projects host-owned nodes into `cell-<rowId>-<columnKey>` slots; the host supplies accessible names and link cues. Rows with `detail` get an expander and a `detail-<id>` slot. `rows.actions` adds native buttons that emit `row-action` with `{rowId, action, row}` independently of selection. `rows.current: true` marks the viewed record with `aria-current` and a leading marker.\n\n`stacked=\"always\"` always stacks; `stacked=\"auto\"` stacks below a 560px container width. The default list keeps each label beside its value. `stacked-layout=\"grid\"` uses label-over-value comparison cards with adjacent group headings. `stacked-layout=\"compact\"` uses scan rows for run lists with wrapping actions: `columns.compact=\"summary\"` hides only the repeated visible label; `\"hidden\"` omits a consumer-chosen field and its slot at stacked widths. No field is hidden by default. Row headers stay visible, and desktop/list/grid show every column. Only hide secondary fields available through a detail action; avoid hiding a focused control.\n\n`loading`, `error-text` and empty states are stated in words. `virtualize` renders viewport rows with spacers; indices remain absolute and Home/End reach collection ends. Fixed-height windowing is suppressed when rows declare detail/actions, columns use hostContent, or stacked grid/compact layouts are requested. The request stays set, and `renderedWindow` is `null` whenever rendering did not window.",
    sourceSnippet: `<box-table label="Files" selection-mode="multiple"></box-table>`,
    referenceRows: [
      { kind: "attribute", name: "stacked-layout", type: '"list" | "grid" | "compact"', description: "Default list cards; grid opts into compact two/three-column label-over-value phone rows with a row heading and one heading per adjacent group. compact opts into scan rows with unlabeled summaries, explicit hidden columns and wrapping actions. Requires stacked." },
      { kind: "property", name: "stackedLayout", type: '"list" | "grid" | "compact"', description: "Reflects stacked-layout; defaults to list." },
      { kind: "attribute", name: "columns", type: "TableColumn[] (JSON)", description: "{ key, label, align?, sortable?, rowHeader?, group?, hostContent?, compact?: \"summary\" | \"hidden\" }. Adjacent group labels span columns; rowHeader marks body cells. hostContent projects cell-<rowId>-<columnKey> slots. In stacked compact mode, summary hides the visible label only; hidden omits the field and its slot. Nothing is hidden by default; rowHeader remains visible, and desktop/list/grid show every column." },
      { kind: "attribute", name: "rows", type: "TableRow[] (JSON)", description: "{ id, cells, detail?, current?, actions? } — cells keyed by column key or positional; detail adds an expander and a detail-<id> slot. current marks the viewed record with aria-current independently of selection. actions: { key, label, disabled?, ariaLabel? }[] adds native row buttons." },
      { kind: "attribute", name: "selection-mode", type: '"none" | "single" | "multiple"', description: "Row selection behaviour." },
      { kind: "event", name: "selection-changed", type: "CustomEvent", description: "Fires with the selected row ids." },
      { kind: "event", name: "sort", type: "CustomEvent", description: "Fires when a sortable header is activated (click or keyboard) — detail { key, direction }." },
      { kind: "event", name: "row-toggled", type: "CustomEvent", description: "A row's detail was expanded or collapsed — detail { rowId, expanded }." },
      { kind: "attribute", name: "loading", type: "boolean", description: "States 'Loading rows…' with a spinner and sets aria-busy." },
      { kind: "attribute", name: "error-text", type: "string", description: "Non-empty puts the body in an error state stating this text." },
      { kind: "attribute", name: "empty-text", type: "string", description: "What the body says with zero rows (default 'No rows')." },
      { kind: "attribute", name: "stacked", type: '"always" | "auto"', description: "Card layout for narrow containers; auto stacks under a 560px container query." },
      { kind: "attribute", name: "virtualize", type: "boolean", description: "Render only the rows near the viewport; the shell scrolls within --boe-table-height (default 26rem). Ignored when any row declares detail/actions, any column uses hostContent, or stacked grid/compact layout is requested — fixed-height windowing cannot describe variable-height rows." },
      { kind: "attribute", name: "row-height", type: "number", description: "Starting row-height estimate for windowing (default 37). The element measures a real row after first paint and uses that." },
      { kind: "property", name: "renderedWindow", type: "RowWindow | null", description: "Read-only: the rendered slice and spacer heights, or null when the render was not windowed." },
      { kind: "event", name: "row-action", type: "CustomEvent<TableRowActionDetail>", description: "Detail { rowId, action, row } resolves current authored data on activation; independent of selection." },
      { kind: "slot", name: "cell-<rowId>-<columnKey>", type: "slot", description: "Host-owned content for hostContent columns. Preserves node identity and focus through refreshes; host supplies accessible names and styling." },
      { kind: "slot", name: "detail-<id>", type: "slot", description: "Rich host content projected into that row's expanded detail." },
    ],
  },
  variants: [
    { name: "Compact phone comparison", html: `<box-table label="Successful call times" stacked="always" stacked-layout="grid" columns='[{"key":"step","label":"Step","rowHeader":true},{"key":"calls","label":"Calls"},{"key":"median","label":"Median","group":"Successful times"},{"key":"p95","label":"95% within","group":"Successful times"}]' rows='[{"id":"one","cells":{"step":"users.me","calls":"142","median":"48 ms","p95":"98 ms"}}]'></box-table>` },
    { name: "Grouped run comparison", html: `<box-table label="Run comparison" stacked="auto" columns='[{"key":"step","label":"Step","rowHeader":true},{"key":"calls","label":"Calls","group":"This run"},{"key":"failed","label":"Failed","group":"This run"},{"key":"previous","label":"Calls","group":"Earlier run"},{"key":"report","label":"Report"}]' rows='[{"id":"one","cells":{"step":"users.me","calls":"142","failed":{"text":"3","tone":"error"},"previous":"130","report":{"kind":"link","text":"Report","href":"https://box.com","target":"_blank","ariaLabel":"Open users.me report"}}}]'></box-table>` },
    { name: "Selectable", html: `<box-table label="Files" selection-mode="multiple" columns='${columns}' rows='${rows}'></box-table>` },
    { name: "Read-only", html: `<box-table label="Files" columns='${columns}' rows='${rows}'></box-table>` },
    {
      name: "Descriptors and expandable rows",
      html: `<box-table label="Contracts" columns='[{"key":"name","label":"Name"},{"key":"status","label":"Status"}]' rows='[{"id":"1","cells":{"name":{"kind":"link","text":"MSA_Acme.pdf","href":"https://example.com/f/1"},"status":{"kind":"badge","text":"Approved","tone":"success"}},"detail":"Uploaded by Morgan Lee on Jul 10, 2026."},{"id":"2","cells":{"name":{"kind":"link","text":"SOW_Initech.pdf","href":"https://example.com/f/2"},"status":{"kind":"badge","text":"In review","tone":"warning"}}}]'></box-table>`,
      note: "Badge and link cells are descriptors the table renders itself — never HTML strings. The first row is expandable.",
    },
    { name: "Loading", html: `<box-table label="Files" columns='${columns}' rows='[]' loading></box-table>` },
    { name: "Empty", html: `<box-table label="Files" columns='${columns}' rows='[]' empty-text="No documents match your filter"></box-table>` },
    {
      name: "Compact run list with actions",
      html: `<box-table label="Recent runs" stacked="auto" stacked-layout="compact" columns='[{"key":"run","label":"Run","rowHeader":true},{"key":"status","label":"Status","compact":"summary"},{"key":"duration","label":"Duration"},{"key":"calls","label":"Calls","compact":"hidden"},{"key":"report","label":"Report","compact":"hidden"}]' rows='[{"id":"run-123","current":true,"cells":{"run":"Oct 12, 11:45 AM · dry run","status":{"text":"✓ Passed","tone":"success"},"duration":"1.2 s","calls":"142","report":"Ready"},"actions":[{"key":"view","label":"View"},{"key":"compare","label":"Compare Report"}]},{"id":"run-124","cells":{"run":"Oct 12, 11:40 AM · full validation with a very long scenario name","status":{"text":"Failed · retry required","tone":"error"},"duration":"45.8 s","calls":"980","report":"Pending"},"actions":[{"key":"view","label":"View"}]},{"id":"run-125","cells":{"run":"Oct 12, 11:35 AM · dry run","status":"Queued","duration":"—","calls":"0","report":"Pending"}}]'></box-table>`,
      note: "At phone widths the header and Status summary lose repeated visible labels. Duration stays labeled; Calls and Report are explicitly omitted. Desktop shows all five columns. Actions retain row-specific accessible names.",
    },
  ],
};

export default table;
