// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { BoxRestClient } from "../src/auth/client.js";
import { createBoxExplorerDataSource } from "../src/box/explorer-data-source.js";
import { createBoxShareDataSource } from "../src/box/share-data-source.js";
import { createBoxMetadataDataSource } from "../src/box/metadata-data-source.js";
import { BoxApiError } from "../src/http.js";

/** A BoxRestClient stub that resolves each (method, path) via a lookup table. */
const stubClient = (
  handler: (method: string, path: string, options: unknown) => unknown,
): { client: BoxRestClient; request: ReturnType<typeof vi.fn> } => {
  const request = vi.fn(async (method: string, path: string, options: unknown) => handler(method, path, options));
  return { client: { request } as unknown as BoxRestClient, request };
};

describe("createBoxExplorerDataSource", () => {
  it("fetches folder + items and maps to the explorer contract", async () => {
    const { client, request } = stubClient((_method, path) => {
      if (path === "/2.0/folders/42/items") {
        return { total_count: 1, offset: 0, limit: 25, entries: [{ id: "1", type: "file", name: "Plan.pdf" }] };
      }
      return { id: "42", name: "Marketing", type: "folder", path_collection: { entries: [{ id: "0", type: "folder", name: "All Files" }] } };
    });

    const dataSource = createBoxExplorerDataSource(client, { asUser: "u1" });
    const result = await dataSource.listFolderItems({ folderId: "42", limit: 25, offset: 0 });

    expect(result.folder).toEqual({ id: "42", name: "Marketing", type: "folder" });
    expect(result.items).toEqual([{ id: "1", name: "Plan.pdf", type: "file" }]);
    expect(result.breadcrumbs).toHaveLength(2);
    // As-User is threaded to the REST client.
    expect(request.mock.calls[0][2]).toMatchObject({ asUser: "u1" });
    expect(request.mock.calls[1][2]).toMatchObject({
      query: expect.objectContaining({ fields: expect.stringContaining("modified_at") }),
    });
  });

  it("searches via Box /2.0/search and maps the contract", async () => {
    const { client, request } = stubClient(() => ({
      total_count: 1,
      offset: 0,
      limit: 25,
      entries: [{ id: "9", type: "file", name: "Hit.pdf" }],
    }));

    const dataSource = createBoxExplorerDataSource(client);
    const result = await dataSource.search!({
      query: "hit",
      ancestorFolderId: "0",
      limit: 25,
      offset: 0,
    });

    expect(result).toMatchObject({
      query: "hit",
      ancestorFolderId: "0",
      items: [{ id: "9", name: "Hit.pdf", type: "file" }],
    });
    expect(request).toHaveBeenCalledWith(
      "GET",
      "/2.0/search",
      expect.objectContaining({
        query: expect.objectContaining({
          query: "hit",
          ancestor_folder_ids: "0",
        }),
      }),
    );
  });
});

describe("createBoxShareDataSource", () => {
  it("reads share state via the item + its collaborations", async () => {
    const { client } = stubClient((_method, path) => {
      if (path.endsWith("/collaborations")) {
        return { entries: [{ id: "c1", role: "editor", status: "accepted", accessible_by: { id: "u_1", type: "user", name: "Morgan" } }] };
      }
      return { id: "123", type: "file", shared_link: { url: "u", effective_access: "company" } };
    });

    const state = await createBoxShareDataSource(client).getShareState({ itemId: "123", itemType: "file" });
    expect(state.sharedLink).toMatchObject({ access: "company" });
    expect(state.collaborators[0]).toMatchObject({ id: "u_1", role: "editor" });
  });

  it("PUTs the shared-link payload on update", async () => {
    const { client, request } = stubClient((method, path) => {
      if (path.endsWith("/collaborations")) return { entries: [] };
      return { id: "123", type: "file", shared_link: { url: "u", access: "collaborators" } };
    });

    await createBoxShareDataSource(client).updateSharedLink({
      itemId: "123",
      itemType: "file",
      sharedLink: { access: "collaborators", canDownload: false },
    });

    const putCall = request.mock.calls.find(call => call[0] === "PUT");
    expect(putCall?.[2]).toMatchObject({ body: { shared_link: { access: "collaborators", permissions: { can_download: false } } } });
  });
});

describe("createBoxMetadataDataSource", () => {
  it("creates an instance, then falls back to JSON-Patch on 409", async () => {
    let created = false;
    const { client, request } = stubClient((method, path) => {
      if (method === "GET" && path.endsWith("/metadata_templates/enterprise")) return { entries: [] };
      if (method === "POST") {
        created = true;
        throw new BoxApiError("exists", { status: 409 });
      }
      // PUT (json-patch) replace
      return { $id: "i1", $scope: "enterprise_1", $template: "properties", status: "active" };
    });

    const dataSource = createBoxMetadataDataSource(client);
    const result = await dataSource.updateInstance({
      itemId: "123",
      itemType: "file",
      instance: { scope: "enterprise", templateKey: "properties", values: { status: "active" } },
    });

    expect(created).toBe(true);
    expect(result).toMatchObject({ templateKey: "properties", values: { status: "active" } });
    const putCall = request.mock.calls.find(call => call[0] === "PUT");
    expect(putCall?.[2]).toMatchObject({ contentType: "application/json-patch+json" });
    expect(putCall?.[2]).toMatchObject({ body: [{ op: "add", path: "/status", value: "active" }] });
  });
});
