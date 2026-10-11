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
