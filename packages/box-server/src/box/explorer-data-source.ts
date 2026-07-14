import type {
  ContentExplorerDataSource,
  ContentExplorerListFolderInput,
} from "../../../../src/patterns/content-explorer/contracts.js";
import type { ExplorerTransportResult } from "../../../../src/patterns/content-explorer/types.js";
import type { BoxRestClient } from "../auth/client.js";
import {
  buildExplorerResult,
  type BoxRawFolder,
  type BoxRawItemCollection,
} from "../mappers/explorer.js";

export interface BoxExplorerDataSourceOptions {
  /** Impersonate this Box user for every request (enterprise `As-User`). */
  asUser?: string;
  /** Page size used when a request omits one. */
  defaultLimit?: number;
}

const DEFAULT_LIMIT = 25;
const FOLDER_FIELDS = "name,path_collection";
const ITEM_FIELDS = "name,type";

/**
 * A {@link ContentExplorerDataSource} backed by the Box REST API. It fetches
 * the folder (for its name + ancestor trail) and its items, then maps both into
 * the stable explorer contract — no Box DTOs escape this boundary.
 */
export const createBoxExplorerDataSource = (
  client: BoxRestClient,
  options: BoxExplorerDataSourceOptions = {},
): ContentExplorerDataSource => {
  const asUser = options.asUser;
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;

  const listFolderItems = async (
    input: ContentExplorerListFolderInput,
  ): Promise<ExplorerTransportResult> => {
    const limit = input.limit ?? defaultLimit;
    const offset = input.offset ?? 0;
    const requestId = input.context?.requestId;
    const signal = input.context?.signal;

    const folder = await client.request<BoxRawFolder>(
      "GET",
      `/2.0/folders/${encodeURIComponent(input.folderId)}`,
      { query: { fields: FOLDER_FIELDS }, asUser, requestId, signal },
    );
    const collection = await client.request<BoxRawItemCollection>(
      "GET",
      `/2.0/folders/${encodeURIComponent(input.folderId)}/items`,
      { query: { fields: ITEM_FIELDS, limit, offset }, asUser, requestId, signal },
    );

    return buildExplorerResult(folder, collection, { limit, offset });
  };

  return { listFolderItems };
};
