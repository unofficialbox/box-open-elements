// @vitest-environment node

import { describe, expect, it } from "vitest";

import { extractStories, type CatalogLike } from "../../storybook/extract-core.js";
import type { StoryModule } from "../../storybook/metadata.js";
import { storyModules } from "../../storybook/registry.js";
import { catalog, titleOf } from "../../docs-site/registry.js";
import committed from "../../storybook/generated/workshop.json";

const makeStory = (overrides: Partial<StoryModule> = {}): StoryModule => ({
  title: "Components/Actions/Button",
  meta: {
    id: "button",
    tag: "box-button",
    shortDescription: "s",
    docsDescription: "d",
    sourceSnippet: "<box-button></box-button>",
    referenceRows: [],
  },
  variants: [{ name: "Primary", html: `<box-button label="Save"></box-button>` }],
  ...overrides,
});

const testCatalog: CatalogLike[] = [{ id: "button", tag: "box-button", tier: "components" }];
const testTitleOf = (id: string) => (id === "button" ? "Button" : id);

describe("extractStories", () => {
  it("extracts a valid story with no errors", () => {
    const result = extractStories([makeStory()], { catalog: testCatalog, titleOf: testTitleOf });
    expect(result.errors).toEqual([]);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0]).toMatchObject({ id: "button", tag: "box-button", category: "Actions" });
  });

  it("fails when the title leaf does not match the catalog title", () => {
    const story = makeStory({ title: "Components/Actions/Buton" });
    const result = extractStories([story], { catalog: testCatalog, titleOf: testTitleOf });
    expect(result.errors.some(error => error.includes("does not match catalog title"))).toBe(true);
  });

  it("fails when the id is not in the catalog", () => {
    const story = makeStory({ meta: { ...makeStory().meta, id: "ghost", tag: "box-ghost" } });
    const result = extractStories([story], { catalog: testCatalog, titleOf: testTitleOf });
    expect(result.errors.some(error => error.includes("not in the docs-site catalog"))).toBe(true);
  });

  it("fails when the tag does not match the catalog tag", () => {
    const story = makeStory({ meta: { ...makeStory().meta, tag: "box-btn" } });
    const result = extractStories([story], { catalog: testCatalog, titleOf: testTitleOf });
    expect(result.errors.some(error => error.includes("does not match catalog tag"))).toBe(true);
  });

  it("fails when a variant does not render the component tag", () => {
    const story = makeStory({ variants: [{ name: "Bad", html: "<div>nope</div>" }] });
    const result = extractStories([story], { catalog: testCatalog, titleOf: testTitleOf });
    expect(result.errors.some(error => error.includes("does not render"))).toBe(true);
  });

  it("fails on a story with no variants", () => {
    const story = makeStory({ variants: [] });
    const result = extractStories([story], { catalog: testCatalog, titleOf: testTitleOf });
    expect(result.errors.some(error => error.includes("at least one variant"))).toBe(true);
  });

  it("fails on duplicate ids", () => {
    const result = extractStories([makeStory(), makeStory()], { catalog: testCatalog, titleOf: testTitleOf });
    expect(result.errors.some(error => error.includes("Duplicate story"))).toBe(true);
  });

  it("the real authored story set extracts cleanly against the real catalog", () => {
    const result = extractStories(storyModules, { catalog, titleOf });
    expect(result.errors).toEqual([]);
    expect(result.stories.length).toBe(storyModules.length);
  });

  it("the committed generated JSON is up to date (run `bun run storybook:extract`)", () => {
    const { stories } = extractStories(storyModules, { catalog, titleOf });
    expect(committed.stories).toEqual(stories);
  });
});
