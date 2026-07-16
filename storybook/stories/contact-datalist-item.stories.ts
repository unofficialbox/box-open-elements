import type { StoryModule } from "../metadata.js";

const contactDatalistItem: StoryModule = {
  title: "Components/Identity/Contact Datalist Item",
  meta: {
    id: "contact-datalist-item",
    tag: "box-contact-datalist-item",
    shortDescription: "A people-picker row with name and email.",
    docsDescription: "Show a contact candidate with optional selected state.",
    sourceSnippet: `<box-contact-datalist-item name="Morgan Lee" email="morgan@box.com" value="morgan"></box-contact-datalist-item>`,
    referenceRows: [
      { kind: "attribute", name: "name", type: "string", description: "Contact display name." },
      { kind: "attribute", name: "email", type: "string", description: "Contact email." },
      { kind: "attribute", name: "value", type: "string", description: "Row value." },
      { kind: "attribute", name: "selected", type: "boolean", description: "Marks the row selected." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-contact-datalist-item name="Alex Kim" email="alex@box.com" value="alex"></box-contact-datalist-item>` },
    { name: "Selected", html: `<box-contact-datalist-item name="Morgan Lee" email="morgan@box.com" value="morgan" selected></box-contact-datalist-item>` },
  ],
};

export default contactDatalistItem;
