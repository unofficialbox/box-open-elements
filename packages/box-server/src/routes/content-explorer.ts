import type { ContentExplorerDataSource } from "../../../../src/patterns/content-explorer/contracts.js";
import {
  contextFromRequest,
  errorResponse,
  jsonResponse,
  matchPath,
  readNumber,
  type RouteHandler,
} from "./shared.js";

export interface ContentExplorerRouteOptions {
  /** Path template the handler matches. Defaults to the documented wire path. */
  path?: string;
}

const DEFAULT_PATH = "/api/content-explorer/folders/:folderId/items";

/**
 * `GET /api/content-explorer/folders/:folderId/items?limit=&offset=` →
 * `ExplorerTransportResult`. Returns 404 for a non-matching path and 405 for a
 * non-GET method, so it can sit alongside other handlers in one dispatcher.
 */
export const createContentExplorerRouteHandler = (
  dataSource: ContentExplorerDataSource,
  options: ContentExplorerRouteOptions = {},
): RouteHandler => {
  const template = options.path ?? DEFAULT_PATH;

  return async request => {
    try {
      const url = new URL(request.url);
      const params = matchPath(template, url.pathname);
      if (!params) {
        return jsonResponse({ code: "not_found", message: "No matching route" }, 404);
      }
      if (request.method !== "GET") {
        return jsonResponse({ code: "method_not_allowed", message: "Use GET" }, 405);
      }

      const result = await dataSource.listFolderItems({
        folderId: params.folderId,
        limit: readNumber(url.searchParams.get("limit")),
        offset: readNumber(url.searchParams.get("offset")),
        context: contextFromRequest(request),
      });
      return jsonResponse(result);
    } catch (error) {
      return errorResponse(error);
    }
  };
};
