import { BaseElement } from "../../core/element.js";
import { captureOwnedFocus, refreshOwnedControls, restoreOwnedFocus } from "../../core/refresh-controls.js";
import { isSafeHref } from "../../patterns/internal/safe-href.js";
import { boeStatusGlyph, boeStatusStyles, toStatusKind } from "../../foundations/status/index.js";
import { boeEntrance, boeEntranceKeyframes, boeReducedMotionPolicy, boeStaggerStyles } from "../../foundations/motion/index.js";

export type CheckStatus = "pass" | "warn" | "fail" | "info";
export type ResultLabels = Record<CheckStatus, string>;
export interface ResultRenderOptions { labels?: Partial<ResultLabels>; linkSuffix?: string; selectableDocuments?: boolean }
export type ResultBlock = { id?: string } & (
  | { type: "facts"; title?: string; rows: { label: string; value: string }[] }
  | { type: "checks"; title?: string; rows: { label: string; value?: string; detail?: string; status: CheckStatus }[] }
  | { type: "table"; title?: string; columns: string[]; rows: { cells: string[]; status?: CheckStatus; note?: string }[]; footnote?: string }
  | { type: "documents"; title?: string; items: { id: string; name: string; detail?: string; href?: string }[] }
);
const escape = (s: string): string => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const defaultLabels: ResultLabels = { pass: "Within policy", warn: "Needs exception", fail: "Outside policy", info: "Information" };
const verdict = (s: CheckStatus, labels: Partial<ResultLabels> = {}): string => labels[s] ?? defaultLabels[s];
const glyph = (s: CheckStatus): string => boeStatusGlyph(toStatusKind(s));
export const resultDocumentIds = (blocks: readonly ResultBlock[]): string[] => [...new Set(blocks.flatMap(b => b.type === "documents" ? b.items.map(i => i.id) : []))];
/** Pure escaped renderer also usable by host-composed conversations. */
export function renderResultBlock(block: ResultBlock, options: ResultRenderOptions = {}): string {
  const heading = block.title ? `<h3 part="title">${escape(block.title)}</h3>` : "";
  if (block.type === "facts") return `${heading}<dl part="facts">${block.rows.map(r => `<div part="row"><dt>${escape(r.label)}</dt><dd>${escape(r.value)}</dd></div>`).join("")}</dl>`;
  if (block.type === "checks") return `${heading}<ul part="checks">${block.rows.map(r => `<li part="row">${glyph(r.status)}<div><strong>${escape(r.label)}</strong>${r.detail ? `<p>${escape(r.detail)}</p>` : ""}</div><span part="verdict" data-status="${r.status}">${escape(r.value ?? verdict(r.status, options.labels))}</span></li>`).join("")}</ul>`;
  if (block.type === "documents") return `${heading}<ul part="documents">${block.items.map(i => {
    const content = `<svg aria-hidden="true" width="16" height="20" viewBox="0 0 16 20"><path d="M2 1h8l4 4v14H2zM10 1v5h4" fill="none" stroke="currentColor"/></svg><span><strong>${escape(i.name)}</strong>${i.detail ? `<small>${escape(i.detail)}</small>` : ""}</span>`;
    const link = i.href && isSafeHref(i.href);
    return `<li part="row">${link ? `<a part="document" data-document-id="${escape(i.id)}" href="${escape(i.href!)}" target="_blank" rel="noopener noreferrer">${content}<span part="external" aria-hidden="true">↗</span><span class="sr">${escape(options.linkSuffix ?? " (opens in new tab)")}</span></a>` : options.selectableDocuments ? `<button type="button" part="document" data-document-id="${escape(i.id)}">${content}</button>` : `<span part="document">${content}</span>`}</li>`;
  }).join("")}</ul>`;
  return `${heading}<div part="table-frame" role="region" aria-label="${escape(block.title ?? "Results")}" tabindex="0"><table><thead><tr>${block.columns.map(c => `<th scope="col">${escape(c)}</th>`).join("")}</tr></thead><tbody>${block.rows.map(r => `<tr>${r.cells.map((cell, index) => index === 0 ? `<th scope="row">${r.status ? glyph(r.status) : ""}${escape(cell)}${r.note ? `<small>${escape(r.note)}</small>` : r.status ? `<span class="sr"> (${escape(verdict(r.status, options.labels))})</span>` : ""}</th>` : `<td>${escape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${block.footnote ? `<p>${escape(block.footnote)}</p>` : ""}`;
}
export const resultBlockStyles = `
:host { display:block; min-width:0; color:var(--boe-token-text-text,#222); font:inherit; }
:host([hidden]){display:none !important} *{box-sizing:border-box} h3{font-size:var(--boe-result-title-size,1em);margin:0 0 .5rem} :host([title-style="eyebrow"]) h3{font-size:.72em;letter-spacing:.08em;text-transform:uppercase;color:var(--boe-token-text-text-secondary,#666)} dl,ul{padding:0;margin:0;list-style:none}
[part="row"]{border-bottom:1px solid var(--boe-token-stroke-stroke,#ddd);padding:.7rem 0;display:flex;gap:.6rem;align-items:baseline}
dt{color:var(--boe-token-text-text-secondary,#666)} dd{margin:0 0 0 auto;font-variant-numeric:tabular-nums}
[part="facts"] [part="row"]{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);overflow-wrap:anywhere}
[part="facts"] dd{margin:0;text-align:end}
@container boe-result-block (max-width:28rem){[part="facts"] [part="row"]{grid-template-columns:minmax(0,1fr);gap:.25rem}[part="facts"] dd{text-align:start}}
p{margin:.25rem 0;color:var(--boe-token-text-text-secondary,#666)} small{display:block;font-weight:normal;color:var(--boe-token-text-text-secondary,#666)}
[part="verdict"]{margin-left:auto;text-align:right} [data-status="warn"]{color:var(--boe-token-text-status-text-warning,#946400)} [data-status="fail"]{color:var(--boe-token-text-status-text-error,#c52a46)}
[part="document"]{display:flex;gap:.6rem;align-items:center;width:100%;text-align:left;color:inherit;font:inherit;background:none;border:0;text-decoration:none;cursor:pointer}
span[part="document"]{cursor:default}
[part="table-frame"]{overflow:auto;max-width:100%} table{border-collapse:collapse;min-width:100%;font-variant-numeric:tabular-nums} td,th{padding:.7rem;text-align:left;border-bottom:1px solid var(--boe-token-stroke-stroke,#ddd)} td:last-child{font-weight:600}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
[part="block"]{${boeEntrance()}${boeStaggerStyles};margin-block:1rem;min-width:0;container:boe-result-block / inline-size}
${boeEntranceKeyframes}${boeStatusStyles}${boeReducedMotionPolicy}`;
const DEFAULT_TAG_NAME = "box-result-blocks";
export class ResultBlocks extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] { return ["title-style", "link-suffix", "selectable-documents"]; }
  private value: ResultBlock[] = [];
  private verdictLabels: Partial<ResultLabels> = {};
  private renderedBlocks = new Map<string, HTMLElement>();
  private blockValues = new WeakMap<HTMLElement, ResultBlock>();
  get blocks(): ResultBlock[] { return this.value; }
  set blocks(value: ResultBlock[]) { this.value = value; if (this.isRendered) this.update(); }
  get labels(): Partial<ResultLabels> { return this.verdictLabels; }
  set labels(value: Partial<ResultLabels>) { this.verdictLabels = value; if (this.isRendered) this.update(); }
  get selectableDocuments(): boolean { return this.hasAttribute("selectable-documents"); }
  set selectableDocuments(value: boolean) { this.toggleAttribute("selectable-documents", value); }
  get documentIds(): string[] { return resultDocumentIds(this.value); }
  protected renderTemplate(): void { this.shadowRoot!.innerHTML = `<style>${resultBlockStyles}</style><div part="blocks"></div>`; }
  protected setupListeners(): void {
    this.shadowRoot!.addEventListener("click", event => {
      // Capture-time refresh may detach the clicked label. The original path
      // still identifies its control and block; live ownership rejects removal.
      const path = event.composedPath();
      const ownedPath = path.slice(0, path.indexOf(this.shadowRoot!));
      const row = ownedPath.find(node => node instanceof HTMLElement && node.matches("[data-document-id]")) as HTMLElement | undefined;
      if (!row) return;
      const section = ownedPath.find(node => node instanceof HTMLElement && node.matches('[part="block"]')) as HTMLElement | undefined;
      const block = section && [...this.renderedBlocks.values()].includes(section) && section.contains(row)
        ? this.blockValues.get(section) : undefined;
      const item = block?.type === "documents" ? block.items.find(item => item.id === row.dataset.documentId) : undefined;
      const interactive = item && ((item.href && isSafeHref(item.href)) || this.selectableDocuments);
      // A capture listener can replace/remove the document before this click.
      // Never activate a removed record or navigate a superseded unsafe link.
      if (!interactive || (row.tagName === "A" && (!item?.href || !isSafeHref(item.href)))) event.preventDefault();
      if (interactive) this.dispatchEvent(new CustomEvent("document-selected", { bubbles: true, composed: true, detail: { id: row.dataset.documentId } }));
    });
  }
  protected update(): void {
    const focus = captureOwnedFocus(this);
    const parent = this.shadowRoot!.querySelector('[part="blocks"]')!;
    const counts = new Map<string, number>();
    for (const block of this.value) if (typeof block.id === "string") counts.set(block.id, (counts.get(block.id) ?? 0) + 1);
    const next = new Map<string, HTMLElement>();
    this.value.forEach((block, index) => {
      const key = typeof block.id === "string" && counts.get(block.id) === 1
        ? JSON.stringify(["id", block.type, block.id]) : JSON.stringify(["index", block.type, index]);
      let node = this.renderedBlocks.get(key);
      const options: ResultRenderOptions = { labels: this.verdictLabels, linkSuffix: this.getAttribute("link-suffix") ?? undefined, selectableDocuments: this.selectableDocuments };
      const signature = JSON.stringify([block, options]);
      if (!node) { node = document.createElement("section"); node.setAttribute("part", "block"); }
      node.setAttribute("aria-label", block.title ?? ({facts:"Facts",checks:"Checks",table:"Results",documents:"Documents"}[block.type]));
      node.style.setProperty("--i", String(index));
      if (node.dataset.signature !== signature) {
        const template = document.createElement("template");
        template.innerHTML = renderResultBlock(block, options);
        refreshOwnedControls(node, template.content, "[data-document-id], [part=table-frame]", control =>
          control.dataset.documentId !== undefined ? `document:${control.dataset.documentId}` : "table-frame");
        node.replaceChildren(template.content); node.dataset.signature = signature;
      }
      this.blockValues.set(node, block);
      next.set(key, node);
      if (parent.children[index] !== node) parent.insertBefore(node, parent.children[index] ?? null);
    });
    const retained = new Set(next.values());
    for (const node of Array.from(parent.children)) if (!retained.has(node as HTMLElement)) node.remove();
    this.renderedBlocks = next;
    restoreOwnedFocus(this, focus);
  }
}
ResultBlocks.register();
