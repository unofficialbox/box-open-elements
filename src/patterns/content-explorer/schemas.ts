import type { JsonSchema } from "../../core/json-schema.js";

export const explorerItemSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "type"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { enum: ["file", "folder", "web_link"] },
    size: { type: ["number", "null"] },
    modifiedAt: { type: ["string", "null"] },
    createdAt: { type: ["string", "null"] },
    extension: { type: ["string", "null"] },
    owner: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        type: { enum: ["user", "group"] },
      },
    },
    permissions: {
      type: "object",
      additionalProperties: false,
      properties: {
        canDownload: { type: "boolean" },
        canPreview: { type: "boolean" },
        canShare: { type: "boolean" },
        canDelete: { type: "boolean" },
        canRename: { type: "boolean" },
        canUpload: { type: "boolean" },
      },
    },
    sharedLink: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["isShared"],
      properties: {
        isShared: { type: "boolean" },
        access: { enum: ["open", "company", "collaborators"] },
        url: { type: "string" },
      },
    },
    preview: {
      type: "object",
      additionalProperties: false,
      properties: {
        canPreview: { type: "boolean" },
        extension: { type: ["string", "null"] },
        mimeType: { type: ["string", "null"] },
      },
    },
    parent: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    },
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

export const explorerSearchResultSchema: JsonSchema = {
  $id: "box-open-elements/patterns/content-explorer/ExplorerSearchResult",
  type: "object",
  additionalProperties: false,
  required: ["query", "items", "pagination"],
  properties: {
    query: { type: "string" },
    ancestorFolderId: { type: "string" },
    items: {
      type: "array",
      items: explorerItemSchema,
    },
    pagination: explorerPaginationSchema,
  },
};
