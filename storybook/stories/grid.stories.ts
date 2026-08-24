import type { StoryModule } from "../metadata.js";

const grid: StoryModule = {
  title: "Components/Layout/Grid",
  meta: {
    id: "grid",
    tag: "box-grid",
    shortDescription: "Adobe Spectrum's responsive grid, for laying out content.",
    docsDescription:
      "Twelve columns by default — 12 divides by 2, 3, 4 and 6, so halves, thirds, quarters and sidebar-plus-content all land on whole columns — with gutters stepping 16 → 24 → 32 → 40 → 48px across Spectrum's breakpoints. Gutters are fixed values per breakpoint rather than a proportion of the grid; that is Spectrum's rule, and it is why the gutter cannot simply be a percentage. Children declare their own placement with `data-span`, `data-offset` and `data-row-span`, because they are arbitrary content the author already writes — an `items` payload on the host would have to address them positionally and would silently mis-place everything the moment one was inserted. Placement is applied as generated CSS rules rather than by writing inline styles onto the children, so the author's markup is left untouched; `grid-column-start` and `grid-column-end` are set by separate rules so offset and span compose without a rule for every pair. Row height is deliberately unset: a layout grid's rows should be as tall as their content, and pinning them would crop it. `box-skeleton`'s grid variant reads the same `--boe-grid-gutter` and the same column model, so a placeholder matches the layout it stands in for.",
    sourceSnippet: `<box-grid><article data-span="8">Main</article><aside data-span="4">Sidebar</aside></box-grid>`,
    referenceRows: [
      { kind: "attribute", name: "columns", type: "number", description: "Columns in the grid. Defaults to Spectrum's 12; a value below 1 or unparseable falls back." },
      { kind: "attribute", name: "row-height", type: "string", description: "Optional fixed height for every row. Unset by default, so rows fit their content." },
      { kind: "slot", name: "(default)", type: "slot", description: "The layout regions. Each child may carry `data-span`, `data-offset` and `data-row-span` (1–24)." },
      { kind: "part", name: "grid", type: "part", description: "The grid container." },
    ],
  },
  variants: [
    {
      name: "Sidebar and content",
      html: `<box-grid><article data-span="8">Main (8)</article><aside data-span="4">Sidebar (4)</aside></box-grid>`,
      note: "The canonical split. Eight and four are whole columns of twelve, so nothing lands on a fraction.",
    },
    {
      name: "Offset",
      html: `<box-grid><div data-span="6" data-offset="3">Centred (6, offset 3)</div></box-grid>`,
      note: "Spectrum's offset: three empty columns, then a six-column region. `data-offset` sets an explicit `grid-column-start` — the author's stated intent here, unlike `box-skeleton`, which generates its own regions and uses spacers so auto-placement is not disturbed.",
    },
    {
      name: "Spanning rows",
      html: `<box-grid row-height="60px"><div data-span="4" data-row-span="2">Tall (4 × 2)</div><div data-span="8">A (8)</div><div data-span="8">B (8)</div></box-grid>`,
      note: "A four-column region standing two rows tall beside two eight-column ones. With `row-height=\"60px\"` the tall region measures 144px in Chromium — two rows plus the 24px gutter between them.",
    },
    {
      name: "Even row",
      html: `<box-grid columns="4"><div>1</div><div>2</div><div>3</div><div>4</div></box-grid>`,
      note: "A child with no placement attributes takes one column, so a bare list reads as an even row.",
    },
  ],
};

export default grid;
