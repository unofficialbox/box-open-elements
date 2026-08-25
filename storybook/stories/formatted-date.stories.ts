import type { StoryModule } from "../metadata.js";

const formattedDate: StoryModule = {
  title: "Components/Output/Formatted Date",
  meta: {
    id: "formatted-date",
    tag: "box-formatted-date",
    shortDescription: "A date or time in the reader's locale.",
    docsDescription:
      "Renders into `<time datetime=\"…\">`, so the exact instant stays available to anything reading the document rather than looking at it — a crawler, a calendar extension, a screen reader offering \"copy date\". The visible text is the reader's format; the attribute is always ISO 8601. An absent `locale` means the host's own, passed to `Intl` as `undefined` rather than a hardcoded `en-US`, because substituting one would silently render American dates to a German reader. With neither `date-style` nor `time-style` set, the date alone is shown at medium width: that is the common case in a file list, and defaulting to a timestamp would put a time nobody asked for beside every filename. A value that cannot be parsed hides the element rather than rendering `Invalid Date` — a malformed value is a host bug, and showing its wreckage helps no reader.",
    sourceSnippet: `<box-formatted-date value="2026-08-25T14:30:00Z" date-style="medium"></box-formatted-date>`,
    referenceRows: [
      { kind: "attribute", name: "value", type: "string", description: "The instant, as ISO 8601 or epoch milliseconds." },
      { kind: "attribute", name: "date-style", type: "string", description: "`full`, `long`, `medium` or `short`. Unrecognised values are ignored rather than substituted." },
      { kind: "attribute", name: "time-style", type: "string", description: "Same vocabulary. Absent renders no time at all." },
      { kind: "attribute", name: "time-zone", type: "string", description: "IANA zone, e.g. `America/New_York`. Absent uses the host's." },
      { kind: "attribute", name: "locale", type: "string", description: "BCP 47 tag. Absent uses the host's locale." },
      { kind: "attribute", name: "tabular", type: "boolean", description: "Tabular figures, so a column of dates aligns." },
      { kind: "part", name: "value", type: "part", description: "The `<time>` element." },
    ],
  },
  variants: [
    { name: "Date", html: `<box-formatted-date value="2026-08-25T14:30:00Z" date-style="medium" time-zone="UTC" locale="en-GB"></box-formatted-date>`, note: "The default shape: a date, no time." },
    { name: "Date and time", html: `<box-formatted-date value="2026-08-25T14:30:00Z" date-style="medium" time-style="short" time-zone="UTC" locale="en-GB"></box-formatted-date>` },
    { name: "Another locale", html: `<box-formatted-date value="2026-08-25T14:30:00Z" date-style="full" time-zone="UTC" locale="de-DE"></box-formatted-date>`, note: "Same instant, same markup — the reader's language decides the rest." },
    { name: "Unparseable", html: `<box-formatted-date value="banana"></box-formatted-date>`, note: "Renders nothing at all. There is deliberately no `Invalid Date` to see here." },
  ],
};

export default formattedDate;
