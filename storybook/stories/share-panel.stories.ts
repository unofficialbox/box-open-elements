import type { StoryModule } from "../metadata.js";

const sharePanel: StoryModule = {
  title: "Patterns/Share/Share Panel",
  meta: {
    id: "share-panel",
    tag: "box-share-panel",
    shortDescription: "A share summary with link, collaborators, and settings.",
    docsDescription: "Compose heading/message with JSON `shared-link`, `collaborators`, `settings`, and `actions`.",
    sourceSnippet: `<box-share-panel heading="Share Quarterly Plan.pdf" message="Anyone in the company with the link can view." shared-link='{"url":"https://box.com/s/example","access":"company","label":"Company link","status":"Active"}'></box-share-panel>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel title." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting share copy." },
      { kind: "attribute", name: "shared-link", type: "json", description: "Shared link summary object." },
      { kind: "attribute", name: "collaborators", type: "json", description: "Collaborator rows." },
      { kind: "attribute", name: "settings", type: "json", description: "Setting rows." },
      { kind: "attribute", name: "actions", type: "json", description: "Action buttons." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-share-panel heading="Share Quarterly Plan.pdf" message="Anyone in the company with the link can view." shared-link='{"url":"https://box.com/s/example","access":"company","label":"Company link","status":"Active"}' collaborators='[{"name":"Morgan Lee","role":"Editor"},{"name":"Alex Kim","role":"Viewer"}]' settings='[{"label":"Downloads","value":"Allowed"},{"label":"Expiration","value":"Jun 1, 2026"}]' actions='[{"id":"copy","label":"Copy link"}]'></box-share-panel>`,
    },
  ],
};

export default sharePanel;
