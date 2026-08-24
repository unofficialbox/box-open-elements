import type { StoryModule } from "../metadata.js";

const skeleton: StoryModule = {
  title: "Components/Feedback/Skeleton",
  meta: {
    id: "skeleton",
    tag: "box-skeleton",
    shortDescription: "A placeholder block for loading layouts.",
    docsDescription:
      "Reserves space while content loads. `box` (the default) is a single rectangle sized by `width` and `height`. `line` is a stack of `lines` text bars, the last one stopping short so it reads as a paragraph rather than a table. `grid` is a column layout after Adobe Spectrum's responsive grid: twelve columns by default, gutters that step 16 → 24 → 32 → 40 → 48px across Spectrum's breakpoints, and regions that span columns and rows. Every region is clamped to the `columns` and `rows` declared — a `span` of 9 in a three-column grid renders as 3 — so a bad number from the host makes the placeholder slightly wrong rather than blowing the layout out. Offsets render as hidden spacers rather than an explicit `grid-column-start`, which would make the region hunt for a row with that exact column free and reorder the list the author wrote. The gutter is exposed as `--boe-grid-gutter` — the same property `box-grid` reads — so overriding it once keeps a placeholder matching the layout it stands in for.",
    sourceSnippet: `<box-skeleton width="320px" height="18px"></box-skeleton>`,
    referenceRows: [
      { kind: "attribute", name: "variant", type: "'box' | 'line' | 'grid'", description: "Shape of the placeholder. Defaults to `box`; an unknown value falls back to it." },
      { kind: "attribute", name: "width", type: "string", description: "CSS width for the `box` variant." },
      { kind: "attribute", name: "height", type: "string", description: "CSS height for the `box` variant, and for each bar of the `line` variant." },
      { kind: "attribute", name: "lines", type: "number", description: "Bars drawn by the `line` variant. Defaults to 3; values below 1 draw one." },
      { kind: "attribute", name: "columns", type: "number", description: "Columns in the `grid` variant. Defaults to Spectrum's 12." },
      { kind: "attribute", name: "rows", type: "number", description: "Rows in the `grid` variant, and the ceiling for any region's `rowSpan`. Defaults to 1." },
      { kind: "attribute", name: "row-height", type: "string", description: "Height of one grid row. A region spanning two is twice this plus a gutter. Defaults to 48px." },
      { kind: "attribute", name: "items", type: "json", description: "Grid regions: `span`, `rowSpan` and `offset`, each clamped to the declared totals. With none given the grid is filled with rows × columns single cells." },
      { kind: "property", name: "resolvedItems", type: "ResolvedSkeletonGridItem[]", description: "Read-only: the regions as rendered, after clamping." },
    ],
  },
  variants: [
    { name: "Box", html: `<box-skeleton width="240px" height="120px"></box-skeleton>`, note: "The default: one rectangle, sized directly." },
    {
      name: "Lines",
      html: `<box-skeleton variant="line" lines="4"></box-skeleton>`,
      note: "Four text bars. The last stops at 62% so the stack reads as a paragraph. Bars are added and removed in place when `lines` changes, rather than rebuilt, so the shimmer does not restart.",
    },
    {
      name: "Grid",
      html: `<box-skeleton variant="grid" columns="3" rows="3" items='[{"span":3},{"span":1,"rowSpan":2},{"span":2}]'></box-skeleton>`,
      note: "Three columns: a full-width band, then a single column standing two rows tall beside a two-column region. The tall region is 2 rows plus the gutter between them, and cannot exceed the three rows declared.",
    },
    {
      name: "Grid with an offset",
      html: `<box-skeleton variant="grid" columns="4" items='[{"span":2,"offset":2}]'></box-skeleton>`,
      note: "Spectrum's offset: two empty columns, then a two-column region. The offset is a hidden spacer, so it composes with auto-placement instead of fighting it.",
    },
    {
      name: "Uniform grid",
      html: `<box-skeleton variant="grid" columns="3" rows="2"></box-skeleton>`,
      note: "With no `items`, `rows` and `columns` alone describe a uniform grid — here six single cells.",
    },
  ],
};

export default skeleton;
