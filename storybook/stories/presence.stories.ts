import type { StoryModule } from "../metadata.js";

const presence: StoryModule = {
  title: "Patterns/Share/Presence",
  meta: {
    id: "presence",
    tag: "box-presence",
    shortDescription: "A live-presence avatar pile for people on an item.",
    docsDescription: "Set `label` and `max` as attributes; live roster data is supplied through the `users` or `transport` properties.",
    sourceSnippet: `<box-presence label="Who's here" max="4"></box-presence>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Presence group label." },
      { kind: "attribute", name: "max", type: "number", description: "Maximum visible avatars before overflow." },
      { kind: "property", name: "users", type: "PresenceUser[]", description: "Static roster for non-transport use." },
      { kind: "property", name: "transport", type: "PresenceTransport", description: "Realtime presence feed." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-presence label="Who's here" max="4"></box-presence>`,
      note: "Presence rosters are properties, so serialized HTML can only show the labelled empty state.",
    },
  ],
};

export default presence;
