import { afterEach, expect, it } from "vitest";
import { examples } from "../../docs-site/examples.js";
import { FolderTreeDiff } from "../../src/patterns/folder-tree/folder-tree-diff.js";
afterEach(() => document.body.replaceChildren());
it("the copied structural diff setup populates the empty markup", () => {
  const diff = new FolderTreeDiff(); document.body.append(diff);
  const code = examples["folder-tree-diff"]!.setupCode!;
  expect(code).toContain("diff.nodes");
  new Function("document", code)(document);
  expect(diff.nodes).toHaveLength(2);
  expect(diff.shadowRoot!.querySelectorAll('[role="treeitem"]')).toHaveLength(2);
});
