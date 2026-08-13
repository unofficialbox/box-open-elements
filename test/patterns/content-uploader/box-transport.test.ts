import { describe, expect, it, vi } from "vitest";

import { createBoxUploadTransport } from "../../../src/patterns/content-uploader/box-transport.js";

const jsonResponse = (payload: unknown, status = 201): Response =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

describe("createBoxUploadTransport", () => {
  it("posts multipart attributes + file to the upload host with auth headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ entries: [{ id: 12345, name: "report.pdf", size: 2048 }] }),
    );
    const transport = createBoxUploadTransport({ fetch: fetchImpl });
    const onProgress = vi.fn();

    const result = await transport.uploadFile({
      file: new Blob(["hello"]) as unknown as { name: string; size: number },
      fileName: "report.pdf",
      folderId: "42",
      token: "token-1",
      onProgress,
    });

    expect(result).toEqual({ fileId: "12345", name: "report.pdf", size: 2048 });
    expect(onProgress).toHaveBeenCalledWith(1);

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://upload.box.com/api/2.0/files/content");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-1" });

    const body = init.body as FormData;
    expect(JSON.parse(body.get("attributes") as string)).toEqual({
      name: "report.pdf",
      parent: { id: "42" },
    });
    expect(body.get("file")).not.toBeNull();
  });

  it("honours a custom upload base URL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ entries: [{ id: "1" }] }));
    const transport = createBoxUploadTransport({ fetch: fetchImpl, uploadBaseUrl: "https://bff.example/upload/" });

    await transport.uploadFile({
      file: new Blob(["x"]) as unknown as { name: string; size: number },
      fileName: "a.txt",
      folderId: "0",
      token: "t",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://bff.example/upload/files/content");
  });

  it("throws on a non-2xx response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ message: "denied" }, 403));
    const transport = createBoxUploadTransport({ fetch: fetchImpl });

    await expect(
      transport.uploadFile({
        file: new Blob(["x"]) as unknown as { name: string; size: number },
        fileName: "a.txt",
        folderId: "0",
        token: "t",
      }),
    ).rejects.toThrow("Box upload failed (403)");
  });

  it("throws when the response has no file entry", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ entries: [] }));
    const transport = createBoxUploadTransport({ fetch: fetchImpl });

    await expect(
      transport.uploadFile({
        file: new Blob(["x"]) as unknown as { name: string; size: number },
        fileName: "a.txt",
        folderId: "0",
        token: "t",
      }),
    ).rejects.toThrow("no file entry");
  });

  it("forwards the abort signal to fetch", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ entries: [{ id: "1" }] }));
    const transport = createBoxUploadTransport({ fetch: fetchImpl });
    const abortController = new AbortController();

    await transport.uploadFile({
      file: new Blob(["x"]) as unknown as { name: string; size: number },
      fileName: "a.txt",
      folderId: "0",
      token: "t",
      signal: abortController.signal,
    });

    expect(fetchImpl.mock.calls[0]?.[1]?.signal).toBe(abortController.signal);
  });
});
