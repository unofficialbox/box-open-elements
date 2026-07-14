import type {
  CollaboratorSummary,
  SharedLinkState,
  ShareState,
} from "../../../../src/patterns/share/contracts.js";

/** Raw Box REST shapes (only the fields this adapter consumes). */
export interface BoxRawSharedLink {
  url?: string;
  effective_access?: "open" | "company" | "collaborators";
  access?: "open" | "company" | "collaborators";
  is_password_enabled?: boolean;
  unshared_at?: string | null;
  permissions?: { can_download?: boolean; can_preview?: boolean };
}

export interface BoxRawItem {
  id: string;
  type: "file" | "folder";
  shared_link?: BoxRawSharedLink | null;
}

export interface BoxRawCollaborationUser {
  id?: string;
  type?: "user" | "group";
  name?: string;
  login?: string;
}

export interface BoxRawCollaboration {
  id: string;
  role?: string;
  status?: "accepted" | "pending" | "rejected";
  accessible_by?: BoxRawCollaborationUser | null;
  invite_email?: string | null;
}

export interface BoxRawCollaborationCollection {
  entries?: BoxRawCollaboration[];
}

export const mapSharedLink = (raw: BoxRawSharedLink | null | undefined): SharedLinkState | null => {
  if (!raw) {
    return null;
  }
  return {
    url: raw.url,
    access: raw.effective_access ?? raw.access,
    passwordEnabled: raw.is_password_enabled,
    canDownload: raw.permissions?.can_download,
    canPreview: raw.permissions?.can_preview,
    expiresAt: raw.unshared_at ?? null,
  };
};

/** Serialize a contract shared link back into Box's PUT payload shape. */
export const toBoxSharedLinkPayload = (
  sharedLink: SharedLinkState | null,
): { shared_link: Record<string, unknown> | null } => {
  if (!sharedLink) {
    return { shared_link: null };
  }
  const permissions: Record<string, boolean> = {};
  if (typeof sharedLink.canDownload === "boolean") {
    permissions.can_download = sharedLink.canDownload;
  }
  if (typeof sharedLink.canPreview === "boolean") {
    permissions.can_preview = sharedLink.canPreview;
  }
  return {
    shared_link: {
      ...(sharedLink.access ? { access: sharedLink.access } : {}),
      ...(sharedLink.expiresAt !== undefined ? { unshared_at: sharedLink.expiresAt } : {}),
      ...(Object.keys(permissions).length ? { permissions } : {}),
    },
  };
};

export const mapCollaborator = (raw: BoxRawCollaboration): CollaboratorSummary => {
  const accessor = raw.accessible_by;
  const isInvite = !accessor && Boolean(raw.invite_email);
  return {
    id: accessor?.id ?? raw.id,
    name: accessor?.name?.trim() || accessor?.login || raw.invite_email || "Unknown",
    type: isInvite ? "invite" : accessor?.type ?? "user",
    role: raw.role ?? "viewer",
    status: raw.status,
  };
};

export const mapCollaborators = (
  collection: BoxRawCollaborationCollection,
): CollaboratorSummary[] => (collection.entries ?? []).map(mapCollaborator);

export const buildShareState = (
  item: BoxRawItem,
  collaborations: BoxRawCollaborationCollection,
): ShareState => ({
  itemId: item.id,
  itemType: item.type,
  sharedLink: mapSharedLink(item.shared_link),
  collaborators: mapCollaborators(collaborations),
});
