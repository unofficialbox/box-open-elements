import type { StoryModule } from "../metadata.js";

const formattedNumber: StoryModule = {
  title: "Components/Output/Formatted Number",
  meta: {
    id: "formatted-number",
    tag: "box-formatted-number",
    shortDescription: "A number in the reader's locale.",
    docsDescription:
      "The attribute is `format-style`, not `style`, because `style` is a global HTML attribute: naming it after the `Intl` option would be tidier right up until the first host wrote `style=\"currency\"`, put CSS on the element, and watched nothing happen. `percent` follows `Intl`, which multiplies by 100 — pass `0.42` to render \"42%\". Where an option is missing or invalid the number is still rendered, plainly: a `currency` style with no `currency` code, or a code `Intl` rejects, falls back to a decimal rather than hiding a real value over a bad attribute. Only a value that is not a finite number hides the element.",
    sourceSnippet: `<box-formatted-number value="1234.5" format-style="currency" currency="USD"></box-formatted-number>`,
    referenceRows: [
      { kind: "attribute", name: "value", type: "string", description: "The number to render." },
      { kind: "attribute", name: "format-style", type: "string", description: "`decimal` (default), `currency`, `percent` or `unit`. Named to avoid the global `style` attribute." },
      { kind: "attribute", name: "currency", type: "string", description: "ISO 4217 code, required by `Intl` when the style is `currency`." },
      { kind: "attribute", name: "unit", type: "string", description: "A sanctioned unit identifier, e.g. `megabyte`, when the style is `unit`. `Intl` accepts a closed list and throws on anything else, so this is not a free-text label." },
      { kind: "attribute", name: "unit-display", type: "string", description: "`short` (default, `2.5 MB`), `narrow` (`2.5MB`) or `long` (`2.5 megabytes`)." },
      { kind: "attribute", name: "minimum-fraction-digits", type: "number", description: "Passed through to `Intl.NumberFormat`." },
      { kind: "attribute", name: "maximum-fraction-digits", type: "number", description: "Passed through to `Intl.NumberFormat`." },
      { kind: "attribute", name: "locale", type: "string", description: "BCP 47 tag. Absent uses the host's locale." },
      { kind: "attribute", name: "tabular", type: "boolean", description: "Tabular figures, so a column of numbers aligns." },
      { kind: "part", name: "value", type: "part", description: "The rendered number." },
    ],
  },
  variants: [
    { name: "Grouped", html: `<box-formatted-number value="1234567.5" locale="en-US"></box-formatted-number>` },
    { name: "Another locale", html: `<box-formatted-number value="1234567.5" locale="de-DE"></box-formatted-number>`, note: "The grouping and decimal separators both change; this is why it is a component and not a template literal." },
    { name: "Currency", html: `<box-formatted-number value="1234.5" format-style="currency" currency="USD" locale="en-US"></box-formatted-number>` },
    { name: "Percent", html: `<box-formatted-number value="0.42" format-style="percent" locale="en-US"></box-formatted-number>`, note: "Intl multiplies by 100, so the input is a fraction." },
    { name: "Unit", html: `<box-formatted-number value="2.5" format-style="unit" unit="megabyte" locale="en-US"></box-formatted-number>`, note: "For a raw magnitude that already knows its unit. Reach for `box-formatted-file-size` when the input is a byte count that still needs reducing." },
    { name: "Unit, spelled out", html: `<box-formatted-number value="2.5" format-style="unit" unit="megabyte" unit-display="long" locale="en-US"></box-formatted-number>`, note: "`long` is for prose, where an abbreviation the reader has to expand in their head is worse than the words." },
    { name: "Duration", html: `<box-formatted-number value="8" format-style="unit" unit="hour" unit-display="long" locale="en-US"></box-formatted-number>`, note: "Units are not only sizes — `hour`, `day` and `week` all come from the same sanctioned list." },
  ],
};

export default formattedNumber;
