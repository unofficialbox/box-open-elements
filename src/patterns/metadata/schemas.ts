import type { JsonSchema } from "../../core/json-schema.js";

export const metadataFieldDefinitionSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["key", "label", "type"],
  properties: {
    key: { type: "string" },
    label: { type: "string" },
    type: {
      enum: ["string", "enum", "float", "integer", "date", "bool", "multiSelect"],
    },
    description: { type: "string" },
    required: { type: "boolean" },
    options: {
      type: "array",
      items: { type: "string" },
    },
  },
};

export const metadataTemplateDefinitionSchema: JsonSchema = {
  $id: "box-open-elements/patterns/metadata/MetadataTemplateDefinition",
  type: "object",
  additionalProperties: false,
  required: ["key", "label", "scope", "fields"],
  properties: {
    key: { type: "string" },
    label: { type: "string" },
    scope: { type: "string" },
    fields: {
      type: "array",
      items: metadataFieldDefinitionSchema,
    },
  },
};

export const metadataInstanceSchema: JsonSchema = {
  $id: "box-open-elements/patterns/metadata/MetadataInstance",
  type: "object",
  additionalProperties: true,
  required: ["scope", "templateKey", "values"],
  properties: {
    id: { type: "string" },
    scope: { type: "string" },
    templateKey: { type: "string" },
    values: {
      type: "object",
      additionalProperties: true,
    },
  },
};

export const metadataPageSchema: JsonSchema = {
  $id: "box-open-elements/patterns/metadata/MetadataPage",
  type: "object",
  additionalProperties: false,
  required: ["entries", "limit", "offset", "totalCount"],
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
    limit: { type: "number" },
    offset: { type: "number" },
    totalCount: { type: ["number", "null"] },
  },
};
