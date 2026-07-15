export const meta = {
  name: 'darkmode-color-sweep',
  description: 'Batch 2: replace white-in-color-mix and color:white with theme-flipping tokens across the flagged components',
  phases: [{ title: 'Sweep', detail: 'one agent per file, edit in place' }],
}

// args may arrive as a real array or a JSON-encoded string depending on caller.
const FILES = Array.isArray(args) ? args : JSON.parse(args)

phase('Sweep')
const results = (await parallel(
  FILES.map(rel => () =>
    agent(
      `Fix dark-mode color bugs in the single file \`src/${rel}\` of the box-open-elements design system. Read it, apply ONLY the edits below with the Edit tool, and change nothing else.\n\n` +
        `The bug: styles mix toward literal white, which stays white in the \`box-dark\` theme, so surfaces render light-on-dark. Fix by using theme-flipping tokens.\n\n` +
        `EDITS:\n` +
        `1. In every \`color-mix(in srgb, ...)\` expression, if a **bare white color** appears as a mix term — the keyword \`white\`, or a literal \`#fff\`/\`#ffffff\` that is a direct color-mix argument — replace THAT term with \`var(--boe-token-surface-surface, #ffffff)\`. Keep the percentage and everything else identical. This is correct because surface-surface is #ffffff in light and dark in box-dark, so light mode is visually unchanged.\n` +
        `2. Replace any standalone \`color: white;\` (a foreground text color, typically on a brand/colored surface) with \`color: var(--boe-token-text-text-on-brand, #ffffff);\`.\n\n` +
        `DO NOT:\n` +
        `- touch a \`#ffffff\`/\`#fff\` that is the **fallback inside a \`var(--..., #ffffff)\`** — those already theme correctly; leave them exactly as-is.\n` +
        `- change \`white-space\`, identifiers containing "white", comments, or any non-color use of the word.\n` +
        `- reformat, reorder, or make any other change. Preserve indentation and surrounding text exactly (Edit requires exact matches).\n` +
        `- change a color-mix that mixes toward \`transparent\` (leave transparent alone) — only the white term is the target.\n\n` +
        `If the same white-in-color-mix line repeats identically many times, use replace_all for that exact string. After editing, report how many replacements you made and any place you deliberately left white (with a one-line reason). Return the structured result for \`${rel}\`.`,
      {
        label: `sweep:${rel.split('/').pop()}`,
        phase: 'Sweep',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['file', 'replacements', 'notes'],
          properties: {
            file: { type: 'string' },
            replacements: { type: 'number' },
            notes: { type: 'string', description: 'anything left unchanged on purpose, or "clean"' },
          },
        },
      },
    ),
  ),
)).filter(Boolean)

const total = results.reduce((s, r) => s + (r.replacements || 0), 0)
log(`Sweep done: ${results.length}/${FILES.length} files, ${total} replacements`)
return { total, results: results.sort((a, b) => (b.replacements || 0) - (a.replacements || 0)) }
