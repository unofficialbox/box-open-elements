import type { StoryModule } from "../metadata.js";

const formattedFileSize: StoryModule = {
  title: "Components/Output/Formatted File Size",
  meta: {
    id: "formatted-file-size",
    tag: "box-formatted-file-size",
    shortDescription: "A byte count as a readable size.",
    docsDescription:
      "The magnitude goes through `Intl.NumberFormat`, so a German reader sees \"2,52 MB\" rather than \"2.52 MB\". That is the reason this exists as a component rather than a `toFixed` call in each consumer: the decimal separator is not the same everywhere, and a file size is among the most frequently rendered values in a content platform. Defaults to decimal units — powers of 1000 with `kB`/`MB` names — matching what the Box product reports; `units=\"binary\"` switches to powers of 1024 with IEC names (`KiB`/`MiB`) for hosts that need to agree with a filesystem instead. Bytes are reported whole, because \"1.5 B\" is nonsense; above that, one decimal is the convention every file browser uses.",
    sourceSnippet: `<box-formatted-file-size value="2517630"></box-formatted-file-size>`,
    referenceRows: [
      { kind: "attribute", name: "value", type: "string", description: "The size in bytes." },
      { kind: "attribute", name: "units", type: "string", description: "`decimal` (default, powers of 1000) or `binary` (powers of 1024, IEC names)." },
      { kind: "attribute", name: "maximum-fraction-digits", type: "number", description: "Overrides the default of 1 (0 for whole bytes)." },
      { kind: "attribute", name: "locale", type: "string", description: "BCP 47 tag. Absent uses the host's locale." },
      { kind: "attribute", name: "tabular", type: "boolean", description: "Tabular figures, so a column of sizes aligns." },
      { kind: "part", name: "value", type: "part", description: "The rendered size." },
    ],
  },
  variants: [
    { name: "Decimal", html: `<box-formatted-file-size value="2517630" locale="en-US"></box-formatted-file-size>`, note: "Powers of 1000, matching what the Box product reports." },
    { name: "Binary", html: `<box-formatted-file-size value="2517630" units="binary" locale="en-US"></box-formatted-file-size>`, note: "The same bytes, counted the way a filesystem counts them." },
    { name: "Another locale", html: `<box-formatted-file-size value="2517630" locale="de-DE"></box-formatted-file-size>` },
    { name: "Bytes", html: `<box-formatted-file-size value="512" locale="en-US"></box-formatted-file-size>`, note: "Whole, because a fractional byte is not a thing." },
  ],
};

export default formattedFileSize;
