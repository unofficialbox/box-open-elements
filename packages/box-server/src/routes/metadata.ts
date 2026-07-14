import type {
  MetadataDataSource,
  MetadataInstance,
  MetadataQueryInput,
} from "../../../../src/patterns/metadata/contracts.js";
import {
  contextFromRequest,
  errorResponse,
  jsonResponse,
  matchPath,
  type RouteHandler,
} from "./shared.js";

export interface MetadataRouteOptions {
  basePath?: string;
}

const DEFAULT_BASE = "/api/metadata";

const asItemType = (value: string): "file" | "folder" | null =>
  value === "file" || value === "folder" ? value : null;

/**
 * Metadata wire routes:
 * - `GET  {base}/templates` → `MetadataTemplateDefinition[]`
 * - `GET  {base}/items/:itemType/:itemId/instances` → `MetadataInstance[]`
 * - `PUT  {base}/items/:itemType/:itemId/instances/:templateKey` → `MetadataInstance`
 * - `POST {base}/query` → `MetadataPage`
 */
export const createMetadataRouteHandler = (
  dataSource: MetadataDataSource,
  options: MetadataRouteOptions = {},
): RouteHandler => {
  const base = (options.basePath ?? DEFAULT_BASE).replace(/\/$/, "");
  const templatesPath = `${base}/templates`;
  const queryPath = `${base}/query`;
  const instancesPath = `${base}/items/:itemType/:itemId/instances`;
  const instancePath = `${base}/items/:itemType/:itemId/instances/:templateKey`;

  return async request => {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const context = contextFromRequest(request);

      if (pathname === templatesPath) {
        if (request.method !== "GET") {
          return jsonResponse({ code: "method_not_allowed", message: "Use GET" }, 405);
        }
        return jsonResponse(await dataSource.listTemplates(context));
      }

      if (pathname === queryPath) {
        if (request.method !== "POST") {
          return jsonResponse({ code: "method_not_allowed", message: "Use POST" }, 405);
        }
        const body = (await request.json()) as Omit<MetadataQueryInput, "context">;
        return jsonResponse(await dataSource.query({ ...body, context }));
      }

      const instanceParams = matchPath(instancePath, pathname);
      if (instanceParams) {
        if (request.method !== "PUT") {
          return jsonResponse({ code: "method_not_allowed", message: "Use PUT" }, 405);
        }
        const itemType = asItemType(instanceParams.itemType);
        if (!itemType) {
          return jsonResponse({ code: "bad_request", message: "itemType must be file or folder" }, 400);
        }
        const body = (await request.json()) as MetadataInstance;
        const instance: MetadataInstance = { ...body, templateKey: instanceParams.templateKey };
        return jsonResponse(
          await dataSource.updateInstance({ itemId: instanceParams.itemId, itemType, instance, context }),
        );
      }

      const instancesParams = matchPath(instancesPath, pathname);
      if (instancesParams) {
        if (request.method !== "GET") {
          return jsonResponse({ code: "method_not_allowed", message: "Use GET" }, 405);
        }
        const itemType = asItemType(instancesParams.itemType);
        if (!itemType) {
          return jsonResponse({ code: "bad_request", message: "itemType must be file or folder" }, 400);
        }
        return jsonResponse(
          await dataSource.listInstances({ itemId: instancesParams.itemId, itemType, context }),
        );
      }

      return jsonResponse({ code: "not_found", message: "No matching route" }, 404);
    } catch (error) {
      return errorResponse(error);
    }
  };
};
