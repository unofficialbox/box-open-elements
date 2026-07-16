import type { StoryModule } from "../metadata.js";

const collaboratorAvatars: StoryModule = {
  title: "Patterns/Share/Collaborator Avatars",
  meta: {
    id: "collaborator-avatars",
    tag: "box-collaborator-avatars",
    shortDescription: "A stacked avatar pile for item collaborators.",
    docsDescription: "Use JSON `collaborators` plus `max` to render visible collaborator avatars and overflow.",
    sourceSnippet: `<box-collaborator-avatars label="Collaborators" max="4" collaborators='[{"id":"1","name":"Morgan Lee"},{"id":"2","name":"Alex Kim"}]'></box-collaborator-avatars>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible group label." },
      { kind: "attribute", name: "max", type: "number", description: "Maximum visible avatars before overflow." },
      { kind: "attribute", name: "collaborators", type: "json", description: "Array of collaborators with name, id, initials, or src." },
      { kind: "event", name: "select", description: "Emitted when a visible avatar is selected." },
      { kind: "event", name: "overflow", description: "Emitted when the overflow chip is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-collaborator-avatars label="Collaborators" max="4" collaborators='[{"id":"1","name":"Morgan Lee"},{"id":"2","name":"Alex Kim"},{"id":"3","name":"Sam Patel"},{"id":"4","name":"Jordan Rivera"},{"id":"5","name":"Robin Cho"},{"id":"6","name":"Casey Ng"}]'></box-collaborator-avatars>`,
    },
  ],
};

export default collaboratorAvatars;
