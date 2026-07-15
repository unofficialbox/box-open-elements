export const meta = {
  name: 'heading-test-assertions',
  description: 'Add a rendered-heading assertion to each renamed-component test so the heading contract is actually verified',
  phases: [{ title: 'Assert', detail: 'one agent per test file' }],
}

const FILES = Array.isArray(args) ? args : JSON.parse(args)

phase('Assert')
const results = (await parallel(
  FILES.map(rel => () =>
    agent(
      `In \`test/${rel}\` (a jsdom Vitest test for a box-open-elements web component), the test sets \`element.heading = "…"\` but does not verify the heading actually renders. Add a focused assertion so the renamed heading contract is covered.\n\n` +
        `Steps:\n` +
        `1. Read \`test/${rel}\`.\n` +
        `2. Find the test that assigns \`element.heading = "<value>"\` (or \`heading="<value>"\`). Note the exact <value>.\n` +
        `3. After the element is connected and rendered (i.e. after \`document.body.append(element)\` and any existing show()/flush in that test), add ONE assertion that the heading text renders in the shadow DOM. Prefer matching the existing assertion style in the file; a safe default is \`expect(element.shadowRoot?.textContent).toContain("<value>");\`. If the file already asserts a specific \`[part="title"]\`/heading node elsewhere, mirror that.\n` +
        `4. If (and only if) the test's name/description mentions "title" as an alias or a "preferred" heading (stale wording from before the rename), update just that description string to accurately describe setting/rendering \`heading\` (e.g. "renders the heading"). Do not change assertions unrelated to this.\n` +
        `5. Change nothing else. Use the Edit tool with exact matches.\n\n` +
        `Return the structured result for \`${rel}\`.`,
      {
        label: `assert:${rel.split('/').pop()}`,
        phase: 'Assert',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['file', 'assertionAdded', 'notes'],
          properties: {
            file: { type: 'string' },
            assertionAdded: { type: 'boolean' },
            notes: { type: 'string' },
          },
        },
      },
    ),
  ),
)).filter(Boolean)

log(`Assertions: ${results.filter(r => r.assertionAdded).length}/${FILES.length} added`)
return { results }
