import type {
  ShareDataSource,
  SharedLinkState,
} from "../../../../src/patterns/share/contracts.js";
import {
  contextFromRequest,
  errorResponse,
  jsonResponse,
  matchPath,
  type RouteHandler,
} from "./shared.js";

export interface ShareRouteOptions {
  /** Base path the handlers match. Defaults to the documented wire base. */
  basePath?: string;
}

const DEFAULT_BASE = "/api/share";

const asItemType = (value: string): "file" | "folder" | null =>
  value === "file" || value === "folder" ? value : null;

/**
 * Share wire routes:
 * - `GET  {base}/items/:itemType/:itemId` → `ShareState`
 * - `PUT  {base}/items/:itemType/:itemId/shared-link` → `ShareState`
 * - `GET  {base}/items/:itemType/:itemId/collaborators` → `CollaboratorSummary[]`
 */
export const createShareRouteHandler = (
  dataSource: ShareDataSource,
  options: ShareRouteOptions = {},
): RouteHandler => {
  const base = (options.basePath ?? DEFAULT_BASE).replace(/\/$/, "");
  const statePath = `${base}/items/:itemType/:itemId`;
  const linkPath = `${base}/items/:itemType/:itemId/shared-link`;
  const collaboratorsPath = `${base}/items/:itemType/:itemId/collaborators`;

  return async request => {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const context = contextFromRequest(request);

      const linkParams = matchPath(linkPath, pathname);
      if (linkParams) {
        if (request.method !== "PUT") {
          return jsonResponse({ code: "method_not_allowed", message: "Use PUT" }, 405);
        }
        const itemType = asItemType(linkParams.itemType);
        if (!itemType) {
          return jsonResponse({ code: "bad_request", message: "itemType must be file or folder" }, 400);
        }
        const payload = (await request.json()) as { sharedLink: SharedLinkState | null };
        const state = await dataSource.updateSharedLink({
          itemId: linkParams.itemId,
          itemType,
          sharedLink: payload.sharedLink,
          context,
        });
        return jsonResponse(state);
      }

      const collaboratorsParams = matchPath(collaboratorsPath, pathname);
      if (collaboratorsParams) {
        if (request.method !== "GET") {
          return jsonResponse({ code: "method_not_allowed", message: "Use GET" }, 405);
        }
        const itemType = asItemType(collaboratorsParams.itemType);
        if (!itemType) {
          return jsonResponse({ code: "bad_request", message: "itemType must be file or folder" }, 400);
        }
        const collaborators = await dataSource.listCollaborators({
          itemId: collaboratorsParams.itemId,
          itemType,
          context,
        });
        return jsonResponse(collaborators);
      }

      const stateParams = matchPath(statePath, pathname);
      if (stateParams) {
        if (request.method !== "GET") {
          return jsonResponse({ code: "method_not_allowed", message: "Use GET" }, 405);
        }
        const itemType = asItemType(stateParams.itemType);
        if (!itemType) {
          return jsonResponse({ code: "bad_request", message: "itemType must be file or folder" }, 400);
        }
        const state = await dataSource.getShareState({
          itemId: stateParams.itemId,
          itemType,
          context,
        });
        return jsonResponse(state);
      }

      return jsonResponse({ code: "not_found", message: "No matching route" }, 404);
    } catch (error) {
      return errorResponse(error);
    }
  };
};
