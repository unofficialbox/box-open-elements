/**
 * Heading markup helpers so `heading` attributes expose real document outline
 * semantics (`<h*>`) instead of `<div>` / `<strong part="title">`.
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type RenderHeadingOptions = {
  /** Heading level. Defaults to 2 (section-level). */
  level?: HeadingLevel;
  /** Space-separated `part` tokens. Defaults to `"title"`. */
  part?: string;
  id?: string;
  hidden?: boolean;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * Render a native heading element with escaped text.
 * Keep `part="title"` so existing `::part(title)` / `[part="title"]` styles apply.
 */
export const renderHeadingHtml = (text: string, options: RenderHeadingOptions = {}): string => {
  const level = options.level ?? 2;
  const part = options.part ?? "title";
  const idAttr = options.id ? ` id="${escapeHtml(options.id)}"` : "";
  const hiddenAttr = options.hidden ? " hidden" : "";
  return `<h${level} part="${escapeHtml(part)}"${idAttr}${hiddenAttr}>${escapeHtml(text)}</h${level}>`;
};

/**
 * Open tag for headings whose text is set later via `textContent`
 * (avoids double-escaping when content is assigned from JS).
 */
export const headingOpenTag = (options: RenderHeadingOptions = {}): string => {
  const level = options.level ?? 2;
  const part = options.part ?? "title";
  const idAttr = options.id ? ` id="${escapeHtml(options.id)}"` : "";
  const hiddenAttr = options.hidden ? " hidden" : "";
  return `<h${level} part="${escapeHtml(part)}"${idAttr}${hiddenAttr}>`;
};

export const headingCloseTag = (level: HeadingLevel = 2): string => `</h${level}>`;

/** CSS reset so native headings inherit component typography instead of UA margins. */
export const boeHeadingResetStyles = (selector: string): string => `
  ${selector} {
    margin: 0;
    font: inherit;
  }
`;
