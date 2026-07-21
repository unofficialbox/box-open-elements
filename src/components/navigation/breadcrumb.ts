import { BaseElement } from "../../core/index.js";
import { boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-breadcrumb";

export interface BreadcrumbItem {
  label: string;
  /** Optional link target. Omit for a purely JS-driven crumb. */
  href?: string;
  /** Value reported on `navigate`; defaults to `href` or `label`. */
  value?: string;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const breadcrumbStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="list"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${boeSpace[1]};
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 13px;
  }

  [part="crumb"] {
    display: inline-flex;
    align-items: center;
  }

  [part="link"] {
    appearance: none;
    border: none;
    background: none;
    font: inherit;
    padding: 2px 6px;
    border-radius: ${boeRadius.med};
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    text-decoration: none;
    cursor: pointer;
    max-width: 22ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition:
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="link"]:hover {
    color: var(--boe-token-text-text, #222222);
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
  }

  [part="link"]:focus-visible {
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
    outline-offset: 1px;
  }

  [part="link"][aria-current="page"] {
    color: var(--boe-token-text-text, #222222);
    font-weight: 600;
    cursor: default;
  }

  [part="separator"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    user-select: none;
  }

  [part="ellipsis"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    padding: 0 2px;
  }
`;

/** A collapsed marker inserted when the trail exceeds `max-items`. */
const ELLIPSIS = Symbol("ellipsis");
type Crumb = BreadcrumbItem | typeof ELLIPSIS;

/**
 * File-path breadcrumb trail with overflow collapse — box-ui-elements
 * `Breadcrumb`. When the trail is longer than `max-items` the middle crumbs
 * collapse into an ellipsis, always keeping the first crumb and the last two.
 */
export class BoxBreadcrumbElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "max-items"];
  }

  private listEl!: HTMLElement;

  get items(): BreadcrumbItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as BreadcrumbItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BreadcrumbItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Breadcrumb";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  /** Max crumbs shown before the middle collapses to an ellipsis. 0 disables collapse. */
  get maxItems(): number {
    const raw = Number(this.getAttribute("max-items"));
    return Number.isFinite(raw) && raw > 0 ? raw : 4;
  }

  set maxItems(value: number) {
    this.setAttribute("max-items", String(value));
  }

  /** Keep the first crumb + last two, collapsing the middle into an ellipsis. */
  private collapse(items: BreadcrumbItem[]): Crumb[] {
    const max = this.maxItems;
    if (items.length <= max) {
      return items;
    }
    return [items[0], ELLIPSIS, ...items.slice(-2)];
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>${breadcrumbStyles}</style>
      <nav part="nav">
        <ol part="list"></ol>
      </nav>
    `;
    this.listEl = this.shadowRoot.querySelector('[part="list"]')!;
  }

  protected setupListeners(): void {
    this.listEl.addEventListener("click", event => {
      const link = (event.target as HTMLElement).closest<HTMLElement>('[part="link"]');
      if (!link || link.getAttribute("aria-current") === "page") {
        return;
      }
      const value = link.dataset.value ?? "";
      const href = link.getAttribute("href") ?? undefined;
      // JS-only crumbs (no href) shouldn't navigate the browser.
      if (!href) {
        event.preventDefault();
      }
      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: true,
          composed: true,
          detail: { value, href },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.listEl) {
      return;
    }

    this.shadowRoot?.querySelector('[part="nav"]')?.setAttribute("aria-label", this.label);

    const crumbs = this.collapse(this.items);
    const lastIndex = crumbs.length - 1;

    this.listEl.innerHTML = crumbs
      .map((crumb, index) => {
        const separator =
          index < lastIndex ? `<span part="separator" aria-hidden="true">/</span>` : "";
        if (crumb === ELLIPSIS) {
          return `<li part="crumb"><span part="ellipsis" aria-label="Hidden path">…</span>${separator}</li>`;
        }
        const isLast = index === lastIndex;
        const value = escapeHtml(crumb.value ?? crumb.href ?? crumb.label);
        const tag = crumb.href && !isLast ? "a" : "button";
        const hrefAttr = crumb.href && !isLast ? ` href="${escapeHtml(crumb.href)}"` : "";
        const typeAttr = tag === "button" ? ' type="button"' : "";
        const current = isLast ? ' aria-current="page"' : "";
        return `<li part="crumb"><${tag} part="link" data-value="${value}"${hrefAttr}${typeAttr}${current}>${escapeHtml(crumb.label)}</${tag}>${separator}</li>`;
      })
      .join("");
  }
}

export const defineBoxBreadcrumbElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxBreadcrumbElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxBreadcrumbElement;
  }

  customElements.define(tagName, BoxBreadcrumbElement);
  return BoxBreadcrumbElement;
};
