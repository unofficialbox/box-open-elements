import { mapScrollPosition } from "./types.js";
import type { CompareSyncMode, ScrollMetrics } from "./types.js";
import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-compare-view";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const metricsOf = (element: HTMLElement): ScrollMetrics => ({
  scrollTop: element.scrollTop,
  scrollHeight: element.scrollHeight,
  clientHeight: element.clientHeight,
});

const elementStyles = `
        :host {
          display: block;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        /*
         * The height a host sets on the element has to reach the scrollers, or
         * the panes size to their content, never overflow, and the scroll lock
         * has nothing to do. Every link in the chain needs a definite height:
         * one auto-height ancestor and the frame's 100% resolves to content
         * height instead.
         */
        [part="host"] {
          block-size: 100%;
          min-block-size: 0;
        }

        [part="frame"] {
          border: ${boePanel.border};
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
          overflow: hidden;
          display: grid;
          grid-template-rows: auto 1fr;
          block-size: 100%;
          min-block-size: 0;
        }

        [part="toolbar"] {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 0.85rem;
          border-block-end: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
        }

        [part="heading"] {
          margin: 0;
          font: inherit;
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="sync-toggle"] {
          margin-inline-start: auto;
          appearance: none;
          font: inherit;
          font-size: 0.78rem;
          padding: 0.2rem 0.6rem;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: ${boeRadius.control};
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
        }

        [part="sync-toggle"][aria-pressed="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 38%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 80%, black 20%);
        }

        [part="sync-toggle"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="panes"] {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          min-block-size: 0;
        }

        [part="divider"] {
          background: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, transparent);
        }

        [part="pane"] {
          display: grid;
          grid-template-rows: auto 1fr;
          min-block-size: 0;
        }

        [part="pane-label"] {
          padding: 0.45rem 0.85rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          border-block-end: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 45%, transparent);
        }

        [part="scroller"] {
          overflow: auto;
          padding: 0.75rem 0.85rem;
          min-block-size: 0;
        }

        @media (prefers-reduced-motion: no-preference) {
          [part="scroller"] {
            scroll-behavior: auto;
          }
        }
      `;

/**
 * Side-by-side comparison shell with scroll-locked panes — doc-vs-doc review
 * for the cases the diff table cannot serve, where the two things being
 * compared are rendered documents rather than lines of text.
 *
 * The scroll maths lives in `mapScrollPosition`, which is pure, so the
 * interesting behaviour is testable without a layout engine and a host can
 * reuse it to drive its own panes.
 *
 * The subtle part is the **feedback loop**. Scrolling the left pane sets the
 * right pane's `scrollTop`, which fires the right pane's own scroll event,
 * which would scroll the left pane back — the two panes fight, and a slow
 * drag turns into a stutter. Each programmatic scroll therefore marks the
 * pane it is about to move, and that pane's next scroll event is swallowed.
 *
 * The mark is cleared immediately when the assignment does not actually move
 * the pane (already there, or clamped at an end): no scroll event will fire
 * in that case, so a mark left set would swallow the user's *next* real
 * scroll instead.
 */
export class CompareView extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["heading", "left-label", "right-label", "sync", "sync-mode"];
  }

  private hostEl!: HTMLElement;

  private leftEl!: HTMLElement;

  private rightEl!: HTMLElement;

  private toggleEl!: HTMLButtonElement;

  /** The pane whose next scroll event came from us, not from the user. */
  private echoPane: HTMLElement | null = null;

  get heading(): string {
    return this.getAttribute("heading") ?? "Compare";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get leftLabel(): string {
    return this.getAttribute("left-label") ?? "Before";
  }

  set leftLabel(value: string) {
    this.setAttribute("left-label", value);
  }

  get rightLabel(): string {
    return this.getAttribute("right-label") ?? "After";
  }

  set rightLabel(value: string) {
    this.setAttribute("right-label", value);
  }

  /** Scroll lock. On by default — comparing is the point of the component. */
  get sync(): boolean {
    return this.getAttribute("sync") !== "off";
  }

  set sync(value: boolean) {
    this.setAttribute("sync", value ? "on" : "off");
  }

  get syncMode(): CompareSyncMode {
    return this.getAttribute("sync-mode") === "absolute" ? "absolute" : "proportional";
  }

  set syncMode(value: CompareSyncMode) {
    this.setAttribute("sync-mode", value);
  }

  private syncFrom(source: HTMLElement, target: HTMLElement): void {
    if (this.echoPane === source) {
      // Our own doing — consume the mark and stop, or the panes fight.
      this.echoPane = null;
      return;
    }
    if (!this.sync) {
      return;
    }
    const next = mapScrollPosition(metricsOf(source), metricsOf(target), this.syncMode);
    const before = target.scrollTop;
    this.echoPane = target;
    target.scrollTop = next;
    if (target.scrollTop === before) {
      // Nothing moved, so no scroll event is coming; drop the mark rather
      // than let it swallow the next real scroll on that pane.
      this.echoPane = null;
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="host">
        <section part="frame">
          <div part="toolbar">
            <h3 part="heading"></h3>
            <button type="button" part="sync-toggle" aria-pressed="true"></button>
          </div>
          <div part="panes">
            <div part="pane" data-side="left">
              <div part="pane-label" id="compare-left-label"></div>
              <div part="scroller" data-side="left" tabindex="0" role="region" aria-labelledby="compare-left-label">
                <slot name="left"></slot>
              </div>
            </div>
            <div part="divider" role="presentation"></div>
            <div part="pane" data-side="right">
              <div part="pane-label" id="compare-right-label"></div>
              <div part="scroller" data-side="right" tabindex="0" role="region" aria-labelledby="compare-right-label">
                <slot name="right"></slot>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
    this.hostEl = this.shadowRoot.querySelector('[part="host"]')!;
    this.leftEl = this.shadowRoot.querySelector('[part="scroller"][data-side="left"]')!;
    this.rightEl = this.shadowRoot.querySelector('[part="scroller"][data-side="right"]')!;
    this.toggleEl = this.shadowRoot.querySelector('[part="sync-toggle"]')!;
  }

  protected setupListeners(): void {
    this.leftEl.addEventListener("scroll", () => {
      this.syncFrom(this.leftEl, this.rightEl);
    });
    this.rightEl.addEventListener("scroll", () => {
      this.syncFrom(this.rightEl, this.leftEl);
    });

    this.toggleEl.addEventListener("click", () => {
      const next = !this.sync;
      this.sync = next;
      this.dispatchEvent(
        new CustomEvent("sync-toggled", {
          detail: { sync: next },
          bubbles: true,
          composed: true,
        }),
      );
      if (next) {
        // Re-engaging should align immediately rather than waiting for the
        // next scroll, or the panes sit visibly out of step while claiming
        // to be locked.
        this.syncFrom(this.leftEl, this.rightEl);
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }
    const synced = this.sync;
    this.hostEl.querySelector('[part="heading"]')!.textContent = this.heading;
    this.hostEl.querySelector('[part="pane-label"][id="compare-left-label"]')!.textContent =
      this.leftLabel;
    this.hostEl.querySelector('[part="pane-label"][id="compare-right-label"]')!.textContent =
      this.rightLabel;
    this.toggleEl.textContent = synced ? "Scroll locked" : "Scroll unlocked";
    this.toggleEl.setAttribute("aria-pressed", String(synced));
    this.toggleEl.setAttribute(
      "aria-label",
      escapeHtml(synced ? "Scroll lock on, disable" : "Scroll lock off, enable"),
    );
  }
}

CompareView.register();
