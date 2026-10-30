import type { ReferenceRow } from "../metadata.js";
import type { CartesianSeries } from "../../src/patterns/insights/cartesian-model.js";
const json = (v: unknown) => JSON.stringify(v).replaceAll("&", "&amp;").replaceAll("'", "&#39;");
const labels = ["Oct 5", "Oct 12", "Oct 19", "Oct 26"];
export const activitySeries: CartesianSeries[] = [
  { id: "uploads", label: "Uploads", points: [42, 51, 64, 71].map((y, i) => ({ id: `upload-${i}`, x: i + 1, y, label: labels[i] })) },
  { id: "downloads", label: "Downloads", points: [35, 46, 58, 63].map((y, i) => ({ id: `download-${i}`, x: i + 1, y, label: labels[i] })) },
];
export const scatterSeries: CartesianSeries[] = [
  { id: "text", label: "Text documents", points: [{ id: "t1", x: 2, y: 18, size: 35 }, { id: "t2", x: 5, y: 27, size: 80 }, { id: "t3", x: 9, y: 40, size: 125 }, { id: "t4", x: 15, y: 63, size: 170 }] },
  { id: "media", label: "Media files", points: [{ id: "m1", x: 4, y: 29, size: 60 }, { id: "m2", x: 8, y: 45, size: 110 }, { id: "m3", x: 12, y: 56, size: 145 }, { id: "m4", x: 18, y: 82, size: 220 }] },
];
export const chartFamilyExamples: Record<string, string> = {
  "grouped-bar-chart": `<box-grouped-bar-chart heading="Weekly content activity" description="Illustrative weekly counts · compare uploads with downloads" x-label="Week of" y-label="Files" series='${json(activitySeries)}'></box-grouped-bar-chart>`,
  "scatter-chart": `<box-scatter-chart heading="File size and upload latency" description="Illustrative observations; association does not establish causation" x-label="File size (MB)" y-label="Upload latency (ms)" series='${json(scatterSeries)}'></box-scatter-chart>`,
  "bubble-chart": `<box-bubble-chart heading="Upload workload" description="Illustrative file groups · bubble area represents the number of files" x-label="File size (MB)" y-label="Upload latency (ms)" size-label="Files" series='${json(scatterSeries)}'></box-bubble-chart>`,
  "area-chart": `<box-area-chart heading="Weekly storage added" description="Illustrative storage additions · each series is measured in GB" x-label="Week of" y-label="Storage added (GB)" series='${json(activitySeries)}'></box-area-chart>`,
  "mixed-chart": `<box-mixed-chart heading="Uploads and active users" description="Illustrative weekly measures · files use the left axis; people use the right" x-label="Week" y-axes='${json([{ id: "files", label: "Files" }, { id: "users", label: "Active users" }])}' series='${json([{ ...activitySeries[0], axis: "files", kind: "bar" }, { ...activitySeries[1], id: "users", label: "Active users", axis: "users", kind: "line", points: [310, 370, 402, 431].map((y, i) => ({ id: `users-${i}`, x: i + 1, y, label: labels[i] })) }])}'></box-mixed-chart>`,
  "pie-chart": `<box-pie-chart heading="Storage by file type" message="Illustrative classified storage · fixed 250 GB denominator" unit="GB" total="250" summary="250 GB" readonly segments='${json([{ id: "docs", label: "Documents", value: 115 }, { id: "media", label: "Media", value: 80 }, { id: "other", label: "Other", value: 55 }])}'></box-pie-chart>`,
  "radar-chart": `<box-radar-chart heading="Workflow capability comparison" description="Illustrative rubric scores · all axes use the same 0–100 point scale" unit="points" maximum="100" axes='${json([{ id: "capture", label: "Capture" }, { id: "classify", label: "Classify" }, { id: "review", label: "Review" }, { id: "retain", label: "Retain" }, { id: "share", label: "Share" }])}' series='${json([{ id: "current", label: "Current workflow", values: [65, 80, 50, 75, 60].map((value, i) => ({ axis: ["capture", "classify", "review", "retain", "share"][i], value })) }, { id: "proposed", label: "Proposed workflow", values: [85, 85, 80, 75, 90].map((value, i) => ({ axis: ["capture", "classify", "review", "retain", "share"][i], value })) }])}'></box-radar-chart>`,
  "polar-area-chart": `<box-polar-area-chart heading="Requests by operation" description="Illustrative counts · equal angles and area-scaled sectors" unit="requests" segments='${json([{ id: "read", label: "Read", value: 120 }, { id: "upload", label: "Upload", value: 80 }, { id: "search", label: "Search", value: 60 }, { id: "share", label: "Share", value: 30 }])}'></box-polar-area-chart>`,
};

