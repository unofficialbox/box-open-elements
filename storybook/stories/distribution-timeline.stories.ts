import {distributionTimelineHtml,distributionTimelineSamplesHtml,distributionTimelineLogHtml} from "../fixtures/distribution-timeline.js";
import type { StoryModule } from "../metadata.js";

const distributionTimeline: StoryModule = {
  title: "Patterns/Insights/Distribution Timeline",
  meta: {
    id: "distribution-timeline",
    tag: "box-distribution-timeline",
    shortDescription: "Watch one measurement's distribution move over a run.",
    docsDescription: "Provide one host-computed summary per interval. Separate interval boxes show Q1–Q3, capped whiskers show minimum–maximum, and a blue line follows the medians. Host-supplied samples are an optional inspection layer, off by default, with bounded thinning across time.",
    sourceSnippet: distributionTimelineHtml,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Accessible chart name." },
      { kind: "attribute", name: "heading-level", type: "1–6", description: "Native heading level, default 2; choose the host outline level." },
      { kind: "attribute", name: "embedded", type: "boolean", description: "Remove panel background, border, radius and padding." },
      { kind: "attribute", name: "hide-note", type: "boolean", description: "Hide the method note, retaining the key, description and plot summary." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting explanation." },
      { kind: "attribute", name: "points", type: "json", description: "One host-computed interval summary per point." },
      { kind: "attribute", name: "scale", type: "string", description: "linear or log." },
      { kind: "attribute", name: "unit", type: "string", description: "Unit appended to default value labels." },
      { kind: "attribute", name: "time-unit", type: "string", description: "Unit appended to time labels, default s." },
      { kind: "attribute", name: "show-samples", type: "boolean", description: "Opt into the sampled-values layer; off by default. A named control also toggles it." },
      { kind: "event", name: "samples-toggled", type: "{ visible: boolean }", description: "The sampled-values control was toggled." },
      { kind: "attribute", name: "hide-samples", type: "boolean", description: "Force sample dots and their control off, even if show-samples is set." },
      { kind: "attribute", name: "max-samples", type: "number", description: "Cap on plotted sample dots, default 2000." },
    ],
  },
  variants:[{name:"Interval summaries",html:distributionTimelineHtml},{name:"With sampled values",html:distributionTimelineSamplesHtml},{name:"Log scale",html:distributionTimelineLogHtml}],
};

export default distributionTimeline;
