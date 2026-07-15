// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  buildExplorerResult,
  buildExplorerSearchResult,
  mapBreadcrumbs,
  mapExplorerItem,
  mapPagination,
} from "../src/mappers/explorer.js";
import { buildShareState, mapSharedLink, toBoxSharedLinkPayload } from "../src/mappers/share.js";
import { buildMetadataQueryPage, mapInstance, mapTemplates } from "../src/mappers/metadata.js";

describe("explorer mappers", () => {
  const folder = {
    id: "42",
    name: "Marketing",
    type: "folder" as const,
    path_collection: {
      entries: [{ id: "0", type: "folder" as const, name: "All Files" }],
    },
  };

  it("builds breadcrumbs from path_collection plus the current folder", () => {
    expect(mapBreadcrumbs(folder)).toEqual([
      { id: "0", name: "All Files", type: "folder" },
      { id: "42", name: "Marketing", type: "folder" },
    ]);
  });

  it("computes hasMoreItems from total/offset", () => {
    expect(mapPagination({ total_count: 120, offset: 0, limit: 25, entries: new Array(25) }, { limit: 25, offset: 0 }))
      .toMatchObject({ hasMoreItems: true, totalCount: 120 });
    expect(mapPagination({ total_count: 10, offset: 0, limit: 25, entries: new Array(10) }, { limit: 25, offset: 0 }))
      .toMatchObject({ hasMoreItems: false });
  });

  it("builds a full explorer result and falls back on blank names", () => {
    const result = buildExplorerResult(
      folder,
      { total_count: 2, offset: 0, limit: 25, entries: [
        { id: "1", type: "file", name: "Plan.pdf" },
        { id: "2", type: "folder", name: "  " },
      ] },
      { limit: 25, offset: 0 },
    );
    expect(result.folderId).toBe("42");
    expect(result.items).toEqual([
      { id: "1", name: "Plan.pdf", type: "file" },
      { id: "2", name: "Untitled", type: "folder" },
    ]);
  });

  it("maps optional summary fields and search results", () => {
    expect(
      mapExplorerItem({
        id: "1",
        type: "file",
        name: "Plan.pdf",
        size: 10,
        modified_at: "2026-07-01T00:00:00Z",
        extension: "pdf",
        owned_by: { id: "u1", name: "Morgan", type: "user" },
        shared_link: { url: "https://box.com/s/x", access: "open" },
        permissions: { can_preview: true },
        parent: { id: "0", name: "All Files" },
      }),
    ).toMatchObject({
      size: 10,
      modifiedAt: "2026-07-01T00:00:00Z",
      owner: { id: "u1", name: "Morgan", type: "user" },
      sharedLink: { isShared: true, access: "open" },
      preview: { canPreview: true, extension: "pdf" },
      parent: { id: "0", name: "All Files" },
    });

    expect(
      buildExplorerSearchResult(
        "plan",
        { total_count: 1, offset: 0, limit: 25, entries: [{ id: "1", type: "file", name: "Plan.pdf" }] },
        { limit: 25, offset: 0, ancestorFolderId: "0" },
      ),
    ).toMatchObject({
      query: "plan",
      ancestorFolderId: "0",
      items: [{ id: "1", name: "Plan.pdf", type: "file" }],
    });
  });
});

describe("share mappers", () => {
  it("maps a shared link, preferring effective_access", () => {
    expect(
      mapSharedLink({
        url: "https://box.com/s/x",
        effective_access: "company",
        access: "open",
        is_password_enabled: true,
        unshared_at: null,
        permissions: { can_download: true, can_preview: false },
      }),
    ).toEqual({
      url: "https://box.com/s/x",
      access: "company",
      passwordEnabled: true,
      canDownload: true,
      canPreview: false,
      expiresAt: null,
    });
  });

  it("returns null shared link when absent", () => {
    expect(mapSharedLink(null)).toBeNull();
  });

  it("serializes a shared link to the Box PUT payload", () => {
    expect(
      toBoxSharedLinkPayload({ access: "collaborators", canDownload: false, expiresAt: "2026-06-01T00:00:00.000Z" }),
    ).toEqual({
      shared_link: {
        access: "collaborators",
        unshared_at: "2026-06-01T00:00:00.000Z",
        permissions: { can_download: false },
      },
    });
    expect(toBoxSharedLinkPayload(null)).toEqual({ shared_link: null });
  });

  it("builds share state with invite + user collaborators", () => {
    const state = buildShareState(
      { id: "123", type: "file", shared_link: { url: "u", access: "company" } },
      {
        entries: [
          { id: "c1", role: "editor", status: "accepted", accessible_by: { id: "u_1", type: "user", name: "Morgan Lee" } },
          { id: "c2", role: "viewer", status: "pending", accessible_by: null, invite_email: "new@box.com" },
        ],
      },
    );
    expect(state.itemId).toBe("123");
    expect(state.collaborators).toEqual([
      { id: "u_1", name: "Morgan Lee", type: "user", role: "editor", status: "accepted" },
      { id: "c2", name: "new@box.com", type: "invite", role: "viewer", status: "pending" },
    ]);
  });
});

describe("metadata mappers", () => {
  it("maps templates, skipping hidden and reading option keys", () => {
    const templates = mapTemplates({
      entries: [
        {
          templateKey: "properties",
          displayName: "Properties",
          scope: "enterprise_1",
          fields: [
            { key: "status", displayName: "Status", type: "enum", options: [{ key: "active" }, { key: "archived" }] },
          ],
        },
        { templateKey: "secret", scope: "enterprise_1", hidden: true },
      ],
    });
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({ key: "properties", label: "Properties" });
    expect(templates[0].fields[0]).toEqual({ key: "status", label: "Status", type: "enum", options: ["active", "archived"] });
  });

  it("maps an instance, stripping $-prefixed system keys", () => {
    expect(
      mapInstance({ $id: "i1", $scope: "enterprise_1", $template: "properties", status: "active", owner: "mkt" }),
    ).toEqual({ id: "i1", scope: "enterprise_1", templateKey: "properties", values: { status: "active", owner: "mkt" } });
  });

  it("builds a query page from item entries", () => {
    const page = buildMetadataQueryPage(
      { entries: [{ item: { id: "123", type: "file", name: "Plan.pdf" } }, {}] },
      { limit: 25, offset: 0 },
    );
    expect(page.entries).toEqual([{ id: "123", name: "Plan.pdf", type: "file" }]);
    expect(page.totalCount).toBeNull();
  });
});
