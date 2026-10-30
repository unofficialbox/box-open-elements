export const distributionTimelineDemoPoints = [
  { at: 0, min: 15, q1: 29, median: 38, q3: 50, max: 90, count: 1180, samples: [42, 46, 46, 49, 51, 64] },
  { at: 5, min: 16, q1: 30, median: 40, q3: 53, max: 93, count: 1187, samples: [16, 27, 36, 39, 41, 64] },
  { at: 10, min: 16, q1: 30, median: 41, q3: 55, max: 95, count: 1194, samples: [36, 41, 75, 79, 87, 92] },
  { at: 15, min: 20, q1: 34, median: 43, q3: 58, max: 98, count: 1201, samples: [22, 43, 55, 69, 72, 83] },
  { at: 20, min: 20, q1: 34, median: 44, q3: 56, max: 96, count: 1208, samples: [37, 40, 44, 47, 53, 80] },
  { at: 25, min: 21, q1: 35, median: 46, q3: 59, max: 99, count: 1215, samples: [24, 44, 71, 86, 95, 97] },
  { at: 30, min: 28, q1: 42, median: 51, q3: 65, max: 133, count: 1222, samples: [44, 52, 60, 76, 83, 111] },
  { at: 35, min: 28, q1: 42, median: 52, q3: 67, max: 135, count: 1229, samples: [30, 35, 81, 103, 106, 118] },
  { at: 40, min: 26, q1: 40, median: 51, q3: 63, max: 103, count: 1236, samples: [61, 62, 64, 73, 87, 97] },
  { at: 45, min: 29, q1: 43, median: 52, q3: 65, max: 105, count: 1243, samples: [31, 40, 47, 57, 60, 70] },
  { at: 50, min: 30, q1: 44, median: 54, q3: 68, max: 108, count: 1250, samples: [55, 61, 70, 81, 91, 104] },
  { at: 55, min: 31, q1: 45, median: 56, q3: 71, max: 111, count: 1257, samples: [38, 39, 40, 49, 83, 96] },
  { at: 60, min: 34, q1: 48, median: 57, q3: 69, max: 109, count: 1264, samples: [35, 43, 81, 86, 103, 105] },
];
const encoded=JSON.stringify(distributionTimelineDemoPoints).replaceAll("&","&amp;").replaceAll("'","&#39;");
export const distributionTimelineHtml=`<box-distribution-timeline heading="Upload latency" description="Illustrative run · one summary every 5 seconds" unit="ms" time-unit="s" points='${encoded}'></box-distribution-timeline>`;
export const distributionTimelineSamplesHtml=distributionTimelineHtml.replace('<box-distribution-timeline ','<box-distribution-timeline show-samples ');
export const distributionTimelineLogHtml=distributionTimelineHtml.replace('<box-distribution-timeline ','<box-distribution-timeline scale="log" hide-samples ');
