import type { StoryModule } from "../metadata.js";

const distributionTimeline: StoryModule = {
  title: "Patterns/Insights/Distribution Timeline",
  meta: {
    id: "distribution-timeline",
    tag: "box-distribution-timeline",
    shortDescription: "Watch one measurement's distribution move over a run.",
    docsDescription: "Provide one host-computed summary per interval. The shaded range is minimum to maximum, the band inside it is Q1–Q3, and the line through it is the median. Optional samples draw as dots, thinned to an even spread across the time axis.",
    sourceSnippet: `<box-distribution-timeline heading="Upload latency" unit="ms" time-unit="s" points='[{"at":0,"min":18,"q1":31,"median":42,"q3":58,"max":126}]'></box-distribution-timeline>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Accessible chart name." },
      { kind: "attribute", name: "heading-level", type: "1–6", description: "Native heading level, default 2; choose the host outline level." },
      { kind: "attribute", name: "embedded", type: "boolean", description: "Remove panel background, border, radius and padding." },
      { kind: "attribute", name: "hide-note", type: "boolean", description: "Hide the standard band/range note, retaining description and plot summary." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting explanation." },
      { kind: "attribute", name: "points", type: "json", description: "One host-computed interval summary per point." },
      { kind: "attribute", name: "scale", type: "string", description: "linear or log." },
      { kind: "attribute", name: "unit", type: "string", description: "Unit appended to default value labels." },
      { kind: "attribute", name: "time-unit", type: "string", description: "Unit appended to time labels, default s." },
      { kind: "attribute", name: "hide-samples", type: "boolean", description: "Draw summaries only, omitting sample dots." },
      { kind: "attribute", name: "max-samples", type: "number", description: "Cap on plotted sample dots, default 2000." },
    ],
  },
  variants: [{
    name: "Upload latency",
    html: `<box-distribution-timeline heading="Upload latency" description="Each interval of one run, summarised" unit="ms" time-unit="s" points='[{"at":0,"min":15,"q1":29,"median":38,"q3":50,"max":90,"count":1180,"samples":[31,38,44,52,71]},{"at":5,"min":16,"q1":30,"median":40,"q3":53,"max":93,"count":1187,"samples":[22,36,41,58,80]},{"at":10,"min":16,"q1":30,"median":41,"q3":55,"max":95,"count":1194,"samples":[27,39,47,63,88]},{"at":15,"min":19,"q1":33,"median":43,"q3":57,"max":99,"count":1201,"samples":[30,42,49,66,91]},{"at":20,"min":21,"q1":34,"median":44,"q3":59,"max":101,"count":1208,"samples":[33,43,51,70,96]},{"at":25,"min":21,"q1":35,"median":46,"q3":61,"max":104,"count":1215,"samples":[34,45,54,73,99]},{"at":30,"min":26,"q1":40,"median":51,"q3":63,"max":136,"count":1222,"samples":[38,52,61,88,128]},{"at":35,"min":27,"q1":41,"median":52,"q3":66,"max":139,"count":1229,"samples":[40,53,63,91,131]},{"at":40,"min":27,"q1":41,"median":51,"q3":67,"max":110,"count":1236,"samples":[36,50,58,79,105]},{"at":45,"min":30,"q1":44,"median":53,"q3":66,"max":109,"count":1243,"samples":[39,52,60,81,106]}]'></box-distribution-timeline>`,
  }, {
    name: "Summaries only · log scale",
    html: `<box-distribution-timeline heading="Response times" unit="ms" time-unit="s" scale="log" hide-samples points='[{"at":0,"min":3,"q1":12,"median":24,"q3":58,"max":310},{"at":30,"min":4,"q1":18,"median":38,"q3":92,"max":470},{"at":60,"min":3,"q1":14,"median":29,"q3":66,"max":360},{"at":90,"min":5,"q1":21,"median":44,"q3":104,"max":520}]'></box-distribution-timeline>`,
  }],
};

export default distributionTimeline;
