import type { StoryModule } from "../metadata.js";

const card: StoryModule = {
  title: "Components/Collections/Card",
  meta: {
    id: "card",
    tag: "box-card",
    shortDescription: "A content card with eyebrow and heading.",
    docsDescription: "Surfaces a titled block; put body copy in the light DOM.",
    sourceSnippet: `<box-card eyebrow="PDF · 2.4 MB" heading="Quarterly Plan.pdf">Updated 2 hours ago.</box-card>`,
    referenceRows: [
      { kind: "attribute", name: "eyebrow", type: "string", description: "Small meta line above the heading." },
      { kind: "attribute", name: "heading", type: "string", description: "Card title." },
      { kind: "slot", name: "default", description: "Body content." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-card eyebrow="PDF · 2.4 MB" heading="Quarterly Plan.pdf">Updated 2 hours ago by Morgan Lee</box-card>`,
    },
  ],
};

export default card;
