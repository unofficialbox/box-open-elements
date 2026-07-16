import type { StoryModule } from "../metadata.js";

const avatar: StoryModule = {
  title: "Components/Identity/Avatar",
  meta: {
    id: "avatar",
    tag: "box-avatar",
    shortDescription: "A compact person or entity mark.",
    docsDescription: "Shows initials from `name` (or explicit `initials`), optional `src` image, and size/tone variants.",
    sourceSnippet: `<box-avatar name="Morgan Lee"></box-avatar>`,
    referenceRows: [
      { kind: "attribute", name: "name", type: "string", description: "Display name used for initials/alt." },
      { kind: "attribute", name: "initials", type: "string", description: "Override initials." },
      { kind: "attribute", name: "src", type: "string", description: "Optional image URL." },
      { kind: "attribute", name: "size", type: "string", description: "Visual size." },
      { kind: "attribute", name: "tone", type: "string", description: "Background emphasis." },
    ],
  },
  variants: [
    { name: "Named", html: `<box-avatar name="Morgan Lee"></box-avatar>` },
    { name: "Initials", html: `<box-avatar initials="JD" name="Jordan Diaz"></box-avatar>` },
  ],
};

export default avatar;
