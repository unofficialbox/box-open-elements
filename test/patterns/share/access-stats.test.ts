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

  it("renders per-tile groups with accessible full values", () => {
    const element = create();

    const tiles = Array.from(element.shadowRoot?.querySelectorAll('[part="tile"]') ?? []);
    expect(tiles).toHaveLength(3);
    expect(tiles.every(tile => tile.getAttribute("role") === "group")).toBe(true);

    const views = tiles.find(t => t.getAttribute("aria-label")?.includes("Views"));
    expect(views?.getAttribute("aria-label")).toBe("1280 Views");
    expect(views?.querySelector('[part="tile-value"]')?.textContent).toBe("1.3k");
    expect(views?.querySelector('[part="tile-value"]')?.getAttribute("aria-hidden")).toBe("true");
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

  it("abbreviates millions and billions without producing 1000k", () => {
    const element = document.createElement("box-access-stats") as BoxAccessStatsElement;
    element.stats = [
      { label: "Views", value: 1_000_000 },
      { label: "Downloads", value: 2_500_000_000 },
    ];
    document.body.append(element);

    const tiles = Array.from(element.shadowRoot?.querySelectorAll('[part="tile"]') ?? []);
    const views = tiles.find(t => t.querySelector('[part="tile-label"]')?.textContent === "Views");
    const downloads = tiles.find(t => t.querySelector('[part="tile-label"]')?.textContent === "Downloads");

    expect(views?.querySelector('[part="tile-value"]')?.textContent).toBe("1M");
    expect(downloads?.querySelector('[part="tile-value"]')?.textContent).toBe("2.5B");
    expect(views?.getAttribute("aria-label")).toBe("1000000 Views");
    expect(downloads?.getAttribute("aria-label")).toBe("2500000000 Downloads");
  });

  it("promotes near-million counts to M instead of 1000k", () => {
    const element = document.createElement("box-access-stats") as BoxAccessStatsElement;
    element.stats = [{ label: "Views", value: 999_950 }];
    document.body.append(element);

    const tile = element.shadowRoot?.querySelector('[part="tile"]');
    expect(tile?.querySelector('[part="tile-value"]')?.textContent).toBe("1M");
    expect(tile?.getAttribute("aria-label")).toBe("999950 Views");
  });

  it("keeps the labelled section and shows an empty affordance with no stats", () => {
    const element = document.createElement("box-access-stats") as BoxAccessStatsElement;
    document.body.append(element);

    const section = element.shadowRoot?.querySelector('[part="stats"]');
    expect(section?.getAttribute("aria-labelledby")).toBe("access-stats-title");
    expect(element.shadowRoot?.querySelector('[part="title"]')?.id).toBe("access-stats-title");
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
