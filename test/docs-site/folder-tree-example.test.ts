import { afterEach, expect, it } from "vitest";
import { examples } from "../../docs-site/examples.js";
import { FolderTreeDiff } from "../../src/patterns/folder-tree/folder-tree-diff.js";

afterEach(() => document.body.replaceChildren());

it("reproduces the folder comparison preview from the displayed setup snippet", () => {
  FolderTreeDiff.register();
  const example = examples["folder-tree-diff"]!;
  const preview = document.createElement("div");
  preview.innerHTML = example.html;
  document.body.append(preview);
  example.setup!(preview);
  const tree = preview.querySelector("box-folder-tree-diff") as FolderTreeDiff;
  const expectedNodes = tree.nodes;
  const expectedRows = tree.shadowRoot!.querySelectorAll('[role="treeitem"]').length;
  const expectedCounts = tree.counts;

  document.body.innerHTML = example.html;
  new Function("document", example.setupCode!)(document);
  const copied = document.querySelector("box-folder-tree-diff") as FolderTreeDiff;
  expect(copied.nodes).toEqual(expectedNodes);
  expect(copied.counts).toEqual(expectedCounts);
  expect(copied.shadowRoot!.querySelectorAll('[role="treeitem"]')).toHaveLength(expectedRows);
});
