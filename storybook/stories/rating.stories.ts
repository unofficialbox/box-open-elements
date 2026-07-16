import type { StoryModule } from "../metadata.js";

const rating: StoryModule = {
  title: "Components/Forms/Rating",
  meta: {
    id: "rating",
    tag: "box-rating",
    shortDescription: "A star-style rating control.",
    docsDescription: "Form-associated rating with `value` out of `max` and an accessible `label`.",
    sourceSnippet: `<box-rating label="Quality" value="4" max="5"></box-rating>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "number", description: "Current rating." },
      { kind: "attribute", name: "max", type: "number", description: "Maximum stars." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the control inert." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-rating label="Quality" value="4" max="5"></box-rating>` },
    { name: "Empty", html: `<box-rating label="Quality" value="0" max="5"></box-rating>` },
  ],
};

export default rating;
