import type { StoryModule } from "../metadata.js";

const permissionMatrix: StoryModule = {
  title: "Patterns/Share/Permission Matrix",
  meta: {
    id: "permission-matrix",
    tag: "box-permission-matrix",
    shortDescription: "A permission selector matrix for people and groups.",
    docsDescription: "Render subjects with selectable role options using JSON `options`, `subjects`, and `value` attributes.",
    sourceSnippet: `<box-permission-matrix label="Permissions" options='[{"label":"Viewer","value":"viewer"},{"label":"Editor","value":"editor"}]' subjects='[{"id":"1","name":"Morgan Lee","description":"Content Designer","type":"User"}]' value='{"1":"editor"}'></box-permission-matrix>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Matrix label." },
      { kind: "attribute", name: "options", type: "json", description: "Available role options." },
      { kind: "attribute", name: "subjects", type: "json", description: "People or groups shown as rows." },
      { kind: "attribute", name: "value", type: "json", description: "Subject id to selected role value map." },
      { kind: "event", name: "value-changed", description: "Emitted when the role map changes." },
      { kind: "event", name: "subject-role-changed", description: "Emitted with the changed subject and role value." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-permission-matrix label="Permissions" options='[{"label":"Viewer","value":"viewer"},{"label":"Editor","value":"editor"}]' subjects='[{"id":"1","name":"Morgan Lee","description":"Content Designer","type":"User"},{"id":"2","name":"Alex Kim","description":"Procurement","type":"User"},{"id":"3","name":"Finance Team","type":"Group"}]' value='{"1":"editor","2":"viewer","3":"viewer"}'></box-permission-matrix>`,
    },
  ],
};

export default permissionMatrix;
