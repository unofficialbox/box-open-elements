import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-progress-steps";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * Explicit per-step status. Absent means the step derives complete / current /
 * upcoming from its position relative to `value` — the behaviour existing
 * hosts rely on. An explicit status wins over the positional derivation:
 * `complete` marks out-of-order completion, `blocked` and `disabled` make the
 * step non-interactive, `failed` stays interactive because a failed step is
 * usually exactly where the user needs to go.
 */
export type ProgressStepStatus = "complete" | "blocked" | "failed" | "disabled";

export interface ProgressStepItem {
  description?: string;
  label: string;
  value: string;
  status?: ProgressStepStatus;
  /** Short visible note under the label explaining the status ("Waiting on legal review"). */
  statusNote?: string;
}

export type ProgressStepState = "current" | "upcoming" | ProgressStepStatus;

export interface ResolvedProgressStep {
  item: ProgressStepItem;
  state: ProgressStepState;
  /**
   * True on the step `value` points at, whatever its status — currency is
   * position, status is condition, and the two are stated separately so a
   * failed step can still be the one the user is on.
   */
  isCurrent: boolean;
  /** Blocked and disabled steps take no clicks and no focus. */
  interactive: boolean;
}

const STEP_STATUSES = new Set<ProgressStepStatus>(["complete", "blocked", "failed", "disabled"]);

/** Attribute payloads are author input — validate every record. */
export const isProgressStepRecord = (value: unknown): value is ProgressStepItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const step = value as Record<string, unknown>;
  return (
    typeof step.value === "string" &&
    step.value.length > 0 &&
    typeof step.label === "string" &&
    step.label.length > 0 &&
    (step.status === undefined || STEP_STATUSES.has(step.status as ProgressStepStatus)) &&
    // Non-string text fields would reach escapeHtml and throw mid-render.
    (step.description === undefined || typeof step.description === "string") &&
    (step.statusNote === undefined || typeof step.statusNote === "string")
  );
};

/**
 * The state rules, pure and DOM-free, so a host can drive its own surface
 * (or decide whether "Continue" is enabled) from the same function the
 * component renders from. An unknown `value` falls back to the first step,
 * matching the component's long-standing behaviour.
 */
export const resolveStepStates = (
  items: readonly ProgressStepItem[],
  value: string,
): ResolvedProgressStep[] => {
  const currentIndex = Math.max(
    0,
    items.findIndex(item => item.value === value),
  );
  return items.map((item, index) => {
    const positional: ProgressStepState =
      index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
    const state = item.status ?? positional;
    return {
      item,
      state,
      isCurrent: index === currentIndex,
      interactive: state !== "blocked" && state !== "disabled",
    };
  });
};

/** Every state in words — colour never carries the meaning alone. */
export const STEP_STATE_LABEL: Record<ProgressStepState, string> = {
  complete: "Complete",
  current: "Current step",
  upcoming: "Not started",
  blocked: "Blocked",
  failed: "Failed",
  disabled: "Unavailable",
};

const progressStepsStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

  [part="steps"] {
    display: grid;
    gap: 0.55rem;
  }

  [part="step"] {
    appearance: none;
    display: flex;
    align-items: start;
    gap: 0.55rem;
    width: 100%;
    text-align: left;
    padding: 0.55rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 56%, transparent);
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface, #ffffff);
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="step"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="step"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }

  [part="step"][data-state="current"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
  }

  [part="marker"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.78rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="step"][data-state="complete"] [part="marker"] {
    border-color: transparent;
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 62%, var(--boe-token-text-text, #222222));
  }

  [part="step"][data-state="current"] [part="marker"] {
    border-color: transparent;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="content"] {
    display: grid;
    gap: 0.2rem;
    padding-top: 0.1rem;
  }

  [part="step-label"] {
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="step"][data-state="upcoming"] [part="step-label"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="step-description"] {
    font-size: 0.86rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.45;
  }

  [part="step"]:disabled {
    cursor: not-allowed;
    background: var(--boe-token-surface-surface, #ffffff);
  }

  [part="step"][data-state="blocked"] [part="step-label"],
  [part="step"][data-state="disabled"] [part="step-label"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="step"][data-state="blocked"] [part="marker"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 18%, var(--boe-token-surface-surface, #ffffff) 82%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 52%, var(--boe-token-text-text, #222222));
  }

  [part="step"][data-state="failed"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 34%, transparent);
  }

  [part="step"][data-state="failed"] [part="marker"] {
    border-color: transparent;
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 72%, black 28%);
  }

  [part="step"][data-state="disabled"] {
    opacity: 0.62;
  }

  /* The status, in words: visible for the conditions a user must not miss. */
  [part="step-status"] {
    font-size: 0.8rem;
    font-weight: 700;
  }

  [part="step"][data-state="blocked"] [part="step-status"] {
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 48%, var(--boe-token-text-text, #222222));
  }

  [part="step"][data-state="failed"] [part="step-status"] {
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 76%, black 24%);
  }

  [part="step-status-note"] {
    font-size: 0.82rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  .boe-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    clip: rect(0, 0, 0, 0);
    overflow: hidden;
    white-space: nowrap;
  }
`;

export class ProgressSteps extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private valueInternal = "";
  private stepsEl!: HTMLElement;
  private liveEl!: HTMLElement;
  private itemsSignature = "";

  get label(): string {
    return this.getAttribute("label") ?? "Progress Steps";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): ProgressStepItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.every(isProgressStepRecord)
        ? (parsed as ProgressStepItem[])
        : [];
    } catch {
      return [];
    }
  }

  set items(value: ProgressStepItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  /** The resolved states — same objects the render uses. */
  get resolvedSteps(): ResolvedProgressStep[] {
    return resolveStepStates(this.items, this.valueInternal);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${progressStepsStyles}</style>
      <div part="steps" role="group"></div>
      <div part="live" class="boe-sr-only" aria-live="polite"></div>
    `;
    this.stepsEl = this.shadowRoot.querySelector('[part="steps"]')!;
    this.liveEl = this.shadowRoot.querySelector('[part="live"]')!;
  }

  protected setupListeners(): void {
    this.stepsEl.addEventListener("click", event => {
      const step = (event.target as HTMLElement).closest('[part="step"]') as HTMLButtonElement | null;
      if (!step || !this.stepsEl.contains(step)) {
        return;
      }

      const nextValue = step.dataset.value ?? "";
      if (!nextValue || nextValue === this.valueInternal) {
        return;
      }

      this.selectValue(nextValue);
    });

    this.stepsEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const step = (keyboardEvent.target as HTMLElement).closest('[part="step"]') as HTMLButtonElement | null;
      if (!step || !this.stepsEl.contains(step)) {
        return;
      }

      const resolved = this.resolvedSteps;
      const index = Array.from(this.stepsEl.querySelectorAll('[part="step"]')).indexOf(step);
      if (index < 0 || resolved.length === 0) {
        return;
      }

      // Arrows walk to the next *interactive* step — blocked and disabled
      // steps are skipped, not landed on and bounced off.
      const isInteractive = (candidate: number): boolean => resolved[candidate]?.interactive ?? false;
      const walk = (direction: 1 | -1): number => {
        for (let offset = 1; offset <= resolved.length; offset += 1) {
          const candidate = (((index + direction * offset) % resolved.length) + resolved.length) % resolved.length;
          if (isInteractive(candidate)) {
            return candidate;
          }
        }
        return -1;
      };

      let nextIndex: number;
      if (keyboardEvent.key === "ArrowRight" || keyboardEvent.key === "ArrowDown") {
        nextIndex = walk(1);
      } else if (keyboardEvent.key === "ArrowLeft" || keyboardEvent.key === "ArrowUp") {
        nextIndex = walk(-1);
      } else if (keyboardEvent.key === "Home") {
        nextIndex = resolved.findIndex(entry => entry.interactive);
      } else if (keyboardEvent.key === "End") {
        nextIndex = -1;
        for (let candidate = resolved.length - 1; candidate >= 0; candidate -= 1) {
          if (isInteractive(candidate)) {
            nextIndex = candidate;
            break;
          }
        }
      } else {
        return;
      }

      keyboardEvent.preventDefault();
      const nextStep = resolved[nextIndex];
      if (nextIndex < 0 || !nextStep) {
        return;
      }

      this.selectValue(nextStep.item.value);
      queueMicrotask(() => {
        const nextButton = this.stepsEl.querySelectorAll('[part="step"]')[nextIndex] as
          | HTMLButtonElement
          | undefined;
        nextButton?.focus();
      });
    });
  }

  private selectValue(nextValue: string): void {
    // Disabled buttons never emit clicks and the keyboard path skips them,
    // but the invariant should not depend on every caller knowing that.
    const resolved = resolveStepStates(this.items, this.valueInternal);
    const target = resolved.find(entry => entry.item.value === nextValue);
    if (!target || !target.interactive) {
      return;
    }

    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
    this.update();
    this.announceStep(target);
  }

  /** A polite announcement on user-driven step changes, never on render. */
  private announceStep(target: ResolvedProgressStep): void {
    if (!this.liveEl) {
      return;
    }
    const items = this.items;
    const position = items.findIndex(item => item.value === target.item.value) + 1;
    this.liveEl.textContent = `${target.item.label}, step ${String(position)} of ${String(items.length)}`;
  }

  /**
   * The tab stop lives on the current step — unless that step is blocked or
   * disabled (a host can point `value` anywhere), in which case the first
   * interactive step takes it so the group stays reachable.
   */
  private tabbableIndex(resolved: ResolvedProgressStep[]): number {
    const currentIndex = resolved.findIndex(entry => entry.isCurrent);
    if (resolved[currentIndex]?.interactive) {
      return currentIndex;
    }
    return resolved.findIndex(entry => entry.interactive);
  }

  protected update(): void {
    if (!this.stepsEl) {
      return;
    }

    const items = this.items;
    const activeIndex = Math.max(
      0,
      items.findIndex(item => item.value === this.valueInternal),
    );

    const selectedValue = items[activeIndex]?.value ?? "";
    if (selectedValue && selectedValue !== this.valueInternal) {
      this.valueInternal = selectedValue;
      this.setAttribute("value", selectedValue);
    }

    this.stepsEl.setAttribute("aria-label", this.label);

    const resolved = resolveStepStates(items, this.valueInternal);
    const tabbable = this.tabbableIndex(resolved);

    const signature = JSON.stringify(items);
    if (signature !== this.itemsSignature) {
      this.itemsSignature = signature;
      this.stepsEl.innerHTML = resolved
        .map((entry, index) => {
          const { item, state, isCurrent, interactive } = entry;
          // Blocked / failed / disabled are said out loud on the surface; the
          // positional states get a screen-reader word so colour and a number
          // are never the only carriers of the state.
          const explicitStatus = item.status
            ? `<span part="step-status">${STEP_STATE_LABEL[state]}</span>
               ${item.statusNote ? `<span part="step-status-note">${escapeHtml(item.statusNote)}</span>` : ""}`
            : `<span part="step-state" class="boe-sr-only">${STEP_STATE_LABEL[state]}</span>`;

          return `
            <button
              type="button"
              part="step"
              data-state="${state}"
              data-value="${escapeHtml(item.value)}"
              aria-current="${isCurrent ? "step" : "false"}"
              tabindex="${index === tabbable ? "0" : "-1"}"
              ${interactive ? "" : "disabled"}
            >
              <span part="marker">${index + 1}</span>
              <span part="content">
                <strong part="step-label">${escapeHtml(item.label)}</strong>
                ${explicitStatus}
                ${item.description ? `<span part="step-description">${escapeHtml(item.description)}</span>` : ""}
              </span>
            </button>
          `;
        })
        .join("");
      return;
    }

    this.stepsEl.querySelectorAll('[part="step"]').forEach((step, index) => {
      const entry = resolved[index];
      if (!entry) {
        return;
      }
      const button = step as HTMLButtonElement;
      button.dataset.state = entry.state;
      button.setAttribute("aria-current", entry.isCurrent ? "step" : "false");
      button.tabIndex = index === tabbable ? 0 : -1;
      button.disabled = !entry.interactive;
      // Positional states move with `value`; keep the spoken word in step.
      const stateWord = button.querySelector('[part="step-state"]');
      if (stateWord) {
        stateWord.textContent = STEP_STATE_LABEL[entry.state];
      }
    });
  }
}

ProgressSteps.register();
