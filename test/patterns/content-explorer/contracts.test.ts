import { describe, expect, it, vi } from "vitest";

import {
  createExplorerTransportFromDataSource,
  createHttpContentExplorerDataSource,
} from "../../../src/patterns/content-explorer/contracts.js";

describe("createExplorerTransportFromDataSource", () => {
  it("maps explorer transport requests into a token-free data-source call", async () => {
    const result = {
      breadcrumbs: [{ id: "0", name: "All Files", type: "folder" as const }],
      folder: { id: "0", name: "All Files", type: "folder" as const },
      folderId: "0",
      items: [{ id: "1", name: "Quarterly Plan", type: "file" as const }],
      pagination: {
        hasMoreItems: false,
        limit: 25,
        offset: 0,
        totalCount: 1,
      },
    };
    const dataSource = {
      listFolderItems: vi.fn().mockResolvedValue(result),
    };
    const transport = createExplorerTransportFromDataSource(dataSource);
    const controllerSignal = new AbortController().signal;

    const response = await transport.loadFolderItems({
      folderId: "0",
      limit: 25,
      offset: 0,
      token: "server-owned-token",
      language: "en-US",
      signal: controllerSignal,
    });

    expect(response).toBe(result);
    expect(dataSource.listFolderItems).toHaveBeenCalledWith({
      folderId: "0",
      limit: 25,
      offset: 0,
      context: {
        locale: "en-US",
        signal: controllerSignal,
      },
    });
    expect(transport.searchItems).toBeUndefined();
  });

  it("bridges search when the data source supports it", async () => {
    const searchResult = {
      query: "plan",
      ancestorFolderId: "0",
      items: [{ id: "1", name: "Quarterly Plan", type: "file" as const }],
      pagination: {
        hasMoreItems: false,
        limit: 25,
        offset: 0,
        totalCount: 1,
      },
    };
    const dataSource = {
      listFolderItems: vi.fn(),
      search: vi.fn().mockResolvedValue(searchResult),
    };
    const transport = createExplorerTransportFromDataSource(dataSource);

    const response = await transport.searchItems!({
      query: "plan",
      ancestorFolderId: "0",
      limit: 25,
      offset: 0,
      token: "server-owned-token",
      language: "en-US",
    });

    expect(response).toBe(searchResult);
    expect(dataSource.search).toHaveBeenCalledWith({
      query: "plan",
      ancestorFolderId: "0",
      limit: 25,
      offset: 0,
      context: {
        locale: "en-US",
        signal: undefined,
      },
    });
  });
});

describe("createHttpContentExplorerDataSource", () => {
  it("loads explorer state from a language-agnostic HTTP endpoint", async () => {
    const result = {
      breadcrumbs: [{ id: "0", name: "All Files", type: "folder" as const }],
      folder: { id: "0", name: "All Files", type: "folder" as const },
      folderId: "0",
      items: [{ id: "1", name: "Quarterly Plan", type: "file" as const }],
      pagination: {
        hasMoreItems: false,
        limit: 25,
        offset: 0,
        totalCount: 1,
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const dataSource = createHttpContentExplorerDataSource({
      baseUrl: "https://app.example.com/api/content-explorer",
      fetch: fetchMock,
      headers: {
        authorization: "Bearer app-session",
      },
    });

    const response = await dataSource.listFolderItems({
      folderId: "0",
      limit: 25,
      offset: 0,
      context: {
        locale: "en-US",
        requestId: "req-1",
      },
    });

    expect(response).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.example.com/api/content-explorer/folders/0/items?limit=25&offset=0",
      {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "accept-language": "en-US",
          "x-request-id": "req-1",
          authorization: "Bearer app-session",
        },
        signal: undefined,
      },
    );
  });

  it("supports relative API base paths", async () => {
    const result = {
      breadcrumbs: [{ id: "0", name: "All Files", type: "folder" as const }],
      folder: { id: "0", name: "All Files", type: "folder" as const },
      folderId: "0",
      items: [{ id: "1", name: "Quarterly Plan", type: "file" as const }],
      pagination: {
        hasMoreItems: false,
        limit: 2,
        offset: 0,
        totalCount: 1,
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const dataSource = createHttpContentExplorerDataSource({
      baseUrl: "/api/content-explorer",
      fetch: fetchMock,
    });

    await dataSource.listFolderItems({
      folderId: "0",
      limit: 2,
      offset: 0,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost/api/content-explorer/folders/0/items?limit=2&offset=0",
      {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
        signal: undefined,
      },
    );
  });

  it("loads search results from the HTTP search endpoint", async () => {
    const result = {
      query: "plan",
      ancestorFolderId: "0",
      items: [{ id: "1", name: "Quarterly Plan", type: "file" as const }],
      pagination: {
        hasMoreItems: false,
        limit: 25,
        offset: 0,
        totalCount: 1,
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const dataSource = createHttpContentExplorerDataSource({
      baseUrl: "https://app.example.com/api/content-explorer",
      fetch: fetchMock,
    });

    const response = await dataSource.search!({
      query: "plan",
      ancestorFolderId: "0",
      limit: 25,
      offset: 0,
    });

    expect(response).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.example.com/api/content-explorer/search?query=plan&ancestorFolderId=0&limit=25&offset=0",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
