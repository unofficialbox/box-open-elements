import { actionButton, syncKeyedChildren } from "../internal/keyed-children.js";
interface Point { id: string; label: string; value: number; tone?: string; }
interface Action { id: string; label: string; tone?: string; }
interface Legend { label: string; value?: string; tone?: string; }
const escapeHtml = (value: string): string => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
export const chartHeader = `<header part="header"><div part="meta"><h2 part="title"></h2><div part="summary" hidden></div><div part="message" hidden></div></div><div part="header-side"><div part="timeframe" hidden></div><div part="actions" hidden></div></div></header>`;
export const syncChartHeader = (root: ShadowRoot, data: { heading: string; summary: string; message: string; timeframe: string; actions: Action[] }): void => {
  root.querySelector('[part="title"]')!.textContent = data.heading;
  for (const [part, text] of [["summary",data.summary],["message",data.message],["timeframe",data.timeframe]]) {
    const element = root.querySelector<HTMLElement>(`[part="${part}"]`)!; element.textContent = text; element.hidden = !text;
  }
  const actions = root.querySelector<HTMLElement>('[part="actions"]')!; actions.hidden = !data.actions.length;
  syncKeyedChildren(actions, data.actions, action => action.id, () => actionButton("action"), (button, action) => { button.dataset.actionId=action.id; button.dataset.tone=action.tone??"neutral"; button.textContent=action.label; });
};
export const syncChartLegend = (root: ShadowRoot, items: Legend[]): void => {
  const legend = root.querySelector<HTMLElement>('[part="legend"]')!; legend.hidden=!items.length;
  legend.innerHTML=items.map(item=>`<div part="legend-item" data-tone="${escapeHtml(item.tone??"neutral")}"><span part="legend-swatch"></span><span part="legend-label">${escapeHtml(item.label)}</span>${item.value?`<span part="legend-value">${escapeHtml(item.value)}</span>`:""}</div>`).join("");
};
export const bindChartEvents = (root: ShadowRoot, action: (id: string)=>void, point: (id:string)=>void): void => {
  const host=root.querySelector('[part="content-host"]')!;
  host.addEventListener("click", event=>{
    const button=(event.target as Element).closest<HTMLButtonElement>("button"); if(!button||!host.contains(button))return;
    if(button.getAttribute("part")==="action"&&button.dataset.actionId)action(button.dataset.actionId);
    if(button.getAttribute("part")==="point"&&button.dataset.pointId!==undefined)point(button.dataset.pointId);
  });
};
export const syncChartPoints = (parent: HTMLElement, points: Point[], kind: "bar"|"shell"|"line", ratio?: (point: Point)=>number, fixedPrefix?: Element): void => {
  syncKeyedChildren(parent,points,point=>point.id,()=>{
    // A list item owns a native button; assigning listitem to the button would
    // erase its button semantics. display:contents preserves existing layout.
    const item=document.createElement("div"); item.setAttribute("role","listitem"); item.setAttribute("part","point-item"); item.style.display="contents";
    const button=actionButton("point");
    button.innerHTML=`${kind==="shell"?'<span part="bar-shell"><span part="bar"></span></span>':kind==="bar"?'<span part="bar"></span>':""}<span part="point-label"></span><span part="point-value"></span>`;
    item.append(button); return item;
  },(item,point)=>{
    const button=item.querySelector<HTMLButtonElement>("button")!; button.dataset.pointId=point.id; button.dataset.tone=point.tone??"neutral"; button.setAttribute("aria-label",`${point.label}: ${point.value}`);
    button.querySelector('[part="point-label"]')!.textContent=point.label; button.querySelector('[part="point-value"]')!.textContent=String(point.value);
    if(ratio)button.querySelector<HTMLElement>('[part="bar"]')!.style.setProperty("--point-ratio",String(ratio(point)));
  },fixedPrefix);
};
