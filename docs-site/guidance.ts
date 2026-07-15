/**
 * Usage / Best-practices / Keyboard guidance for the docs site.
 *
 * Content rule: every bullet must come from authored workshop metadata or the
 * shared accessibility contract — never invented per-component placeholder copy.
 * Cards that resolve to zero bullets are omitted by the caller.
 */
import workshop from "../storybook/generated/workshop.json" with { type: "json" };

export interface ComponentUsageGuidance {
  shortDescription: string;
  docsDescription: string;
}

/** Workshop-authored usage copy keyed by catalog id (only surfaces with stories). */
export const usageById: Record<string, ComponentUsageGuidance> = Object.fromEntries(
  workshop.stories.map(story => [
    story.id,
    {
      shortDescription: story.shortDescription,
      docsDescription: story.docsDescription,
    },
  ]),
);

/** Roles that use Arrow / Home / End roving focus (docs/foundations/accessibility.md). */
const COMPOSITE_ROLES = new Set([
  "listbox",
  "option",
  "tree",
  "treeitem",
  "treegrid",
  "radiogroup",
  "radio",
  "tablist",
  "tab",
  "menu",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "toolbar",
  "grid",
  "row",
  "gridcell",
  "rowheader",
  "columnheader",
]);

/** Roles where Enter/Space activate the focused item. */
const ACTIVATE_ROLES = new Set([
  "button",
  "option",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "tab",
  "treeitem",
  "switch",
  "checkbox",
  "radio",
]);

/** Transient surfaces dismissed with Escape. */
const ESCAPE_ROLES = new Set(["dialog", "alertdialog", "menu", "tooltip"]);

const SELECTION_ROLES = new Set(["listbox", "option", "tab", "tablist", "tree", "treeitem"]);
const CHECKED_ROLES = new Set(["checkbox", "radio", "switch", "menuitemcheckbox", "menuitemradio"]);
const FORM_ROLES = new Set([
  "textbox",
  "searchbox",
  "spinbutton",
  "slider",
  "combobox",
  "listbox",
]);

const hasAny = (roles: Set<string>, candidates: Set<string>): boolean => {
  for (const role of candidates) {
    if (roles.has(role)) {
      return true;
    }
  }
  return false;
};

/** Keyboard bullets derived from roles detected in the live preview. */
export const keyboardGuidanceForRoles = (roles: Iterable<string>): string[] => {
  const set = new Set(roles);
  const bullets: string[] = [];

  if (hasAny(set, COMPOSITE_ROLES)) {
    bullets.push(
      "Arrow keys move focus inside ordered composite widgets; Home and End jump to the first and last item.",
    );
  }

  if (hasAny(set, ACTIVATE_ROLES)) {
    bullets.push("Enter and Space activate the currently focused item when activation is expected.");
  }

  if (hasAny(set, ESCAPE_ROLES)) {
    bullets.push(
      "Escape dismisses transient surfaces such as dialogs, drawers, popovers, tooltips, and menus.",
    );
  }

  return bullets;
};

/**
 * Best-practice bullets from the shared accessibility contract, filtered by
 * roles present in the preview. Empty when nothing maps.
 */
export const bestPracticesForRoles = (roles: Iterable<string>): string[] => {
  const set = new Set(roles);
  const bullets: string[] = [];

  if (set.size > 0) {
    bullets.push(
      "Expose an accessible name with `label`, visible text, or an explicit `aria-label`.",
    );
  }

  if (hasAny(set, SELECTION_ROLES)) {
    bullets.push(
      "Prefer `aria-selected` for selection state in listbox, tab, tree, and similar composites.",
    );
  }

  if (hasAny(set, CHECKED_ROLES)) {
    bullets.push("Prefer `aria-checked` for boolean and radio-like selection state.");
  }

  if (set.has("treeitem")) {
    bullets.push("Prefer `aria-expanded` for collapsible branches and disclosure controls.");
  }

  if (set.has("progressbar")) {
    bullets.push(
      "Expose `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext` on progress indicators.",
    );
  }

  if (set.has("status")) {
    bullets.push("Use `role=\"status\"` or `aria-live` for transient feedback that should be announced.");
  }

  if (set.has("note")) {
    bullets.push("Use `role=\"note\"` for passive supporting guidance such as inline help text.");
  }

  if (set.has("alert")) {
    bullets.push(
      "Dismissive or destructive controls should expose intent explicitly (for example `Dismiss alert`).",
    );
  }

  if (hasAny(set, FORM_ROLES)) {
    bullets.push(
      "Form-associated controls use `name`, and surface validation with `invalid` + `error-message` (`aria-invalid` / `aria-errormessage`).",
    );
  }

  return bullets;
};

export interface PreviewGuidance {
  usage: ComponentUsageGuidance | null;
  usageNote: string | null;
  keyboard: string[];
  bestPractices: string[];
}

/** Assemble the guidance cards for a catalog entry from real sources only. */
export const resolvePreviewGuidance = (args: {
  catalogId: string;
  roles: Iterable<string>;
  exampleNote?: string | null;
}): PreviewGuidance => {
  const usage = usageById[args.catalogId] ?? null;
  const usageNote = args.exampleNote?.trim() ? args.exampleNote.trim() : null;
  return {
    usage,
    usageNote,
    keyboard: keyboardGuidanceForRoles(args.roles),
    bestPractices: bestPracticesForRoles(args.roles),
  };
};

export const hasUsageCard = (guidance: PreviewGuidance): boolean =>
  Boolean(guidance.usage || guidance.usageNote);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Escape HTML then promote `` `code` `` spans (trusted authored guidance). */
export const renderInlineCode = (value: string): string =>
  escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>");

export const renderBulletList = (bullets: string[]): string =>
  `<ul class="guidance-list">${bullets.map(bullet => `<li>${renderInlineCode(bullet)}</li>`).join("")}</ul>`;

/** HTML for Preview-tab guidance cards; empty string when nothing real to show. */
export const renderGuidanceCards = (guidance: PreviewGuidance): string => {
  const cards: string[] = [];

  if (hasUsageCard(guidance)) {
    const lead = guidance.usage
      ? `<p class="guidance-lead">${renderInlineCode(guidance.usage.shortDescription)}</p>
         <p>${renderInlineCode(guidance.usage.docsDescription)}</p>`
      : "";
    const note = guidance.usageNote
      ? `<p class="guidance-note"><strong>Note.</strong> ${renderInlineCode(guidance.usageNote)}</p>`
      : "";
    cards.push(`
      <article class="guidance-card" data-guidance="usage">
        <h3 class="guidance-title">Usage</h3>
        ${lead}
        ${note}
      </article>`);
  }

  if (guidance.bestPractices.length) {
    cards.push(`
      <article class="guidance-card" data-guidance="best-practices">
        <h3 class="guidance-title">Best practices</h3>
        ${renderBulletList(guidance.bestPractices)}
      </article>`);
  }

  if (guidance.keyboard.length) {
    cards.push(`
      <article class="guidance-card" data-guidance="keyboard">
        <h3 class="guidance-title">Keyboard</h3>
        ${renderBulletList(guidance.keyboard)}
      </article>`);
  }

  if (!cards.length) {
    return "";
  }

  return `
    <section class="guidance-section" aria-label="Usage guidance">
      <p class="section-label">Guidance</p>
      <div class="guidance-grid">${cards.join("")}</div>
    </section>`;
};
