// Illustrative domain copy belongs to the demo host, never the chart renderer.
const periodLabels = ["Sep 28", "Oct 5", "Oct 12", "Oct 19", "Oct 26"];
const periodPoints = (values: Array<number | null>, unit: string) => values.map((value,i) => {
  const prior = values[i-1];
  const delta = value !== null && prior != null ? value-prior : null;
  return {id:`w${i+1}`,label:periodLabels[i],value,inspection:{label:`${i === values.length-1 ? "Latest week ·" : "Week of"} ${periodLabels[i]}`,value:value === null ? "Not observed" : `${value} ${unit}`,comparison:delta !== null && prior !== 0 ? `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} (${delta >= 0 ? "+" : "−"}${(Math.abs(delta/prior!)*100).toFixed(1)}%) vs ${periodLabels[i-1]} · ${prior}` : undefined}};
});
export const periodChartHtml = (kind: "bar-chart" | "line-chart", extra = "", values: Array<number|null> = kind === "bar-chart" ? [42,51,48,64,71] : [310,355,348,402,431]) => `<box-${kind} heading="${kind === "bar-chart" ? "Weekly uploads" : "Weekly active users"}" timeframe="Sep 28–Nov 1, 2026" unit="${kind === "bar-chart" ? "Uploads" : "Distinct users"}" x-label="Week of" note="Illustrative data · Monday–Sunday intervals${kind === "line-chart" ? " · A user is counted once per week" : ""}" ${kind === "line-chart" ? 'domain="[0,500]"' : ""} points='${JSON.stringify(periodPoints(values,kind === "bar-chart" ? "uploads" : "users"))}' ${extra}></box-${kind}>`;
export const periodVariants = (kind: "bar-chart" | "line-chart") => [
  {name:"Default",html:periodChartHtml(kind)},
  {name:"Selected · Oct 19",html:periodChartHtml(kind,'selected-id="w4"')},
  {name:"Zero measured",html:periodChartHtml(kind,"",[0,0,0,0,0])},
  {name:"No observations",html:periodChartHtml(kind).replace(/points='[^']*'/,"points='[]'")},
  {name:"Incomplete period",html:periodChartHtml(kind,'state="partial" status-message="Oct 26–Nov 1 is incomplete. Comparisons are unavailable."')},
  {name:"Missing interval",html:periodChartHtml(kind,"",kind === "bar-chart" ? [42,51,null,64,71] : [310,355,null,402,431])},
  {name:"Cached observations",html:periodChartHtml(kind,'state="stale" status-message="Cached · updated Oct 29, 2026 at 09:00 UTC"')},
  {name:"Loading",html:periodChartHtml(kind,'state="loading"')},
  {name:"Long category labels",html:periodChartHtml(kind).replace(/points='[^']*'/,`points='${JSON.stringify(periodPoints(kind === "bar-chart" ? [42,51,48,64,71] : [310,355,348,402,431],kind === "bar-chart" ? "uploads" : "users").map(point=>({...point,label:`Week beginning ${point.label}, 2026 — extended category label`})))}'`)},
  {name:"Dense observations",html:periodChartHtml(kind).replace(/points='[^']*'/,`points='${JSON.stringify(Array.from({length:30},(_,i)=>({id:`sample-${i}`,label:`Period ${i+1}`,value:kind === "bar-chart" ? 20+i : 200+i*7})))}'`)},
  {name:"Load error",html:periodChartHtml(kind,'state="error" status-message="Observations could not be loaded. Try again from the host application."')},
];

export const metricChartHtml = `<box-metric-card heading="Active shared links" value="1,284" eyebrow="As of Oct 29, 2026" message="Active = not expired or revoked. Illustrative definition." trend='{"label":"+182 (+16.5%) vs Sep 29 · 1,102","tone":"neutral","direction":"up"}'></box-metric-card>`;
export const storageChartHtml = `<box-donut-chart readonly category-label="File type" heading="Storage by file type" timeframe="As of Nov 1, 2026" unit="GB" total-label="Total stored" note="Illustrative data · Part of total stored, not capacity" segments='[{"id":"docs","label":"Documents","value":115},{"id":"media","label":"Media","value":80},{"id":"other","label":"Other","value":55}]'></box-donut-chart>`;
export const dailyChartHtml = `<box-chart-panel heading="Daily uploads" timeframe="Oct 26–30, 2026" unit="Uploads" x-label="Day" note="Illustrative data" points='[{"id":"mon","label":"Oct 26","value":12},{"id":"tue","label":"Oct 27","value":18},{"id":"wed","label":"Oct 28","value":24},{"id":"thu","label":"Oct 29","value":21},{"id":"fri","label":"Oct 30","value":28}]'></box-chart-panel>`;
export const distributionRows = [
  {id:"upload",label:"files.upload",min:16,p5:21,q1:34,median:42,q3:55,p95:84,max:126,count:1204,reference:50},
  {id:"user",label:"users.me",min:8,p5:12,q1:18,median:24,q3:31,p95:45,max:72,count:984},
  {id:"signin",label:"Signing in",min:32,p5:39,q1:52,median:66,q3:80,p95:103,max:148,count:96},
];
export const distributionChartHtml = `<box-box-plot heading="Step duration" description="Sampled calls · Sep 28–Nov 1, 2026" unit="ms" whiskers="p5-p95" domain="[0,150]" selectable rows='${JSON.stringify(distributionRows)}'><span slot="footer">Illustrative data · 50 ms reference for files.upload only; not an SLO.</span></box-box-plot>`;
export const dataStateVariants = (html: string,tag: string) => [
  {name:"Default",html},
  {name:"Loading",html:html.replace(`<${tag}`,`<${tag} state="loading"`)},
  {name:"Partial coverage",html:html.replace(`<${tag}`,`<${tag} state="partial" status-message="Coverage is incomplete; comparisons are unavailable."`)},
  {name:"Cached observations",html:html.replace(`<${tag}`,`<${tag} state="stale" status-message="Cached · updated Oct 29, 2026 at 09:00 UTC"`)},
  {name:"Load error",html:html.replace(`<${tag}`,`<${tag} state="error" status-message="Observations could not be loaded. Retry from the host application."`)},
];
