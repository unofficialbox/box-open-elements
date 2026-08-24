import { afterEach, describe, expect, it } from "vitest";

import {
  Path,
  isPathStageRecord,
  resolveStageStates,
} from "../../../src/components/feedback/path.js";
import type { PathStage } from "../../../src/components/feedback/path.js";

Path.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const stages: PathStage[] = [
  { id: "draft", label: "Draft" },
  { id: "review", label: "In Review", description: "Legal second pass" },
  { id: "approved", label: "Approved" },
  { id: "executed", label: "Executed" },
];

const mount = async (configure: (element: Path) => void = () => {}): Promise<Path> => {
  const element = document.createElement("box-path") as Path;
  element.stages = stages;
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const all = (element: Path, selector: string): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll(selector));

const states = (element: Path): (string | null)[] =>
  all(element, '[part="stage"]').map(node => node.getAttribute("data-state"));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("resolveStageStates", () => {
  it("splits the path at the current stage", () => {
    expect(resolveStageStates(stages, "approved")).toEqual([
      "complete",
      "complete",
      "current",
      "upcoming",
    ]);
  });

  it("marks the first stage current with nothing complete", () => {
    expect(resolveStageStates(stages, "draft")).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("leaves everything upcoming for an unknown current id", () => {
    // A stale id must not silently mark the whole path done.
    expect(resolveStageStates(stages, "nonsense")).toEqual([
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(resolveStageStates(stages, "")).toEqual([
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("handles an empty path", () => {
    expect(resolveStageStates([], "draft")).toEqual([]);
  });
});

describe("resolveStageStates with an error", () => {
  it("fails the path at the stage it stopped on, not before it", () => {
    // The work behind the failure did happen — an approval rejected at "In
    // Review" does not un-draft the contract.
    expect(resolveStageStates(stages, "approved", true)).toEqual([
      "complete",
      "complete",
      "error",
      "upcoming",
    ]);
  });

  it("has nothing to fail when the current id is unknown", () => {
    expect(resolveStageStates(stages, "nonsense", true)).toEqual([
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("leaves the current stage current when no error is reported", () => {
    expect(resolveStageStates(stages, "approved", false)).toEqual([
      "complete",
      "complete",
      "current",
      "upcoming",
    ]);
  });
});

describe("isPathStageRecord", () => {
  it("requires a non-empty id and label", () => {
    expect(isPathStageRecord({ id: "a", label: "A" })).toBe(true);
    expect(isPathStageRecord({ id: "", label: "A" })).toBe(false);
    expect(isPathStageRecord({ id: "a", label: "" })).toBe(false);
    expect(isPathStageRecord({ label: "A" })).toBe(false);
    expect(isPathStageRecord(null)).toBe(false);
  });
});

describe("box-path", () => {
  it("renders an ordered list so the sequence survives without the chevrons", async () => {
    const element = await mount(el => (el.current = "approved"));

    expect(element.shadowRoot!.querySelector('[part="path"]')?.tagName).toBe("OL");
    expect(all(element, '[part="stage"]').map(node => node.tagName)).toEqual([
      "LI",
      "LI",
      "LI",
      "LI",
    ]);
    expect(element.shadowRoot!.querySelector('[part="path"]')?.getAttribute("aria-label")).toBe(
      "Lifecycle",
    );
  });

  it("marks only the current stage with aria-current", async () => {
    const element = await mount(el => (el.current = "approved"));

    expect(states(element)).toEqual(["complete", "complete", "current", "upcoming"]);
    const current = all(element, '[part="stage"]').filter(
      node => node.getAttribute("aria-current") === "step",
    );
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute("data-stage-id")).toBe("approved");
  });

  it("gives completed stages a marker, so 'done' is not colour-only", async () => {
    const element = await mount(el => (el.current = "approved"));

    // A marker box exists on every stage — the base variant styles it into the
    // rail — but only the states with a glyph carry one, and CSS hides the
    // empty ones. Assert on the glyphs, which is the actual signal.
    const glyphs = all(element, '[part="stage-marker"]')
      .map(node => node.textContent)
      .filter(text => text !== "");
    expect(glyphs).toEqual(["✓", "✓"]);

    const markers = all(element, '[part="stage-marker"]');
    // Decoration: the state is already in data-state, aria-current and the
    // assistive state text.
    expect(markers[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(all(element, '[part="stage-state"]').map(node => node.textContent)).toEqual([
      "Completed",
      "Completed",
      "Current stage",
      "Not started",
    ]);
  });

  it("shows the description only on the current stage", async () => {
    const element = await mount(el => (el.current = "review"));

    const descriptions = all(element, '[part="stage-description"]');
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]?.textContent).toBe("Legal second pass");

    // Move past it and the detail goes with the current marker.
    element.current = "approved";
    await flush();
    expect(all(element, '[part="stage-description"]')).toHaveLength(0);
  });

  it("advances when current changes", async () => {
    const element = await mount(el => (el.current = "draft"));
    expect(states(element)).toEqual(["current", "upcoming", "upcoming", "upcoming"]);

    element.current = "executed";
    await flush();
    expect(states(element)).toEqual(["complete", "complete", "complete", "current"]);
    expect(element.states).toEqual(["complete", "complete", "complete", "current"]);
  });

  it("leaves the path upcoming for a stale current id", async () => {
    const element = await mount(el => (el.current = "cancelled"));

    expect(states(element).every(state => state === "upcoming")).toBe(true);
    expect(all(element, '[part="stage"]').some(n => n.hasAttribute("aria-current"))).toBe(false);
  });

  it("marks the failed stage invalid while keeping it the current step", async () => {
    const element = await mount(el => {
      el.current = "approved";
      el.hasError = true;
    });

    expect(states(element)).toEqual(["complete", "complete", "error", "upcoming"]);
    const failed = all(element, '[part="stage"]')[2]!;
    expect(failed.getAttribute("aria-invalid")).toBe("true");
    // Still where the record sits, so it keeps aria-current: an error is a
    // property of the position, not a different position.
    expect(failed.getAttribute("aria-current")).toBe("step");
    expect(failed.querySelector('[part="stage-marker"]')?.textContent).toBe("!");
    expect(failed.querySelector('[part="stage-state"]')?.textContent).toBe("Error");

    element.hasError = false;
    await flush();
    expect(states(element)).toEqual(["complete", "complete", "current", "upcoming"]);
    expect(all(element, '[part="stage"]')[2]?.hasAttribute("aria-invalid")).toBe(false);
  });

  it("keeps the description on a failed stage", async () => {
    // The detail is what says *why* it failed, so losing it at exactly the
    // moment it matters would be the wrong trade.
    const element = await mount(el => {
      el.current = "review";
      el.hasError = true;
    });

    expect(all(element, '[part="stage-description"]').map(n => n.textContent)).toEqual([
      "Legal second pass",
    ]);
  });

  it("reflects has-error as an attribute", async () => {
    const element = await mount(el => (el.current = "review"));
    expect(element.hasError).toBe(false);

    element.hasError = true;
    expect(element.hasAttribute("has-error")).toBe(true);
    element.hasError = false;
    expect(element.hasAttribute("has-error")).toBe(false);
  });

  it("escapes hostile stage content", async () => {
    const element = await mount(el => {
      el.stages = [
        {
          id: "<img src=x onerror=alert(1)>",
          label: "<script>alert('label')</script>",
          description: "<b>desc</b>",
        },
      ];
      el.current = "<img src=x onerror=alert(1)>";
    });

    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("b")).toBeNull();
    expect(element.shadowRoot!.querySelector('[part="stage-label"]')?.textContent).toBe(
      "<script>alert('label')</script>",
    );
    expect(element.shadowRoot!.querySelector('[part="stage-description"]')?.textContent).toBe(
      "<b>desc</b>",
    );
  });

  it("ignores a malformed stages payload", async () => {
    const element = document.createElement("box-path") as Path;
    element.setAttribute("stages", '[{"id":"ok","label":"Fine"},{"label":"no id"}]');
    document.body.append(element);
    await flush();

    expect(element.stages).toEqual([]);
    expect(all(element, '[part="stage"]')).toHaveLength(0);
  });

  it("re-reads stages when the payload changes and never shares its cache", async () => {
    const element = await mount(el => (el.current = "draft"));
    expect(element.stages).toHaveLength(4);

    element.stages = [{ id: "only", label: "Only" }];
    await flush();
    expect(element.stages.map(stage => stage.id)).toEqual(["only"]);

    const first = element.stages;
    first.push({ id: "injected", label: "Nope" });
    expect(element.stages.map(stage => stage.id)).toEqual(["only"]);
  });
});

describe("path variants", () => {
  const stages = JSON.stringify([
    { id: "draft", label: "Draft" },
    { id: "review", label: "In review", description: "With Morgan Lee" },
    { id: "done", label: "Executed" },
  ]);

  const mount = (variant?: string): Path => {
    const element = document.createElement("box-path") as Path;
    element.setAttribute("stages", stages);
    element.setAttribute("current", "review");
    if (variant !== undefined) element.setAttribute("variant", variant);
    document.body.append(element);
    return element;
  };

  it("defaults to the chevron shape", () => {
    const element = mount();
    expect(element.variant).toBe("chevron");
    expect(
      element.shadowRoot?.querySelector('[part="path"]')?.getAttribute("data-variant"),
    ).toBe("chevron");
  });

  it("renders the base marker rail when asked", () => {
    const element = mount("base");
    expect(element.variant).toBe("base");
    expect(
      element.shadowRoot?.querySelector('[part="path"]')?.getAttribute("data-variant"),
    ).toBe("base");
  });

  it("falls back to chevron for an unknown variant", () => {
    // Every variant rule is scoped to a known value, so an unrecognised one
    // would otherwise render an unstyled row rather than a path.
    expect(mount("hexagon").variant).toBe("chevron");
    expect(mount("").variant).toBe("chevron");
  });

  it("reflects a variant set as a property", () => {
    const element = mount();
    element.variant = "base";
    expect(element.getAttribute("variant")).toBe("base");
  });

  it("centres stage content and sizes every stage alike", () => {
    // The reported defect: the current stage carries a description, so it grew
    // taller than its neighbours and the row read as ragged. Stretch alignment
    // plus centred content is what keeps the row level — jsdom has no layout,
    // so this asserts the declarations that produce it.
    const styles = mount().shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("align-items: stretch");
    expect(styles).toContain("text-align: center");
    expect(styles).toContain("justify-content: center");
  });

  it("keeps a chevron stage to one line by not rendering the description in it", () => {
    // The reported defect: a chevron is ~190px at four stages in a 760px
    // header, so the description wrapped to a second line and — with
    // align-items: stretch — took the whole row from 27.5px to 43.3px in
    // Chromium. Hiding it in the chevron holds every row at 27.5px. jsdom has
    // no layout, so this asserts the rule; the pixels are in the browser check.
    const styles = mount().shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toMatch(
      /\[data-variant="chevron"\] \[part="stage-description"\] \{\s*display: none;/,
    );
    // Still in the DOM, so a host with the width can re-show it via ::part.
    expect(mount().shadowRoot?.querySelector('[part="stage-description"]')?.textContent).toBe(
      "With Morgan Lee",
    );
    // The base rail stacks and shows it by default.
    expect(styles).toMatch(/\[data-variant="base"\] \[part="stage"\] \{\s*flex-direction: column;/);
  });

  it("takes its density from the segmented control", () => {
    // Both are a horizontal row of equal-weight labels; they should read at the
    // same density rather than each inventing a height.
    const styles = mount().shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 0.45em 1em");
    expect(styles).toContain("line-height: 1.2");
  });
});
