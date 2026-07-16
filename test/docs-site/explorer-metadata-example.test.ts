// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  contentExplorerMetadataChromeHtml,
  createMetadataDemoDataSource,
  setupContentExplorerMetadataChrome,
} from "../../docs-site/explorer-metadata-demo.js";
import { defineBoxExplorerTableElement } from "../../src/patterns/content-explorer/adapters/table.js";
import { defineBoxExplorerToolbarElement } from "../../src/patterns/content-explorer/adapters/toolbar.js";
import { defineBoxMetadataFilterBuilderElement } from "../../src/patterns/metadata/metadata-filter-builder.js";
import { defineBoxMetadataInspectorElement } from "../../src/patterns/metadata/metadata-inspector.js";

const waitForStatus = async (expected: string): Promise<void> => {
  for (let i = 0; i < 40; i++) {
    if (document.querySelector("[data-metadata-status] strong")?.textContent === expected) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  expect(document.querySelector("[data-metadata-status] strong")?.textContent).toBe(expected);
};

describe("docs-site content-explorer metadata chrome demo", () => {
  beforeEach(() => {
    defineBoxMetadataFilterBuilderElement();
    defineBoxMetadataInspectorElement();
    defineBoxExplorerToolbarElement();
    defineBoxExplorerTableElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("queries metadata, fills the table transport, and paints the inspector", async () => {
    expect(contentExplorerMetadataChromeHtml).toContain("box-metadata-filter-builder");
    expect(contentExplorerMetadataChromeHtml).toContain("box-explorer-table");
    expect(contentExplorerMetadataChromeHtml).toContain("box-metadata-inspector");

    document.body.innerHTML = contentExplorerMetadataChromeHtml;
    const dataSource = createMetadataDemoDataSource();
    const cleanup = setupContentExplorerMetadataChrome(document.body, dataSource);
    expect(cleanup).toEqual(expect.any(Function));

    // Default rule is classification=internal → Vendor MSA (confidential) excluded.
    await waitForStatus("2");

    const inspector = document.querySelector("box-metadata-inspector") as HTMLElement;
    expect(inspector.getAttribute("sections")).toContain("Classification");
    expect(inspector.getAttribute("heading")).toMatch(/\.pdf$/);

    cleanup?.();
  });
});
