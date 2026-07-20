import { describe, expect, it } from "vitest";

import { formatHtml, indentBlock } from "../../docs-site/format-html.js";

describe("formatHtml", () => {
  it("leaves a short element on one line", () => {
    const src = `<box-button label="Save" tone="primary"></box-button>`;
    expect(formatHtml(src)).toBe(src);
  });

  it("keeps sibling elements on their own lines", () => {
    const src = `<box-button label="Save"></box-button>\n<box-button label="Cancel"></box-button>`;
    expect(formatHtml(src)).toBe(src);
  });

  it("breaks a long tag onto one attribute per line", () => {
    const src =
      `<box-chart-panel heading="Usage" summary="89%" timeframe="Last 7 days" ` +
      `message="Weekly rollups across the enterprise."></box-chart-panel>`;
    const out = formatHtml(src);
    expect(out.split("\n")).toEqual([
      "<box-chart-panel",
      '  heading="Usage"',
      '  summary="89%"',
      '  timeframe="Last 7 days"',
      '  message="Weekly rollups across the enterprise."',
      "></box-chart-panel>",
    ]);
  });

  it("preserves single-quoted JSON attributes verbatim", () => {
    const json = `[{"id":"mon","label":"Mon","value":12},{"id":"tue","label":"Tue","value":18}]`;
    const src = `<box-chart-panel heading="Usage" summary="89%" timeframe="Last 7 days" points='${json}'></box-chart-panel>`;
    const out = formatHtml(src);
    // The payload must survive untouched — it is copy-pasted into real code.
    expect(out).toContain(`points='${json}'`);
    expect(out).toContain("<box-chart-panel\n");
  });

  it("emits JSX-style self-closing tags when asked", () => {
    const src = `<box-chart-panel heading="Usage" summary="89%" timeframe="Last 7 days" message="Weekly rollups across the enterprise."/>`;
    const html = formatHtml(src);
    const jsx = formatHtml(src, true);
    expect(html.endsWith(">")).toBe(true);
    expect(jsx.trimEnd().endsWith("/>")).toBe(true);
  });

  it("indents nested elements", () => {
    const src = `<box-card><box-button label="Save" tone="primary"></box-button><box-button label="Cancel" tone="neutral"></box-button></box-card>`;
    const out = formatHtml(src).split("\n");
    expect(out[0]).toBe("<box-card>");
    expect(out[1]).toBe(`  <box-button label="Save" tone="primary"></box-button>`);
    expect(out.at(-1)).toBe("</box-card>");
  });

  it("keeps boolean attributes bare", () => {
    const src = `<box-button label="Disabled" disabled></box-button>`;
    expect(formatHtml(src)).toBe(src);
  });

  it("round-trips attribute values without re-escaping", () => {
    const src = `<box-alert message="Tom &amp; Jerry"></box-alert>`;
    expect(formatHtml(src)).toContain(`message="Tom &amp; Jerry"`);
  });
});

describe("indentBlock", () => {
  it("indents non-empty lines only", () => {
    expect(indentBlock("a\n\nb", 2)).toBe("  a\n\n  b");
  });
});
