import type {
  MetadataFieldDefinition,
  MetadataFieldType,
  MetadataInstance,
  MetadataPage,
  MetadataTemplateDefinition,
} from "../../../../src/patterns/metadata/contracts.js";

/** Raw Box REST shapes (only the fields this adapter consumes). */
export interface BoxRawTemplateField {
  key: string;
  displayName?: string;
  type: string;
  description?: string;
  options?: Array<{ key: string }>;
}

export interface BoxRawTemplate {
  templateKey: string;
  displayName?: string;
  scope: string;
  fields?: BoxRawTemplateField[];
  hidden?: boolean;
}

export interface BoxRawTemplateCollection {
  entries?: BoxRawTemplate[];
}

/** A metadata instance is a flat map plus `$`-prefixed system keys. */
export type BoxRawInstance = Record<string, unknown> & {
  $id?: string;
  $scope?: string;
  $template?: string;
};

export interface BoxRawInstanceCollection {
  entries?: BoxRawInstance[];
}

export interface BoxRawQueryEntry {
  item?: { id: string; type: "file" | "folder"; name?: string };
}

export interface BoxRawQueryResponse {
  entries?: BoxRawQueryEntry[];
  next_marker?: string | null;
}

const KNOWN_FIELD_TYPES: MetadataFieldType[] = [
  "string",
  "enum",
  "float",
  "integer",
  "date",
  "bool",
  "multiSelect",
];

const mapFieldType = (type: string): MetadataFieldType =>
  (KNOWN_FIELD_TYPES as string[]).includes(type) ? (type as MetadataFieldType) : "string";

export const mapTemplateField = (raw: BoxRawTemplateField): MetadataFieldDefinition => ({
  key: raw.key,
  label: raw.displayName?.trim() || raw.key,
  type: mapFieldType(raw.type),
  ...(raw.description ? { description: raw.description } : {}),
  ...(raw.options?.length ? { options: raw.options.map(option => option.key) } : {}),
});

export const mapTemplate = (raw: BoxRawTemplate): MetadataTemplateDefinition => ({
  key: raw.templateKey,
  label: raw.displayName?.trim() || raw.templateKey,
  scope: raw.scope,
  fields: (raw.fields ?? []).map(mapTemplateField),
});

export const mapTemplates = (
  collection: BoxRawTemplateCollection,
): MetadataTemplateDefinition[] =>
  (collection.entries ?? []).filter(entry => !entry.hidden).map(mapTemplate);

export const mapInstance = (raw: BoxRawInstance): MetadataInstance => {
  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith("$")) {
      values[key] = value;
    }
  }
  return {
    ...(raw.$id ? { id: raw.$id } : {}),
    scope: raw.$scope ?? "enterprise",
    templateKey: raw.$template ?? "",
    values,
  };
};

export const mapInstances = (collection: BoxRawInstanceCollection): MetadataInstance[] =>
  (collection.entries ?? []).map(mapInstance);

/**
 * Build the metadata-query wire page. Box's query API is marker-paginated and
 * returns no total, so `totalCount` is null and `offset` echoes the request.
 */
export const buildMetadataQueryPage = (
  response: BoxRawQueryResponse,
  requested: { limit: number; offset: number },
): MetadataPage<{ id: string; name: string; type: "file" | "folder" }> => ({
  entries: (response.entries ?? [])
    .map(entry => entry.item)
    .filter((item): item is NonNullable<BoxRawQueryEntry["item"]> => Boolean(item))
    .map(item => ({ id: item.id, name: item.name?.trim() || "Untitled", type: item.type })),
  limit: requested.limit,
  offset: requested.offset,
  totalCount: null,
});
