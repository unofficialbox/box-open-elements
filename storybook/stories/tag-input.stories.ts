import type { StoryModule } from "../metadata.js";

const tagInput: StoryModule = {
  title: "Components/Forms/Tag Input",
  meta: {
    id: "tag-input",
    tag: "box-tag-input",
    shortDescription: "A token field for labels and tags.",
    docsDescription: "Provide committed tags via the comma-separated `value` attribute.",
    sourceSnippet: `<box-tag-input label="Labels" placeholder="Add a label" value="marketing, q3, launch"></box-tag-input>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Empty-field hint." },
      { kind: "attribute", name: "value", type: "string", description: "Comma-separated tag list." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-tag-input label="Labels" placeholder="Add a label" value="marketing, q3, launch"></box-tag-input>` },
  ],
};

export default tagInput;
