// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createContentExplorerRouteHandler } from "../src/routes/content-explorer.js";
import { createShareRouteHandler } from "../src/routes/share.js";
import { createMetadataRouteHandler } from "../src/routes/metadata.js";
import { BoxApiError } from "../src/http.js";
import type { ContentExplorerDataSource } from "../../../src/patterns/content-explorer/contracts.js";
import type { ShareDataSource } from "../../../src/patterns/share/contracts.js";

describe("content-explorer route", () => {
  it("maps a GET to the data source and returns the wire result", async () => {
    const listFolderItems = vi.fn(async () => ({
      breadcrumbs: [], folder: { id: "0", name: "All Files", type: "folder" as const }, folderId: "0", items: [],
      pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: 0 },
    }));
    const handler = createContentExplorerRouteHandler({ listFolderItems } as ContentExplorerDataSource);

    const response = await handler(
      new Request("https://app.test/api/content-explorer/folders/0/items?limit=25&offset=0", {
        headers: { "accept-language": "en-US", "x-request-id": "req-1" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ folderId: "0" });
    expect(listFolderItems).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "0", limit: 25, offset: 0, context: { locale: "en-US", requestId: "req-1" } }),
    );
  });

  it("returns 405 for a non-GET method and 404 for an unmatched path", async () => {
    const handler = createContentExplorerRouteHandler({ listFolderItems: vi.fn() } as unknown as ContentExplorerDataSource);
    expect(
      (await handler(new Request("https://app.test/api/content-explorer/folders/0/items", { method: "POST" }))).status,
    ).toBe(405);
    expect((await handler(new Request("https://app.test/nope"))).status).toBe(404);
  });

  it("maps a thrown BoxApiError to its status", async () => {
    const handler = createContentExplorerRouteHandler({
      listFolderItems: vi.fn(async () => {
        throw new BoxApiError("gone", { status: 404, code: "not_found" });
      }),
    } as unknown as ContentExplorerDataSource);

    const response = await handler(new Request("https://app.test/api/content-explorer/folders/9/items"));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "not_found", message: "gone" });
  });
});

describe("share route", () => {
  const dataSource: ShareDataSource = {
    getShareState: vi.fn(async () => ({ itemId: "123", itemType: "file" as const, sharedLink: null, collaborators: [] })),
    updateSharedLink: vi.fn(async () => ({ itemId: "123", itemType: "file" as const, sharedLink: { access: "collaborators" as const }, collaborators: [] })),
    listCollaborators: vi.fn(async () => [{ id: "u_1", name: "Morgan", type: "user" as const, role: "editor" }]),
  };
  const handler = createShareRouteHandler(dataSource);

  it("routes GET state, PUT shared-link, and GET collaborators", async () => {
    const state = await handler(new Request("https://app.test/api/share/items/file/123"));
    expect(await state.json()).toMatchObject({ itemId: "123" });

    const put = await handler(
      new Request("https://app.test/api/share/items/file/123/shared-link", {
        method: "PUT",
        body: JSON.stringify({ sharedLink: { access: "collaborators" } }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(await put.json()).toMatchObject({ sharedLink: { access: "collaborators" } });
    expect(dataSource.updateSharedLink).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "123", itemType: "file", sharedLink: { access: "collaborators" } }),
    );

    const collaborators = await handler(new Request("https://app.test/api/share/items/file/123/collaborators"));
    expect(await collaborators.json()).toHaveLength(1);
  });

  it("rejects an invalid itemType with 400", async () => {
    const response = await handler(new Request("https://app.test/api/share/items/widget/123"));
    expect(response.status).toBe(400);
  });
});

describe("metadata route", () => {
  it("routes templates, instances, instance update, and query", async () => {
    const dataSource = {
      listTemplates: vi.fn(async () => [{ key: "properties", label: "Properties", scope: "enterprise", fields: [] }]),
      listInstances: vi.fn(async () => [{ scope: "enterprise", templateKey: "properties", values: {} }]),
      updateInstance: vi.fn(async () => ({ scope: "enterprise", templateKey: "properties", values: { status: "active" } })),
      query: vi.fn(async () => ({ entries: [], limit: 25, offset: 0, totalCount: null })),
    };
    const handler = createMetadataRouteHandler(dataSource);

    expect((await handler(new Request("https://app.test/api/metadata/templates"))).status).toBe(200);
    expect((await handler(new Request("https://app.test/api/metadata/items/file/123/instances"))).status).toBe(200);

    const put = await handler(
      new Request("https://app.test/api/metadata/items/file/123/instances/properties", {
        method: "PUT",
        body: JSON.stringify({ scope: "enterprise", templateKey: "properties", values: { status: "active" } }),
      }),
    );
    expect(put.status).toBe(200);
    expect(dataSource.updateInstance).toHaveBeenCalledWith(
      expect.objectContaining({ instance: expect.objectContaining({ templateKey: "properties" }) }),
    );

    const query = await handler(
      new Request("https://app.test/api/metadata/query", {
        method: "POST",
        body: JSON.stringify({ templateKey: "properties", filters: { status: "active" } }),
      }),
    );
    expect(query.status).toBe(200);
  });
});
