export const meta = {
  name: 'component-fidelity-audit',
  description: 'Audit every catalog component for design fidelity, states, a11y, API, and code quality; produce a ranked fix plan',
  phases: [
    { title: 'Audit', detail: 'one reviewer per component, five scored dimensions' },
    { title: 'Synthesize', detail: 'rank worst-first, extract themes, propose fix batches' },
  ],
}

const comp = (dir, ids) => ids.map(id => ({ id, dir: `src/components/${dir}`, tier: 'component' }))
const pat = (dir, ids) => ids.map(id => ({ id, dir: `src/patterns/${dir}`, tier: 'pattern' }))

const CATALOG = [
  ...comp('actions', ['button', 'button-group', 'icon-button', 'link-button', 'menu', 'menu-item', 'segmented-control']),
  ...comp('collections', ['card', 'carousel', 'datalist-item', 'draggable-list', 'grid-view', 'pagination', 'tree', 'tree-grid']),
  ...comp('feedback', ['alert', 'badge', 'chip', 'empty-state', 'error-mask', 'help-text', 'nudge', 'progress-bar', 'progress-ring', 'progress-steps', 'skeleton', 'spinner', 'toast']),
  ...comp('files', ['drop-zone']),
  ...comp('forms', ['calendar', 'category-selector', 'checkbox', 'checkbox-group', 'color-picker', 'combobox', 'date-field', 'dropdown', 'dual-listbox', 'multi-select', 'number-input', 'radio-group', 'range-slider', 'rating', 'fieldset', 'pill-cloud', 'pill-selector-dropdown', 'rich-text-input', 'search-field', 'select', 'slider', 'spin-button', 'switch', 'tag-input', 'text-area', 'text-field', 'time-field']),
  ...comp('identity', ['avatar', 'contact-datalist-item', 'persona']),
  ...comp('layout', ['app-shell', 'divider', 'nav-sidebar', 'section', 'sidebar-toggle-button', 'split-view']),
  ...comp('navigation', ['accordion', 'tabs']),
  ...comp('overlays', ['dialog', 'drawer', 'popover', 'tooltip']),
  ...comp('visuals', ['illustration']),
  ...pat('content-explorer', ['content-explorer', 'explorer-breadcrumbs', 'explorer-toolbar', 'explorer-list', 'explorer-table', 'explorer-items', 'explorer-action-menu']),
  ...pat('search', ['filter-bar', 'search-results-header', 'saved-view-picker']),
  ...pat('item', ['item-form', 'item-details-panel', 'bulk-action-bar', 'preview-header']),
  ...pat('metadata', ['metadata-filter-builder', 'metadata-inspector']),
  ...pat('share', ['share-panel', 'permission-matrix', 'access-stats', 'collaborator-avatars', 'presence', 'invite-collaborators-modal', 'unified-share-modal']),
  ...pat('preview', ['annotation-toolbar', 'annotation-inspector', 'annotation-thread', 'preview-element']),
  ...pat('file-request', ['file-request-builder']),
  ...pat('task', ['task-assignment-panel', 'review-queue-item']),
  ...pat('governance', ['governance-panel']),
  ...pat('insights', ['metric-card', 'chart-panel', 'bar-chart', 'line-chart', 'donut-chart']),
]

const AUDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'found', 'overall', 'scores', 'issues', 'summary'],
  properties: {
    id: { type: 'string' },
    found: { type: 'boolean', description: 'whether the component source was located' },
    overall: { type: 'number', description: 'holistic fidelity 1 (poor) to 5 (Box production quality)' },
    scores: {
      type: 'object',
      additionalProperties: false,
      required: ['visualFidelity', 'states', 'accessibility', 'api', 'codeQuality'],
      properties: {
        visualFidelity: { type: 'number', description: '1-5: Box Blueprint token usage, spacing, polish' },
        states: { type: 'number', description: '1-5: hover/focus-visible/active/disabled/error/loading/selected coverage' },
        accessibility: { type: 'number', description: '1-5: roles, ARIA, keyboard, focus management, labels' },
        api: { type: 'number', description: '1-5: observedAttributes, attribute reflection, events, sensible props' },
        codeQuality: { type: 'number', description: '1-5: correctness, robustness, no obvious bugs' },
      },
    },
    issues: {
      type: 'array',
      description: 'concrete, specific, actionable problems — not generic advice',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'dimension', 'description'],
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          dimension: { type: 'string', enum: ['visualFidelity', 'states', 'accessibility', 'api', 'codeQuality'] },
          description: { type: 'string' },
        },
      },
    },
    summary: { type: 'string', description: '1-2 sentence verdict' },
  },
}

