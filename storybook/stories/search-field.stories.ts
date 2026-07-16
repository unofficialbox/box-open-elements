import type { StoryModule } from "../metadata.js";

const searchField: StoryModule = {
  title: "Components/Forms/Search Field",
  meta: {
    id: "search-field",
    tag: "box-search-field",
    shortDescription: "A labelled search input with clear affordance.",
    docsDescription:
      "Form-associated search field for queries. Use `label` for the accessible name; clear resets the value.",
    sourceSnippet: `<box-search-field label="Search files" placeholder="Type to search"></box-search-field>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible field label." },
      { kind: "attribute", name: "value", type: "string", description: "Current query." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Hint shown when empty." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the field inert." },
      { kind: "event", name: "input", description: "Fired as the query changes." },
      { kind: "event", name: "change", description: "Fired when the query is committed." },
    ],
  },
  variants: [
    { name: "Empty", html: `<box-search-field label="Search files" placeholder="Type to search"></box-search-field>` },
    { name: "Filled", html: `<box-search-field label="Search files" value="contracts"></box-search-field>` },
  ],
};

export default searchField;
