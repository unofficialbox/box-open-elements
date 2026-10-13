// JSON imports widen the authored kind literals to string; the renderer only
// consumes attribute rows and does not need the full authoring union.
interface AttributeReferenceRow {
  kind: string;
  name: string;
  type?: string;
  description: string;
}

const escapeHtml = (value: string): string => value
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** Observed names come from the component; descriptions come from authored stories. */
export function renderAttributeReference(observed: readonly string[], referenceRows: readonly AttributeReferenceRow[]): string {
  if (!observed.length) return '<p class="inspector-empty">This element observes no attributes.</p>';
  return `<table class="api-table"><tr><th>Attribute</th><th>Type / usage</th></tr>${observed.map(name => {
    const row = referenceRows.find(row => row.kind === "attribute" && row.name === name);
    return `<tr><td><code>${escapeHtml(name)}</code></td><td>${row
      ? `<code>${escapeHtml(row.type ?? "")}</code><p>${escapeHtml(row.description)}</p>`
      : ""}</td></tr>`;
  }).join("")}</table>`;
}
