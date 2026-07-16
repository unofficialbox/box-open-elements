import type { StoryModule } from "../metadata.js";

const calendar: StoryModule = {
  title: "Components/Forms/Calendar",
  meta: {
    id: "calendar",
    tag: "box-calendar",
    shortDescription: "A standalone month calendar grid.",
    docsDescription: "Pin demos with `value`, `month`, and `today` ISO dates so rendering stays deterministic.",
    sourceSnippet: "<box-calendar value=\"2026-07-18\" month=\"2026-07\" today=\"2026-07-15\"></box-calendar>",
    referenceRows: [
      { kind: "attribute", name: "value", type: "string", description: "Selected ISO date." },
      { kind: "attribute", name: "month", type: "string", description: "Displayed month (YYYY-MM)." },
      { kind: "attribute", name: "today", type: "string", description: "Pinned today for demos/tests." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Makes the calendar inert." },
    ],
  },
  variants: [
    { name: "Default", html: "<box-calendar value=\"2026-07-18\" month=\"2026-07\" today=\"2026-07-15\"></box-calendar>" },
  ],
};

export default calendar;
