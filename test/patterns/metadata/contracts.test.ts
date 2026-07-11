import { describe, expect, it, vi } from "vitest";

import { createHttpMetadataDataSource } from "../../../src/patterns/metadata/contracts.js";

describe("createHttpMetadataDataSource", () => {
  it("loads metadata templates over HTTP", async () => {
    const result = [
      {
        key: "properties",
        label: "Properties",
        scope: "enterprise",
        fields: [{ key: "status", label: "Status", type: "string" as const }],
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const dataSource = createHttpMetadataDataSource({
      baseUrl: "https://app.example.com/api/metadata",
      fetch: fetchMock,
    });

    const response = await dataSource.listTemplates({
      locale: "en-US",
      requestId: "req-1",
    });

    expect(response).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith("https://app.example.com/api/metadata/templates", {
      method: "GET",
      headers: {
        accept: "application/json",
        "accept-language": "en-US",
        "x-request-id": "req-1",
      },
      signal: undefined,
    });
  });

  it("updates a metadata instance over HTTP", async () => {
    const instance = {
      scope: "enterprise",
      templateKey: "properties",
      values: { status: "active" },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(instance), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const dataSource = createHttpMetadataDataSource({
      fetch: fetchMock,
    });

    const response = await dataSource.updateInstance({
      itemId: "123",
      itemType: "file",
      instance,
    });

    expect(response).toEqual(instance);
    expect(fetchMock).toHaveBeenCalledWith("/api/metadata/items/file/123/instances/properties", {
      method: "PUT",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(instance),
      signal: undefined,
    });
  });
});
