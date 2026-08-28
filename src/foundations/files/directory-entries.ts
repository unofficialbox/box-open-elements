/**
 * Reading dropped folders, using only what the platform provides.
 *
 * A drop carries two very different things. `DataTransfer.files` is a flat
 * `FileList` that **cannot represent a directory** — drop a folder and you get
 * nothing useful, silently. `DataTransfer.items` carries `FileSystemEntry`
 * objects via `webkitGetAsEntry()`, which is the only way to see that a folder
 * was dropped at all, let alone read what is inside it.
 *
 * Two rules here are load-bearing and easy to get wrong:
 *
 * 1. **`webkitGetAsEntry()` must be called synchronously** while the `drop`
 *    event is being handled. The `DataTransferItemList` is emptied as soon as
 *    the handler returns, so an `await` before the call leaves you with
 *    nothing. Capture first (`captureDropEntries`), traverse afterwards
 *    (`collectEntries`).
 * 2. **`readEntries()` is batched.** It resolves with at most ~100 entries per
 *    call and must be called repeatedly until it yields an empty array. Read it
 *    once and a folder of 500 files quietly becomes a folder of 100.
 */

/** A file plus the directory path it was found under, relative to the drop. */
export interface UploadEntry {
  file: File;
  /**
   * Directory path relative to the drop root, e.g. `"docs/2026"`. Empty for a
   * file dropped at the top level.
   */
  path: string;
}

/** Minimal shape of the entry objects, which TypeScript's DOM lib types loosely. */
interface FileSystemEntryLike {
  isDirectory: boolean;
  isFile: boolean;
  name: string;
  createReader?: () => FileSystemDirectoryReaderLike;
  file?: (onSuccess: (file: File) => void, onError?: (error: unknown) => void) => void;
}

interface FileSystemDirectoryReaderLike {
  readEntries: (
    onSuccess: (entries: FileSystemEntryLike[]) => void,
    onError?: (error: unknown) => void,
  ) => void;
}

/** What a synchronous capture yields: an entry, or a plain file when there is none. */
export interface CapturedDropItem {
  entry: FileSystemEntryLike | null;
  file: File | null;
}

const getAsEntry = (item: DataTransferItem): FileSystemEntryLike | null => {
  const candidate = item as DataTransferItem & {
    webkitGetAsEntry?: () => FileSystemEntryLike | null;
    mozGetAsEntry?: () => FileSystemEntryLike | null;
    getAsEntry?: () => FileSystemEntryLike | null;
  };
  const method = candidate.webkitGetAsEntry ?? candidate.mozGetAsEntry ?? candidate.getAsEntry;
  return typeof method === "function" ? method.call(item) ?? null : null;
};

/**
 * A macOS bundle (`.app`, `.rtfd`, a Keynote file) arrives as a *directory*
 * that the OS also describes as a zip. Descending into one would upload its
 * internals as loose files and destroy the thing; it is uploaded whole.
 */
const isPackage = (item: DataTransferItem, entry: FileSystemEntryLike | null): boolean =>
  entry !== null && entry.isDirectory && item.kind === "file" && item.type === "application/zip";

/**
 * Read the entries out of a drop **synchronously**, before the event handler
 * returns and the item list is emptied.
 */
export const captureDropEntries = (dataTransfer: DataTransfer | null): CapturedDropItem[] => {
  if (!dataTransfer) {
    return [];
  }

  const items = Array.from(dataTransfer.items ?? []).filter(item => item.kind === "file");
  if (items.length) {
    return items.map(item => {
      const entry = getAsEntry(item);
      // A package is captured as a file so traversal never descends into it,
      // and getAsFile() is also only valid during the event.
      return isPackage(item, entry)
        ? { entry: null, file: item.getAsFile() }
        : { entry, file: entry ? null : item.getAsFile() };
    });
  }

  // No item list (older browsers, synthetic events): the flat file list is all
  // there is, and it cannot describe folders.
  return Array.from(dataTransfer.files ?? []).map(file => ({ entry: null, file }));
};

const readAllEntries = async (
  reader: FileSystemDirectoryReaderLike,
): Promise<{ entries: FileSystemEntryLike[]; failed: boolean }> => {
  const all: FileSystemEntryLike[] = [];

  // readEntries resolves a batch at a time and signals the end with an empty
  // array. Calling it once truncates any directory past the batch size.
  for (;;) {
    // A directory that cannot be read yields what was read before it failed,
    // rather than throwing: one unreadable subfolder must not discard the
    // hundreds of files that were read successfully around it.
    const batch = await new Promise<FileSystemEntryLike[] | null>(resolve => {
      try {
        reader.readEntries(resolve, () => resolve(null));
      } catch {
        resolve(null);
      }
    });
    if (batch === null) {
      return { entries: all, failed: true };
    }
    if (!batch.length) {
      return { entries: all, failed: false };
    }
    all.push(...batch);
  }
};

const readFile = async (entry: FileSystemEntryLike): Promise<File | null> => {
  if (typeof entry.file !== "function") {
    return null;
  }
  return new Promise<File | null>(resolve => {
    entry.file!(
      file => resolve(file),
      // An unreadable file inside an otherwise good folder should not abort the
      // whole drop; it is skipped and the rest still uploads.
      () => resolve(null),
    );
  });
};

const walk = async (
  entry: FileSystemEntryLike,
  path: string,
  out: UploadEntry[],
  onSkip: (name: string) => void,
): Promise<void> => {
  if (entry.isFile) {
    const file = await readFile(entry);
    if (file) {
      out.push({ file, path });
    } else {
      onSkip(path ? `${path}/${entry.name}` : entry.name);
    }
    return;
  }

  if (!entry.isDirectory || typeof entry.createReader !== "function") {
    onSkip(path ? `${path}/${entry.name}` : entry.name);
    return;
  }

  const childPath = path ? `${path}/${entry.name}` : entry.name;
  const { entries: children, failed } = await readAllEntries(entry.createReader());
  if (failed) {
    onSkip(childPath);
  }
  for (const child of children) {
    await walk(child, childPath, out, onSkip);
  }
};

/**
 * Resolve captured drop items into files, each tagged with the directory path
 * it came from. Files dropped at the top level get an empty path.
 *
 * Never rejects. A file the browser refuses to hand over, or a directory it
 * cannot finish reading, is reported through `onSkip` and everything else still
 * comes back — losing one file must not lose the drop, but nor should it pass
 * unmentioned, which is the failure mode this whole module exists to remove.
 */
export const collectEntries = async (
  captured: CapturedDropItem[],
  onSkip: (name: string) => void = () => {},
): Promise<UploadEntry[]> => {
  const out: UploadEntry[] = [];

  for (const item of captured) {
    if (item.entry) {
      await walk(item.entry, "", out, onSkip);
    } else if (item.file) {
      out.push({ file: item.file, path: "" });
    }
  }

  return out;
};

/**
 * Derive the same shape from an `<input webkitdirectory>` selection, where the
 * browser reports the tree through each file's `webkitRelativePath` rather than
 * through entries.
 */
export const entriesFromFileList = (files: readonly File[]): UploadEntry[] =>
  files.map(file => {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
    // webkitRelativePath includes the file name; the directory is everything
    // before the last separator.
    const separator = relativePath.lastIndexOf("/");
    return { file, path: separator > 0 ? relativePath.slice(0, separator) : "" };
  });

/** Whether any entry sits inside a folder, i.e. whether folder support is needed. */
export const hasFolderEntries = (entries: readonly UploadEntry[]): boolean =>
  entries.some(entry => entry.path !== "");
