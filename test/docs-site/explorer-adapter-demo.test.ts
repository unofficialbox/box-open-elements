// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createExplorerDemoTransport,
  setupExplorerAdapter,
} from "../../docs-site/explorer-adapter-demo.js";
import { defineBoxExplorerActionMenuElement } from "../../src/patterns/content-explorer/adapters/action-menu.js";
import { defineBoxExplorerBreadcrumbsElement } from "../../src/patterns/content-explorer/adapters/breadcrumbs.js";

describe("docs-site explorer adapter demo helpers", () => {
  beforeEach(() => {
    defineBoxExplorerBreadcrumbsElement();
    defineBoxExplorerActionMenuElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("preserves requested folder ids (Legal stays Legal)", async () => {
    const transport = createExplorerDemoTransport();
    const result = await transport.loadFolderItems({ folderId: "77" });
    expect(result.folder).toEqual({ id: "77", name: "Legal", type: "folder" });
    expect(result.breadcrumbs.at(-1)).toEqual({ id: "77", name: "Legal", type: "folder" });
  });

  it("binds controller, sets itemId before connect, selects after load, and cleans up", async () => {
    document.body.innerHTML = `<box-explorer-action-menu></box-explorer-action-menu>`;
    const cleanup = setupExplorerAdapter(document.body, "box-explorer-action-menu", {
      itemId: "123",
      selectItemId: "123",
    });
    const menu = document.querySelector("box-explorer-action-menu") as HTMLElement & {
      controller?: { getState: () => { selectedItemIds: string[]; connected: boolean }; disconnect: () => void };
      itemId?: string;
    };
    expect(menu.controller).toBeTruthy();
    expect(menu.itemId).toBe("123");

    for (let i = 0; i < 40; i++) {
      if (menu.controller?.getState().selectedItemIds.includes("123")) break;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    expect(menu.controller?.getState().selectedItemIds).toContain("123");

    cleanup();
    expect(menu.controller?.getState().connected).toBe(false);
  });

  it("no-ops cleanup when the selector is missing", () => {
    document.body.innerHTML = `<div></div>`;
    const cleanup = setupExplorerAdapter(document.body, "box-explorer-breadcrumbs");
    expect(cleanup).toEqual(expect.any(Function));
    cleanup();
  });
});
