import type { StoryModule } from "../metadata.js";

const codeBlock: StoryModule = {
  title: "Components/Output/Code Block",
  meta: {
    id: "code-block",
    tag: "box-code-block",
    shortDescription: "A block of code, rendered as written.",
    docsDescription:
      "The code is set as `textContent`, never as markup — a snippet is the string most likely on any page to contain angle brackets, and rendering it as HTML would both corrupt what the reader sees and hand an injection point to whatever produced the snippet. There is **no syntax highlighting**, deliberately: doing it properly means shipping a grammar per language, and doing it improperly means mis-colouring code a reader is trying to trust. A host that needs highlighting slots pre-rendered markup into the default slot instead, and `language` is surfaced as a `data-language` hook and a `language-*` class for whatever does the highlighting. Long lines scroll rather than wrap, because a wrapped line silently changes what the reader believes the source says; `wrap` opts in where the content has no meaningful column structure. The copy button reports a refused clipboard by simply not confirming — access is denied in plenty of ordinary situations, and none of them deserve an exception in the host's console.",
    sourceSnippet: `<box-code-block code="bun add @unofficialbox/box-open-elements"></box-code-block>`,
    referenceRows: [
      { kind: "attribute", name: "code", type: "string", description: "The source to render. Slotted content takes precedence, for pre-highlighted markup." },
      { kind: "attribute", name: "language", type: "string", description: "Surfaced as `data-language` and a `language-*` class. Nothing here interprets it." },
      { kind: "attribute", name: "wrap", type: "boolean", description: "Wrap long lines instead of scrolling them." },
      { kind: "attribute", name: "inline", type: "boolean", description: "Inline presentation; hides the copy button." },
      { kind: "attribute", name: "copy-label", type: "string", description: "Accessible name for the copy button. Defaults to `Copy code`." },
      { kind: "event", name: "code-copied", type: "{ copied: boolean }", description: "Emitted after a copy attempt, whether or not the clipboard accepted it." },
      { kind: "part", name: "pre", type: "part", description: "The scrolling container." },
      { kind: "part", name: "copy", type: "part", description: "The copy button." },
    ],
  },
  variants: [
    { name: "Command", html: `<box-code-block language="bash" code="bun add @unofficialbox/box-open-elements"></box-code-block>` },
    { name: "Markup", html: `<box-code-block language="html" code='<box-indicator tone="success" label="Signed"></box-indicator>'></box-code-block>`, note: "Angle brackets survive intact — the snippet is text, not markup." },
    { name: "Wrapped", html: `<box-code-block wrap code="https://app.box.com/folder/0/file/123456789?utm_source=example&utm_campaign=a-very-long-query-string-that-has-no-column-structure"></box-code-block>` },
    { name: "Inline", html: `<p style="margin:0">Install with <box-code-block inline code="bun add"></box-code-block> and restart.</p>` },
  ],
};

export default codeBlock;
