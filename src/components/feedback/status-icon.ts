import { BaseElement } from "../../core/element.js";
import { boeStatusGlyph, boeStatusStyles, statusLabel, toStatusKind, type StatusKind } from "../../foundations/status/index.js";
import { boeEntranceKeyframes, boeReducedMotionPolicy } from "../../foundations/motion/index.js";
const DEFAULT_TAG_NAME = "box-status-icon";
export class StatusIcon extends BaseElement {
  static readonly tagName = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] { return ["kind"]; }
  get kind(): StatusKind { return toStatusKind(this.getAttribute("kind") ?? "pending"); }
  set kind(value: StatusKind) { this.setAttribute("kind", value); }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>:host{display:inline-flex} :host([hidden]){display:none !important}
    .label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    ${boeEntranceKeyframes}${boeStatusStyles}${boeReducedMotionPolicy}</style><span part="glyph"></span><span class="label" part="label"></span>`;
  }
  protected update(): void {
    if (!this.isRendered) return;
    const glyph = this.shadowRoot!.querySelector('[part="glyph"]')!;
    if (glyph.getAttribute("data-kind") !== this.kind) {
      glyph.setAttribute("data-kind", this.kind); glyph.innerHTML = boeStatusGlyph(this.kind);
    }
    this.shadowRoot!.querySelector('[part="label"]')!.textContent = statusLabel(this.kind);
  }
}
StatusIcon.register();
