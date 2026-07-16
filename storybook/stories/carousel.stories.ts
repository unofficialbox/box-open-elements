import type { StoryModule } from "../metadata.js";

const carousel: StoryModule = {
  title: "Components/Collections/Carousel",
  meta: {
    id: "carousel",
    tag: "box-carousel",
    shortDescription: "A horizontal featured-content carousel.",
    docsDescription: "Pass slides as JSON `items` (`id`/`title`/`description`).",
    sourceSnippet: `<box-carousel label="Featured" items='[{"id":"one","title":"Launch checklist","description":"Everything before go-live."}]'></box-carousel>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible carousel label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { id, title, description? }." },
      { kind: "attribute", name: "value", type: "number", description: "Selected slide index." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-carousel label="Featured" items='[{"id":"one","title":"Launch checklist","description":"Everything before go-live."},{"id":"two","title":"Brand refresh","description":"New tokens and iconography."},{"id":"three","title":"Q3 planning","description":"Roadmap and staffing."}]'></box-carousel>`,
    },
  ],
};

export default carousel;
