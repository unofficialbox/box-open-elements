import type { StoryModule } from "../metadata.js";

const formattedDuration: StoryModule = {
  title: "Components/Output/Formatted Duration",
  meta: {
    id: "formatted-duration",
    tag: "box-formatted-duration",
    shortDescription: "How long something takes, in the reader's locale.",
    docsDescription:
      "`value` is a count of seconds or an ISO 8601 duration (`PT1H30M`), because hosts have both: an API field is usually a number, while `<time datetime>` wants the ISO form. Whichever comes in, the ISO form goes back out in `datetime`. Not to be confused with `box-relative-time`, which renders *when* something happened relative to now — this renders *how long*, and carries no direction, which is why a negative value is refused rather than shown as elapsed. Months and years are refused too: a month is not a fixed number of seconds, and `P1M` is ambiguous with a minute besides. `Intl.DurationFormat` renders it where the browser has it; where it does not, the same output is composed from `Intl.NumberFormat`'s unit style and `Intl.ListFormat`, and the two paths agree across styles and locales.",
    sourceSnippet: `<box-formatted-duration value="5400"></box-formatted-duration>`,
    referenceRows: [
      { kind: "attribute", name: "value", type: "string", description: "Seconds, or an ISO 8601 duration such as `PT1H30M`. Negative values, months and years are refused." },
      { kind: "attribute", name: "format-style", type: "string", description: "`short` (default, `1 hr, 30 min`), `long` (`1 hour, 30 minutes`) or `narrow` (`1h 30m`). Named to avoid the global `style` attribute." },
      { kind: "attribute", name: "max-units", type: "number", description: "How many units to show, default 2. A trailing zero unit is dropped, so an exact hour is `1 hr` rather than `1 hr, 0 min`." },
      { kind: "attribute", name: "locale", type: "string", description: "BCP 47 tag. Absent uses the host's locale." },
      { kind: "attribute", name: "tabular", type: "boolean", description: "Tabular figures, so a column of durations aligns." },
      { kind: "part", name: "value", type: "part", description: "The rendered duration, in a `<time>` carrying the ISO form." },
    ],
  },
  variants: [
    { name: "A duration", html: `<box-formatted-duration value="5400" locale="en-US"></box-formatted-duration>`, note: "5400 seconds. Two units by default — enough to convey magnitude without a precision nobody reads." },
    { name: "Spelled out", html: `<box-formatted-duration value="5400" format-style="long" locale="en-US"></box-formatted-duration>`, note: "For prose, where the abbreviations read as jargon." },
    { name: "Narrow", html: `<box-formatted-duration value="5400" format-style="narrow" locale="en-US"></box-formatted-duration>`, note: "For a dense column where the unit is obvious from the header." },
    { name: "From an ISO duration", html: `<box-formatted-duration value="P1DT2H" locale="en-US"></box-formatted-duration>`, note: "The same input a `datetime` attribute takes, so a host holding one does not have to convert it first." },
    { name: "More precision", html: `<box-formatted-duration value="97928" max-units="3" locale="en-US"></box-formatted-duration>`, note: "1 day, 3 hours, 12 minutes and 8 seconds, shown to three units." },
    { name: "An exact hour", html: `<box-formatted-duration value="3600" locale="en-US"></box-formatted-duration>`, note: "The trailing zero unit is dropped rather than rendered as `1 hr, 0 min`." },
    { name: "Another locale", html: `<box-formatted-duration value="5400" format-style="long" locale="de-DE"></box-formatted-duration>`, note: "Both the unit names and the joiner come from the locale; this is why it is a component and not a template literal." },
    { name: "Zero", html: `<box-formatted-duration value="0" locale="en-US"></box-formatted-duration>`, note: "Zero is a real answer, so it renders. `Intl` formats a zero duration to the empty string, which would leave a visible element with nothing in it." },
  ],
};

export default formattedDuration;
