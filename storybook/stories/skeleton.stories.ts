import type { StoryModule } from "../metadata.js";

const skeleton: StoryModule = {
  title: "Components/Feedback/Skeleton",
  meta: {
    id: "skeleton",
    tag: "box-skeleton",
    shortDescription: "A placeholder block for loading layouts.",
    docsDescription: "Reserves space with `width` and `height` while content loads.",
    sourceSnippet: `<box-skeleton width="320px" height="18px"></box-skeleton>`,
    referenceRows: [
      { kind: "attribute", name: "width", type: "string", description: "CSS width for the placeholder." },
      { kind: "attribute", name: "height", type: "string", description: "CSS height for the placeholder." },
    ],
  },
  variants: [
    { name: "Line", html: `<box-skeleton width="320px" height="18px"></box-skeleton>` },
    { name: "Block", html: `<box-skeleton width="240px" height="120px"></box-skeleton>` },
  ],
};

export default skeleton;
