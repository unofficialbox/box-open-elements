import { describe, expect, it } from "vitest";
import { renderAttributeReference } from "../../docs-site/api-reference.js";
import table from "../../storybook/stories/table.stories.js";

describe("docs attribute reference", () => {
  it("shows Table's authored compact choices and their meaning", () => {
    const html = renderAttributeReference(["columns", "stacked-layout"], table.meta.referenceRows);
    expect(html).toContain("summary hides the visible label only");
    expect(html).toContain("hidden omits the field and its slot");
    expect(html).toContain("desktop/list/grid show every column");
    expect(html).toContain("Requires stacked");
  });
  it("keeps unannotated observed names, excludes non-observed rows, and escapes prose", () => {
    const html = renderAttributeReference(["unknown", "label"], [
      { kind: "attribute", name: "label", type: "<string>", description: '<img src=x> & "text"' },
      { kind: "attribute", name: "obsolete", description: "old" },
    ]);
    expect(html).toContain("unknown");
    expect(html).not.toContain("obsolete");
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).toContain("&lt;string&gt;");
    expect(html).not.toContain("<img");
    expect(renderAttributeReference([], [])).toContain("observes no attributes");
  });
});
