import { AnimationOptionsElement, chartAnimationAttributes } from "./animation-options.js";
import { ChartMotion } from "./chart-motion.js";

export { chartAnimationAttributes } from "./chart-motion.js";
export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";

/** Shared, opt-in presentation lifecycle. Source data and selection stay host owned. */
export abstract class ChartElement extends AnimationOptionsElement {
  private readonly motion = new ChartMotion(this);
  replayAnimation(): void { this.motion.replay(); }
  finishAnimation(): void { this.motion.finish(); }
  connectedCallback(): void {
    this.upgradeAnimationProperties();
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
  protected invalidateAnimationData(): void { this.motion.dataChanged(); }
  protected update(): void { this.renderChart(); this.motion.rendered(); }
  protected abstract renderChart(): void;
}
