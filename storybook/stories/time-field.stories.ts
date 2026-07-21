import type { StoryModule } from "../metadata.js";

const timeField: StoryModule = {
  title: "Components/Forms/Time Field",
  meta: {
    id: "time-field",
    tag: "box-time-field",
    shortDescription: "A time-of-day input.",
    docsDescription: "Use a 24-hour `value` string such as `09:30`. `setTimeString(str)` parses human 12h/24h input (`\"1:30 PM\"`, `\"9 am\"`, `\"13:45\"`) to canonical HH:MM, emitting `parse-error` when it can't (the static `parseTime` exposes the same logic).",
    sourceSnippet: `<box-time-field label="Launch time" value="09:30"></box-time-field>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "value", type: "string", description: "Time value (HH:MM)." },
      { kind: "property", name: "setTimeString(str)", type: "method", description: "Parse a 12h/24h string into the value; returns false + emits parse-error on failure." },
      { kind: "event", name: "parse-error", type: "CustomEvent", description: "Emitted when setTimeString cannot parse the input." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-time-field label="Launch time" value="09:30"></box-time-field>` },
  ],
};

export default timeField;
