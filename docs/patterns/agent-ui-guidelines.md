# Agent UI guidelines

The answer is the content. Agent replies are plain text on the page; user
messages use a soft bubble. Keep the reading measure near 75 characters.

## Principles

- Use one accent for the primary action, links and the brand mark. Amber means
  waiting on the user, green means done, red means failed. Always pair colour
  with words or a labelled status glyph.
- Use one button system, status family, type scale and motion vocabulary.
  For compact agent surfaces, use 13px semibold pill buttons at 32px or 28px.
- Return structured facts, checks, tables and documents with a short prose
  introduction. Do not encode lists or verdicts with bullet/check characters
  embedded in reply strings.
- State what is happening and how long it took. Approval and successful
  execution are separate facts. Show an incomplete-stream notice when needed.
- Require visible approval for governed writes. A pending approval should be
  the most prominent card in the thread.
- Keep plans and trace steps one click away under the collapsed run summary.
- Keep developer tools on a separate route, outside the product interface.

## Avoid

- Coloured accent bars along the edge of rounded cards.
- Sparkle branding and pink-to-blue gradients by default.
- Text characters pretending to be structured bullets or status icons.
- Centred two-by-two prompt-card grids as an empty state.
- Boxes around every content fragment; uppercase eyebrows everywhere.
- Pills around plain metadata.
- Reaching into another component's shadow DOM to restyle it. Use public parts,
  tokens, or compose a headless controller.

## Craft

Use tabular numerals for amounts, IDs and durations. Keep any serif type to the
brand voice (wordmark or greeting). Scope IDs to each mounted conversation.
Use `overflow: clip` on shell containers: unlike `hidden`, it cannot become a
scroll target when a descendant calls `scrollIntoView`. Make closed panels
`inert`, and restore focus with `preventScroll`.

Motion marks arrival or state changes; it is quick, eased out and never bouncy.
Use the [shared motion helpers](../foundations/motion.md) and honour reduced motion.

## Pre-ship checklist

- Tests, typechecks and build pass.
- Walk the full flow at 1440px and 390px in light and dark.
- Repeat keyboard-only and with reduced motion enabled.
- Check for horizontal overflow and console errors.
- Check pending, failed, approved-but-failed and incomplete states.
- Compare screenshots against the anti-patterns above.

See [agent UI APIs](./agent-ui.md) for reusable building blocks. These guidelines
generalize the Loan Copilot review findings recorded in issues #242–#251.

For workflow builders and editors, also use [builder and editor guidelines](./builder-editor-guidelines.md).
