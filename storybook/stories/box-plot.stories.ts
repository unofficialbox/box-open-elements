import type { StoryModule } from "../metadata.js";

const boxPlot: StoryModule = {
  title: "Patterns/Insights/Box Plot",
  meta: {
    id: "box-plot",
    tag: "box-box-plot",
    shortDescription: "Compare measurement distributions on a shared scale.",
    docsDescription: "Provide host-computed summary rows. The box is Q1–Q3, its line is the median, and whiskers can use extremes or percentiles. Use the format property for custom value labels.",
    sourceSnippet: `<box-box-plot heading="Step times" unit="ms" rows='[{"id":"upload","label":"files.upload","min":16,"q1":34,"median":42,"q3":55,"max":126}]'></box-box-plot>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Accessible chart name." },
      { kind: "attribute", name: "description", type: "string", description: "Supporting explanation." },
      { kind: "attribute", name: "rows", type: "json", description: "Host-computed summary statistics." },
      { kind: "attribute", name: "whiskers", type: "string", description: "min-max, p5-p95, or p5-p99." },
      { kind: "attribute", name: "orientation", type: "string", description: "horizontal or vertical." },
      { kind: "attribute", name: "scale", type: "string", description: "linear or log." },
      { kind: "attribute", name: "unit", type: "string", description: "Unit appended to default numeric labels." },
    ],
  },
  variants: [{
    name: "Step times",
    html: `<box-box-plot heading="Step times" description="Sampled call duration by step" unit="ms" whiskers="p5-p95" rows='[{"id":"upload","label":"files.upload","min":16,"p5":21,"q1":34,"median":42,"q3":55,"p95":84,"max":126,"count":1204,"reference":50,"samples":[21,31,42,47,65,84]},{"id":"user","label":"users.me","min":8,"p5":12,"q1":18,"median":24,"q3":31,"p95":45,"max":72,"count":984},{"id":"signin","label":"Signing in","min":32,"p5":39,"q1":52,"median":66,"q3":80,"p95":103,"max":148,"count":96}]'></box-box-plot>`,
  }],
};

export default boxPlot;
