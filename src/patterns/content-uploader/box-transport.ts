import type { ExplorerFetchLike } from "../content-explorer/types.js";
import type { UploadRequest, UploadResult, UploadTransport } from "./types.js";

interface BoxUploadEntry {
  id?: string | number;
  name?: string;
  size?: number;
}

interface BoxUploadResponse {
  entries?: BoxUploadEntry[];
}

export interface BoxUploadTransportOptions {
  /** Box upload host — uploads do NOT go to api.box.com. */
  uploadBaseUrl?: string;
  fetch?: ExplorerFetchLike;
}

const DEFAULT_UPLOAD_BASE_URL = "https://upload.box.com/api/2.0";

const resolveFetch = (providedFetch?: ExplorerFetchLike): ExplorerFetchLike => {
  if (providedFetch) {
    return providedFetch;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("A fetch implementation is required to use the Box upload transport");
  }

  return globalThis.fetch.bind(globalThis) as ExplorerFetchLike;
};

/**
 * Multipart upload against `POST {uploadBase}/files/content` (the Box
 * pre-flight-free path). fetch cannot observe upload progress, so
 * `onProgress` fires once at completion; a chunked upload-session transport
 * can implement the same `UploadTransport` contract with real fractions.
 */
export const createBoxUploadTransport = (options: BoxUploadTransportOptions = {}): UploadTransport => {
  const uploadBaseUrl = (options.uploadBaseUrl ?? DEFAULT_UPLOAD_BASE_URL).replace(/\/$/, "");
  const fetchImpl = resolveFetch(options.fetch);

  return {
    async uploadFile(request: UploadRequest): Promise<UploadResult> {
      const attributes = JSON.stringify({
        name: request.fileName,
        parent: { id: request.folderId },
      });

      const body = new FormData();
      body.append("attributes", attributes);
      body.append("file", request.file as unknown as Blob, request.fileName);

      const response = await fetchImpl(`${uploadBaseUrl}/files/content`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${request.token}`,
          "Accept-Language": request.language ?? "en-US",
        },
        body,
        ...(request.signal ? { signal: request.signal } : {}),
      });

      if (!response.ok) {
        throw new Error(`Box upload failed (${response.status})`);
      }

      const payload = (await response.json()) as BoxUploadResponse;
      const entry = payload.entries?.[0];
      if (entry?.id == null) {
        throw new Error("Box upload response contained no file entry");
      }

      request.onProgress?.(1);
      return {
        fileId: String(entry.id),
        ...(entry.name != null ? { name: entry.name } : {}),
        ...(entry.size != null ? { size: entry.size } : {}),
      };
    },
  };
};
