// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ProgressSteps,
  isProgressStepRecord,
  resolveStepStates,
} from "../../../src/components/feedback/progress-steps.js";
import type { ProgressStepItem } from "../../../src/components/feedback/progress-steps.js";

const RUN_ITEMS: ProgressStepItem[] = [
  { label: "Connect", value: "connect", status: "complete" },
  { label: "Configure", value: "configure", status: "failed", statusNote: "Credentials rejected" },
  { label: "Validate", value: "validate" },
  { label: "Deploy", value: "deploy", status: "blocked", statusNote: "Fix configuration first" },
  { label: "Archive", value: "archive", status: "disabled" },
];

describe("ProgressSteps", () => {
  beforeEach(() => {
    ProgressSteps.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the current step", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
      { label: "Publish", value: "publish" },
    ];
    element.value = "review";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Review");
    expect(element.shadowRoot?.querySelector('[part="step"][data-state="current"]')).not.toBeNull();
  });

  it("emits value-changed when a new step is selected", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    const changed = vi.fn();
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
      { label: "Publish", value: "publish" },
    ];
    element.value = "draft";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const steps = element.shadowRoot?.querySelectorAll('[part="step"]') ?? [];
    (steps[1] as HTMLButtonElement | undefined)?.click();

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "review" },
      }),
    );
  });

  it("uses step semantics and supports arrow key navigation", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
      { label: "Publish", value: "publish" },
    ];
    element.value = "draft";

    document.body.append(element);

    const steps = element.shadowRoot?.querySelectorAll('[part="step"]') ?? [];
    const firstStep = steps[0] as HTMLButtonElement | undefined;

    expect(element.shadowRoot?.querySelector('[part="steps"]')?.getAttribute("role")).toBe("group");
    expect(firstStep?.getAttribute("role")).toBeNull();
    expect(firstStep?.getAttribute("aria-current")).toBe("step");

    firstStep?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(element.value).toBe("review");
  });

  describe("resolveStepStates", () => {
    it("derives complete/current/upcoming positionally when no status is set", () => {
      const items: ProgressStepItem[] = [
        { label: "Draft", value: "draft" },
        { label: "Review", value: "review" },
        { label: "Publish", value: "publish" },
      ];
      const resolved = resolveStepStates(items, "review");
      expect(resolved.map(entry => entry.state)).toEqual(["complete", "current", "upcoming"]);
      expect(resolved.map(entry => entry.isCurrent)).toEqual([false, true, false]);
      expect(resolved.every(entry => entry.interactive)).toBe(true);
    });

    it("lets an explicit status win over the positional derivation", () => {
      const resolved = resolveStepStates(RUN_ITEMS, "validate");
      expect(resolved.map(entry => entry.state)).toEqual([
        "complete",
        "failed",
        "current",
        "blocked",
        "disabled",
      ]);
      // Currency is position, status is condition — both are stated.
      expect(resolved[2]?.isCurrent).toBe(true);
    });

    it("keeps failed interactive but blocked and disabled not", () => {
      const resolved = resolveStepStates(RUN_ITEMS, "validate");
      expect(resolved.map(entry => entry.interactive)).toEqual([true, true, true, false, false]);
    });

    it("marks a failed step that value points at as both failed and current", () => {
      const resolved = resolveStepStates(RUN_ITEMS, "configure");
      expect(resolved[1]?.state).toBe("failed");
      expect(resolved[1]?.isCurrent).toBe(true);
    });

    it("falls back to the first step for an unknown value", () => {
      const items: ProgressStepItem[] = [
        { label: "Draft", value: "draft" },
        { label: "Review", value: "review" },
      ];
      const resolved = resolveStepStates(items, "nope");
      expect(resolved[0]?.isCurrent).toBe(true);
    });
  });

  it("validates item records and rejects malformed payloads whole", () => {
    expect(isProgressStepRecord({ label: "A", value: "a" })).toBe(true);
    expect(isProgressStepRecord({ label: "A", value: "a", status: "blocked" })).toBe(true);
    expect(isProgressStepRecord({ label: "A", value: "a", status: "bogus" })).toBe(false);
    expect(isProgressStepRecord({ label: "A" })).toBe(false);
    // Non-string text fields would reach escapeHtml and throw mid-render.
    expect(isProgressStepRecord({ label: "A", value: "a", description: 1 })).toBe(false);
    expect(isProgressStepRecord({ label: "A", value: "a", statusNote: {} })).toBe(false);

    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.setAttribute("items", JSON.stringify([{ label: "A", value: "a", status: "bogus" }]));
    document.body.append(element);
    expect(element.items).toEqual([]);
  });

  it("renders blocked and disabled steps as real disabled buttons", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = RUN_ITEMS;
    element.value = "validate";
    document.body.append(element);

    const steps = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="step"]') ?? [],
    );
    expect(steps.map(step => step.disabled)).toEqual([false, false, false, true, true]);

    // Clicking a blocked step changes nothing and emits nothing — including a
    // synthetic click, which fires listeners even on a disabled button, so the
    // invariant cannot rest on the disabled attribute alone.
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);
    steps[3]?.click();
    steps[3]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(changed).not.toHaveBeenCalled();
    expect(element.value).toBe("validate");
  });

  it("states an explicit status in words, with the note", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = RUN_ITEMS;
    element.value = "validate";
    document.body.append(element);

    const steps = Array.from(element.shadowRoot?.querySelectorAll('[part="step"]') ?? []);
    expect(steps[1]?.querySelector('[part="step-status"]')?.textContent).toBe("Failed");
    expect(steps[1]?.querySelector('[part="step-status-note"]')?.textContent).toBe(
      "Credentials rejected",
    );
    expect(steps[3]?.querySelector('[part="step-status"]')?.textContent).toBe("Blocked");
    expect(steps[4]?.querySelector('[part="step-status"]')?.textContent).toBe("Unavailable");
  });

  it("gives positional states a screen-reader word that tracks value changes", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
    ];
    element.value = "draft";
    document.body.append(element);

    const wordOf = (index: number): string =>
      element.shadowRoot?.querySelectorAll('[part="step-state"]')[index]?.textContent ?? "";
    expect(wordOf(0)).toBe("Current step");
    expect(wordOf(1)).toBe("Not started");

    // The patch path (same items, new value) must keep the words in step.
    element.value = "review";
    expect(wordOf(0)).toBe("Complete");
    expect(wordOf(1)).toBe("Current step");
  });

  it("skips blocked and disabled steps during keyboard navigation", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = RUN_ITEMS;
    element.value = "validate";
    document.body.append(element);

    const steps = element.shadowRoot?.querySelectorAll('[part="step"]') ?? [];
    // ArrowRight from Validate: Deploy is blocked, Archive disabled — wraps to Connect.
    steps[2]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(element.value).toBe("connect");

    // End lands on the last *interactive* step, not the disabled tail.
    steps[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(element.value).toBe("validate");
  });

  it("moves the tab stop to the first interactive step when value points at a blocked one", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = RUN_ITEMS;
    element.value = "deploy"; // blocked
    document.body.append(element);

    const steps = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="step"]') ?? [],
    );
    // A disabled button cannot take focus; the group must stay reachable.
    expect(steps.map(step => step.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it("announces user-driven step changes politely, and only those", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
      { label: "Publish", value: "publish" },
    ];
    element.value = "draft";
    document.body.append(element);

    const live = element.shadowRoot?.querySelector('[part="live"]');
    expect(live?.getAttribute("aria-live")).toBe("polite");
    // Render is not an event worth speaking over.
    expect(live?.textContent).toBe("");

    const steps = element.shadowRoot?.querySelectorAll('[part="step"]') ?? [];
    (steps[1] as HTMLButtonElement | undefined)?.click();
    expect(live?.textContent).toBe("Review, step 2 of 3");
  });

  it("no longer sets aria-selected — invalid on buttons in a group", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
    ];
    element.value = "draft";
    document.body.append(element);

    // Drive the patch path, where the old code added it.
    element.value = "review";
    const steps = element.shadowRoot?.querySelectorAll('[part="step"]') ?? [];
    expect(steps[0]?.hasAttribute("aria-selected")).toBe(false);
    expect(steps[1]?.hasAttribute("aria-selected")).toBe(false);
  });

  it("uses compact step shell radius", () => {
    const element = document.createElement("box-progress-steps") as ProgressSteps;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("border-radius: var(--boe-profile-radius-medium, 12px);");
  });
});
