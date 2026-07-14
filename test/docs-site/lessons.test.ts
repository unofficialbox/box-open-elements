// @vitest-environment node

import { describe, expect, it } from "vitest";

import { lessons, lessonById, explorerLesson, type PreviewKey } from "../../docs-site/lessons.js";
import { catalog } from "../../docs-site/registry.js";
import { addedLines } from "../../docs-site/diff.js";
import { lessonMockTransport } from "../../docs-site/lesson-mock-transport.js";

const PREVIEW_KEYS: PreviewKey[] = ["empty", "shell", "connected", "navigate", "select", "multiselect"];

/** Lines that carry real content (skip blanks and pure-brace lines). */
const significant = (code: string): string[] =>
  code
    .split("\n")
    .map(line => line.trim())
    .filter(line => /[A-Za-z]/.test(line));

describe("build-along lessons", () => {
  it("exposes exactly the Explorer lesson", () => {
    expect(lessons).toHaveLength(1);
    expect(lessons[0]).toBe(explorerLesson);
    expect(lessonById("explorer")).toBe(explorerLesson);
    expect(lessonById("nope")).toBeUndefined();
  });

  it("does not collide with any catalog id", () => {
    const catalogIds = new Set(catalog.map(entry => entry.id));
    for (const lesson of lessons) {
      expect(catalogIds.has(lesson.id)).toBe(false);
    }
  });

  it("has a mandatory Setup step and contiguous numbering", () => {
    const numbers = explorerLesson.steps.map(step => step.n);
    expect(numbers).toEqual([0, 1, 2, 3, 4, 5]);
    expect(explorerLesson.steps[0].title).toBe("Setup");
    // 4–6 teaching steps on top of setup.
    const teaching = explorerLesson.steps.filter(step => step.n > 0);
    expect(teaching.length).toBeGreaterThanOrEqual(4);
    expect(teaching.length).toBeLessThanOrEqual(6);
  });

  it("gives every step the required fields", () => {
    for (const step of explorerLesson.steps) {
      expect(step.code.trim().length).toBeGreaterThan(0);
      expect(step.why.trim().length).toBeGreaterThan(0);
      expect(step.goal.trim().length).toBeGreaterThan(0);
      expect(step.result.trim().length).toBeGreaterThan(0);
      expect(step.file.trim().length).toBeGreaterThan(0);
      expect(step.anchor.trim().length).toBeGreaterThan(0);
      expect(PREVIEW_KEYS).toContain(step.preview);
    }
  });

  it("builds code cumulatively — no wholesale replacement", () => {
    const steps = explorerLesson.steps;
    for (let i = 1; i < steps.length; i++) {
      const prevLines = significant(steps[i - 1].code);
      const currentSet = new Set(significant(steps[i].code));
      for (const line of prevLines) {
        expect(currentSet.has(line)).toBe(true);
      }
      // Each step must actually add something.
      expect(significant(steps[i].code).length).toBeGreaterThan(prevLines.length);
    }
  });

  it("lands the full public-API surface by the final step", () => {
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

  it("keeps lesson code consumer-real (no docs-site internals)", () => {
    for (const step of explorerLesson.steps) {
      expect(step.code).not.toContain("/dist/");
      expect(step.code).not.toContain("./examples");
      expect(step.code).not.toContain("createMockTransport");
    }
  });

  it("ships a runnable starter that references the app module and package", () => {
    expect(explorerLesson.starterHtml).toContain("app.js");
    expect(explorerLesson.starterHtml).toContain("box-open-elements");
    expect(explorerLesson.starterHtml).toContain('id="app"');
    // Pinned CDN version so the copyable starter never floats.
    expect(explorerLesson.starterHtml).toMatch(/box-open-elements@\d+\.\d+\.\d+/);
    expect(explorerLesson.install.toLowerCase()).toContain("install");
  });

  it("keeps lesson + starter as browser-valid JavaScript (no build step)", () => {
    // The starter loads app.js from a static server, so the shown code must be
    // plain browser JS — no TypeScript-only syntax that a browser can't run.
    expect(explorerLesson.starterHtml).toContain('src="./app.js"');
    expect(explorerLesson.starterHtml).not.toContain(".ts");
    for (const step of explorerLesson.steps) {
      // TS type assertions — upper- and lower-case keywords alike.
      expect(step.code).not.toMatch(/\bas\s+(const|any|unknown|never|string|number|boolean|[A-Z]\w*)\b/);
      expect(step.code).not.toMatch(/:\s*(string|number|boolean)\b/); // param type annotations
      expect(step.code).not.toContain("!."); // non-null assertions
    }
  });

  it("mock transport stays consistent per folder id (no contradictory navigation)", () => {
    // Guard the reviewer's case: every non-root folder must not masquerade as
    // Marketing. The shown Step 2 code drives folder name off the id.
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
    const steps = explorerLesson.steps;
    for (let i = 1; i < steps.length; i++) {
      const added = addedLines(steps[i - 1].code, steps[i].code);
      const prevLineCount = steps[i - 1].code.split("\n").length;
      const currLineCount = steps[i].code.split("\n").length;
      // Something is highlighted, and never more than the file has.
      expect(added.size).toBeGreaterThan(0);
      expect(added.size).toBeLessThanOrEqual(currLineCount);
      // Cumulative growth means at least (curr - prev) lines are new.
      expect(added.size).toBeGreaterThanOrEqual(currLineCount - prevLineCount);
      for (const index of added) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(currLineCount);
      }
    }
  });
});
