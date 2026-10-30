import { BaseElement } from "../../core/index.js";
import { ChartMotion, chartAnimationAttributes, type ChartAnimationPreset, type ChartAnimationEasing } from "./chart-motion.js";

export { chartAnimationAttributes } from "./chart-motion.js";
export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";

/** Shared, opt-in presentation lifecycle. Source data and selection stay host owned. */
export abstract class ChartElement extends BaseElement {
  private readonly motion = new ChartMotion(this);
  get animated(): boolean { return this.hasAttribute("animated"); }
  set animated(value: boolean) { this.toggleAttribute("animated", value); }
  get animationPreset(): ChartAnimationPreset { const value=this.getAttribute("animation-preset");return (["auto","fade","delay","drop","loop","progressive","progressive-easing"].includes(value??"")?value:"auto") as ChartAnimationPreset; }
  set animationPreset(value: ChartAnimationPreset) { this.setAttribute("animation-preset", value); }
  get animationDuration(): number { return this.numberOption("animation-duration", 600); }
  set animationDuration(value: number) { this.setAttribute("animation-duration", String(value)); }
  get animationDelay(): number { return this.numberOption("animation-delay", 0); }
  set animationDelay(value: number) { this.setAttribute("animation-delay", String(value)); }
  get animationStagger(): number { return this.numberOption("animation-stagger", 40); }
  set animationStagger(value: number) { this.setAttribute("animation-stagger", String(value)); }
  get animationEasing(): ChartAnimationEasing { const value=this.getAttribute("animation-easing");return (["linear","ease-out-quad","ease-out-cubic","ease-out-quart","ease-out-quint","ease-in-quad","ease-in-cubic","ease-in-quart","ease-in-quint","ease-in-out-sine","ease-out-bounce","ease-in-out-elastic"].includes(value??"")?value:"ease-out-cubic") as ChartAnimationEasing; }
  set animationEasing(value: ChartAnimationEasing) { this.setAttribute("animation-easing", value); }
  get animationLoop(): boolean { return this.hasAttribute("animation-loop"); }
  set animationLoop(value: boolean) { this.toggleAttribute("animation-loop", value); }
  get animationPaused(): boolean { return this.hasAttribute("animation-paused"); }
  set animationPaused(value: boolean) { this.toggleAttribute("animation-paused", value); }
  replayAnimation(): void { this.motion.replay(); }
  finishAnimation(): void { this.motion.finish(); }
  private numberOption(name: string, fallback: number): number {
    const raw = this.getAttribute(name), value = Number(raw);
    return raw !== null && Number.isFinite(value) && value >= 0 ? Math.min(value, 60000) : fallback;
  }
  connectedCallback(): void {
    this.upgradeProperties(["animated", "animationPreset", "animationDuration", "animationDelay", "animationStagger", "animationEasing", "animationLoop", "animationPaused"]);
    this.motion.connect();
    super.connectedCallback();
  }
  disconnectedCallback(): void { this.motion.disconnect(); super.disconnectedCallback(); }
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (chartAnimationAttributes.includes(name)) {
      if (oldValue !== newValue && this.isRendered) this.motion.rendered(name !== "animation-paused");
      return;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }
  protected update(): void { this.renderChart(); this.motion.rendered(); }
  protected abstract renderChart(): void;
}
