// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  lessons,
  lessonById,
  explorerLesson,
  shareLesson,
  previewLesson,
  type Lesson,
  type PreviewKey,
} from "../../docs-site/lessons.js";
import { catalog } from "../../docs-site/registry.js";
import { addedLines } from "../../docs-site/diff.js";
import { lessonMockTransport } from "../../docs-site/lesson-mock-transport.js";

const EXPLORER_PREVIEW_KEYS: PreviewKey[] = ["empty", "shell", "connected", "navigate", "select", "multiselect"];
const SHARE_PREVIEW_KEYS: PreviewKey[] = [
  "empty",
  "share-shell",
  "share-link",
  "share-people",
  "share-settings",
  "share-actions",
];
const CONTENT_PREVIEW_KEYS: PreviewKey[] = [
  "empty",
  "preview-shell",
  "preview-meta",
  "preview-provider",
  "preview-adapter",
  "preview-actions",
];

/** Lines that carry real content (skip blanks and pure-brace lines). */
const significant = (code: string): string[] =>
  code
    .split("\n")
    .map(line => line.trim())
    .filter(line => /[A-Za-z]/.test(line));

const assertLessonShape = (lesson: Lesson, previewKeys: PreviewKey[]): void => {
  const numbers = lesson.steps.map(step => step.n);
  expect(numbers[0]).toBe(0);
  expect(lesson.steps[0].title).toBe("Setup");
  const teaching = lesson.steps.filter(step => step.n > 0);
  expect(teaching.length).toBeGreaterThanOrEqual(4);
  expect(teaching.length).toBeLessThanOrEqual(6);
  expect(numbers).toEqual(numbers.slice().sort((a, b) => a - b));

  expect(lesson.outcomePreview.trim().length).toBeGreaterThan(0);
  expect(lesson.wrapup.trim().length).toBeGreaterThan(0);
  expect(previewKeys).toContain(lesson.outcomePreview);

  for (const step of lesson.steps) {
    expect(step.code.trim().length).toBeGreaterThan(0);
    expect(step.why.trim().length).toBeGreaterThan(0);
    expect(step.goal.trim().length).toBeGreaterThan(0);
    expect(step.result.trim().length).toBeGreaterThan(0);
    expect(step.file.trim().length).toBeGreaterThan(0);
    expect(step.anchor.trim().length).toBeGreaterThan(0);
    expect(previewKeys).toContain(step.preview);
  }

  for (let i = 1; i < lesson.steps.length; i++) {
    const prevLines = significant(lesson.steps[i - 1].code);
    const currentSet = new Set(significant(lesson.steps[i].code));
    for (const line of prevLines) {
      expect(currentSet.has(line)).toBe(true);
    }
    expect(significant(lesson.steps[i].code).length).toBeGreaterThan(prevLines.length);
  }

  expect(lesson.starterHtml).toContain("app.js");
  expect(lesson.starterHtml).toContain("box-open-elements");
  expect(lesson.starterHtml).toContain('id="app"');
  expect(lesson.starterHtml).toMatch(/box-open-elements@\d+\.\d+\.\d+/);
  expect(lesson.install.toLowerCase()).toContain("install");
  expect(lesson.starterHtml).toContain('src="./app.js"');
  expect(lesson.starterHtml).not.toContain(".ts");

  for (const step of lesson.steps) {
    expect(step.code).not.toContain("/dist/");
    expect(step.code).not.toContain("./examples");
    expect(step.code).not.toContain("createMockTransport");
    expect(step.code).not.toMatch(/\bas\s+(const|any|unknown|never|string|number|boolean|[A-Z]\w*)\b/);
    expect(step.code).not.toMatch(/:\s*(string|number|boolean)\b/);
    expect(step.code).not.toContain("!.");
  }
};

