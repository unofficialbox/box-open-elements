import type { StoryModule } from "../metadata.js";

const richTextInput: StoryModule = {
  title: "Components/Forms/Rich Text Input",
  meta: {
    id: "rich-text-input",
    tag: "box-rich-text-input",
    shortDescription: "A form-associated rich text editor with a compact toolbar.",
    docsDescription: "Use `label`, optional `placeholder`, and sanitized HTML `value` for editable formatted content.",
    sourceSnippet: `<box-rich-text-input label="Announcement" value="&lt;p&gt;Welcome to the &lt;strong&gt;new&lt;/strong&gt; workspace.&lt;/p&gt;"></box-rich-text-input>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Field label." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Placeholder shown when empty." },
      { kind: "attribute", name: "value", type: "html", description: "Sanitized rich text HTML." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables editing and toolbar actions." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "Emitted when editor HTML changes." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-rich-text-input label="Announcement" value="&lt;p&gt;Welcome to the &lt;strong&gt;new&lt;/strong&gt; workspace.&lt;/p&gt;"></box-rich-text-input>`,
    },
  ],
};

export default richTextInput;
