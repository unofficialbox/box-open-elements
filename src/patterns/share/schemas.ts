import type { JsonSchema } from "../../core/json-schema.js";

export const sharedLinkStateSchema: JsonSchema = {
  $id: "box-open-elements/patterns/share/SharedLinkState",
  type: ["object", "null"],
  additionalProperties: false,
  properties: {
    url: { type: "string" },
    access: { enum: ["open", "company", "collaborators"] },
    passwordEnabled: { type: "boolean" },
    canDownload: { type: "boolean" },
    canPreview: { type: "boolean" },
    expiresAt: { type: ["string", "null"] },
  },
};

export const collaboratorSummarySchema: JsonSchema = {
  $id: "box-open-elements/patterns/share/CollaboratorSummary",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "type", "role"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { enum: ["user", "group", "invite"] },
    role: { type: "string" },
    status: { type: "string" },
  },
};

export const shareStateSchema: JsonSchema = {
  $id: "box-open-elements/patterns/share/ShareState",
  type: "object",
  additionalProperties: false,
  required: ["itemId", "itemType", "sharedLink", "collaborators"],
  properties: {
    itemId: { type: "string" },
    itemType: { enum: ["file", "folder"] },
    sharedLink: sharedLinkStateSchema,
    collaborators: {
      type: "array",
      items: collaboratorSummarySchema,
    },
  },
};
