import type { StoryModule } from "../metadata.js";

const relativeTime: StoryModule = {
  title: "Components/Output/Relative Time",
  meta: {
    id: "relative-time",
    tag: "box-relative-time",
    shortDescription: "How long ago something happened.",
    docsDescription:
      "Renders into `<time datetime=\"…\">` carrying the exact instant, because \"4 days ago\" is an approximation and the precise value is what a reader reaches for when the approximation is not enough — the same trade `box-due-badge` makes. `reference-time` pins what \"now\" means, for the same reason that component has one: output that depends on the wall clock cannot be tested or screenshotted deterministically, and a host rendering a list wants every row measured against one instant rather than each against the moment it happened to render. The unit is the largest that yields a whole number, and it truncates rather than rounds — 47 hours is \"1 day ago\", never \"2 days ago\", because a label should not claim a boundary the instant has not crossed. An unparseable `reference-time` falls back to the current time rather than hiding the element: the instant being described is still valid, and a broken reference must not erase it.",
    sourceSnippet: `<box-relative-time value="2026-08-21T12:00:00Z"></box-relative-time>`,
    referenceRows: [
      { kind: "attribute", name: "value", type: "string", description: "The instant being described, as ISO 8601 or epoch milliseconds." },
      { kind: "attribute", name: "reference-time", type: "string", description: "What \"now\" means. Absent uses the current time." },
      { kind: "attribute", name: "numeric", type: "string", description: "`auto` (default) allows \"yesterday\" where the language has a word for it; `always` forces \"1 day ago\"." },
      { kind: "attribute", name: "locale", type: "string", description: "BCP 47 tag. Absent uses the host's locale." },
      { kind: "part", name: "value", type: "part", description: "The `<time>` element." },
    ],
  },
  variants: [
    { name: "Days ago", html: `<box-relative-time value="2026-08-21T12:00:00Z" reference-time="2026-08-25T12:00:00Z" locale="en"></box-relative-time>` },
    { name: "Idiomatic", html: `<box-relative-time value="2026-08-24T12:00:00Z" reference-time="2026-08-25T12:00:00Z" locale="en"></box-relative-time>`, note: "`auto` lets Intl say \"yesterday\" rather than \"1 day ago\"." },
    { name: "Always numeric", html: `<box-relative-time value="2026-08-24T12:00:00Z" reference-time="2026-08-25T12:00:00Z" numeric="always" locale="en"></box-relative-time>`, note: "The same instant, forced into a count — useful when rows must read uniformly." },
    { name: "Ahead", html: `<box-relative-time value="2026-09-02T12:00:00Z" reference-time="2026-08-25T12:00:00Z" locale="en"></box-relative-time>`, note: "The future works too; the sign follows `Intl.RelativeTimeFormat`." },
  ],
};

export default relativeTime;
