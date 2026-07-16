import type { StoryModule } from "../metadata.js";

const timeField: StoryModule = {
  title: "Components/Forms/Time Field",
  meta: {
    id: "time-field",
    tag: "box-time-field",
    shortDescription: "A time-of-day input.",
    docsDescription: "Use a 24-hour `value` string such as `09:30`.",
    sourceSnippet: `<box-time-field label="Launch time" value="09:30"></box-time-field>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "value", type: "string", description: "Time value (HH:MM)." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-time-field label="Launch time" value="09:30"></box-time-field>` },
  ],
};

export default timeField;