describe("build-along lessons", () => {
  it("exposes Explorer, Share, and Preview lessons", () => {
    expect(lessons).toHaveLength(3);
    expect(lessons[0]).toBe(explorerLesson);
    expect(lessons[1]).toBe(shareLesson);
    expect(lessons[2]).toBe(previewLesson);
    expect(lessonById("explorer")).toBe(explorerLesson);
    expect(lessonById("share")).toBe(shareLesson);
    expect(lessonById("preview")).toBe(previewLesson);
    expect(lessonById("nope")).toBeUndefined();
  });

  it("does not collide with any catalog id", () => {
    const catalogIds = new Set(catalog.map(entry => entry.id));
    for (const lesson of lessons) {
      expect(catalogIds.has(lesson.id)).toBe(false);
    }
  });

  it("keeps Explorer lesson shape and public API surface", () => {
    assertLessonShape(explorerLesson, EXPLORER_PREVIEW_KEYS);
    const finalCode = explorerLesson.steps[explorerLesson.steps.length - 1].code;
    for (const token of [
      'from "box-open-elements"',
      "registerBoxDefaultDesignSystem",
      "defineBoxContentExplorerElement",
      "box-content-explorer",
      "explorer.transport = transport",
      "root-folder-id",
      "folder-loaded",
      "selection-changed",
      "item-activated",
      "selection-mode",
      "page-size",
    ]) {
      expect(finalCode).toContain(token);
    }
  });

  it("keeps Share lesson shape and public API surface", () => {
    assertLessonShape(shareLesson, SHARE_PREVIEW_KEYS);
    const finalCode = shareLesson.steps[shareLesson.steps.length - 1].code;
    for (const token of [
      'from "box-open-elements"',
      "registerBoxDefaultDesignSystem",
      "defineBoxSharePanelElement",
      "box-share-panel",
      "sharedLink",
      "collaborators",
      "settings",
      "actions",
      'addEventListener("action"',
      'addEventListener("collaborator-selected"',
    ]) {
      expect(finalCode).toContain(token);
    }
  });

  it("keeps Preview lesson shape and public API surface", () => {
    assertLessonShape(previewLesson, CONTENT_PREVIEW_KEYS);
    const finalCode = previewLesson.steps[previewLesson.steps.length - 1].code;
    for (const token of [
      'from "box-open-elements"',
      "registerBoxDefaultDesignSystem",
      "defineBoxPreviewElement",
      "box-preview-element",
      "item-label",
      "provider",
      "adapterState",
      "actions",
      'addEventListener("action"',
      'addEventListener("provider-action"',
    ]) {
      expect(finalCode).toContain(token);
    }
  });

  it("keeps explorer mock transport folder names consistent in Step 2", () => {
    const step2 = explorerLesson.steps.find(step => step.n === 2)!;
    expect(step2.code).toContain("folderNames[folderId]");
    expect(step2.code).toContain('"77": "Legal"');
  });
});

describe("lesson mock transport (live preview)", () => {
  it("returns root folder metadata, items, breadcrumbs, and pagination", async () => {
    const result = await lessonMockTransport().loadFolderItems({ folderId: "0" });
    expect(result.folder).toEqual({ id: "0", name: "All Files", type: "folder" });
    expect(result.breadcrumbs).toEqual([{ id: "0", name: "All Files", type: "folder" }]);
    expect(result.items.map(item => item.name)).toContain("Marketing");
    expect(result.items.map(item => item.name)).toContain("Legal");
    expect(result.pagination.totalCount).toBe(5);
  });

  it("returns the requested non-root folder, not a stand-in (Legal stays Legal)", async () => {
    const result = await lessonMockTransport().loadFolderItems({ folderId: "77" });
    expect(result.folder).toEqual({ id: "77", name: "Legal", type: "folder" });
    expect(result.breadcrumbs.at(-1)).toEqual({ id: "77", name: "Legal", type: "folder" });
    expect(result.items).toHaveLength(2);
    expect(result.items.every(item => item.name.startsWith("Legal"))).toBe(true);
    expect(result.pagination.totalCount).toBe(2);
  });

  it("falls back to a string name for unknown or inherited-key ids", async () => {
    for (const folderId of ["constructor", "toString", "hasOwnProperty", "999"]) {
      const result = await lessonMockTransport().loadFolderItems({ folderId });
      expect(typeof result.folder.name).toBe("string");
      expect(result.folder.name).toBe("Folder");
      expect(result.items.every(item => typeof item.name === "string" && item.name.startsWith("Folder"))).toBe(true);
    }
  });
});

describe("lesson delta diff", () => {
  it("marks only genuinely new lines", () => {
    const prev = "a\nb\nc";
    const curr = "a\nb\nX\nc";
    expect([...addedLines(prev, curr)].sort()).toEqual([2]);
  });

  it("marks every line as added when there is no previous step", () => {
    expect([...addedLines("", "one\ntwo")].sort()).toEqual([0, 1]);
  });

  it("highlights exactly the cumulative growth between real steps", () => {
    for (const lesson of lessons) {
      const steps = lesson.steps;
      for (let i = 1; i < steps.length; i++) {
        const added = addedLines(steps[i - 1].code, steps[i].code);
        const prevLineCount = steps[i - 1].code.split("\n").length;
        const currLineCount = steps[i].code.split("\n").length;
        expect(added.size).toBeGreaterThan(0);
        expect(added.size).toBeLessThanOrEqual(currLineCount);
        expect(added.size).toBeGreaterThanOrEqual(currLineCount - prevLineCount);
        for (const index of added) {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(currLineCount);
        }
      }
    }
  });
});
