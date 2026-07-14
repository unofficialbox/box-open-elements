import type {
  MetadataDataSource,
  MetadataInstance,
  MetadataPage,
  MetadataTemplateDefinition,
} from "../../../../src/patterns/metadata/contracts.js";
import { BoxApiError } from "../http.js";
import type { BoxRestClient } from "../auth/client.js";
import {
  buildMetadataQueryPage,
  mapInstance,
  mapInstances,
  mapTemplates,
  type BoxRawInstance,
  type BoxRawInstanceCollection,
  type BoxRawQueryResponse,
  type BoxRawTemplateCollection,
} from "../mappers/metadata.js";

export interface BoxMetadataDataSourceOptions {
  asUser?: string;
  /** Template scope used for reads/writes. Defaults to "enterprise". */
  scope?: string;
}

type QueryItem = { id: string; name: string; type: "file" | "folder" };

const DEFAULT_SCOPE = "enterprise";
const JSON_PATCH = "application/json-patch+json";

const itemBase = (itemType: "file" | "folder", itemId: string): string =>
  `/2.0/${itemType === "folder" ? "folders" : "files"}/${encodeURIComponent(itemId)}`;

/**
 * A {@link MetadataDataSource} backed by the Box REST API. Templates, instances,
 * and query results are mapped into the stable metadata contracts. Instance
 * writes create the instance, or fall back to a JSON-Patch replace when it
 * already exists.
 */
export const createBoxMetadataDataSource = (
  client: BoxRestClient,
  options: BoxMetadataDataSourceOptions = {},
): MetadataDataSource<QueryItem> => {
  const asUser = options.asUser;
  const scope = options.scope ?? DEFAULT_SCOPE;

  const listTemplates: MetadataDataSource<QueryItem>["listTemplates"] = async context => {
    const collection = await client.request<BoxRawTemplateCollection>(
      "GET",
      `/2.0/metadata_templates/${encodeURIComponent(scope)}`,
      { asUser, requestId: context?.requestId, signal: context?.signal },
    );
    return mapTemplates(collection);
  };

  const listInstances: MetadataDataSource<QueryItem>["listInstances"] = async input => {
    const collection = await client.request<BoxRawInstanceCollection>(
      "GET",
      `${itemBase(input.itemType, input.itemId)}/metadata`,
      { asUser, requestId: input.context?.requestId, signal: input.context?.signal },
    );
    return mapInstances(collection);
  };

  const updateInstance: MetadataDataSource<QueryItem>["updateInstance"] = async input => {
    const { itemId, itemType, instance, context } = input;
    const path = `${itemBase(itemType, itemId)}/metadata/${encodeURIComponent(scope)}/${encodeURIComponent(instance.templateKey)}`;
    const requestId = context?.requestId;
    const signal = context?.signal;

    try {
      const created = await client.request<BoxRawInstance>("POST", path, {
        body: instance.values,
        asUser,
        requestId,
        signal,
      });
      return mapInstance(created);
    } catch (error) {
      // 409 = the instance already exists; replace each value via JSON-Patch.
      if (!(error instanceof BoxApiError) || error.status !== 409) {
        throw error;
      }
      const ops = Object.entries(instance.values).map(([key, value]) => ({
        op: "add" as const,
        path: `/${key}`,
        value,
      }));
      const updated = await client.request<BoxRawInstance>("PUT", path, {
        body: ops,
        contentType: JSON_PATCH,
        asUser,
        requestId,
        signal,
      });
      return mapInstance(updated);
    }
  };

  const query: MetadataDataSource<QueryItem>["query"] = async input => {
    const limit = input.limit ?? 25;
    const offset = input.offset ?? 0;
    const response = await client.request<BoxRawQueryResponse>(
      "POST",
      "/2.0/metadata_queries/execute",
      {
        body: {
          from: `${input.scope ?? scope}.${input.templateKey}`,
          query: buildQueryExpression(input.filters),
          query_params: input.filters,
          limit,
        },
        asUser,
        requestId: input.context?.requestId,
        signal: input.context?.signal,
      },
    );
    return buildMetadataQueryPage(response, { limit, offset }) satisfies MetadataPage<QueryItem>;
  };

  return { listTemplates, listInstances, updateInstance, query };
};

/** Turn a flat filter map into a Box metadata-query `key = :key` expression. */
const buildQueryExpression = (filters: Record<string, unknown>): string =>
  Object.keys(filters)
    .map(key => `${key} = :${key}`)
    .join(" AND ");

export type { MetadataTemplateDefinition, MetadataInstance };
