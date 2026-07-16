import type { StoryModule } from "../metadata.js";

const governancePanel: StoryModule = {
  title: "Patterns/Governance/Governance Panel",
  meta: {
    id: "governance-panel",
    tag: "box-governance-panel",
    shortDescription: "A governance summary panel for policies and signals.",
    docsDescription: "Use string status/copy attributes with JSON `policies`, `signals`, and `actions`.",
    sourceSnippet: `<box-governance-panel heading="Governance" status="Compliant" message="Retention and classification policies applied."></box-governance-panel>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "status", type: "string", description: "Governance status label." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting governance copy." },
      { kind: "attribute", name: "policies", type: "json", description: "Policy summary rows." },
      { kind: "attribute", name: "signals", type: "json", description: "Governance signal chips." },
      { kind: "attribute", name: "actions", type: "json", description: "Panel action buttons." },
      { kind: "event", name: "policy-selected", description: "Emitted when a policy row is selected." },
      { kind: "event", name: "action", description: "Emitted when an action is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-governance-panel heading="Governance" status="Compliant" message="Retention and classification policies applied." policies='[{"label":"Retention","value":"7 years","description":"Finance default"},{"label":"Classification","value":"Internal"}]' signals='[{"label":"Legal hold","tone":"warning"}]' actions='[{"id":"audit","label":"View audit log","tone":"primary"}]'></box-governance-panel>`,
    },
  ],
};

export default governancePanel;
