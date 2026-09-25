import { BaseElement } from "../../core/element.js";
import { boeStatusDocumentStyles, boeStatusGlyph, statusLabel, toStatusKind, type StatusKind } from "../../foundations/status/index.js";
const DEFAULT_TAG_NAME = "box-status-icon";
export class StatusIcon extends BaseElement {
  static readonly tagName = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] { return ["kind", "label"]; }
  get kind(): StatusKind { return toStatusKind(this.getAttribute("kind") ?? "pending"); }
  set kind(value: StatusKind) { this.setAttribute("kind", value); }
  get label(): string { return this.getAttribute("label") ?? statusLabel(this.kind); }
  set label(value: string) { this.setAttribute("label", value); }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>:host{display:inline-flex} :host([hidden]){display:none !important}
    .label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    ${boeStatusDocumentStyles}</style><span part="glyph"></span><span class="label" part="label"></span>`;
  }
  protected update(): void {
    if (!this.isRendered) return;
    const glyph = this.shadowRoot!.querySelector('[part="glyph"]')!;
    if (glyph.getAttribute("data-kind") !== this.kind) {
      glyph.setAttribute("data-kind", this.kind); glyph.innerHTML = boeStatusGlyph(this.kind);
    }
    this.shadowRoot!.querySelector('[part="label"]')!.textContent = this.label;
  }
}
StatusIcon.register();
