import type { JsonSchema } from "../../core/json-schema.js";

export const explorerItemSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "type"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { enum: ["file", "folder", "web_link"] },
  },
};

export const explorerFolderSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "type"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { const: "folder" },
  },
};

export const explorerPaginationSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["hasMoreItems", "limit", "offset", "totalCount"],
  properties: {
    hasMoreItems: { type: "boolean" },
    limit: { type: "number" },
    offset: { type: "number" },
    totalCount: { type: ["number", "null"] },
  },
};

export const explorerTransportResultSchema: JsonSchema = {
  $id: "box-open-elements/patterns/content-explorer/ExplorerTransportResult",
  type: "object",
  additionalProperties: false,
  required: ["breadcrumbs", "folder", "folderId", "items", "pagination"],
  properties: {
    breadcrumbs: {
      type: "array",
      items: explorerFolderSchema,
    },
    folder: explorerFolderSchema,
    folderId: { type: "string" },
    items: {
      type: "array",
      items: explorerItemSchema,
    },
    pagination: explorerPaginationSchema,
  },
};
