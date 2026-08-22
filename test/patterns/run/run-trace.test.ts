// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RunTrace, RUN_STEP_STATUS_LABEL } from "../../../src/patterns/run/run-trace.js";
import type { RunStep } from "../../../src/patterns/run/types.js";

const STEPS: RunStep[] = [
  {
    id: "fetch",
    title: "Fetch sources",
    startedAt: "2026-08-22T10:00:00Z",
    finishedAt: "2026-08-22T10:00:42Z",
  },
  {
    id: "build",
    title: "Build artifacts",
    description: "Compiling 3 targets.",
    startedAt: "2026-08-22T10:00:42Z",
    children: [
      { id: "web", label: "web", progress: 80, status: "running" },
      { id: "cli", label: "cli", progress: 100, status: "succeeded" },
      { id: "docs", label: "docs", status: "pending" },
    ],
  },
  { id: "deploy", title: "Deploy" },
];

const create = (steps: RunStep[] = STEPS): RunTrace => {
  const element = document.createElement("box-run-trace") as RunTrace;
  element.heading = "Nightly build";
  element.steps = steps;
  document.body.append(element);
  return element;
};

const stepEls = (element: RunTrace): HTMLElement[] =>
  Array.from(element.shadowRoot?.querySelectorAll<HTMLElement>('[part="step"]') ?? []);

describe("RunTrace", () => {
  beforeEach(() => {
    RunTrace.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders steps top-down with derived statuses stated in words", () => {
    const element = create();
    const steps = stepEls(element);
    expect(steps.map(step => step.dataset.status)).toEqual(["succeeded", "running", "pending"]);
    expect(steps[0]?.textContent).toContain(RUN_STEP_STATUS_LABEL.succeeded);
    expect(steps[1]?.textContent).toContain(RUN_STEP_STATUS_LABEL.running);
    expect(steps[2]?.textContent).toContain(RUN_STEP_STATUS_LABEL.pending);
    // Forward-chronological: first step first (box-timeline is reversed).
    expect(steps[0]?.textContent).toContain("Fetch sources");
  });

  it("renders the finished step's duration", () => {
    const element = create();
    expect(stepEls(element)[0]?.querySelector('[part="duration"]')?.textContent).toBe("42s");
  });

  it("summarises the run in a polite status region", () => {
    const element = create();
    const summary = element.shadowRoot?.querySelector('[part="summary"]');
    expect(summary?.getAttribute("role")).toBe("status");
    expect(summary?.textContent).toBe("Running Build artifacts — step 2 of 3");
    expect(summary?.getAttribute("data-status")).toBe("running");

    // Live update: the host patches statuses and the region re-announces.
    element.steps = STEPS.map(step =>
      step.id === "deploy" ? step : { ...step, status: "succeeded" as const },
    );
    expect(element.shadowRoot?.querySelector('[part="summary"]')?.textContent).toBe(
      "2 of 3 steps done",
    );
  });

  it("expands and collapses step detail, emitting step-toggled", () => {
    const element = create();
    const toggled = vi.fn();
    element.addEventListener("step-toggled", toggled);

    const detailOf = (): HTMLElement | null | undefined =>
      element.shadowRoot?.querySelector<HTMLElement>('[part="detail"][data-step-id="build"]');
    const toggleOf = (): HTMLElement | null | undefined =>
      element.shadowRoot?.querySelector<HTMLElement>('[part="toggle"][data-step-id="build"]');

    expect(detailOf()?.hidden).toBe(true);
    expect(toggleOf()?.getAttribute("aria-expanded")).toBe("false");

    toggleOf()?.click();
    expect(detailOf()?.hidden).toBe(false);
    expect(toggleOf()?.getAttribute("aria-expanded")).toBe("true");
    expect(detailOf()?.textContent).toContain("Compiling 3 targets.");
    expect(toggled).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { stepId: "build", expanded: true } }),
    );
    expect(element.expandedSteps).toEqual(["build"]);

    // Expansion survives a steps update — a live run must not snap shut.
    element.steps = [...STEPS];
    expect(detailOf()?.hidden).toBe(false);

    toggleOf()?.click();
    expect(detailOf()?.hidden).toBe(true);
    expect(element.expandedSteps).toEqual([]);
  });

  it("renders child tasks with live progress bars and status words", () => {
    const element = create();
    element.shadowRoot
      ?.querySelector<HTMLElement>('[part="toggle"][data-step-id="build"]')
      ?.click();

    const children = Array.from(
      element.shadowRoot?.querySelectorAll('[part="child"]') ?? [],
    );
    expect(children.length).toBe(3);
    expect(children[0]?.querySelector("box-progress-bar")?.getAttribute("value")).toBe("80");
    expect(children[0]?.textContent).toContain(RUN_STEP_STATUS_LABEL.running);
    // Indeterminate child: status word only, no bar.
    expect(children[2]?.querySelector("box-progress-bar")).toBeNull();
    expect(children[2]?.textContent).toContain(RUN_STEP_STATUS_LABEL.pending);
  });

  it("offers a named detail slot per step so hosts can project rich content", () => {
    const element = create();
    const log = document.createElement("pre");
    log.slot = "detail-deploy";
    log.textContent = "$ deploy --dry-run";
    element.append(log);

    const slot = element.shadowRoot?.querySelector(
      'slot[name="detail-deploy"]',
    ) as HTMLSlotElement | null;
    expect(slot).not.toBeNull();
    expect(slot?.assignedElements()).toEqual([log]);
  });

  it("steps without detail get no toggle", () => {
    const element = create();
    expect(
      element.shadowRoot?.querySelector('[part="toggle"][data-step-id="fetch"]'),
    ).toBeNull();
  });

  it("rejects malformed step payloads whole and states emptiness", () => {
    const element = document.createElement("box-run-trace") as RunTrace;
    element.setAttribute("steps", JSON.stringify([{ id: "a", title: "ok" }, { id: "bad" }]));
    document.body.append(element);

    expect(element.steps).toEqual([]);
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain(
      "No steps yet.",
    );
  });

  it("escapes step content", () => {
    const element = create([
      { id: "x", title: `<img src=x onerror=alert(1)>`, description: `<script>` },
    ]);
    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.querySelector("script")).toBeNull();
  });
});

describe("RunTrace review fixes (PR #188)", () => {
  beforeEach(() => {
    RunTrace.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("clears the cached steps when steps is set to an empty array", () => {
    const element = create();
    expect(element.steps.length).toBe(3);

    element.steps = [];
    expect(element.steps).toEqual([]);
    expect(element.shadowRoot?.querySelector('[part="empty"]')).not.toBeNull();
  });

  it("gives slot-only detail a toggle", async () => {
    const element = create();
    const log = document.createElement("pre");
    log.slot = "detail-deploy"; // the deploy step has no description or children
    log.textContent = "$ deploy --dry-run";
    element.append(log);
    // The light-DOM observer re-renders asynchronously.
    await new Promise(resolve => setTimeout(resolve, 0));

    const toggle = element.shadowRoot?.querySelector(
      '[part="toggle"][data-step-id="deploy"]',
    ) as HTMLElement | null;
    expect(toggle).not.toBeNull();
    toggle?.click();
    const detail = element.shadowRoot?.querySelector(
      '[part="detail"][data-step-id="deploy"]',
    ) as HTMLElement | null;
    expect(detail?.hidden).toBe(false);
    const slot = detail?.querySelector('slot[name="detail-deploy"]') as HTMLSlotElement | null;
    expect(slot?.assignedElements()).toEqual([log]);
  });
});
