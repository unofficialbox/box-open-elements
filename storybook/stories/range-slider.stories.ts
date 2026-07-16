import type { StoryModule } from "../metadata.js";

const rangeSlider: StoryModule = {
  title: "Components/Forms/Range Slider",
  meta: {
    id: "range-slider",
    tag: "box-range-slider",
    shortDescription: "A dual-thumb numeric range control.",
    docsDescription: "Set `start`/`end` within `min`/`max` for a bounded range.",
    sourceSnippet: `<box-range-slider label="Size range" min="0" max="100" start="20" end="80"></box-range-slider>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible control label." },
      { kind: "attribute", name: "min", type: "number", description: "Minimum bound." },
      { kind: "attribute", name: "max", type: "number", description: "Maximum bound." },
      { kind: "attribute", name: "start", type: "number", description: "Range start value." },
      { kind: "attribute", name: "end", type: "number", description: "Range end value." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-range-slider label="Size range" min="0" max="100" start="20" end="80"></box-range-slider>` },
  ],
};

export default rangeSlider;
