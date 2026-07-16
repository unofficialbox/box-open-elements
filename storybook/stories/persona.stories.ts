import type { StoryModule } from "../metadata.js";

const persona: StoryModule = {
  title: "Components/Identity/Persona",
  meta: {
    id: "persona",
    tag: "box-persona",
    shortDescription: "An avatar with name and supporting copy.",
    docsDescription: "Identity row for a person: `name` plus optional `description` / `subtitle` and avatar fields.",
    sourceSnippet: `<box-persona name="Morgan Lee" description="Enterprise Admin"></box-persona>`,
    referenceRows: [
      { kind: "attribute", name: "name", type: "string", description: "Primary display name." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting role or detail." },
      { kind: "attribute", name: "subtitle", type: "string", description: "Secondary line when needed." },
      { kind: "attribute", name: "status", type: "string", description: "Optional presence/status cue." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-persona name="Morgan Lee" description="Enterprise Admin"></box-persona>` },
    { name: "Subtitle", html: `<box-persona name="Alex Kim" description="Editor" subtitle="Legal"></box-persona>` },
  ],
};

export default persona;
