import type {
  ShareDataSource,
  ShareState,
  CollaboratorSummary,
} from "../../../../src/patterns/share/contracts.js";
import type { BoxRestClient } from "../auth/client.js";
import {
  buildShareState,
  mapCollaborators,
  toBoxSharedLinkPayload,
  type BoxRawCollaborationCollection,
  type BoxRawItem,
} from "../mappers/share.js";

export interface BoxShareDataSourceOptions {
  asUser?: string;
}

const ITEM_FIELDS = "shared_link";

const itemPath = (itemType: "file" | "folder", itemId: string): string =>
  `/2.0/${itemType === "folder" ? "folders" : "files"}/${encodeURIComponent(itemId)}`;

/**
 * A {@link ShareDataSource} backed by the Box REST API. It reads/writes the
 * item's shared link and lists collaborations, mapping Box DTOs into the stable
 * share contract.
 */
export const createBoxShareDataSource = (
  client: BoxRestClient,
  options: BoxShareDataSourceOptions = {},
): ShareDataSource => {
  const asUser = options.asUser;

  const fetchCollaborations = (
    itemType: "file" | "folder",
    itemId: string,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<BoxRawCollaborationCollection> =>
    client.request<BoxRawCollaborationCollection>(
      "GET",
      `${itemPath(itemType, itemId)}/collaborations`,
      { asUser, requestId, signal },
    );

  const getShareState: ShareDataSource["getShareState"] = async input => {
    const { itemId, itemType, context } = input;
    const item = await client.request<BoxRawItem>("GET", itemPath(itemType, itemId), {
      query: { fields: ITEM_FIELDS },
      asUser,
      requestId: context?.requestId,
      signal: context?.signal,
    });
    const collaborations = await fetchCollaborations(
      itemType,
      itemId,
      context?.requestId,
      context?.signal,
    );
    return buildShareState({ ...item, id: itemId, type: itemType }, collaborations);
  };

  const updateSharedLink: ShareDataSource["updateSharedLink"] = async input => {
    const { itemId, itemType, sharedLink, context } = input;
    const item = await client.request<BoxRawItem>("PUT", itemPath(itemType, itemId), {
      query: { fields: ITEM_FIELDS },
      body: toBoxSharedLinkPayload(sharedLink),
      asUser,
      requestId: context?.requestId,
      signal: context?.signal,
    });
    const collaborations = await fetchCollaborations(
      itemType,
      itemId,
      context?.requestId,
      context?.signal,
    );
    return buildShareState({ ...item, id: itemId, type: itemType }, collaborations) satisfies ShareState;
  };

  const listCollaborators: ShareDataSource["listCollaborators"] = async input => {
    const collaborations = await fetchCollaborations(
      input.itemType,
      input.itemId,
      input.context?.requestId,
      input.context?.signal,
    );
    return mapCollaborators(collaborations) satisfies CollaboratorSummary[];
  };

  return { getShareState, updateSharedLink, listCollaborators };
};
