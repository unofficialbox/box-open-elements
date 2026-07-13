// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxAccessStatsElement, defineBoxAccessStatsElement } from "../../../src/patterns/share/access-stats.js";

const sampleStats = [
  { label: "Views", value: 1280, icon: "👁" },
  { label: "Downloads", value: 96 },
  { label: "Comments", value: 7 },
];

const create = (): BoxAccessStatsElement => {
  const element = document.createElement("box-access-stats") as BoxAccessStatsElement;
  element.stats = sampleStats;
  document.body.append(element);
  return element;
};

describe("BoxAccessStatsElement", () => {
  beforeEach(() => {
    defineBoxAccessStatsElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled group with one tile per stat", () => {
    const element = create();

    const group = element.shadowRoot?.querySelector('[part="stats"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Access stats");
    expect(element.shadowRoot?.querySelectorAll('[part="tile"]').length).toBe(3);
  });

  it("renders each stat's label and value", () => {
    const element = create();

    const tiles = Array.from(element.shadowRoot?.querySelectorAll('[part="tile"]') ?? []);
    const downloads = tiles.find(t => t.querySelector('[part="tile-label"]')?.textContent === "Downloads");
    expect(downloads?.querySelector('[part="tile-value"]')?.textContent).toBe("96");
  });

  it("abbreviates large counts with a k suffix", () => {
    const element = create();

    const tiles = Array.from(element.shadowRoot?.querySelectorAll('[part="tile"]') ?? []);
    const views = tiles.find(t => t.querySelector('[part="tile-label"]')?.textContent === "Views");
    expect(views?.querySelector('[part="tile-value"]')?.textContent).toBe("1.3k");
  });

  it("renders the optional per-stat icon", () => {
    const element = create();

    expect(element.shadowRoot?.querySelector('[part="tile-icon"]')?.textContent).toContain("👁");
  });

  it("keeps the labelled group and shows an empty affordance with no stats", () => {
    const element = document.createElement("box-access-stats") as BoxAccessStatsElement;
    document.body.append(element);

    const group = element.shadowRoot?.querySelector('[part="stats"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Access stats");
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain("No access data");
  });

  it("drops malformed stat entries", () => {
    const element = document.createElement("box-access-stats") as BoxAccessStatsElement;
    element.setAttribute(
      "stats",
      JSON.stringify([null, { label: "Views", value: 5 }, { label: "Bad", value: "x" }]),
    );
    document.body.append(element);

    const tiles = element.shadowRoot?.querySelectorAll('[part="tile"]');
    expect(tiles?.length).toBe(1);
    expect(tiles?.[0].querySelector('[part="tile-label"]')?.textContent).toBe("Views");
  });
});
