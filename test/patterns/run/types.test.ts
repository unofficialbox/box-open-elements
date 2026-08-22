// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  formatRunDuration,
  formatRunSummary,
  isRunStepRecord,
  resolveRunSteps,
} from "../../../src/patterns/run/types.js";
import type { RunStep } from "../../../src/patterns/run/types.js";

describe("resolveRunSteps", () => {
  it("derives running/succeeded/pending from timestamps when no status is set", () => {
    const steps: RunStep[] = [
      { id: "a", title: "Fetch", startedAt: "2026-08-22T10:00:00Z", finishedAt: "2026-08-22T10:00:05Z" },
      { id: "b", title: "Build", startedAt: "2026-08-22T10:00:05Z" },
      { id: "c", title: "Deploy" },
    ];
    const resolution = resolveRunSteps(steps);
    expect(resolution.steps.map(entry => entry.status)).toEqual([
      "succeeded",
      "running",
      "pending",
    ]);
    expect(resolution.status).toBe("running");
    expect(resolution.settled).toBe(1);
  });

  it("lets an explicit status win over the timestamp derivation", () => {
    const steps: RunStep[] = [
      { id: "a", title: "Fetch", finishedAt: "2026-08-22T10:00:05Z", status: "warning" },
    ];
    expect(resolveRunSteps(steps).steps[0]?.status).toBe("warning");
  });

  it("shadows steps behind a failure as skipped — a dead run shows no work as coming", () => {
    const steps: RunStep[] = [
      { id: "a", title: "Fetch", finishedAt: "2026-08-22T10:00:05Z" },
      { id: "b", title: "Build", status: "failed" },
      { id: "c", title: "Test" },
      { id: "d", title: "Deploy" },
    ];
    const resolution = resolveRunSteps(steps);
    expect(resolution.steps.map(entry => entry.status)).toEqual([
      "succeeded",
      "failed",
      "skipped",
      "skipped",
    ]);
    expect(resolution.status).toBe("failed");
  });

  it("lets an explicit later status override the failure shadow", () => {
    const steps: RunStep[] = [
      { id: "a", title: "Build", status: "failed" },
      { id: "b", title: "Notify", status: "succeeded" }, // ran anyway (cleanup hook)
    ];
    expect(resolveRunSteps(steps).steps[1]?.status).toBe("succeeded");
  });

  it("reports completed only when every step is terminal", () => {
    const done: RunStep[] = [
      { id: "a", title: "Fetch", status: "succeeded" },
      { id: "b", title: "Build", status: "warning" },
    ];
    expect(resolveRunSteps(done).status).toBe("completed");

    expect(resolveRunSteps([{ id: "a", title: "Fetch" }]).status).toBe("pending");
    expect(resolveRunSteps([]).status).toBe("pending");
  });
});

describe("formatRunSummary", () => {
  it("names the failed step", () => {
    const resolution = resolveRunSteps([
      { id: "a", title: "Fetch", status: "succeeded" },
      { id: "b", title: "Configure", status: "failed" },
      { id: "c", title: "Deploy" },
    ]);
    expect(formatRunSummary(resolution)).toBe("Failed at Configure");
  });

  it("names the running step with its position", () => {
    const resolution = resolveRunSteps([
      { id: "a", title: "Fetch", status: "succeeded" },
      { id: "b", title: "Build", status: "running" },
      { id: "c", title: "Deploy" },
    ]);
    expect(formatRunSummary(resolution)).toBe("Running Build — step 2 of 3");
  });

  it("counts warnings on completion", () => {
    const resolution = resolveRunSteps([
      { id: "a", title: "Fetch", status: "succeeded" },
      { id: "b", title: "Build", status: "warning" },
    ]);
    expect(formatRunSummary(resolution)).toBe("Completed with 1 warning");
  });

  it("covers the empty and untouched runs", () => {
    expect(formatRunSummary(resolveRunSteps([]))).toBe("No steps");
    expect(formatRunSummary(resolveRunSteps([{ id: "a", title: "Fetch" }]))).toBe("Not started");
  });
});

describe("formatRunDuration", () => {
  it("formats seconds, minutes and hours", () => {
    expect(formatRunDuration("2026-08-22T10:00:00Z", "2026-08-22T10:00:42Z")).toBe("42s");
    expect(formatRunDuration("2026-08-22T10:00:00Z", "2026-08-22T10:04:12Z")).toBe("4m 12s");
    expect(formatRunDuration("2026-08-22T10:00:00Z", "2026-08-22T10:05:00Z")).toBe("5m");
    expect(formatRunDuration("2026-08-22T10:00:00Z", "2026-08-22T12:30:00Z")).toBe("2h 30m");
  });

  it("returns empty for missing, unparseable, or reversed timestamps", () => {
    expect(formatRunDuration(undefined, "2026-08-22T10:00:00Z")).toBe("");
    expect(formatRunDuration("2026-08-22T10:00:00Z", undefined)).toBe("");
    expect(formatRunDuration("nope", "2026-08-22T10:00:00Z")).toBe("");
    expect(formatRunDuration("2026-08-22T11:00:00Z", "2026-08-22T10:00:00Z")).toBe("");
  });
});

describe("isRunStepRecord", () => {
  it("accepts valid records and rejects malformed ones", () => {
    expect(isRunStepRecord({ id: "a", title: "Fetch" })).toBe(true);
    expect(
      isRunStepRecord({
        id: "a",
        title: "Fetch",
        status: "running",
        children: [{ id: "c1", label: "Chunk 1", progress: 40 }],
      }),
    ).toBe(true);
    expect(isRunStepRecord({ id: "a" })).toBe(false);
    expect(isRunStepRecord({ id: "a", title: "Fetch", status: "bogus" })).toBe(false);
    expect(isRunStepRecord({ id: "a", title: "Fetch", children: [{ id: "c1" }] })).toBe(false);
    expect(
      isRunStepRecord({ id: "a", title: "Fetch", children: [{ id: "c1", label: "x", status: "nah" }] }),
    ).toBe(false);
  });
});
