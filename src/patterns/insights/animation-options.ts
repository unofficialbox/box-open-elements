import { BaseElement } from "../../core/index.js";

export const chartAnimationAttributes = ["animated", "animation-preset", "animation-duration", "animation-delay", "animation-stagger", "animation-easing", "animation-loop", "animation-paused"];
export type ChartAnimationPreset = "auto" | "fade" | "delay" | "drop" | "loop" | "progressive" | "progressive-easing";
export type ChartAnimationEasing = "linear" | "ease-out-quad" | "ease-out-cubic" | "ease-out-quart" | "ease-out-quint" | "ease-in-quad" | "ease-in-cubic" | "ease-in-quart" | "ease-in-quint" | "ease-in-out-sine" | "ease-out-bounce" | "ease-in-out-elastic";

/** Lightweight reflected animation options; no chart runtime is loaded here. */
export abstract class AnimationOptionsElement extends BaseElement {
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
  private numberOption(name: string, fallback: number): number {
    const raw = this.getAttribute(name), value = Number(raw);
    return raw !== null && raw.trim() !== "" && Number.isFinite(value) && value >= 0 ? Math.min(value, 60000) : fallback;
  }
  protected upgradeAnimationProperties(): void {
    this.upgradeProperties(["animated", "animationPreset", "animationDuration", "animationDelay", "animationStagger", "animationEasing", "animationLoop", "animationPaused"]);
  }
}
