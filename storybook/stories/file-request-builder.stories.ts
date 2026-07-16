import type { StoryModule } from "../metadata.js";

const fileRequestBuilder: StoryModule = {
  title: "Patterns/File Request/File Request Builder",
  meta: {
    id: "file-request-builder",
    tag: "box-file-request-builder",
    shortDescription: "A builder for collecting files from external parties.",
    docsDescription: "Pass request `fields` and `settings` as JSON arrays.",
    sourceSnippet: `<box-file-request-builder heading="Collect vendor W-9s" message="Request tax forms from onboarding vendors." fields='[{"id":"company","label":"Company name","required":true}]'></box-file-request-builder>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Builder title." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "fields", type: "json", description: "Request field definitions." },
      { kind: "attribute", name: "settings", type: "json", description: "Request settings rows." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-file-request-builder heading="Collect vendor W-9s" message="Request tax forms from onboarding vendors." fields='[{"id":"company","label":"Company name","required":true},{"id":"w9","label":"W-9 upload","description":"PDF only","required":true}]' settings='[{"id":"due","label":"Due date","description":"Jul 31, 2026"},{"id":"notify","label":"Email notifications","description":"On upload"}]'></box-file-request-builder>`,
    },
  ],
};

export default fileRequestBuilder;