export function chartFamilyVariants(id: string): {name: string; html: string;setup?:(root:HTMLElement)=>(()=>void)|void}[] {
  const html = chartFamilyExamples[id];
  const state = (name: string, attributes: string) => ({name,html:html.replace(`<box-${id} `,`<box-${id} ${attributes} `)});
  const variants = [
    {name:"Default",html},
    state("Loading",'state="loading"'),
    state("Partial coverage",'state="partial" status-message="Coverage is incomplete; no missing observation is counted as zero."'),
    state("Cached observations",'state="stale" status-message="Cached · updated Oct 29, 2026 at 09:00 UTC"'),
    state("Load error",'state="error" status-message="Observations could not be loaded. Retry from the host application."'),
  ];
  if(id==="grouped-bar-chart"){
    const signed = activitySeries.map((s,i)=>({...s,stack:"net",points:s.points.map(p=>({...p,y:i?-p.y!:p.y}))}));
    variants.push({name:"Diverging stacks",html:html.replace("<box-grouped-bar-chart ","<box-grouped-bar-chart stacked ").replace(/series='[^']*'/,`series='${json(signed)}'`)});
    const grouped = [...activitySeries.map(s=>({...s,stack:"observed"})),...activitySeries.map(s=>({...s,id:`prior-${s.id}`,label:`Prior ${s.label.toLowerCase()}`,stack:"prior",points:s.points.map(p=>({...p,id:`prior-${p.id}`,y:Math.round(p.y!*.8)}))}))];
    variants.push({name:"Grouped stacks",html:html.replace("<box-grouped-bar-chart ","<box-grouped-bar-chart stacked ").replace(/series='[^']*'/,`series='${json(grouped)}'`)});
  }
  if(id==="area-chart"){
    variants.push(state("Stacked area", "stacked"));
    variants.push({name:"Missing interval",html:html.replace(/series='[^']*'/,`series='${json(activitySeries.map(s=>({...s,points:s.points.map((p,i)=>({...p,y:i===1?null:p.y}))})))}'`)});
  }
  if(["grouped-bar-chart","area-chart","scatter-chart","bubble-chart","mixed-chart"].includes(id)) variants.push(state("Selected observation",`selected-id="${id==="scatter-chart"||id==="bubble-chart"?"t2":"upload-1"}"`));
  const property=id==="pie-chart"||id==="polar-area-chart"?"segments":"series";
  variants.push({name:"No observations",html:html.replace(new RegExp(`${property}='[^']*'`),`${property}='[]'`)});
  return variants.map(variant=>({...variant,setup:setupChartFamilySelection}));
}

export const extendedLineVariants = [
 {name:"Stepped numeric series",html:`<box-line-chart heading="Retained file count" message="Illustrative state observations · after-step holds until the next observation" interpolation="step-after" x-label="Day" y-label="Files" series='${json([{id:"files",label:"Retained files",points:[{x:1,y:20},{x:2,y:20},{x:3,y:35},{x:4,y:30}]}])}'></box-line-chart>`},
 {name:"Monotone interpolation",html:`<box-line-chart heading="Upload throughput" message="Illustrative samples · opt-in monotone interpolation adds no local extrema" interpolation="monotone" x-label="Elapsed minutes" y-label="Files per minute" series='${json([{id:"rate",label:"Throughput",points:[{x:1,y:12},{x:2,y:28},{x:3,y:null},{x:4,y:40},{x:5,y:42}]}])}'></box-line-chart>`},
 {name:"Calendar time axis",html:`<box-line-chart heading="Stored files by month" message="Illustrative snapshots · spacing follows elapsed time; ticks follow the UTC calendar" x-scale="time" x-label="Snapshot date" y-label="Files" series='${json([{id:"files",label:"Stored files",points:[{x:Date.UTC(2026,0,1),y:120},{x:Date.UTC(2026,1,1),y:155},{x:Date.UTC(2026,2,1),y:180},{x:Date.UTC(2026,3,1),y:210}]}])}'></box-line-chart>`},
 {name:"Separate y axes",html:`<box-line-chart heading="Uploads and active users" message="Illustrative weekly measures · axes have independent units and domains" x-label="Week" y-axes='${json([{id:"files",label:"Files"},{id:"users",label:"People"}])}' series='${json([{id:"files",label:"Uploads",axis:"files",points:[{x:1,y:42},{x:2,y:51},{x:3,y:64},{x:4,y:71}]},{id:"users",label:"Active users",axis:"users",points:[{x:1,y:310},{x:2,y:370},{x:3,y:402},{x:4,y:431}]}])}'></box-line-chart>`},
];

/** Demo host commits controlled selection; component state stays host owned. */
export function setupChartFamilySelection(root: HTMLElement): (() => void) | void {
  const chart=root.querySelector<HTMLElement & {selectedId:string|null}>("box-grouped-bar-chart,box-scatter-chart,box-bubble-chart,box-area-chart,box-mixed-chart,box-radar-chart,box-polar-area-chart");
  if(!chart)return;
  const name=chart.localName==="box-radar-chart"||chart.localName==="box-polar-area-chart"?"item-selected":"point-selected";
  const commit=(event:Event)=>{const id=(event as CustomEvent<{selectedId:string|null}>).detail?.selectedId;if(typeof id==="string"||id===null)chart.selectedId=id;};
  chart.addEventListener(name,commit);
  return ()=>chart.removeEventListener(name,commit);
}
export function chartFamilySetupCode(id:string):string|undefined {
  if(id==="pie-chart")return undefined;
  const event=id==="radar-chart"||id==="polar-area-chart"?"item-selected":"point-selected";
  return `// Run after the custom element mounts; use the same controller in every framework.\nconst chart = document.querySelector("box-${id}")!;\nchart.addEventListener("${event}", event => {\n  const { selectedId } = (event as CustomEvent<{ selectedId: string | null }>).detail;\n  chart.selectedId = selectedId;\n});`;
}

export const cartesianReferenceRows: ReferenceRow[] = [
 {kind:"property",name:"yAxes",type:"CartesianAxis[]",description:"One or two named y axes with optional explicit domains and linear/log scales. Series identify their axis by ID."},
 {kind:"attribute",name:"x-scale",type:"linear | log | time",description:"Actual coordinate spacing. Time uses epoch milliseconds and calendar-aware ticks; bars require linear zero baselines."},
 {kind:"attribute",name:"time-zone",type:"string",description:"IANA time zone for calendar ticks and exact timestamps; UTC by default."},
 {kind:"attribute",name:"interpolation",type:"linear | monotone | step-before | step-after | step-middle",description:"Opt-in curve behavior; every missing observation remains a gap."},
 {kind:"attribute",name:"stacked",type:"boolean",description:"Signed stacking with separate positive/negative accumulation. Stack IDs form groups; axes never accumulate together."},
 {kind:"attribute",name:"selected-id",type:"string",description:"Host-controlled observation ID. Inspection does not change scale, order or denominator."},
 {kind:"event",name:"point-selected",description:"Emits selectedId, point and seriesId; null requests clearing. Assign selectedId in the host to commit the selection."},
 { kind: "attribute", name: "state", type: "ready | loading | error | partial | stale", description: "Loading and errors suppress cached geometry; supply status-message with the data scope or timestamp." },
 { kind: "property", name: "series", type: "CartesianSeries[]", description: "Typed host observations with stable IDs; full source values remain available." },
 ];
