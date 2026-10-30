import type {StoryModule} from "../metadata.js";
import {findingsHtml} from "../fixtures/analytic-charts.js";
const story:StoryModule={
 title:"Patterns/Governance/Findings Disclosure",
 meta:{id:"findings-disclosure",tag:"box-findings-disclosure",shortDescription:"Keep corrections visible when supporting evidence is collapsed.",docsDescription:"Lead findings remain visible. The disclosure counts additional findings, corrections and limits, while corrected field names always remain discoverable.",sourceSnippet:findingsHtml,referenceRows:[
  {kind:"property",name:"findings",type:"string[]",description:"Conclusions, in host-defined order."},{kind:"property",name:"corrections",type:"FindingCorrection[]",description:"Each corrected field with was, now and why text."},{kind:"property",name:"limits",type:"string[]",description:"What these conclusions do not establish."},
  {kind:"attribute",name:"lead-count",type:"number",description:"Number of findings shown before the toggle; default 1."},{kind:"attribute",name:"expanded",type:"boolean",description:"Controlled disclosure state."},{kind:"event",name:"expanded-changed",type:"{ expanded: boolean }",description:"User toggled supporting detail."},
  {kind:"attribute",name:"heading-level",type:"1–6",description:"Native heading level; default 2."},
 ]},variants:[{name:"Default",html:findingsHtml},{name:"Expanded",html:findingsHtml.replace('<box-findings-disclosure ','<box-findings-disclosure expanded ')},{name:"Nothing to collapse",html:`<box-findings-disclosure findings='["The requested scan completed."]'></box-findings-disclosure>`},{name:"Corrections only",html:`<box-findings-disclosure corrections='[{"field":"Scope","was":"All users","now":"Connected users","why":"Only connected users were sampled."}]'></box-findings-disclosure>`}]
};export default story;
