// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import {
  captureDropEntries,
  collectEntries,
  entriesFromFileList,
  hasFolderEntries,
} from "../../../src/foundations/files/directory-entries.js";

const makeFile = (name: string, relativePath?: string): File => {
  const file = new File(["x"], name);
  if (relativePath !== undefined) {
    Object.defineProperty(file, "webkitRelativePath", { value: relativePath });
  }
  return file;
};

/** A FileSystemEntry stand-in; the real ones are only constructible by a drop. */
const fileEntry = (name: string) => ({
  isDirectory: false,
  isFile: true,
  name,
  file: (onSuccess: (file: File) => void) => onSuccess(makeFile(name)),
});

const unreadableEntry = (name: string) => ({
  isDirectory: false,
  isFile: true,
  name,
  file: (_onSuccess: (file: File) => void, onError?: (error: unknown) => void) =>
    onError?.(new Error("permission denied")),
});

/** A directory whose reader hands back its children in batches, as the real one does. */
const dirEntry = (name: string, children: unknown[], batchSize = 100) => ({
  isDirectory: true,
  isFile: false,
  name,
  createReader: () => {
    let cursor = 0;
    return {
      readEntries: (onSuccess: (entries: never[]) => void) => {
        const batch = children.slice(cursor, cursor + batchSize);
        cursor += batch.length;
        onSuccess(batch as never[]);
      },
    };
  },
});

const dataTransferItem = (options: {
  entry?: unknown;
  file?: File | null;
  kind?: string;
  type?: string;
}): DataTransferItem =>
  ({
    kind: options.kind ?? "file",
    type: options.type ?? "",
    getAsFile: () => options.file ?? null,
    webkitGetAsEntry: () => options.entry ?? null,
  }) as unknown as DataTransferItem;

const dataTransfer = (items: DataTransferItem[], files: File[] = []): DataTransfer =>
  ({ files, items }) as unknown as DataTransfer;

describe("captureDropEntries", () => {
  it("reads the entry list, which is the only thing that can describe a folder", () => {
    const entry = dirEntry("docs", []);
    const captured = captureDropEntries(dataTransfer([dataTransferItem({ entry })]));

    expect(captured).toHaveLength(1);
    expect(captured[0]!.entry).toBe(entry);
  });

  it("falls back to the flat file list when there is no item list", () => {
    // Older browsers and synthetic events have files but no items; folders
    // cannot be represented there, but loose files still upload.
    const file = makeFile("a.txt");
    const captured = captureDropEntries(dataTransfer([], [file]));

    expect(captured).toEqual([{ entry: null, file }]);
  });

  it("ignores non-file items, such as a dragged text selection", () => {
    const captured = captureDropEntries(
      dataTransfer([dataTransferItem({ kind: "string", entry: null })]),
    );

    expect(captured).toEqual([]);
  });

  it("treats a macOS package as one file rather than descending into it", () => {
    // A .app or .rtfd arrives as a directory the OS also calls a zip. Walking
    // it would upload its internals as loose files and destroy the bundle.
    const bundle = makeFile("Keynote.app");
    const captured = captureDropEntries(
      dataTransfer([
        dataTransferItem({
          entry: dirEntry("Keynote.app", [fileEntry("index")]),
          file: bundle,
          type: "application/zip",
        }),
      ]),
    );

    expect(captured).toEqual([{ entry: null, file: bundle }]);
  });

  it("returns nothing for a drop with no dataTransfer", () => {
    expect(captureDropEntries(null)).toEqual([]);
  });
});

