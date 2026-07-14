// @vitest-environment node

import { describe, expect, it } from "vitest";

import { lessons, lessonById, explorerLesson, type PreviewKey } from "../../docs-site/lessons.js";
import { catalog } from "../../docs-site/registry.js";

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
      "folder-changed",
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
    expect(explorerLesson.starterHtml).toContain("app.ts");
    expect(explorerLesson.starterHtml).toContain("box-open-elements");
    expect(explorerLesson.starterHtml).toContain('id="app"');
    expect(explorerLesson.install.toLowerCase()).toContain("install");
  });
});
