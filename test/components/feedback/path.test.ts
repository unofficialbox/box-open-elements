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

    const markers = all(element, '[part="stage-marker"]');
    expect(markers).toHaveLength(2);
    expect(markers[0]?.textContent).toBe("✓");
    // Decoration: the state is already in data-state and aria-current.
    expect(markers[0]?.getAttribute("aria-hidden")).toBe("true");
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

describe("stage path variants", () => {
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

  it("renders the rounded shape when asked", () => {
    const element = mount("rounded");
    expect(element.variant).toBe("rounded");
    expect(
      element.shadowRoot?.querySelector('[part="path"]')?.getAttribute("data-variant"),
    ).toBe("rounded");
  });

  it("falls back to chevron for an unknown variant", () => {
    // Every variant rule is scoped to a known value, so an unrecognised one
    // would otherwise render an unstyled row rather than a path.
    expect(mount("hexagon").variant).toBe("chevron");
    expect(mount("").variant).toBe("chevron");
  });

  it("reflects a variant set as a property", () => {
    const element = mount();
    element.variant = "rounded";
    expect(element.getAttribute("variant")).toBe("rounded");
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

  it("takes its density from the segmented control", () => {
    // Both are a horizontal row of equal-weight labels; they should read at the
    // same density rather than each inventing a height.
    const styles = mount().shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 0.45em 1em");
    expect(styles).toContain("line-height: 1.2");
  });
});