describe("collectEntries", () => {
  it("gives a loose file an empty path", async () => {
    const file = makeFile("a.txt");
    const entries = await collectEntries([{ entry: null, file }]);

    expect(entries).toEqual([{ file, path: "" }]);
  });

  it("records the directory a file was found in", async () => {
    const entries = await collectEntries([
      { entry: dirEntry("docs", [fileEntry("a.txt")]), file: null },
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]!.path).toBe("docs");
    expect(entries[0]!.file.name).toBe("a.txt");
  });

  it("descends through nested directories", async () => {
    const entries = await collectEntries([
      {
        entry: dirEntry("docs", [dirEntry("2026", [fileEntry("q1.pdf")])]),
        file: null,
      },
    ]);

    expect(entries.map(entry => entry.path)).toEqual(["docs/2026"]);
  });

  it("reads every batch, because readEntries truncates at ~100 per call", async () => {
    // The single most common folder-upload bug: call readEntries once and a
    // folder of 250 files silently becomes a folder of 100.
    const children = Array.from({ length: 250 }, (_, index) => fileEntry(`file-${index}.txt`));
    const entries = await collectEntries([
      { entry: dirEntry("bulk", children), file: null },
    ]);

    expect(entries).toHaveLength(250);
  });

  it("skips a file it cannot read rather than losing the whole drop", async () => {
    const entries = await collectEntries([
      {
        entry: dirEntry("docs", [unreadableEntry("locked.txt"), fileEntry("fine.txt")]),
        file: null,
      },
    ]);

    expect(entries.map(entry => entry.file.name)).toEqual(["fine.txt"]);
  });

  it("keeps what it read when a directory fails partway through", async () => {
    // One unreadable subfolder must not discard the files already read around
    // it — the whole drop used to be lost to an unhandled rejection.
    const failing = {
      isDirectory: true,
      isFile: false,
      name: "locked",
      createReader: () => ({
        readEntries: (
          _onSuccess: (entries: never[]) => void,
          onError?: (error: unknown) => void,
        ) => onError?.(new Error("permission denied")),
      }),
    };
    const skipped: string[] = [];
    const entries = await collectEntries(
      [{ entry: dirEntry("docs", [fileEntry("fine.txt"), failing]), file: null }],
      name => skipped.push(name),
    );

    expect(entries.map(entry => entry.file.name)).toEqual(["fine.txt"]);
    expect(skipped).toEqual(["docs/locked"]);
  });

  it("survives a reader that throws rather than calling back", async () => {
    const throwing = {
      isDirectory: true,
      isFile: false,
      name: "docs",
      createReader: () => ({
        readEntries: () => {
          throw new Error("gone");
        },
      }),
    };

    await expect(collectEntries([{ entry: throwing, file: null }])).resolves.toEqual([]);
  });

  it("names a file it could not read instead of dropping it silently", async () => {
    const skipped: string[] = [];
    await collectEntries(
      [{ entry: dirEntry("docs", [unreadableEntry("locked.txt")]), file: null }],
      name => skipped.push(name),
    );

    expect(skipped).toEqual(["docs/locked.txt"]);
  });

  it("yields nothing for an empty folder, since there is nothing to upload", async () => {
    expect(await collectEntries([{ entry: dirEntry("empty", []), file: null }])).toEqual([]);
  });
});

describe("entriesFromFileList", () => {
  it("derives the directory from webkitRelativePath", () => {
    const entries = entriesFromFileList([makeFile("q1.pdf", "docs/2026/q1.pdf")]);

    expect(entries[0]!.path).toBe("docs/2026");
  });

  it("leaves the path empty when the browser reports no relative path", () => {
    expect(entriesFromFileList([makeFile("a.txt")])[0]!.path).toBe("");
  });

  it("leaves the path empty for a file at the selection root", () => {
    expect(entriesFromFileList([makeFile("a.txt", "a.txt")])[0]!.path).toBe("");
  });
});

describe("hasFolderEntries", () => {
  it("distinguishes a folder drop from a plain file drop", () => {
    expect(hasFolderEntries([{ file: makeFile("a.txt"), path: "" }])).toBe(false);
    expect(hasFolderEntries([{ file: makeFile("a.txt"), path: "docs" }])).toBe(true);
  });
});
