import { boePanel } from "../../foundations/geometry/index.js";
import { CommentThread } from "../comments/index.js";
import type { CommentAction, CommentEntry, CommentSubmittedDetail } from "../comments/index.js";

const DEFAULT_TAG_NAME = "box-annotation-thread";

/** @deprecated Prefer `CommentAction`; kept so existing hosts keep compiling. */
export type AnnotationThreadAction = CommentAction;

/** @deprecated Prefer `CommentSubmittedDetail`. */
export type AnnotationThreadEntrySubmittedDetail = CommentSubmittedDetail;

/**
 * An annotation comment.
 *
 * A comment plus `toolLabel` — which annotation tool produced it (highlight,
 * draw, stamp). That field is the only thing an annotation entry adds, which is
 * why the rest of the model lives in `patterns/comments`.
 */
export type AnnotationThreadEntry = CommentEntry & {
  toolLabel?: string;
};

/**
 * Where in the document a thread is attached.
 *
 * Every field is optional because anchors arrive in different shapes: a page
 * number alone for a page-level note, a region for a drawn box, a quote for
 * selected text. A thread with no anchor at all is a comment, and belongs on
 * `box-comment-thread` instead.
 */
export type AnnotationAnchor = {
  page?: number;
  quote?: string;
  region?: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
};

const anchorStyles = `
        [part="anchor"] {
          display: grid;
          gap: 0.3rem;
          padding: 0.45rem 0.55rem;
          border-inline-start: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 45%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
        }

        [part="anchor-location"] {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        /* Quoted document text, so it reads as a citation rather than as one of
           the comments below it. */
        [part="anchor-quote"] {
          margin: 0;
          color: var(--boe-token-text-text, #1f1e1b);
          font-style: italic;
          line-height: 1.5;
        }
      `;

/**
 * A comment thread anchored to a place in a document.
 *
 * This is `box-comment-thread` plus the anchor. The distinction is the whole
 * point: comments stand on their own — on a file, a task, a contract clause —
 * and only become annotations when something ties them to a page, a region, or
 * a run of selected text. Hosts that want the former should reach for
 * `box-comment-thread` directly rather than for an annotation with no anchor.
 *
 * Every attribute, part and event of the underlying thread is inherited
 * unchanged, so this remains a drop-in for the previous implementation.
 */
export class AnnotationThread extends CommentThread {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return [...CommentThread.observedAttributes, "anchor"];
  }

  private anchorEl: HTMLElement | null = null;

  protected threadStyles(): string {
    return `${super.threadStyles()}\n${anchorStyles}`;
  }

  protected headerExtras(): string {
    return `
          <div part="anchor" hidden>
            <span part="anchor-location"></span>
            <blockquote part="anchor-quote" hidden></blockquote>
          </div>
    `;
  }

  protected defaultHeading(): string {
    return "Annotation Thread";
  }

  protected emptyText(): string {
    return "No annotation thread entries available.";
  }

  protected defaultComposerLabel(): string {
    return "Reply";
  }

  protected defaultPlaceholder(): string {
    return "Add a reply";
  }

  /**
   * Annotations name their pill `toolLabel`. Mapping it here keeps that
   * vocabulary for existing hosts while the base model stays generic.
   */
  protected entryBadge(entry: AnnotationThreadEntry): string | undefined {
    return entry.toolLabel ?? entry.badge;
  }

  /** Where in the document this thread sits. Null when unanchored. */
  get anchor(): AnnotationAnchor | null {
    return this.parseJsonAttribute<AnnotationAnchor | null>("anchor", null);
  }

  set anchor(value: AnnotationAnchor | null) {
    if (!value) {
      this.removeAttribute("anchor");
      return;
    }

    this.setAttribute("anchor", JSON.stringify(value));
  }

  get entries(): AnnotationThreadEntry[] {
    return super.entries as AnnotationThreadEntry[];
  }

  set entries(value: AnnotationThreadEntry[]) {
    super.entries = value;
  }

  /**
   * The anchor in words.
   *
   * A region is described by its page rather than by its coordinates: the
   * numbers locate the highlight for the renderer, but they tell a reader
   * nothing, and a screen reader least of all.
   */
  private anchorLocation(anchor: AnnotationAnchor): string {
    if (typeof anchor.page === "number" && Number.isFinite(anchor.page)) {
      return anchor.region ? `Page ${anchor.page} · region` : `Page ${anchor.page}`;
    }

    if (anchor.region) {
      return "Region";
    }

    return anchor.quote ? "Selected text" : "";
  }

  protected update(): void {
    super.update();

    if (!this.shadowRoot) {
      return;
    }

    this.anchorEl ??= this.shadowRoot.querySelector('[part="anchor"]');
    if (!this.anchorEl) {
      return;
    }

    const anchor = this.anchor;
    const location = anchor ? this.anchorLocation(anchor) : "";
    const quote = anchor?.quote ?? "";
    // Hidden only when the anchor says nothing renderable — an anchor carrying
    // just a region still names its page, and a quote alone still shows.
    this.anchorEl.hidden = !location && !quote;

    const locationEl = this.anchorEl.querySelector('[part="anchor-location"]') as HTMLElement | null;
    if (locationEl) {
      locationEl.hidden = !location;
      locationEl.textContent = location;
    }

    const quoteEl = this.anchorEl.querySelector('[part="anchor-quote"]') as HTMLElement | null;
    if (quoteEl) {
      quoteEl.hidden = !quote;
      quoteEl.textContent = quote;
    }
  }
}

AnnotationThread.register();
