import { describe, expect, it } from "vitest";

import { highlightCode, normalizeLang } from "../../docs-site/highlight.js";

/** Text content as the browser would show it, with token markup removed. */
const plain = (html: string): string =>
  html
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"');

describe("normalizeLang", () => {
  it("maps fence info strings and framework ids onto grammars", () => {
    expect(normalizeLang("ts")).toBe("ts");
    expect(normalizeLang("typescript")).toBe("ts");
    expect(normalizeLang("react")).toBe("ts");
    expect(normalizeLang("angular")).toBe("ts");
    expect(normalizeLang("html")).toBe("html");
    expect(normalizeLang("vue")).toBe("mixed");
    expect(normalizeLang("svelte")).toBe("mixed");
    expect(normalizeLang("scss")).toBe("css");
    expect(normalizeLang("bash")).toBe("bash");
    expect(normalizeLang("json")).toBe("json");
  });

  it("ignores extra fence metadata and unknown languages", () => {
    expect(normalizeLang("ts title=example.ts")).toBe("ts");
    expect(normalizeLang("")).toBe("text");
    expect(normalizeLang("brainfuck")).toBe("text");
  });
});

describe("highlightCode", () => {
  it("escapes HTML in every grammar, including plain text", () => {
    const nasty = `<script>alert("x" & 'y')</script>`;
    for (const lang of ["text", "ts", "html", "css", "bash", "json", "mixed"] as const) {
      const out = highlightCode(nasty, lang);
      expect(out).not.toContain("<script>");
      expect(out).not.toContain("</script>");
      expect(plain(out)).toBe(nasty);
    }
  });

  it("preserves the source exactly once markup is stripped", () => {
    const src = `import { defineBoxButtonElement } from "@unofficialbox/box-open-elements";\ndefineBoxButtonElement();`;
    expect(plain(highlightCode(src, "ts"))).toBe(src);
  });

  it("tokenizes TypeScript keywords, strings, and calls", () => {
    const out = highlightCode(`import { a } from "b";\nconst n = 1; // note`, "ts");
    expect(out).toContain('<span class="tok-ctrl">import</span>');
    expect(out).toContain('<span class="tok-kw">const</span>');
    expect(out).toContain('<span class="tok-str">&quot;b&quot;</span>');
    expect(out).toContain('<span class="tok-num">1</span>');
    expect(out).toContain('<span class="tok-comment">// note</span>');
  });

  it("tokenizes markup tags, attributes, and values", () => {
    const out = highlightCode(`<box-button label="Save"></box-button>`, "html");
    expect(out).toContain('<span class="tok-tag">&lt;box-button</span>');
    expect(out).toContain('<span class="tok-attr">label</span>');
    expect(out).toContain('<span class="tok-str">&quot;Save&quot;</span>');
  });

  it("highlights script bodies as TypeScript in single-file components", () => {
    const out = highlightCode(`<script>\nconst x = 1;\n</script>\n<div id="a"></div>`, "mixed");
    expect(out).toContain('<span class="tok-kw">const</span>');
    expect(out).toContain('<span class="tok-attr">id</span>');
  });

  it("leaves unknown languages as escaped text with no tokens", () => {
    const out = highlightCode("const x = 1;", "text");
    expect(out).toBe("const x = 1;");
  });
});
