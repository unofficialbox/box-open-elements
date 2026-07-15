export const meta = {
  name: 'title-to-heading-rename',
  description: 'Batch 6: rename the heading attribute `title` -> `heading` per component (source + test), to stop the native HTMLElement.title collision',
  phases: [{ title: 'Rename', detail: 'one agent per component' }],
}

const FILES = Array.isArray(args) ? args : JSON.parse(args)

phase('Rename')
const results = (await parallel(
  FILES.map(rel => () =>
    agent(
      `In the box-open-elements design system, the custom element defined in \`src/${rel}\` uses a **\`title\` attribute as its heading**, which collides with the native \`HTMLElement.title\` (stray OS tooltip + shadows the DOM property). Rename that heading attribute from \`title\` to \`heading\`.\n\n` +
        `Steps:\n` +
        `1. Read \`src/${rel}\`.\n` +
        `2. Rename ONLY the component's heading attribute named \`title\`:\n` +
        `   - in \`observedAttributes\`: \`"title"\` -> \`"heading"\`.\n` +
        `   - the \`get title()\`/\`set title()\` accessors -> \`get heading()\`/\`set heading()\`, and any \`getAttribute("title")\`/\`setAttribute("title", …)\`/\`removeAttribute("title")\`/\`hasAttribute("title")\` that back that accessor -> \`"heading"\`.\n` +
        `   - any \`this.getAttribute("title")\` (or \`this.title\`) read in render/state that refers to this heading -> \`heading\`.\n` +
        `   - any \`attributeChangedCallback\` name comparison against \`"title"\` -> \`"heading"\`.\n` +
        `3. DO NOT rename: an SVG \`<title>\` element, a \`title\` set on a *child/sub* element purely as a native tooltip, ARIA, or any unrelated use. Only the component's own heading attribute.\n` +
        `4. Find the component's test file (Glob \`test/**/${rel.split('/').pop().replace('.ts', '')}.test.ts\`). If it sets or reads the heading via \`title\` (attribute \`title="…"\`, \`.title =\`, \`getAttribute("title")\`), update those to \`heading\` too so the test still exercises the heading. Leave native-tooltip or unrelated title usage alone.\n` +
        `5. Do NOT touch \`docs-site/examples.ts\` — that shared file is handled separately.\n\n` +
        `Use the Edit tool with exact matches; change nothing unrelated. Report what you renamed and whether a test was updated. Return the structured result for \`${rel}\`.`,
      {
        label: `rename:${rel.split('/').pop()}`,
        phase: 'Rename',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['file', 'renamed', 'testUpdated', 'notes'],
          properties: {
            file: { type: 'string' },
            renamed: { type: 'boolean', description: 'true if a title->heading rename was applied' },
            testUpdated: { type: 'boolean' },
            notes: { type: 'string' },
          },
        },
      },
    ),
  ),
)).filter(Boolean)

log(`Rename done: ${results.filter(r => r.renamed).length}/${FILES.length} renamed, ${results.filter(r => r.testUpdated).length} tests updated`)
return { results }
