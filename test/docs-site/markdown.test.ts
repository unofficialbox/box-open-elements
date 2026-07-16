import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { renderMarkdown } from "../../docs-site/markdown.js";

const foundations = join(import.meta.dirname, "../../docs/foundations");

describe("renderMarkdown", () => {
  it("renders GFM pipe tables as HTML tables", () => {
    const html = renderMarkdown(`
| Export | Role |
| --- | --- |
| \`fast\` | 120ms |
| \`interactive\` | 140ms |
`);
    expect(html).toContain('<table class="md-table">');
    expect(html).toContain("<thead>");
    expect(html).toContain("<th>Export</th>");
    expect(html).toContain("<th>Role</th>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<td><code>fast</code></td>");
    expect(html).toContain("<td>120ms</td>");
    expect(html).not.toContain("<p>| Export | Role |</p>");
  });

  it("supports compact separators", () => {
    const html = renderMarkdown(`
| Helper | Use when |
|---|---|
| \`trapTabKey\` | modal dialogs |
`);
    expect(html).toContain('<table class="md-table">');
    expect(html).toContain("<td><code>trapTabKey</code></td>");
  });

  it("escapes link URLs once (query ampersands stay valid)", () => {
    const html = renderMarkdown("[docs](https://example.com/x?a=1&b=2)");
    expect(html).toContain('href="https://example.com/x?a=1&amp;b=2"');
    expect(html).not.toContain("&amp;amp;");
  });

  it("still renders headings, lists, and code fences", () => {
    const html = renderMarkdown(`
# Title

- one
- two

\`\`\`ts
const x = 1;
\`\`\`
`);
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain('<pre class="code-block"><code>');
    expect(html).toContain("const x = 1;");
  });

  it("renders every Foundations doc table as HTML (not pipe paragraphs)", () => {
    for (const name of ["accessibility", "brand", "motion", "theming", "tokens"]) {
      const md = readFileSync(join(foundations, `${name}.md`), "utf8");
      const html = renderMarkdown(md);
      const pipeParagraphs = (html.match(/<p>\|/g) ?? []).length;
      const tables = (html.match(/<table class="md-table">/g) ?? []).length;
      expect(tables, `${name} should emit at least one table`).toBeGreaterThan(0);
      expect(pipeParagraphs, `${name} should not leave pipe rows as paragraphs`).toBe(0);
    }
  });
});
