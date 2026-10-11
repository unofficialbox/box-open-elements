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
