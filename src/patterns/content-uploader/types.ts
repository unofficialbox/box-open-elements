/**
 * The minimum surface the uploader needs from a file: browsers hand us `File`
 * objects, tests and non-DOM callers can pass any Blob-like with a name.
 */
export interface UploadFileLike {
  name: string;
  size: number;
}

export type UploadItemStatus = "queued" | "uploading" | "succeeded" | "failed" | "cancelled";

export interface UploadQueueItem {
  /** Locally-assigned queue id — not the Box file id. */
  id: string;
  name: string;
  size: number;
  status: UploadItemStatus;
  /** 0–1 fraction reported by the transport; 1 once the upload succeeds. */
  progress: number;
  /** Present when `status` is "failed". */
  errorMessage?: string;
  /** Remote file id from the transport once the upload succeeds. */
  fileId?: string;
}

export interface UploadRequest {
  file: UploadFileLike;
  fileName: string;
  folderId: string;
  token: string;
  language?: string;
  signal?: AbortSignal;
  /** Report fractional progress (0–1). Transports may only report completion. */
  onProgress?: (fraction: number) => void;
}

export interface UploadResult {
  fileId: string;
  name?: string;
  size?: number;
}

/**
 * One narrow capability: move a single file to the destination folder. How —
 * multipart, chunked upload sessions, a BFF — is the transport's business;
 * the queue orchestration above it never changes.
 */
export interface UploadTransport {
  uploadFile(request: UploadRequest): Promise<UploadResult>;
}

export interface UploaderConstraints {
  /**
   * Extension allowlist (case-insensitive, no leading dot) matched against
   * the file name's suffix. Empty or omitted accepts every extension.
   */
  extensions?: string[];
  /** Reject files larger than this many bytes. Omitted means no limit. */
  maxFileSizeBytes?: number;
}

export interface UploaderSessionConfig extends UploaderConstraints {
  folderId: string;
  token: string;
  transport: UploadTransport;
  language?: string;
  /** Simultaneous uploads. Defaults to 2. */
  concurrency?: number;
  /** Start uploading as soon as files are added. Defaults to true. */
  autoStart?: boolean;
}

export type UploadRejectionReason = "extension-not-allowed" | "file-too-large";

export interface UploaderState {
  items: UploadQueueItem[];
  /** True while any item is actively uploading. */
  uploading: boolean;
}

export interface UploaderEvents {
  itemAdded: { item: UploadQueueItem };
  itemRejected: { file: UploadFileLike; reason: UploadRejectionReason };
  itemStarted: { item: UploadQueueItem };
  itemProgress: { item: UploadQueueItem };
  itemSucceeded: { item: UploadQueueItem };
  itemFailed: { item: UploadQueueItem };
  itemCancelled: { item: UploadQueueItem };
  itemRemoved: { itemId: string };
  queueChanged: { items: UploadQueueItem[] };
  /** Fired when the last active item settles and nothing is queued. */
  queueDrained: { succeeded: number; failed: number; cancelled: number };
}

const normalizeExtension = (value: string): string => value.replace(/^\./, "").toLowerCase();

const resolveFileExtension = (name: string): string | null => {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === name.length - 1) {
    return null;
  }
  return normalizeExtension(name.slice(dotIndex + 1));
};

/**
 * Pure acceptance check — the single source of truth for what the uploader
 * lets into its queue. Returns the rejection reason, or null when accepted.
 */
export const resolveUploadRejection = (
  file: UploadFileLike,
  constraints: UploaderConstraints,
): UploadRejectionReason | null => {
  if (constraints.extensions?.length) {
    const extension = resolveFileExtension(file.name);
    if (!extension || !constraints.extensions.map(normalizeExtension).includes(extension)) {
      return "extension-not-allowed";
    }
  }

  if (constraints.maxFileSizeBytes != null && file.size > constraints.maxFileSizeBytes) {
    return "file-too-large";
  }

  return null;
};

export interface UploadQueueSummary {
  total: number;
  queued: number;
  uploading: number;
  succeeded: number;
  failed: number;
  cancelled: number;
}

export const summarizeUploadQueue = (items: readonly UploadQueueItem[]): UploadQueueSummary => {
  const summary: UploadQueueSummary = {
    total: items.length,
    queued: 0,
    uploading: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
  };
  for (const item of items) {
    summary[item.status] += 1;
  }
  return summary;
};
