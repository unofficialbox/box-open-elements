# Table headers and cell descriptors

`TableColumn.rowHeader: true` makes that column's body cells semantic
`<th scope="row">` cells. `group` adds a spanning first header row for adjacent
columns with the same nonempty group. Ungrouped columns span both header rows;
repeated group names separated by another group get separate spans. Sorting,
selection, expansion, virtual rows and stacked phone layouts retain their APIs.

```ts
table.columns = [
  { key: "step", label: "Step", rowHeader: true },
  { key: "calls", label: "Calls", group: "This run" },
  { key: "failed", label: "Failed", group: "This run" },
  { key: "previous", label: "Calls", group: "Earlier run" },
];
table.rows = [{ id: "one", cells: { step: "users.me", calls: "142",
  failed: { text: "3", tone: "error" }, previous: "130" } }];
```

Cell descriptors accept `kind: "text" | "badge" | "link"`; omitted kind means
plain text. Plain text accepts `tone` (`neutral`, `brand`, `success`, `warning`,
`error`) without badge chrome. Link descriptors additionally accept `target`,
`download` (true or filename), and `ariaLabel`. `_blank` links use `noopener`.
All text and attributes stay escaped, and the existing safe-href policy applies:
HTTP(S), rooted paths and fragments are allowed; unsafe hrefs render as text.

```ts
const report = { kind: "link" as const, text: "Report", href: "/runs/123",
  target: "_blank", ariaLabel: "Open run 123 report" };
const csv = { kind: "link" as const, text: "CSV", href: "/runs/123.csv",
  download: "run-123.csv", ariaLabel: "Download run 123 CSV" };
```

Expandable tables give the details column a screen-reader text header. Sorting
remains host-controlled: the `sort` event requests a key/direction, and the host
updates `sort-key`, `sort-direction` and rows. Those updates retain keyboard
focus on the active column’s sort button, so repeated Enter or Space can sort
again; removing that sortable column does not move focus to another column.

Badge cells keep their tone fills and use semantic status text tokens for readable
labels in light and dark themes. Brand and neutral labels use primary text.

## Compact phone rows

Opt into `stacked-layout="grid"` alongside `stacked="auto"` (under a 560px
container) or `stacked="always"`. The default `stacked-layout="list"` keeps the
existing label/value cards. `table.stackedLayout` accepts `"list" | "grid"`.

```html
<box-table label="Step calls and times" stacked="auto" stacked-layout="grid"></box-table>
```

In compact rows, a `rowHeader` column becomes the row heading without repeating
its column label. Other cells show their own sentence-case label above the value,
in three columns, or two when the container is at most 340px wide. Each adjacent
group appears once above its cells. Labels use primary body text color; native
cells, row headers, descriptor links, selection and details remain available.
Wide `stacked="auto"` tables retain their normal column headers and layout.

The `stacked-label`, `stacked-value`, `stacked-field` and `stacked-group` parts
allow styling the compact content. Host labels are rendered as supplied and
escaped; use sentence case in the column data.

`virtualize` is suppressed whenever compact stacking is requested, including
the wide state of `stacked="auto"`, because wrapped cards have variable heights
and the windowing contract is fixed-height. `renderedWindow` is then `null`.

Selectable rows retain keyboard focus by row ID across queued window measurement
and host updates while that row remains rendered. Home/End followed by Space can
therefore select the focused target after the window settles. Removing the row,
scrolling it out of the rendered window, or moving focus to a host control does
not move focus to another row or scroll it back into view.

## Host cells and row actions

Set `TableColumn.hostContent: true` for chosen cells. The table renders a named
`cell-<rowId>-<columnKey>` slot inside the native cell; its escaped descriptor
content is the fallback when the host supplies no node. Slot names use the exact
row ID and column key, so choose combinations with distinct resulting names.
Host nodes keep their identity and value through row refreshes and reordering.
The table never accepts an HTML string or render callback.

```ts
table.columns = [
  { key: "name", label: "Load stage", rowHeader: true },
  { key: "users", label: "Test users", hostContent: true },
];
table.rows = [{ id: "warmup", cells: { name: "Warm-up", users: "10" },
  actions: [{ key: "remove", label: "Remove" }] }];
const users = document.createElement("input");
users.type = "number";
users.value = "10";
users.slot = "cell-warmup-users";
users.setAttribute("aria-label", "Test users for Warm-up");
table.append(users);
```

In stacked list and grid layouts, cells retain their visible column labels and
row-header semantics. The host supplies each control's accessible name, form
association, validation and event handling. Clicks and keys in host content and
descriptor links remain native and do not select or navigate table rows.

`TableRow.actions` adds a built-in Actions column when any row has actions.
Each action has `key`, visible `label`, optional `disabled`, and optional
`ariaLabel` for a complete accessible name. The default name is
`<action label> for <row name>`, using the first row-header column (or first
column) descriptor text and falling back to the row ID. Use distinct action keys
within each row. Native buttons work in read-only and selectable tables.

```ts
table.addEventListener("row-action", event => {
  const { rowId, action, row } = event.detail;
  // The row is current authored data at activation time, including refreshed cells.
  if (action === "remove") table.rows = table.rows.filter(item => item.id !== rowId);
});
```

An action emits one bubbling, composed `row-action` with
`TableRowActionDetail { rowId, action, row }`, independently of selection.
Activation resolves the current row/action by identity; removed or disabled
actions do not emit. Focus follows an active action's row ID and action key
through updates; removed actions receive no replacement focus. External focus
handoffs remain authoritative.

`TableRow.current: true` gives the record being viewed `aria-current="true"`
and a leading brand marker. It is independent of `selectedIds`. The host owns
which row is current and should mark one current record for a single view.

Host cells and row actions suppress fixed-height virtualization, because their
controls and wrapped content can have variable heights. The `virtualize`
request stays set and `renderedWindow` returns `null`; removing those features
restores ordinary windowing. Actions, loading/error/empty states, grouped
headers and expanded detail rows all include the Actions column in their spans.

The native containing-root regression is repeatable after `bun run build:core`:
`BOE_TABLE_BROWSER=firefox node tools/preview/table-host-content.mjs`. It checks
open/closed containing roots, inner-shadow host controls, focus handoffs,
projected-table actions/expansion, and host part-name collisions. Use the pinned
Playwright container when Firefox is unavailable locally; set
`BOE_TABLE_EVIDENCE_DIR` to retain its JSON results. `BOE_TABLE_BROWSER=chrome`
(and optional `BOE_TABLE_CHROME_PATH`) runs the same Chrome compatibility cases.

For the pinned Firefox container, retain results in the ignored regression folder:

```bash
DOCKER_DEFAULT_PLATFORM=linux/amd64 bash tools/preview/container-run.sh \
  'bun run build:core && BOE_TABLE_BROWSER=firefox BOE_TABLE_EVIDENCE_DIR=/work/.regression-tmp/table-host-content node tools/preview/table-host-content.mjs'
```
