import { describe, expect, it } from "vitest";

import {
  bestPracticesForRoles,
  hasUsageCard,
  keyboardGuidanceForRoles,
  renderGuidanceCards,
  resolvePreviewGuidance,
  usageById,
} from "../../docs-site/guidance.js";

describe("docs-site guidance", () => {
  it("exposes workshop-authored usage for storybook surfaces only", () => {
    expect(usageById.button?.docsDescription).toMatch(/labelled button/i);
    expect(usageById.checkbox?.shortDescription).toMatch(/selectable/i);
    expect(usageById["content-explorer"]).toBeUndefined();
  });

  it("maps composite roles to Arrow/Home/End keyboard guidance", () => {
    const bullets = keyboardGuidanceForRoles(["listbox", "option"]);
    expect(bullets.some(bullet => bullet.includes("Arrow"))).toBe(true);
    expect(bullets.some(bullet => bullet.includes("Enter and Space"))).toBe(true);
  });

  it("maps dialog roles to Escape guidance", () => {
    const bullets = keyboardGuidanceForRoles(["dialog"]);
    expect(bullets).toEqual([
      "Escape dismisses transient surfaces such as dialogs, drawers, popovers, tooltips, and menus.",
    ]);
  });

  it("returns no keyboard bullets for unknown roles", () => {
    expect(keyboardGuidanceForRoles(["presentation"])).toEqual([]);
  });

  it("filters best practices by role without inventing empty cards", () => {
    expect(bestPracticesForRoles([])).toEqual([]);
    const checkbox = bestPracticesForRoles(["checkbox"]);
    expect(checkbox.some(bullet => bullet.includes("aria-checked"))).toBe(true);
    expect(checkbox.some(bullet => bullet.includes("accessible name"))).toBe(true);
    expect(checkbox.some(bullet => bullet.includes("aria-selected"))).toBe(false);
  });

  it("assembles preview guidance from workshop meta, notes, and roles", () => {
    const withUsage = resolvePreviewGuidance({
      catalogId: "button",
      roles: ["button"],
      exampleNote: "Tone controls emphasis.",
    });
    expect(hasUsageCard(withUsage)).toBe(true);
    expect(withUsage.usage?.shortDescription).toMatch(/action trigger/i);
    expect(withUsage.usageNote).toBe("Tone controls emphasis.");
    expect(withUsage.keyboard.some(bullet => bullet.includes("Enter and Space"))).toBe(true);

    const noteOnly = resolvePreviewGuidance({
      catalogId: "content-explorer",
      roles: [],
      exampleNote: "Driven by a mock transport.",
    });
    expect(hasUsageCard(noteOnly)).toBe(true);
    expect(noteOnly.usage).toBeNull();
    expect(noteOnly.bestPractices).toEqual([]);
    expect(noteOnly.keyboard).toEqual([]);

    const empty = resolvePreviewGuidance({
      catalogId: "content-explorer",
      roles: [],
    });
    expect(hasUsageCard(empty)).toBe(false);
  });

  it("renders guidance cards HTML only when real content exists", () => {
    const withCards = resolvePreviewGuidance({
      catalogId: "button",
      roles: ["button"],
      exampleNote: "Tone controls emphasis.",
    });
    const html = renderGuidanceCards(withCards);
    expect(html).toContain('data-guidance="usage"');
    expect(html).toContain('data-guidance="best-practices"');
    expect(html).toContain('data-guidance="keyboard"');
    expect(html).toContain("Tone controls emphasis.");
    expect(html).toContain("<code>label</code>");

    const emptyHtml = renderGuidanceCards(
      resolvePreviewGuidance({ catalogId: "content-explorer", roles: [] }),
    );
    expect(emptyHtml).toBe("");
  });
});