phase('Audit')
const audits = (await parallel(
  CATALOG.map(entry => () =>
    agent(
      `You are auditing the web component "${entry.id}" (custom element <box-${entry.id}>, a ${entry.tier}) in the box-open-elements design system, for DESIGN FIDELITY and quality.\n\n` +
        `1. Locate its source: Glob for "${entry.dir}/${entry.id}.ts" first; if missing, Glob "src/**/${entry.id}.ts". Read the full file. Composite components may span sibling files — read what you need.\n` +
        `2. Read its docs example: open docs-site/examples.ts and find the entry keyed by "${entry.id}" (or tag box-${entry.id}).\n` +
        `3. Optionally check src/foundations/tokens for the token names it should be using.\n\n` +
        `Assess critically (this audit exists to find gaps — do NOT inflate scores; a 5 means genuinely Box production quality):\n` +
        `- visualFidelity: does it use --boe-token-* CSS variables (not hardcoded colors), proper Blueprint spacing/rhythm/radius, and look polished? Box blue accent, cool neutrals.\n` +
        `- states: are hover, focus-visible (brand focus ring), active, disabled, error, loading, selected implemented where applicable?\n` +
        `- accessibility: correct semantic role, ARIA attributes/states, full keyboard interaction, focus management, accessible labels?\n` +
        `- api: observedAttributes + attribute reflection (the reflection convention), meaningful events dispatched, sensible attributes/props?\n` +
        `- codeQuality: correctness, edge cases, no obvious bugs or brittle logic.\n\n` +
        `Score each dimension 1-5 and give an overall 1-5. List the specific issues you found (each with severity + dimension + a concrete description tied to the code). Keep issues actionable and real. Return the structured audit for id "${entry.id}".`,
      { label: `audit:${entry.id}`, phase: 'Audit', schema: AUDIT_SCHEMA },
    ),
  ),
)).filter(Boolean)

// Rank worst-first: lowest overall, then most high-severity issues.
const highCount = a => a.issues.filter(i => i.severity === 'high').length
const ranked = [...audits].sort((x, y) => x.overall - y.overall || highCount(y) - highCount(x))

const dims = ['visualFidelity', 'states', 'accessibility', 'api', 'codeQuality']
const avg = key => (audits.reduce((s, a) => s + (key === 'overall' ? a.overall : a.scores[key]), 0) / (audits.length || 1))
const aggregate = {
  count: audits.length,
  avgOverall: Number(avg('overall').toFixed(2)),
  avgByDimension: Object.fromEntries(dims.map(d => [d, Number(avg(d).toFixed(2))])),
  belowThree: ranked.filter(a => a.overall < 3).map(a => a.id),
  highIssueTotal: audits.reduce((s, a) => s + highCount(a), 0),
}

log(`Audited ${audits.length} components — avg overall ${aggregate.avgOverall}/5, ${aggregate.belowThree.length} below 3/5, ${aggregate.highIssueTotal} high-severity issues`)

phase('Synthesize')
const compact = ranked.map(a => ({
  id: a.id,
  overall: a.overall,
  scores: a.scores,
  high: a.issues.filter(i => i.severity === 'high').map(i => `${i.dimension}: ${i.description}`),
  med: a.issues.filter(i => i.severity === 'medium').map(i => `${i.dimension}: ${i.description}`),
  summary: a.summary,
}))

const report = await agent(
  `You are the lead reviewer synthesizing a component-fidelity audit of the box-open-elements design system (${audits.length} components reviewed). ` +
    `Aggregate stats: ${JSON.stringify(aggregate)}.\n\n` +
    `Here is the full per-component audit data, already ranked worst-first:\n${JSON.stringify(compact)}\n\n` +
    `Write a concise, skimmable Markdown report for the maintainer with these sections:\n` +
    `## Executive summary — overall health, the headline in 3-4 sentences.\n` +
    `## Systemic themes — the recurring cross-component problems (e.g. hardcoded colors vs tokens, missing focus-visible rings, absent ARIA, no disabled/loading states), each with roughly how many components it affects and a couple of example ids.\n` +
    `## Worst offenders — a table of the ~15 lowest-scoring components: id, overall, and the single most important fix.\n` +
    `## Prioritized fix plan — group the work into 4-6 batches ordered by impact/effort (e.g. "Batch 1: tokenize hardcoded colors across N components", "Batch 2: add focus-visible + keyboard to the interactive controls"). For each batch: what, which components (ids), and why it matters. Prefer systemic sweeps over one-off fixes.\n\n` +
    `Be specific and grounded in the data — cite real component ids. Do not invent components not in the data.`,
  { label: 'synthesize-report', phase: 'Synthesize' },
)

return { aggregate, ranked, report }
