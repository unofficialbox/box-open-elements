import type { StoryModule } from "../metadata.js";

const shortPath = JSON.stringify([
  { label: "All Files", value: "0" },
  { label: "Marketing", value: "42" },
  { label: "Quarterly Plan.pdf", value: "123" },
]);

const longPath = JSON.stringify([
  { label: "All Files", value: "0" },
  { label: "Marketing", value: "42" },
  { label: "Brand", value: "77" },
  { label: "2026", value: "88" },
  { label: "Quarterly Plan.pdf", value: "123" },
]);

const breadcrumb: StoryModule = {
  title: "Components/Navigation/Breadcrumb",
  meta: {
    id: "breadcrumb",
    tag: "box-breadcrumb",
    shortDescription: "A file-path trail with overflow collapse.",
    docsDescription:
      "A breadcrumb trail of folder crumbs. When the path is longer than `max-items` the middle crumbs collapse into an ellipsis (first crumb + last two are always shown). Clicking a crumb emits `navigate` with its value; the last crumb is `aria-current=\"page\"`.",
    sourceSnippet: `<box-breadcrumb label="File path"></box-breadcrumb>`,
    referenceRows: [
      { kind: "attribute", name: "items", type: "BreadcrumbItem[] (JSON)", description: "The path: { label, href?, value? } crumbs." },
      { kind: "attribute", name: "max-items", type: "number", description: "Crumbs shown before the middle collapses (default 4)." },
      { kind: "attribute", name: "label", type: "string", description: "Accessible name for the nav landmark." },
      { kind: "event", name: "navigate", type: "CustomEvent", description: "Fires when a non-current crumb is chosen." },
    ],
  },
  variants: [
    { name: "Short path", html: `<box-breadcrumb label="File path" items='${shortPath}'></box-breadcrumb>` },
    { name: "Collapsed (overflow)", html: `<box-breadcrumb label="File path" items='${longPath}'></box-breadcrumb>` },
  ],
};

export default breadcrumb;
