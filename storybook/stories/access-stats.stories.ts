import type { StoryModule } from "../metadata.js";

const accessStats: StoryModule = {
  title: "Patterns/Share/Access Stats",
  meta: {
    id: "access-stats",
    tag: "box-access-stats",
    shortDescription: "A compact summary of shared-link activity.",
    docsDescription: "Pass JSON `stats` to show view, download, and comment counts with accessible full values.",
    sourceSnippet: `<box-access-stats label="Shared link activity" stats='[{"label":"Views","value":1280},{"label":"Downloads","value":96},{"label":"Comments","value":7}]'></box-access-stats>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Stats group label." },
      { kind: "attribute", name: "stats", type: "json", description: "Array of { label, value, icon? } stat tiles." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-access-stats label="Shared link activity" stats='[{"label":"Views","value":1280},{"label":"Downloads","value":96},{"label":"Comments","value":7}]'></box-access-stats>`,
    },
  ],
};

export default accessStats;
