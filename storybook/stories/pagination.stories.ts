import type { StoryModule } from "../metadata.js";

const pagination: StoryModule = {
  title: "Components/Collections/Pagination",
  meta: {
    id: "pagination",
    tag: "box-pagination",
    shortDescription: "Previous/next paging with a summary.",
    docsDescription: "Drive paging with `page`, `page-size`, and `total-items`.",
    sourceSnippet: `<box-pagination page="2" page-size="25" total-items="220"></box-pagination>`,
    referenceRows: [
      { kind: "attribute", name: "page", type: "number", description: "Current 1-based page." },
      { kind: "attribute", name: "page-size", type: "number", description: "Items per page." },
      { kind: "attribute", name: "total-items", type: "number", description: "Total item count." },
    ],
  },
  variants: [
    { name: "Middle", html: `<box-pagination page="2" page-size="25" total-items="220"></box-pagination>` },
    { name: "First", html: `<box-pagination page="1" page-size="25" total-items="220"></box-pagination>` },
  ],
};

export default pagination;
