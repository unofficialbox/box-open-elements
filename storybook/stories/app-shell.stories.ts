import type { StoryModule } from "../metadata.js";

const appShell: StoryModule = {
  title: "Components/Layout/App Shell",
  meta: {
    id: "app-shell",
    tag: "box-app-shell",
    shortDescription: "A responsive application frame with header, nav, main, aside, and footer regions.",
    docsDescription: "Set `heading` plus landmark labels, then slot navigation, actions, contextual aside content, and footer copy.",
    sourceSnippet: `<box-app-shell heading="Box Admin" nav-label="Workspace navigation" aside-label="File context"></box-app-shell>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Shell heading and accessible label." },
      { kind: "attribute", name: "nav-label", type: "string", description: "Navigation landmark label." },
      { kind: "attribute", name: "aside-label", type: "string", description: "Aside landmark label." },
      { kind: "slot", name: "nav", description: "Primary navigation content." },
      { kind: "slot", name: "header-actions", description: "Actions rendered in the header." },
      { kind: "slot", name: "aside", description: "Contextual side panel content." },
      { kind: "slot", name: "footer", description: "Footer/status content." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-app-shell heading="Box Admin" nav-label="Workspace navigation" aside-label="File context">
  <span slot="eyebrow">Enterprise</span>
  <box-button slot="header-actions" label="Invite" tone="primary"></box-button>
  <box-nav-sidebar slot="nav" label="Workspace">
    <a href="#" aria-label="All Files">All Files</a>
    <a href="#" aria-label="Recents">Recents</a>
    <a href="#" aria-label="Trash">Trash</a>
  </box-nav-sidebar>
  <box-card eyebrow="PDF · 2.4 MB" heading="Quarterly Plan.pdf">Updated 2 hours ago by Morgan Lee</box-card>
  <box-item-details-panel slot="aside" heading="Quarterly Plan.pdf" eyebrow="PDF · 2.4 MB" owner='{"name":"Morgan Lee","description":"Enterprise Admin"}' meta='[{"label":"Modified","value":"Jul 10, 2026"}]'></box-item-details-panel>
  <span slot="footer">2.4 GB of 10 GB used</span>
</box-app-shell>`,
    },
  ],
};

export default appShell;
